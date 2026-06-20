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
    # 纯品红是 _custom_bg_sheet 的特化版；通用 helper 在文件底部定义，
    # 模块加载完成后即可前向引用（运行时解析）。
    return _custom_bg_sheet(rows, cols, cell, (255, 0, 255), fill_colors)


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


def test_center_single_sprite_oversized_fits_without_crop():
    """D-2: sprite bbox 超过画布尺寸时，应按宽高比缩放入画布，不硬裁。"""
    # 280x200 的不透明 sprite，画布只有 200x200
    big = Image.new("RGBA", (300, 200), (0, 0, 0, 0))
    block = _solid(280, 200, (50, 100, 200)).convert("RGBA")
    block.putalpha(255)
    big.paste(block, (0, 0), block)

    out = process_sprite.center_single_sprite(big, 200)
    arr = np.array(out)

    # 关键：不能有内容被裁掉——画布四角必须全透明（fit-in 后有留白）
    assert arr[0, 0, 3] == 0      # 左上角透明
    assert arr[0, -1, 3] == 0     # 右上角透明
    assert arr[-1, 0, 3] == 0     # 左下角透明
    assert arr[-1, -1, 3] == 0    # 右下角透明

    # 内容仍在画布内（中心区域不透明）
    assert arr[100, 100, 3] > 0


def test_center_single_sprite_oversized_preserves_aspect():
    """D-2: fit-in 缩放后 sprite 宽高比不变（280:200 = 1.4:1）"""
    big = Image.new("RGBA", (300, 200), (0, 0, 0, 0))
    block = _solid(280, 200, (50, 100, 200)).convert("RGBA")
    block.putalpha(255)
    big.paste(block, (0, 0), block)

    out = process_sprite.center_single_sprite(big, 200)
    arr = np.array(out)
    alpha = arr[..., 3]

    # 找到不透明区域的 bbox
    rows = np.any(alpha > 0, axis=1)
    cols = np.any(alpha > 0, axis=0)
    rmin, rmax = np.where(rows)[0][[0, -1]]
    cmin, cmax = np.where(cols)[0][[0, -1]]
    w = cmax - cmin + 1
    h = rmax - rmin + 1
    ratio = w / h

    # 原始 280:200 = 1.4，缩放后比例应保持
    assert abs(ratio - 1.4) < 0.05, f"宽高比被破坏: {ratio} != 1.4"


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

    def test_qc_warns_no_transparency_non_magenta_bg(self):
        """D-1: 有内容但几乎 0 透明 → 背景可能不是品红，必须告警"""
        # 全不透明帧（模拟非品红底色，色键完全没起作用）
        arr = np.full((40, 40, 4), [100, 150, 200, 255], dtype=np.uint8)
        frame = Image.fromarray(arr, "RGBA")
        report = process_sprite.generate_qc_report([frame])
        assert report["non_empty_frames"] == 1  # 有内容
        assert report["transparent_ratio"] < 0.02  # 但几乎没透明
        assert any("transparency" in w.lower() or "background" in w.lower()
                    or "magenta" in w.lower()
                    for w in report["warnings"]), \
            f"应告警背景色键失效，但 warnings={report['warnings']}"

    def test_qc_report_written_to_json(self, tmp_path):
        """D-3: pipeline 应把 QC 报告落盘为 JSON"""
        import json
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
        qc_file = outdir / "qc-report.json"
        assert qc_file.exists(), "qc-report.json 未落盘"
        data = json.loads(qc_file.read_text())
        assert "transparent_ratio" in data
        assert "warnings" in data


# --------------------------------------------------------------------------- #
# Adaptive background detection — 非纯品红背景的自适应色键
#
# 根因: remove_bg_magenta 硬编码 MAGENTA=(255,0,255)，真实生图工具
# (Grok/DALL·E/Nano Banana 等非 SD 系) 对 hex 服从度有限，画出的"magenta"
# 常常是偏暗洋红 (230,45,183)，距离纯品红 77-86px，默认阈值 30 完全够不着，
# 导致 0% 透明、管线断流。修复 = 色键自适应检测实际背景色。
# --------------------------------------------------------------------------- #
def _custom_bg_sheet(rows, cols, cell, bg_rgb, fill_colors):
    """和 _magenta_sheet_with_cells 一样，但背景色可自定义。"""
    w = cols * cell
    h = rows * cell
    arr = np.zeros((h, w, 3), dtype=np.uint8)
    arr[..., 0] = bg_rgb[0]
    arr[..., 1] = bg_rgb[1]
    arr[..., 2] = bg_rgb[2]
    img = Image.fromarray(arr, "RGB")
    for i, color in enumerate(fill_colors):
        r = i // cols
        c = i % cols
        inset = cell // 4
        block = _solid(cell - 2 * inset, cell - 2 * inset, color)
        img.paste(block, (c * cell + inset, r * cell + inset))
    return img


