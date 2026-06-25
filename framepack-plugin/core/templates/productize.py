"""Productize source projects into template bundles."""

from __future__ import annotations

import shutil
from pathlib import Path

from .markdown import render_source_notes
from .scaffold import scaffold_template_bundle
from .types import TemplateCard

_SOURCE_FILES = ("index.html", "hyperframes.json", "package.json")
_SOURCE_DIRS = ("assets", "renders", "snapshots")
_REFERENCE_ARTIFACTS = (
    ("VIDEO_DNA.md", "VIDEO_DNA.md"),
    ("TEMPLATE_BLUEPRINT.md", "TEMPLATE_BLUEPRINT.md"),
    (".hermes/content_decomposition.md", "content_decomposition.md"),
)


def _copy_file(source: Path, target: Path, *, overwrite: bool) -> None:
    if target.exists() and not overwrite:
        raise FileExistsError(str(target))
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, target)


def _copy_dir(source: Path, target: Path, *, overwrite: bool) -> None:
    if target.exists() and not target.is_dir():
        raise NotADirectoryError(str(target))
    target.mkdir(parents=True, exist_ok=True)
    for child in source.iterdir():
        destination = target / child.name
        if child.is_dir():
            _copy_dir(child, destination, overwrite=overwrite)
        elif child.is_file():
            _copy_file(child, destination, overwrite=overwrite)


def package_template_source(
    source_dir: str | Path,
    target_dir: str | Path,
    card: TemplateCard,
    *,
    overwrite: bool = False,
) -> Path:
    """Package selected source project files into a template bundle."""
    source = Path(source_dir)
    if not source.is_dir():
        raise FileNotFoundError(str(source))
    target = Path(target_dir)
    scaffold_template_bundle(target, card, overwrite=overwrite)

    for filename in _SOURCE_FILES:
        source_file = source / filename
        if source_file.is_file():
            _copy_file(source_file, target / filename, overwrite=overwrite)

    for dirname in _SOURCE_DIRS:
        source_subdir = source / dirname
        if source_subdir.is_dir():
            _copy_dir(source_subdir, target / dirname, overwrite=overwrite)

    copied_reference: list[str] = []
    reference_target = target / "source"
    for source_rel, target_name in _REFERENCE_ARTIFACTS:
        artifact = source / source_rel
        if artifact.is_file():
            _copy_file(artifact, reference_target / target_name, overwrite=overwrite)
            copied_reference.append(f"source/{target_name}")

    notes = render_source_notes(card, source=str(source).replace("\\", "/"), reference_artifacts=copied_reference)
    (target / "SOURCE_NOTES.md").write_text(notes, encoding="utf-8", newline="\n")
    return target
