"""TDD tests for sprite-forge post-processing (process_sprite.py).

Deterministic test images are built with numpy + Pillow (magenta background +
geometric shapes). No real image generation is used.
"""

import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image

SCRIPTS_DIR = (
    Path(__file__).resolve().parent.parent
    / "skills"
    / "framepack-sprite-forge"
    / "scripts"
)
sys.path.insert(0, str(SCRIPTS_DIR))

import process_sprite  # noqa: E402


# ---------------------------------------------------------------------------
# Deterministic test-image helpers
# ---------------------------------------------------------------------------
def _solid(w, h, rgb):
    arr = np.zeros((h, w, 3), dtype=np.uint8)
    arr[..., 0] = rgb[0]
    arr[..., 1] = rgb[1]
    arr[..., 2] = rgb[2]
    return Image.fromarray(arr, "RGB")


def _magenta_sheet_with_cells(rows, cols, cell, fill_colors):
    """Magenta (#FF00FF) background sheet with a centered color block per cell."""
    w = cols * cell
    h = rows * cell
    arr = np.zeros((h, w, 3), dtype=np.uint8)
    arr[..., 0] = 255
    arr[..., 1] = 0
    arr[..., 2] = 255
    img = Image.fromarray(arr, "RGB")
    for i, color in enumerate(fill_colors):
        r = i // cols
        c = i % cols
        cx0 = c * cell
        cy0 = r * cell
        inset = cell // 4
        block = _solid(cell - 2 * inset, cell - 2 * inset, color)
        img.paste(block, (cx0 + inset, cy0 + inset))
    return img


# ---------------------------------------------------------------------------
# remove_bg_magenta
# ---------------------------------------------------------------------------
def test_remove_bg_magenta_returns_rgba_and_clears_pure_magenta():
    img = _solid(40, 40, (255, 0, 255))  # pure magenta
    out = process_sprite.remove_bg_magenta(img)
    assert out.mode == "RGBA"
    arr = np.array(out)
    assert (arr[..., 3] == 0).all()  # every pixel transparent


def test_remove_bg_magenta_keeps_colored_shape():
    img = _magenta_sheet_with_cells(1, 1, 40, [(255, 0, 0)])  # red block on magenta
    out = process_sprite.remove_bg_magenta(img)
    arr = np.array(out)
    assert (arr[..., 3] == 255).any()  # opaque shape remains
    assert (arr[..., 3] == 0).any()  # magenta background removed
    # center of the red block stays opaque
    assert arr[20, 20, 3] == 255
    # corner is magenta -> transparent
    assert arr[0, 0, 3] == 0


def test_remove_bg_magenta_threshold_controls_sensitivity():
    # (235,0,235): euclidean distance to magenta = sqrt(20^2 + 20^2) ~ 28.28
    arr = np.zeros((1, 1, 3), dtype=np.uint8)
    arr[0, 0] = (235, 0, 235)
    img = Image.fromarray(arr, "RGB")
    kept = process_sprite.remove_bg_magenta(img, threshold=25)
    removed = process_sprite.remove_bg_magenta(img, threshold=30)
    assert np.array(kept)[0, 0, 3] == 255  # 28.28 >= 25 -> kept opaque
    assert np.array(removed)[0, 0, 3] == 0  # 28.28 < 30 -> transparent


# ---------------------------------------------------------------------------
# split_grid
# ---------------------------------------------------------------------------
def test_split_grid_count_and_dimensions():
    img = _solid(100, 100, (0, 0, 0))
    frames = process_sprite.split_grid(img, 2, 2)
    assert len(frames) == 4
    for f in frames:
        assert f.size == (50, 50)


def test_split_grid_preserves_cell_content():
    colors = [(255, 0, 0), (0, 255, 0), (0, 0, 255), (255, 255, 0)]
    img = _magenta_sheet_with_cells(2, 2, 40, colors)
    frames = process_sprite.split_grid(img, 2, 2)
    for i, f in enumerate(frames):
        arr = np.array(f.convert("RGB"))
        assert tuple(arr[20, 20]) == colors[i]  # center of each block


# ---------------------------------------------------------------------------
# center_single_sprite
# ---------------------------------------------------------------------------
def test_center_single_sprite_centers_offset_block():
    canvas = Image.new("RGBA", (100, 100), (0, 0, 0, 0))
    block = _solid(20, 20, (255, 0, 0)).convert("RGBA")
    block.putalpha(255)
    canvas.paste(block, (0, 0), block)  # opaque block stuck at top-left
    out = process_sprite.center_single_sprite(canvas, 100)
    assert out.size == (100, 100)
    assert out.mode == "RGBA"
    arr = np.array(out)
    assert tuple(arr[50, 50]) == (255, 0, 0, 255)  # now centered & opaque
    assert arr[5, 5, 3] == 0  # old top-left position cleared


def test_center_single_sprite_empty_returns_blank_canvas():
    canvas = Image.new("RGBA", (60, 60), (0, 0, 0, 0))
    out = process_sprite.center_single_sprite(canvas, 80)
    assert out.size == (80, 80)
    assert (np.array(out)[..., 3] == 0).all()


# ---------------------------------------------------------------------------
# clean_edges
# ---------------------------------------------------------------------------
def test_clean_edges_removes_isolated_semitransparent_pixel():
    canvas = Image.new("RGBA", (9, 9), (0, 0, 0, 0))
    canvas.putpixel((4, 4), (255, 0, 0, 10))  # semi-transparent "hair"
    out = process_sprite.clean_edges(canvas)
    assert out.mode == "RGBA"
    assert out.getpixel((4, 4))[3] == 0  # isolated hair removed