class TestAdaptiveBackgroundDetection:
    def test_detect_returns_dominant_edge_color(self):
        """detect_background_color 从边缘采样，返回最常见的背景色"""
        img = _custom_bg_sheet(1, 1, 40, (50, 100, 200), [(255, 0, 0)])
        bg = process_sprite.detect_background_color(img)
        assert bg == (50, 100, 200)

    def test_detect_ignores_center_content(self):
        """detect_background_color 不被中心内容干扰（角色在 60% 安全区）"""
        # 绿色背景，中心占 50% 的大红块——边缘仍是绿色
        img = _custom_bg_sheet(1, 1, 100, (0, 200, 0), [(255, 0, 0)])
        bg = process_sprite.detect_background_color(img)
        assert bg == (0, 200, 0)

    def test_detect_pure_magenta_returns_exact(self):
        """纯品红背景应返回 (255,0,255)"""
        img = _solid(40, 40, (255, 0, 255))
        bg = process_sprite.detect_background_color(img)
        assert bg == (255, 0, 255)

    def test_detect_off_magenta_realistic(self):
        """偏暗洋红 (230,45,183) — 真实生图工具实际输出的背景色"""
        img = _custom_bg_sheet(2, 3, 60, (230, 45, 183),
                               [(255, 0, 0)] * 6)
        bg = process_sprite.detect_background_color(img)
        assert bg == (230, 45, 183)

    def test_detect_empty_image_does_not_crash(self):
        """0×0 退化图像不应 crash，返回默认品红（防御性 guard）"""
        empty = Image.new("RGB", (0, 0))
        bg = process_sprite.detect_background_color(empty)
        assert bg == (255, 0, 255)


class TestRemoveBgCustomKeyColor:
    def test_custom_key_color_removes_off_magenta_bg(self):
        """key_color 参数能键控非纯品红背景"""
        img = _custom_bg_sheet(1, 1, 40, (230, 45, 183), [(255, 0, 0)])
        out = process_sprite.remove_bg_magenta(
            img, threshold=30, key_color=(230, 45, 183)
        )
        arr = np.array(out)
        assert (arr[..., 3] == 0).any()   # 背景变透明
        assert arr[20, 20, 3] == 255      # 中心红色块保留

    def test_default_key_color_is_pure_magenta(self):
        """不传 key_color 时向后兼容，行为和现在一样（纯品红键控）"""
        img = _magenta_sheet_with_cells(1, 1, 40, [(255, 0, 0)])
        out_default = process_sprite.remove_bg_magenta(img, threshold=30)
        out_explicit = process_sprite.remove_bg_magenta(
            img, threshold=30, key_color=(255, 0, 255)
        )
        assert np.array_equal(np.array(out_default), np.array(out_explicit))

    def test_fixed_magenta_fails_on_off_magenta_bg(self):
        """用纯品红键控偏暗洋红背景 → 0% 透明（复现真实 bug）"""
        img = _custom_bg_sheet(1, 1, 40, (230, 45, 183), [(255, 0, 0)])
        out = process_sprite.remove_bg_magenta(img, threshold=30)
        arr = np.array(out)
        assert (arr[..., 3] == 255).all()  # 全不透明，色键完全没起作用


