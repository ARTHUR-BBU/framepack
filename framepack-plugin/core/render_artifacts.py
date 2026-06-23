"""Shared render artifact discovery helpers."""

from __future__ import annotations

from pathlib import Path


def find_nonempty_render(project_dir: str | Path) -> Path | None:
    """Return first non-empty mp4 in renders/, or None."""
    renders = Path(project_dir) / "renders"
    try:
        entries = sorted(renders.iterdir())
    except OSError:
        return None
    for item in entries:
        if item.suffix.lower() != ".mp4":
            continue
        try:
            if item.is_file() and item.stat().st_size > 0:
                return item
        except OSError:
            continue
    return None
