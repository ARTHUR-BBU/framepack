#!/usr/bin/env python
"""命题 D: Sprite Forge 完整管线测试 (3 轮).

只测不改. 生成测试输入, 调用真实 process_sprite.py / make_layout_guide.py,
收集所有输出与 QC 指标到 results.json, 供报告撰写使用.
"""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image

SCRIPTS = Path(r"F:\hyperframes\framepack-plugin\skills\framepack-sprite-forge\scripts")
PROCESS = SCRIPTS / "process_sprite.py"
GUIDE = SCRIPTS / "make_layout_guide.py"

WORK = Path(r"F:\hyperframes\framepack-e2e-test\sprite-D-work")
INPUTS = WORK / "inputs"

# Import the module under test for full QC dict access (CLI only prints a summary).
sys.path.insert(0, str(SCRIPTS))
import process_sprite as ps  # noqa: E402

MAGENTA = (255, 0, 255)


# ---------------------------------------------------------------------------
# Input generators
# ---------------------------------------------------------------------------
def _new_magenta(w: int, h: int) -> Image.Image:
    return Image.new("RGB", (w, h), MAGENTA)


def gen_round1_standard(path: Path) -> dict:
    """800x400, 2 rows x 4 cols -> 8 cells, each a distinct solid color block."""
    W, H = 800, 400
    rows, cols = 2, 4
    cw, ch = W // cols, H // rows  # 200 x 200
    img = _new_magenta(W, H)
    colors = [
        (255, 0, 0),      # red
        (0, 255, 0),      # green
        (0, 0, 255),      # blue
        (255, 255, 0),    # yellow
        (0, 255, 255),    # cyan
        (255, 128, 0),    # orange
        (128, 0, 255),    # purple
        (255, 255, 255),  # white
    ]
    for r in range(rows):
        for c in range(cols):
            idx = r * cols + c
            # inner block at 60% to leave a magenta margin around each sprite
            bx0 = c * cw + int(cw * 0.2)
            by0 = r * ch + int(ch * 0.2)
            bx1 = c * cw + int(cw * 0.8)
            by1 = r * ch + int(ch * 0.8)
            block = Image.new("RGB", (bx1 - bx0, by1 - by0), colors[idx])
            img.paste(block, (bx0, by0))
    img.save(path)
    return {"path": str(path), "size": (W, H), "rows": rows, "cols": cols,
            "cell": (cw, ch), "colors": colors}


def gen_round2_gradient(path: Path) -> dict:
    """600x600, 3 rows x 2 cols -> 6 cells (300x200 each, non-square).
    Each cell = horizontal gradient from pure magenta (left) to a target color
    (right). Higher chroma-key thresholds remove more near-magenta pixels, so
    transparent_ratio should rise monotonically with threshold.
    """
    W, H = 600, 600
    rows, cols = 3, 2
    cw, ch = W // cols, H // rows  # 300 x 200 (non-square!)
    arr = np.zeros((H, W, 3), dtype=np.uint8)
    arr[:, :] = MAGENTA
    targets = [
        (0, 255, 0),    # green   - far from magenta
        (255, 255, 0),  # yellow  - far
        (255, 0, 0),    # red     - mid (dist 255)
        (255, 128, 255),  # light pink - mid (dist 128)
        (255, 64, 255),  # near-magenta-ish (dist 64)
        (255, 20, 255),  # very close to magenta (dist 20)
    ]
    for r in range(rows):
        for c in range(cols):
            idx = r * cols + c
            tg = np.array(targets[idx], dtype=np.float32)
            mg = np.array(MAGENTA, dtype=np.float32)
            # gradient across the cell width
            for x in range(cw):
                t = x / max(cw - 1, 1)
                col = mg * (1 - t) + tg * t
                x0 = c * cw + x
                y0 = r * ch
                arr[y0:y0 + ch, x0, :] = col.astype(np.uint8)
    Image.fromarray(arr, "RGB").save(path)
    return {"path": str(path), "size": (W, H), "rows": rows, "cols": cols,
            "cell": (cw, ch), "targets": targets}