class TestPipelineAdaptiveBackground:
    """端到端: run_pipeline 应自适应检测背景色，不依赖纯品红硬编码。

    这组测试直接复现真实生图场景——生图工具画出的"magenta"是偏暗洋红
    (230,45,183)，距离纯品红 77-86px。修复前 pipeline 0% 透明断流；
    修复后应自动检测实际背景色并正确键控。
    """

    def test_adapts_to_off_magenta_background(self, tmp_path):
        """偏暗洋红背景 + 默认参数 → pipeline 应产生 >10% 透明度"""
        sheet = _custom_bg_sheet(
            2, 2, 50, (230, 45, 183),
            [(255, 0, 0), (0, 255, 0), (0, 0, 255), (255, 255, 0)],
        )
        inp = tmp_path / "off_magenta.png"
        sheet.save(inp)
        outdir = tmp_path / "out"
        sheet_path, qc = process_sprite.run_pipeline(
            input_path=str(inp), rows=2, cols=2,
            output_dir=str(outdir), cell_size=50,
        )
        assert qc["transparent_ratio"] > 0.10, (
            f"自适应色键失败，透明度仅 {qc['transparent_ratio']:.1%}"
        )
        # 不应有"色键失效"警告（背景被正确检测并键控了）
        assert not any("transparency" in w.lower() for w in qc["warnings"]), (
            f"不应告警色键失效: {qc['warnings']}"
        )

    def test_pure_magenta_unchanged_after_fix(self, tmp_path):
        """回归: 纯品红背景的 pipeline 行为不变（向后兼容）"""
        sheet = _magenta_sheet_with_cells(
            2, 2, 50, [(255, 0, 0), (0, 255, 0), (0, 0, 255), (255, 255, 0)]
        )
        inp = tmp_path / "pure_magenta.png"
        sheet.save(inp)
        outdir = tmp_path / "out"
        _, qc = process_sprite.run_pipeline(
            input_path=str(inp), rows=2, cols=2,
            output_dir=str(outdir), cell_size=50,
        )
        assert qc["transparent_ratio"] > 0.10
        assert qc["non_empty_frames"] == 4


def _glow_fringe_sheet(cell, bg_rgb, core_color, fringe_color, fringe_width=4):
    """带辉光过渡区的合成图：bg 背景 + fringe_color 环 + core_color 核心。

    模拟火焰/光效的辉光边缘——fringe_color 距离 bg 超过色键阈值 30，
    色键不清除它，复现真实生图工具在品红背景上画辉光导致的色键残留。
    """
    arr = np.zeros((cell, cell, 3), dtype=np.uint8)
    arr[..., 0] = bg_rgb[0]
    arr[..., 1] = bg_rgb[1]
    arr[..., 2] = bg_rgb[2]
    cx, cy = cell // 2, cell // 2
    core_half = cell // 4
    outer = core_half + fringe_width
    # 辉光环
    arr[cx - outer:cx + outer, cy - outer:cy + outer] = fringe_color
    # 核心块
    arr[cx - core_half:cx + core_half, cy - core_half:cy + core_half] = core_color
    return Image.fromarray(arr, "RGB")