def test_clean_edges_keeps_solid_opaque_region():
    canvas = Image.new("RGBA", (9, 9), (0, 0, 0, 0))
    for x in range(3, 6):
        for y in range(3, 6):
            canvas.putpixel((x, y), (0, 255, 0, 255))
    out = process_sprite.clean_edges(canvas)
    assert out.getpixel((4, 4))[3] == 255  # solid core preserved


# ---------------------------------------------------------------------------
# compose_sheet
# ---------------------------------------------------------------------------
def test_compose_sheet_dimensions_and_placement():
    colors = [(255, 0, 0, 255), (0, 255, 0, 255), (0, 0, 255, 255), (255, 255, 0, 255)]
    frames = [Image.new("RGBA", (50, 50), c) for c in colors]
    sheet = process_sprite.compose_sheet(frames, 2, 2)
    assert sheet.size == (100, 100)
    assert sheet.mode == "RGBA"
    arr = np.array(sheet)
    assert tuple(arr[10, 10]) == (255, 0, 0, 255)  # top-left
    assert tuple(arr[10, 60]) == (0, 255, 0, 255)  # top-right
    assert tuple(arr[60, 10]) == (0, 0, 255, 255)  # bottom-left
    assert tuple(arr[60, 60]) == (255, 255, 0, 255)  # bottom-right


# ---------------------------------------------------------------------------
# save_transparent_gif
# ---------------------------------------------------------------------------
def test_save_transparent_gif_creates_animated_gif(tmp_path):
    frames = [
        Image.new("RGBA", (32, 32), (255, 0, 0, 255)),
        Image.new("RGBA", (32, 32), (0, 255, 0, 255)),
        Image.new("RGBA", (32, 32), (0, 0, 255, 255)),
    ]
    out = tmp_path / "anim.gif"
    process_sprite.save_transparent_gif(frames, str(out), fps=10)
    assert out.exists()
    reopened = Image.open(out)
    assert reopened.format == "GIF"
    assert reopened.n_frames == 3


# ---------------------------------------------------------------------------
# CLI: process subcommand (full pipeline)
# ---------------------------------------------------------------------------
def test_cli_process_pipeline(tmp_path):
    sheet = _magenta_sheet_with_cells(
        2, 2, 50, [(255, 0, 0), (0, 255, 0), (0, 0, 255), (255, 255, 0)]
    )
    inp = tmp_path / "raw.png"
    sheet.save(inp)
    outdir = tmp_path / "out"
    script = SCRIPTS_DIR / "process_sprite.py"
    res = subprocess.run(
        [
            sys.executable,
            str(script),
            "process",
            "--input",
            str(inp),
            "--rows",
            "2",
            "--cols",
            "2",
            "--output-dir",
            str(outdir),
            "--cell-size",
            "50",
        ],
        capture_output=True,
        text=True,
    )
    assert res.returncode == 0, res.stderr
    assert (outdir / "sheet-transparent.png").exists()
    assert (outdir / "animation.gif").exists()
    sheet_img = Image.open(outdir / "sheet-transparent.png")
    assert sheet_img.mode == "RGBA"
    assert sheet_img.size == (100, 100)


# ---------------------------------------------------------------------------
# QC Report tests (瑕疵 1 修复: process_sprite.py 缺显式 QC 报告输出)
# ---------------------------------------------------------------------------
class TestQCReport:
    def test_generate_qc_report_returns_dict(self):
        """generate_qc_report 返回包含必要指标的 dict"""
        arr = np.zeros((40, 40, 4), dtype=np.uint8)
        arr[10:30, 10:30] = [255, 100, 50, 255]  # 中心色块
        frame = Image.fromarray(arr, "RGBA")
        frames = [frame, frame]

        report = process_sprite.generate_qc_report(frames)
        assert "transparent_ratio" in report
        assert "non_empty_frames" in report
        assert "total_frames" in report
        assert "magenta_residue_ratio" in report
        assert "warnings" in report
        assert report["total_frames"] == 2
        assert report["non_empty_frames"] == 2

    def test_qc_report_all_empty_frames(self):
        """全透明帧的 QC 报告应标记为警告"""
        arr = np.zeros((40, 40, 4), dtype=np.uint8)  # 全透明
        frame = Image.fromarray(arr, "RGBA")
        report = process_sprite.generate_qc_report([frame, frame])
        assert report["non_empty_frames"] == 0
        assert len(report["warnings"]) > 0

    def test_pipeline_stdout_includes_qc_summary(self, tmp_path):
        """CLI process 命令 stdout 应包含 QC 摘要"""
        sheet = _magenta_sheet_with_cells(1, 1, 50, [(255, 100, 50)])
        inp = tmp_path / "input.png"
        sheet.save(inp)
        outdir = tmp_path / "out"
        res = subprocess.run(
            [sys.executable, str(SCRIPTS_DIR / "process_sprite.py"),
             "process", "--input", str(inp),
             "--rows", "1", "--cols", "1",
             "--output-dir", str(outdir),
             "--cell-size", "50"],
            capture_output=True, text=True,
        )
        assert res.returncode == 0, res.stderr
        assert "QC" in res.stdout or "qc" in res.stdout.lower()
