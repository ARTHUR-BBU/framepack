"""Productize source projects into template bundles."""

from __future__ import annotations

import shutil
from pathlib import Path

from .markdown import render_source_notes
from .scaffold import _TEMPLATE_FILES, scaffold_template_bundle
from .types import TemplateCard

_SOURCE_FILES = ("index.html", "hyperframes.json", "package.json")
_SOURCE_DIRS = ("assets", "renders", "snapshots")
_REFERENCE_ARTIFACTS = (
    ("VIDEO_DNA.md", "VIDEO_DNA.md"),
    ("TEMPLATE_BLUEPRINT.md", "TEMPLATE_BLUEPRINT.md"),
    (".hermes/content_decomposition.md", "content_decomposition.md"),
)


def _to_posix(path: Path) -> str:
    return str(path).replace("\\", "/")


def _is_relative_to(path: Path, base: Path) -> bool:
    try:
        path.relative_to(base)
        return True
    except ValueError:
        return False


def _copy_file(source: Path, target: Path, *, overwrite: bool) -> None:
    if target.exists() and not overwrite:
        raise FileExistsError(str(target))
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, target)


def _copy_dir(source: Path, target: Path, *, overwrite: bool) -> None:
    if source.is_symlink():
        return
    if target.exists() and not target.is_dir():
        raise NotADirectoryError(str(target))
    target.mkdir(parents=True, exist_ok=True)
    for child in source.iterdir():
        if child.is_symlink():
            continue
        destination = target / child.name
        if child.is_dir():
            _copy_dir(child, destination, overwrite=overwrite)
        elif child.is_file():
            _copy_file(child, destination, overwrite=overwrite)


def _planned_source_files(source: Path, target: Path) -> tuple[list[tuple[Path, Path]], list[str]]:
    files: list[tuple[Path, Path]] = []
    copied_reference: list[str] = []

    for filename in _SOURCE_FILES:
        source_file = source / filename
        if source_file.is_symlink():
            continue
        if source_file.is_file():
            files.append((source_file, target / filename))

    for dirname in _SOURCE_DIRS:
        source_subdir = source / dirname
        if source_subdir.is_symlink():
            continue
        if source_subdir.is_dir():
            for child in source_subdir.rglob("*"):
                if child.is_symlink() or not child.is_file():
                    continue
                rel = child.relative_to(source_subdir)
                files.append((child, target / dirname / rel))

    reference_target = target / "source"
    for source_rel, target_name in _REFERENCE_ARTIFACTS:
        artifact = source / source_rel
        if artifact.is_symlink():
            continue
        if artifact.is_file():
            files.append((artifact, reference_target / target_name))
            copied_reference.append(f"source/{target_name}")

    return files, copied_reference


def _preflight_package(source: Path, target: Path, *, overwrite: bool) -> tuple[list[tuple[Path, Path]], list[str]]:
    source_resolved = source.resolve()
    target_resolved = target.resolve()
    if target_resolved == source_resolved or _is_relative_to(target_resolved, source_resolved):
        raise ValueError("target_dir must not be inside source_dir")

    planned_files, copied_reference = _planned_source_files(source, target)
    managed_targets = [target / filename for filename in _TEMPLATE_FILES]
    managed_targets.append(target / "SOURCE_NOTES.md")
    managed_targets.extend(destination for _, destination in planned_files)

    if not overwrite:
        for destination in managed_targets:
            if destination.exists() and destination.is_file():
                raise FileExistsError(str(destination))
            if destination.exists() and not destination.is_dir() and not destination.is_file():
                raise FileExistsError(str(destination))

    return planned_files, copied_reference


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
    planned_files, copied_reference = _preflight_package(source, target, overwrite=overwrite)

    scaffold_template_bundle(target, card, overwrite=overwrite)
    for source_file, destination in planned_files:
        _copy_file(source_file, destination, overwrite=overwrite)

    notes = render_source_notes(card, source=f"local provenance: {_to_posix(source)}", reference_artifacts=copied_reference)
    (target / "SOURCE_NOTES.md").write_text(notes, encoding="utf-8", newline="\n")
    return target
