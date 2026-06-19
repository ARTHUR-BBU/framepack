"""TDD tests for sprite-forge layout reference generator (make_layout_guide.py).

Pure Pillow drawing — no external dependencies beyond numpy/Pillow used in tests.
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

import make_layout_guide  # noqa: E402


# ---------------------------------------------------------------------------
# make_guide
# ---------------------------------------------------------------------------
def test_make_guide_creates_png_with_correct_dimensions(tmp_path):
    out = tmp_path / "guide.png"
    make_layout_guide.make_guide(2, 3, 100, str(out))
    assert out.exists()
    img = Image.open(out)
    assert img.format == "PNG"
    # width = cols*cell_size, height = rows*cell_size
    assert img.size == (300, 200)


def test_make_guide_draws_non_uniform_content(tmp_path):
    out = tmp_path / "guide.png"
    make_layout_guide.make_guide(2, 2, 80, str(out))
    arr = np.array(Image.open(out).convert("RGB"))
    # A reference grid with dashed cells + safe-area frames must not be a flat fill
    assert arr.std() > 0


def test_make_guide_has_safe_area_within_each_cell(tmp_path):
    """Each cell should contain a solid safe-area frame (60% of cell)."""
    out = tmp_path / "guide.png"
    rows, cols, cell = 1, 1, 100
    make_layout_guide.make_guide(rows, cols, cell, str(out))
    arr = np.array(Image.open(out).convert("RGB"))
    # Background is light/white; safe-area frame is dark. Count dark pixels (frame ink).
    dark = np.sum(np.all(arr < 100, axis=-1))
    assert dark > 0, "expected a visible (dark) safe-area frame"


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------
def test_cli_make_guide(tmp_path):
    out = tmp_path / "cli_guide.png"
    script = SCRIPTS_DIR / "make_layout_guide.py"
    res = subprocess.run(
        [
            sys.executable,
            str(script),
            "--rows",
            "2",
            "--cols",
            "3",
            "--cell-size",
            "64",
            "--output",
            str(out),
        ],
        capture_output=True,
        text=True,
    )
    assert res.returncode == 0, res.stderr
    assert out.exists()
    img = Image.open(out)
    assert img.size == (192, 128)  # 3*64 x 2*64
