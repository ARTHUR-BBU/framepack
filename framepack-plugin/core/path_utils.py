"""Small shared path and JSON helpers for Framepack core modules."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any


def to_posix_string(path: str | Path) -> str:
    """Return a stable forward-slash path string for reports."""
    return str(path).replace("\\", "/")


def read_json_or_none(path: str | Path) -> Any | None:
    """Read JSON file, returning None for missing/invalid files."""
    try:
        return json.loads(Path(path).read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None