def gen_round3_blue_bg(path: Path) -> dict:
    """800x400, 2x4. Background is PURE BLUE (not magenta) + a few non-magenta
    content blocks. Chroma key should leave almost everything opaque -> high
    magenta_residue is not expected (no magenta), but QC should warn because
    background is not keyed (non_empty high, transparent_ratio low).
    """
    W, H = 800, 400
    rows, cols = 2, 4
    cw, ch = W // cols, H // rows
    img = Image.new("RGB", (W, H), (0, 0, 255))  # pure blue bg
    colors = [(255, 0, 0), (0, 255, 0), (255, 255, 0), (255, 128, 0),
              (128, 0, 255), (255, 255, 255), (0, 200, 0), (200, 200, 0)]
    for r in range(rows):
        for c in range(cols):
            idx = r * cols + c
            bx0, by0 = c * cw + int(cw * 0.2), r * ch + int(ch * 0.2)
            bx1, by1 = c * cw + int(cw * 0.8), r * ch + int(ch * 0.8)
            img.paste(Image.new("RGB", (bx1 - bx0, by1 - by0), colors[idx]),
                      (bx0, by0))
    img.save(path)
    return {"path": str(path), "size": (W, H), "rows": rows, "cols": cols,
            "cell": (cw, ch), "bg": (0, 0, 255)}


def gen_round3_all_magenta(path: Path) -> dict:
    """800x400, 2x4. Entirely pure magenta (no content at all).
    After keying -> everything transparent -> QC must warn 'ALL frames empty'.
    """
    W, H = 800, 400
    rows, cols = 2, 4
    _new_magenta(W, H).save(path)
    return {"path": str(path), "size": (W, H), "rows": rows, "cols": cols}


# ---------------------------------------------------------------------------
# Runners
# ---------------------------------------------------------------------------
def run_cli(args: list[str]) -> dict:
    """Invoke a script via subprocess (real CLI path). Capture stdout/err/rc."""
    proc = subprocess.run([sys.executable] + args, capture_output=True, text=True)
    return {"args": args, "returncode": proc.returncode,
            "stdout": proc.stdout.strip(), "stderr": proc.stderr.strip()}


def run_pipeline_full(input_path, rows, cols, out_dir, cell_size, threshold=30, fps=8):
    """Call run_pipeline directly to get the full QC dict (CLI only prints summary)."""
    sheet_path, qc = ps.run_pipeline(
        input_path=str(input_path), rows=rows, cols=cols,
        output_dir=str(out_dir), cell_size=cell_size,
        threshold=threshold, fps=fps,
    )
    return {"sheet_path": str(sheet_path), "qc": qc}


def list_outputs(out_dir: Path) -> dict:
    files = {}
    for p in sorted(out_dir.iterdir()):
        if p.is_file():
            try:
                with Image.open(p) as im:
                    files[p.name] = {"size": im.size, "mode": im.mode,
                                     "bytes": p.stat().st_size}
            except Exception:
                files[p.name] = {"bytes": p.stat().st_size}
    return files


def verify_transparency(png_path: Path) -> dict:
    """Check that a PNG has an alpha channel and some fully-transparent pixels."""
    with Image.open(png_path) as im:
        rgba = im.convert("RGBA")
        arr = np.asarray(rgba)
        alpha = arr[..., 3]
        return {"mode": im.mode, "has_alpha": "A" in im.getbands(),
                "transparent_px": int(np.count_nonzero(alpha == 0)),
                "total_px": int(alpha.size),
                "transparent_ratio": round(
                    np.count_nonzero(alpha == 0) / max(alpha.size, 1), 4)}


