"""Built-in template bundle installation helpers."""

from __future__ import annotations

import shutil
from pathlib import Path

from .arsenal import _template_hash, _to_posix, register_template_bundle
from .types import inspect_template_bundle

PLUGIN_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_BUILTIN_ROOT = PLUGIN_ROOT / "templates" / "bundles"


def list_builtin_templates(*, builtin_root: str | Path | None = None) -> list[dict]:
    """List built-in template bundles shipped with the Framepack plugin."""
    root = Path(builtin_root) if builtin_root is not None else DEFAULT_BUILTIN_ROOT
    if not root.is_dir():
        return []
    templates: list[dict] = []
    for child in sorted(root.iterdir(), key=lambda item: item.name.lower()):
        if not child.is_dir():
            continue
        report = inspect_template_bundle(child)
        if report.card is None:
            continue
        templates.append(
            {
                "id": report.card.id,
                "name": report.card.name,
                "description": report.card.description,
                "path": _to_posix(child),
                "status": report.status,
                "params": list(report.card.params),
                "suitable_for": list(report.card.suitable_for),
                "not_suitable_for": list(report.card.not_suitable_for),
            }
        )
    return templates


def _copy_builtin_bundle(source: Path, target: Path) -> bool:
    """Copy source into managed target; return True when bytes changed."""
    if target.exists() and target.is_dir() and _template_hash(source) == _template_hash(target):
        return False
    if target.exists():
        if not target.is_dir():
            raise FileExistsError(str(target))
        shutil.rmtree(target)
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copytree(source, target)
    return True


def install_builtin_template(
    project_dir: str | Path,
    template_id: str,
    *,
    builtin_root: str | Path | None = None,
) -> dict:
    """Install a built-in template bundle into project .framepack/templates and register it."""
    project = Path(project_dir)
    if not project.is_dir():
        raise FileNotFoundError(str(project))
    root = Path(builtin_root) if builtin_root is not None else DEFAULT_BUILTIN_ROOT
    source = root / template_id
    if not source.is_dir():
        raise KeyError(template_id)
    report = inspect_template_bundle(source)
    if report.card is None or any(issue.severity == "ERROR" for issue in report.issues):
        raise ValueError(f"Built-in template is not installable: {template_id}")

    target = project / ".framepack" / "templates" / template_id
    copied = _copy_builtin_bundle(source, target)
    result = register_template_bundle(project, target, source="builtin")
    return {
        "template_id": template_id,
        "installed_path": _to_posix(target),
        "changed": bool(copied or result.changed),
        "entry": result.entry,
    }
