"""Scaffold template-as-weapon bundles."""

from __future__ import annotations

import json
from pathlib import Path

from .markdown import render_params_doc, render_source_notes, render_template_card, render_template_guide
from .types import TemplateCard


_TEMPLATE_FILES = (
    "TEMPLATE_CARD.md",
    "TEMPLATE_GUIDE.md",
    "PARAMS.md",
    "template.params.example.json",
    "SOURCE_NOTES.md",
)


def _write_text(path: Path, content: str, *, overwrite: bool) -> None:
    if path.exists() and not overwrite:
        raise FileExistsError(str(path))
    path.write_text(content, encoding="utf-8", newline="\n")


def scaffold_template_bundle(target_dir: str | Path, card: TemplateCard, *, overwrite: bool = False) -> Path:
    """Create the standard template bundle file structure."""
    target = Path(target_dir)
    if target.exists() and not target.is_dir():
        raise NotADirectoryError(str(target))
    target.mkdir(parents=True, exist_ok=True)

    if not overwrite:
        for filename in _TEMPLATE_FILES:
            if (target / filename).exists():
                raise FileExistsError(str(target / filename))

    _write_text(target / "TEMPLATE_CARD.md", render_template_card(card), overwrite=overwrite)
    _write_text(target / "TEMPLATE_GUIDE.md", render_template_guide(card), overwrite=overwrite)
    _write_text(target / "PARAMS.md", render_params_doc(card), overwrite=overwrite)
    example = {param: "" for param in card.params} or {"brief": ""}
    _write_text(
        target / "template.params.example.json",
        json.dumps(example, ensure_ascii=False, indent=2) + "\n",
        overwrite=overwrite,
    )
    _write_text(target / "SOURCE_NOTES.md", render_source_notes(card), overwrite=overwrite)

    for dirname in ("assets", "renders", "snapshots"):
        (target / dirname).mkdir(exist_ok=True)
    return target
