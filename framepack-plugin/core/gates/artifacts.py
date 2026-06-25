"""Artifact helpers shared by readiness gates."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class ArtifactText:
    """Text artifact with existence metadata."""

    path: Path
    text: str = ""
    exists: bool = False


def read_text_artifact(path: Path) -> ArtifactText:
    """Read a UTF-8 text artifact without raising on missing/unreadable files."""

    try:
        return ArtifactText(path=path, text=path.read_text(encoding="utf-8", errors="replace"), exists=path.is_file())
    except OSError:
        return ArtifactText(path=path, text="", exists=False)
