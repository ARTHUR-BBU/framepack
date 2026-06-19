#!/usr/bin/env python
"""Sprite-sheet post-processing for framepack-sprite-forge.

Deterministic pixel operations ported from agent-sprite-forge (MIT, 0x0funky):
magenta chroma-key background removal, grid splitting, per-frame centering,
edge cleanup, sheet recomposition and transparent GIF export.

No image-generation backends are used here — every function is pure pixel math
on top of numpy + Pillow.

CLI:
    python process_sprite.py process \\
        --input raw-sheet.png --rows 3 --cols 4 \\
        --output-dir assets/sprites/hero-run/ --cell-size 384
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import List

import numpy as np
from PIL import Image, ImageFilter

# Magenta chroma-key target (#FF00FF).
MAGENTA = (255, 0, 255)


# ---------------------------------------------------------------------------
# Core post-processing functions
# ---------------------------------------------------------------------------
def remove_bg_magenta(img: Image.Image, threshold: int = 30) -> Image.Image:
    """Remove a magenta (#FF00FF) background via euclidean color-distance keying.

    Every pixel whose RGB distance to magenta is below ``threshold`` becomes
    fully transparent; all other pixels are kept fully opaque. Returns an RGBA
    image.
    """
    rgb = img.convert("RGB")
    arr = np.asarray(rgb, dtype=np.int32)
    r, g, b = arr[..., 0], arr[..., 1], arr[..., 2]
    dist = np.sqrt((r - MAGENTA[0]) ** 2 + (g - MAGENTA[1]) ** 2 + (b - MAGENTA[2]) ** 2)
    alpha = np.where(dist < threshold, 0, 255).astype(np.uint8)
    rgba = np.dstack([arr.astype(np.uint8), alpha])
    return Image.fromarray(rgba, "RGBA")


def split_grid(img: Image.Image, rows: int, cols: int) -> List[Image.Image]:
    """Split ``img`` into ``rows * cols`` equal frames in reading order."""
    src = img.convert("RGBA")
    fw = src.width // cols
    fh = src.height // rows
    frames: List[Image.Image] = []
    for r in range(rows):
        for c in range(cols):
            box = (c * fw, r * fh, c * fw + fw, r * fh + fh)
            frames.append(src.crop(box))
    return frames


def center_single_sprite(img: Image.Image, cell_size: int) -> Image.Image:
    """Crop the opaque region of ``img`` and re-center it on a cell_size canvas."""
    src = img.convert("RGBA")
    canvas = Image.new("RGBA", (cell_size, cell_size), (0, 0, 0, 0))
    bbox = src.split()[3].getbbox()
    if bbox is None:
        return canvas  # fully transparent input -> blank canvas
    sprite = src.crop(bbox)
    sw, sh = sprite.size
    x = (cell_size - sw) // 2
    y = (cell_size - sh) // 2
    canvas.paste(sprite, (x, y), sprite)
    return canvas


def clean_edges(img: Image.Image) -> Image.Image:
    """Remove anti-aliasing residue: median-filter the alpha band, then snap it.

    Semi-transparent fringe ("hairs") collapse to either fully transparent or
    fully opaque, and RGB is zeroed where pixels become transparent so no color
    bleeds through the key.
    """
    src = img.convert("RGBA")
    r, g, b, a = src.split()
    a = a.filter(ImageFilter.MedianFilter(size=3))
    a_arr = np.asarray(a)
    a_snapped = np.where(a_arr < 128, 0, 255).astype(np.uint8)

    r_arr = np.asarray(r).copy()
    g_arr = np.asarray(g).copy()
    b_arr = np.asarray(b).copy()
    transparent = a_snapped == 0
    r_arr[transparent] = 0
    g_arr[transparent] = 0
    b_arr[transparent] = 0

    rgba = np.dstack([r_arr, g_arr, b_arr, a_snapped])
    return Image.fromarray(rgba, "RGBA")


def compose_sheet(frames: List[Image.Image], rows: int, cols: int) -> Image.Image:
    """Re-assemble ``frames`` (reading order) into a rows x cols sprite sheet."""
    if not frames:
        raise ValueError("compose_sheet requires at least one frame")
    fw, fh = frames[0].size
    sheet = Image.new("RGBA", (fw * cols, fh * rows), (0, 0, 0, 0))
    for i, frame in enumerate(frames):
        r = i // cols
        c = i % cols
        sheet.paste(frame, (c * fw, r * fh), frame.convert("RGBA"))
    return sheet


def save_transparent_gif(
    frames: List[Image.Image], output_path: str, fps: int = 8
) -> None:
    """Export ``frames`` as an animated GIF with background transparency.

    ``disposal=2`` restores the (transparent) background between frames so each
    sprite stands alone without ghosting from the previous frame.
    """
    if not frames:
        raise ValueError("save_transparent_gif requires at least one frame")
    duration = max(20, int(round(1000 / fps)))
    imgs = [f.convert("RGBA") for f in frames]
    imgs[0].save(
        output_path,
        save_all=True,
        append_images=imgs[1:],
        duration=duration,
        loop=0,
        disposal=2,
    )


# ---------------------------------------------------------------------------#
# QC Report (瑕疵 1 修复: 显式 QC 报告输出)
# ---------------------------------------------------------------------------
def generate_qc_report(frames: List[Image.Image]) -> dict:
    """Generate a QC report dict from processed frames.

    Metrics:
      - transparent_ratio: fraction of fully-transparent pixels
      - non_empty_frames: frames with >1% opaque content
      - total_frames: total frame count
      - magenta_residue_ratio: chroma-key survivors (residual magenta pixels)
      - warnings: list of human-readable warning strings
    """
    total = len(frames)
    non_empty = 0
    transparent_px = 0
    total_px = 0
    magenta_residue_px = 0

    for frame in frames:
        arr = np.asarray(frame.convert("RGBA"))
        alpha = arr[..., 3]
        total_px += alpha.size
        transparent_px += int(np.count_nonzero(alpha == 0))

        opaque_ratio = np.count_nonzero(alpha > 0) / max(alpha.size, 1)
        if opaque_ratio > 0.01:
            non_empty += 1

        # Detect residual magenta (chroma-key survivors)
        r, g, b = arr[..., 0], arr[..., 1], arr[..., 2]
        is_magenta = (
            (np.abs(r.astype(np.int16) - 255) < 30)
            & (g.astype(np.int16) < 30)
            & (np.abs(b.astype(np.int16) - 255) < 30)
            & (alpha > 0)
        )
        magenta_residue_px += int(np.count_nonzero(is_magenta))

    transparent_ratio = transparent_px / max(total_px, 1)
    magenta_residue_ratio = magenta_residue_px / max(total_px, 1)

    warnings: list[str] = []
    if non_empty == 0:
        warnings.append(
            "ALL frames empty — check input image background color "
            "(must be pure magenta #FF00FF)"
        )
    elif non_empty < total:
        warnings.append(
            f"{total - non_empty}/{total} frames appear empty "
            "(no visible content after chroma key)"
        )
    if magenta_residue_ratio > 0.01:
        warnings.append(
            f"Magenta residue detected ({magenta_residue_ratio:.1%} of pixels) "
            "— chroma key threshold may need adjustment"
        )

    # D-1: 有内容但几乎没透明 → 背景可能不是品红，色键失效
    if transparent_ratio < 0.02 and non_empty > 0:
        warnings.append(
            f"Almost no transparency produced ({transparent_ratio:.1%}) "
            "— background may not be pure magenta #FF00FF"
        )

    return {
        "transparent_ratio": round(transparent_ratio, 4),
        "non_empty_frames": non_empty,
        "total_frames": total,
        "magenta_residue_ratio": round(magenta_residue_ratio, 4),
        "warnings": warnings,
    }


def format_qc_summary(report: dict) -> str:
    """Format QC report as a human-readable summary for stdout."""
    lines = [
        f"QC: {report['non_empty_frames']}/{report['total_frames']} non-empty frames, "
        f"{report['transparent_ratio']:.1%} transparent"
    ]
    if report["magenta_residue_ratio"] > 0:
        lines.append(
            f"     magenta residue: {report['magenta_residue_ratio']:.1%}"
        )
    for w in report["warnings"]:
        lines.append(f"     WARNING: {w}")
    if not report["warnings"]:
        lines.append("     OK — no issues detected")
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Pipeline + CLI
# ---------------------------------------------------------------------------
def run_pipeline(
    input_path: str,
    rows: int,
    cols: int,
    output_dir: str,
    cell_size: int,
    threshold: int = 30,
    fps: int = 8,
) -> tuple[Path, dict]:
    """Run the full post-processing pipeline and write artifacts to output_dir.

    Returns (sheet_path, qc_report).
    """
    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)

    raw = Image.open(input_path)
    keyed = remove_bg_magenta(raw, threshold=threshold)
    cleaned = clean_edges(keyed)
    raw_frames = split_grid(cleaned, rows, cols)
    frames = [center_single_sprite(f, cell_size) for f in raw_frames]

    sheet = compose_sheet(frames, rows, cols)
    sheet_path = out / "sheet-transparent.png"
    sheet.save(sheet_path)

    for i, frame in enumerate(frames, start=1):
        frame.save(out / f"frame_{i:02d}.png")

    gif_path = out / "animation.gif"
    save_transparent_gif(frames, str(gif_path), fps=fps)

    qc = generate_qc_report(frames)
    # D-3: QC 报告落盘为 JSON，供下游自动化读取
    import json
    (out / "qc-report.json").write_text(
        json.dumps(qc, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    return sheet_path, qc


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Sprite-sheet post-processing (framepack-sprite-forge)."
    )
    sub = parser.add_subparsers(dest="command", required=True)

    p = sub.add_parser("process", help="Post-process a raw magenta-bg sprite sheet.")
    p.add_argument("--input", required=True, help="Path to raw sprite sheet PNG.")
    p.add_argument("--rows", type=int, required=True, help="Grid row count.")
    p.add_argument("--cols", type=int, required=True, help="Grid column count.")
    p.add_argument(
        "--output-dir", required=True, help="Directory to write processed artifacts."
    )
    p.add_argument(
        "--cell-size", type=int, required=True, help="Output cell size in pixels."
    )
    p.add_argument("--threshold", type=int, default=30, help="Magenta key threshold.")
    p.add_argument("--fps", type=int, default=8, help="GIF frames per second.")
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = _build_parser()
    args = parser.parse_args(argv)
    if args.command == "process":
        sheet_path, qc = run_pipeline(
            input_path=args.input,
            rows=args.rows,
            cols=args.cols,
            output_dir=args.output_dir,
            cell_size=args.cell_size,
            threshold=args.threshold,
            fps=args.fps,
        )
        print(f"Wrote {sheet_path}")
        print(format_qc_summary(qc))
        return 0
    parser.error(f"Unknown command: {args.command}")
    return 2


if __name__ == "__main__":
    sys.exit(main())