# ---------------------------------------------------------------------------
# erode_alpha — alpha 通道形态学收缩，清理辉光过渡区的色键残留
# ---------------------------------------------------------------------------
class TestErodeAlpha:
    """erode_alpha 对 alpha 通道做 N 像素收缩（erode），吃掉辉光过渡区。
    这是 effect/spell 类素材（火焰、光效）色键后清理品红边缘的标准操作。
    """

    def test_zero_pixels_is_noop(self):
        """erode_alpha(pixels=0) 不改变图像"""
        img = _magenta_sheet_with_cells(1, 1, 40, [(255, 0, 0)])
        keyed = process_sprite.remove_bg_magenta(img)
        eroded = process_sprite.erode_alpha(keyed, pixels=0)
        assert np.array_equal(np.array(eroded), np.array(keyed))

    def test_erode_reduces_opaque_area(self):
        """erode 后不透明像素数量减少"""
        img = _magenta_sheet_with_cells(1, 1, 40, [(255, 0, 0)])
        keyed = process_sprite.remove_bg_magenta(img)
        before = np.count_nonzero(np.array(keyed)[..., 3] > 0)
        eroded = process_sprite.erode_alpha(keyed, pixels=2)
        after = np.count_nonzero(np.array(eroded)[..., 3] > 0)
        assert after < before, (
            f"erode 应减少不透明像素: {before} -> {after}"
        )

    def test_erode_zeros_rgb_on_eroded_pixels(self):
        """被侵蚀变透明的像素，RGB 必须置零（防止 GIF 颜色泄漏）"""
        arr = np.zeros((40, 40, 4), dtype=np.uint8)
        # 红色核心
        arr[12:28, 12:28] = [255, 0, 0, 255]
        # 粉品红环（模拟辉光残留，色键不清除）
        arr[10:30, 10:12] = [255, 0, 200, 255]
        arr[10:30, 28:30] = [255, 0, 200, 255]
        arr[10:12, 12:28] = [255, 0, 200, 255]
        arr[28:30, 12:28] = [255, 0, 200, 255]
        img = Image.fromarray(arr, "RGBA")

        eroded = process_sprite.erode_alpha(img, pixels=3)
        result = np.array(eroded)
        transparent = result[..., 3] == 0
        assert (result[transparent, :3] == 0).all(), (
            "透明像素的 RGB 必须置零，否则 GIF 里会泄漏颜色"
        )

    def test_erode_preserves_core(self):
        """erode 2px 不侵蚀大实心块的中心区域"""
        arr = np.zeros((100, 100, 4), dtype=np.uint8)
        arr[20:80, 20:80] = [255, 0, 0, 255]
        img = Image.fromarray(arr, "RGBA")

        eroded = process_sprite.erode_alpha(img, pixels=2)
        result = np.array(eroded)
        assert (result[40:60, 40:60, 3] == 255).all(), (
            "erode 2px 不应侵蚀中心实心区域"
        )

    def test_erode_on_fully_opaque_is_noop(self):
        """全不透明图像 erode 后仍全不透明（min of all-255 = 255）"""
        arr = np.full((40, 40, 4), 255, dtype=np.uint8)
        arr[..., :3] = [200, 50, 50]
        img = Image.fromarray(arr, "RGBA")

        eroded = process_sprite.erode_alpha(img, pixels=5)
        result = np.array(eroded)
        assert (result[..., 3] == 255).all(), (
            "全不透明图像 erode 后不应有透明像素"
        )


class TestPipelineErodeGlowFringe:
    """端到端: pipeline 加 erode 后应减少辉光残留。

    合成图复现真实火焰 sprite 的"辉光过渡区卡色键"问题——
    生图工具在品红背景上画辉光，辉光外缘颜色介于品红和火焰橙红之间，
    距离品红 30-100 的过渡区像素被色键保留，形成品红边缘。
    erode 收缩 alpha 通道吃掉这圈残留。
    """

    def test_erode_reduces_fringe_residue(self, tmp_path):
        """带辉光环的 sheet，erode_pixels=2 后品红系边缘像素减少"""
        # fringe_color (255,0,180) 距离品红 (255,0,255) = 75 > 30
        # 色键不清除它 → 残留在 sprite 边缘
        sheet = _glow_fringe_sheet(
            60, (255, 0, 255), (255, 80, 0), (255, 0, 180), fringe_width=4
        )
        inp = tmp_path / "glow.png"
        sheet.save(inp)
        outdir_no_erode = tmp_path / "no_erode"
        outdir_erode = tmp_path / "erode"

        _, qc_no = process_sprite.run_pipeline(
            input_path=str(inp), rows=1, cols=1,
            output_dir=str(outdir_no_erode), cell_size=60,
        )
        _, qc_erode = process_sprite.run_pipeline(
            input_path=str(inp), rows=1, cols=1,
            output_dir=str(outdir_erode), cell_size=60,
            erode_pixels=2,
        )
        # erode 后不透明像素应比 erode 前少（辉光环被侵蚀）
        ratio_no = 1 - qc_no["transparent_ratio"]
        ratio_erode = 1 - qc_erode["transparent_ratio"]
        assert ratio_erode < ratio_no, (
            f"erode 应减少不透明比例: {ratio_no:.3f} -> {ratio_erode:.3f}"
        )

    def test_default_erode_is_zero_backward_compat(self, tmp_path):
        """默认 erode_pixels=0，pipeline 行为与现有版本一致（向后兼容）"""
        sheet = _magenta_sheet_with_cells(1, 1, 40, [(255, 0, 0)])
        inp = tmp_path / "basic.png"
        sheet.save(inp)
        outdir = tmp_path / "out"
        _, qc = process_sprite.run_pipeline(
            input_path=str(inp), rows=1, cols=1,
            output_dir=str(outdir), cell_size=40,
        )
        assert qc["non_empty_frames"] == 1
        assert qc["transparent_ratio"] > 0.10
