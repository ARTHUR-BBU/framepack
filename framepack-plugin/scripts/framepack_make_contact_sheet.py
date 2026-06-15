#!/usr/bin/env python
"""Build a lightweight contact-sheet plan for Framepack proof frames.

The script intentionally keeps the planning logic dependency-free. If Pillow is
installed, it can also render the sheet; otherwise callers still get a stable
plan they can inspect in tests and logs.
"""

from __future__ import annotations

import argparse
import json
from math import ceil, sqrt
from pathlib import Path
from typing import Any


def build_contact_sheet_plan(images: list[Path], output: Path | None, columns: int | None = None) -> dict[str, Any]:
    if not images:
        raise ValueError("No proof images supplied")
    output_path = output or images[0].parent / "contact-sheet.jpg"
    col_count = columns or max(1, ceil(sqrt(len(images))))
    return {
        "kind": "framepack_contact_sheet_plan",
        "output": str(output_path),
        "count": len(images),
        "columns": col_count,
        "rows": ceil(len(images) / col_count),
        "images": [str(path) for path in images],
        "labels": [path.stem for path in images],
    }


def render_with_pillow(plan: dict[str, Any], thumb_width: int = 320, thumb_height: int = 180) -> Path:
    try:
        from PIL import Image, ImageDraw
    except ImportError as exc:  # pragma: no cover - optional dependency
        raise SystemExit("Pillow not installed; use --plan-only or install pillow") from exc

    images = [Path(path) for path in plan["images"]]
    columns = int(plan["columns"])
    rows = int(plan["rows"])
    label_height = 24
    sheet = Image.new("RGB", (columns * thumb_width, rows * (thumb_height + label_height)), "white")
    draw = ImageDraw.Draw(sheet)
    for index, image_path in enumerate(images):
        col = index % columns
        row = index // columns
        x = col * thumb_width
        y = row * (thumb_height + label_height)
        with Image.open(image_path) as img:
            img.thumbnail((thumb_width, thumb_height))
            sheet.paste(img.convert("RGB"), (x, y))
        draw.text((x + 4, y + thumb_height + 4), Path(image_path).stem, fill=(0, 0, 0))
    output = Path(plan["output"])
    output.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(output, quality=90)
    return output


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("images", nargs="+", type=Path)
    parser.add_argument("--output", type=Path)
    parser.add_argument("--columns", type=int)
    parser.add_argument("--plan-only", action="store_true")
    args = parser.parse_args(argv)

    plan = build_contact_sheet_plan(args.images, args.output, args.columns)
    if args.plan_only:
        print(json.dumps(plan, ensure_ascii=False, indent=2))
        return 0
    print(render_with_pillow(plan))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