# ---------------------------------------------------------------------------
# Main test driver
# ---------------------------------------------------------------------------
def main() -> int:
    results: dict = {"rounds": {}}

    # === ROUND 1 ===
    r1 = {}
    inp = INPUTS / "round1_standard.png"
    r1["input"] = gen_round1_standard(inp)
    cell = r1["input"]["cell"][0]  # 200 (square)
    out1 = WORK / "round1"
    r1["cli"] = run_cli([str(PROCESS), "process", "--input", str(inp),
                         "--rows", "2", "--cols", "4", "--output-dir", str(out1),
                         "--cell-size", str(cell), "--threshold", "30"])
    r1["module"] = run_pipeline_full(inp, 2, 4, out1, cell, threshold=30)
    r1["outputs"] = list_outputs(out1)
    r1["sheet_transparency"] = verify_transparency(out1 / "sheet-transparent.png")
    # frame count check
    frames = sorted(out1.glob("frame_*.png"))
    r1["frame_count"] = len(frames)
    r1["frame_first_transparency"] = verify_transparency(frames[0]) if frames else None
    r1["gif_exists"] = (out1 / "animation.gif").exists()
    # layout guide for round1 geometry: 2x4 @ cell 200 -> 800x400
    g1 = WORK / "guides" / "guide_round1.png"
    r1["guide_cli"] = run_cli([str(GUIDE), "--rows", "2", "--cols", "4",
                               "--cell-size", str(cell), "--output", str(g1)])
    with Image.open(g1) as im:
        r1["guide_size"] = im.size
    results["rounds"]["round1"] = r1

    # === ROUND 2 ===
    r2 = {"thresholds": {}}
    inp2 = INPUTS / "round2_gradient.png"
    r2["input"] = gen_round2_gradient(inp2)
    cell2 = r2["input"]["cell"][0]  # 300? no: cw=300, ch=200 -> use 200 (min) -> square 200
    # cell_size must be square int; use ch=200 so non-square cell 300x200 is cropped into 200x200
    cs2 = 200
    r2["cell_size_used"] = cs2
    r2["note_cell_nonsquare"] = f"input cell {r2['input']['cell']} (non-square); " \
                                f"output canvas forced square {cs2}x{cs2}"
    for thr in (10, 30, 60):
        out2 = WORK / f"round2_t{thr}"
        # direct chroma-key measurement on raw sheet (pure keying effect)
        raw = Image.open(inp2)
        keyed = ps.remove_bg_magenta(raw, threshold=thr)
        ka = np.asarray(keyed)[..., 3]
        raw_transparent = round(np.count_nonzero(ka == 0) / ka.size, 4)
        cli = run_cli([str(PROCESS), "process", "--input", str(inp2),
                       "--rows", "3", "--cols", "2", "--output-dir", str(out2),
                       "--cell-size", str(cs2), "--threshold", str(thr)])
        mod = run_pipeline_full(inp2, 3, 2, out2, cs2, threshold=thr)
        outs = list_outputs(out2)
        r2["thresholds"][str(thr)] = {
            "cli": cli,
            "module_qc": mod["qc"],
            "outputs": outs,
            "raw_keyed_transparent_ratio": raw_transparent,
            "sheet_transparency": verify_transparency(out2 / "sheet-transparent.png"),
        }
    results["rounds"]["round2"] = r2

    # === ROUND 3 ===
    r3 = {}
    # 3a: blue background
    inp_blue = INPUTS / "round3_blue.png"
    r3["blue_input"] = gen_round3_blue_bg(inp_blue)
    out_blue = WORK / "round3_blue"
    r3["blue_cli"] = run_cli([str(PROCESS), "process", "--input", str(inp_blue),
                              "--rows", "2", "--cols", "4", "--output-dir", str(out_blue),
                              "--cell-size", "200", "--threshold", "30"])
    r3["blue_module"] = run_pipeline_full(inp_blue, 2, 4, out_blue, 200, threshold=30)
    r3["blue_transparency"] = verify_transparency(out_blue / "sheet-transparent.png")

    # 3b: all magenta (no content)
    inp_all = INPUTS / "round3_allmagenta.png"
    r3["allmagenta_input"] = gen_round3_all_magenta(inp_all)
    out_all = WORK / "round3_allmagenta"
    r3["allmagenta_cli"] = run_cli([str(PROCESS), "process", "--input", str(inp_all),
                                    "--rows", "2", "--cols", "4", "--output-dir", str(out_all),
                                    "--cell-size", "200", "--threshold", "30"])
    r3["allmagenta_module"] = run_pipeline_full(inp_all, 2, 4, out_all, 200, threshold=30)
    r3["allmagenta_transparency"] = verify_transparency(out_all / "sheet-transparent.png")
    results["rounds"]["round3"] = r3

    out_json = Path(r"F:\hyperframes\framepack-e2e-test\testD_results.json")
    out_json.write_text(json.dumps(results, indent=2, ensure_ascii=False),
                        encoding="utf-8")
    print(f"Wrote {out_json}")
    # brief stdout summary
    print("\n=== ROUND 1 ===")
    print("CLI rc:", r1["cli"]["returncode"])
    print(r1["cli"]["stdout"])
    print("frame_count:", r1["frame_count"], "guide_size:", r1["guide_size"])
    print("\n=== ROUND 2 (threshold sweep) ===")
    for thr in ("10", "30", "60"):
        d = r2["thresholds"][thr]
        print(f"  t={thr}: raw_keyed_trans={d['raw_keyed_transparent_ratio']} "
              f"qc_trans={d['module_qc']['transparent_ratio']} "
              f"non_empty={d['module_qc']['non_empty_frames']}/{d['module_qc']['total_frames']} "
              f"magenta_residue={d['module_qc']['magenta_residue_ratio']}")
    print("\n=== ROUND 3 ===")
    print("blue QC:", r3["blue_module"]["qc"])
    print("allmagenta QC:", r3["allmagenta_module"]["qc"])
    return 0


if __name__ == "__main__":
    sys.exit(main())
