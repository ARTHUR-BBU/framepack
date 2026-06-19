#!/usr/bin/env python
"""Layout reference generator for framepack-sprite-forge.

Produces a grid reference image (dashed cell borders + a solid safe-area frame
at 60% inside each cell) that can be fed to an image-generation model as a
composition guide. Pure Pillow drawing — no external dependencies.

CLI:
    python make_layout_guide.py --rows 3 --cols 4 --cell-size 384 --output guide.png
"""

from __future__ import annotations

import argparse
import sys
from typing import List, Sequence, Tuple

from PIL import Image, ImageDraw

# Drawing palette.
_BG = (255, 255, 255)  # white background
_GRID = (130, 130, 130)  # dashed cell border (grey)
_SAFE = (0, 0, 0)  # solid safe-area frame (black)
_SAFE_RATIO = 0.6  # safe area is 60% of the cell


def _dashed_line(
    draw: ImageDraw.ImageDraw,
    start: Tuple[int, int],
    end: Tuple[int, int],
    fill: Sequence[int],
    dash: int = 8,
    gap: int = 5,
    width: int = 1,
) -> None:
    """Draw an axis-aligned dashed line between ``start`` and ``end``."""
    x0, y0 = start
    x1, y1 = end
    horizontal = y0 == y1
    length = (x1 - x0) if horizontal else (y1 - y0)
    step = dash + gap
    pos = 0
    while pos < length:
        seg_start = pos
        seg_end = min(pos + dash, length)
        if horizontal:
            draw.line(
                (x0 + seg_start, y0, x0 + seg_end, y0), fill=fill, width=width
            )
        else:
            draw.line(
                (x0, y0 + seg_start, x0, y0 + seg_end), fill=fill, width=width
            )
        pos += step


def _dashed_rect(
    draw: ImageDraw.ImageDraw, box: Sequence[int], fill: Sequence[int]
) -> None:
    """Draw a dashed rectangle outline around ``box``."""
    x0, y0, x1, y1 = box
    _dashed_line(draw, (x0, y0), (x1, y0), fill)  # top
    _dashed_line(draw, (x0, y1), (x1, y1), fill)  # bottom
    _dashed_line(draw, (x0, y0), (x0, y1), fill)  # left
    _dashed_line(draw, (x1, y0), (x1, y1), fill)  # right


def make_guide(rows: int, cols: int, cell_size: int, output: str) -> None:
    """Generate a grid reference image and save it to ``output``.

    The canvas is ``cols*cell_size`` wide by ``rows*cell_size`` tall. Each cell
    gets a dashed border and a solid safe-area frame occupying the central 60%.
    """
    width = cols * cell_size
    height = rows * cell_size
    img = Image.new("RGB", (width, height), _BG)
    draw = ImageDraw.Draw(img)

    margin = int(round(cell_size * (1 - _SAFE_RATIO) / 2))  # 20% margin each side

    for r in range(rows):
        for c in range(cols):
            x0 = c * cell_size
            y0 = r * cell_size
            x1 = x0 + cell_size
            y1 = y0 + cell_size

            # Dashed cell border.
            _dashed_rect(draw, (x0, y0, x1, y1), _GRID)

            # Solid safe-area frame (central 60%).
            draw.rectangle(
                (x0 + margin, y0 + margin, x1 - margin, y1 - margin),
                outline=_SAFE,
                width=2,
            )

    img.save(output)


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Generate a sprite-sheet layout reference image."
    )
    parser.add_argument("--rows", type=int, required=True, help="Grid row count.")
    parser.add_argument("--cols", type=int, required=True, help="Grid column count.")
    parser.add_argument(
        "--cell-size", type=int, required=True, help="Cell size in pixels."
    )
    parser.add_argument("--output", required=True, help="Output PNG path.")
    return parser


def main(argv: List[str] | None = None) -> int:
    parser = _build_parser()
    args = parser.parse_args(argv)
    make_guide(args.rows, args.cols, args.cell_size, args.output)
    print(f"Wrote {args.output}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
