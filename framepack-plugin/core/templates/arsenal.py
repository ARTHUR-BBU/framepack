"""Register and select template bundles as arsenal template_suite weapons."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
from typing import Mapping, Sequence

from core.arsenal_registry import DEFAULT_PLUGIN_VERSION, _atomic_write_json, ensure_arsenal, load_arsenal

from .types import TemplateCard, inspect_template_bundle


@dataclass(frozen=True)
class TemplateArsenalResult:
    """Result of registering a template bundle into project arsenal."""

    changed: bool
    arsenal_path: str
    entry: dict

    def to_dict(self) -> dict:
        return {
            "changed": self.changed,
            "arsenal_path": self.arsenal_path,
            "entry": self.entry,
        }


def _now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def _to_posix(path: Path) -> str:
    return str(path).replace("\\", "/")


def _display_path(path: Path, base: Path) -> str:
    try:
        return _to_posix(path.resolve().relative_to(base.resolve()))
    except ValueError:
        return _to_posix(path)


def _template_hash(template_dir: Path) -> str:
    digest = hashlib.sha256()
    for path in sorted(p for p in template_dir.rglob("*") if p.is_file() and not p.is_symlink()):
        rel = path.relative_to(template_dir).as_posix()
        digest.update(rel.encode("utf-8"))
        digest.update(b"\0")
        digest.update(path.read_bytes())
        digest.update(b"\0")
    return f"sha256:{digest.hexdigest()}"


def _registration_entry(card: TemplateCard, template_dir: Path, project_dir: Path) -> dict:
    now = _now()
    template_path = _display_path(template_dir, project_dir)
    return {
        "id": card.id,
        "kind": "template_suite",
        "source": "local",
        "status": "active",
        "path": template_path,
        "template_card": f"{template_path}/TEMPLATE_CARD.md",
        "name": card.name,
        "description": card.description,
        "suitable_for": list(card.suitable_for),
        "not_suitable_for": list(card.not_suitable_for),
        "params": list(card.params),
        "hash": _template_hash(template_dir),
        "registered_at": now,
        "updated_at": now,
    }


def register_template_bundle(
    project_dir: str | Path,
    template_dir: str | Path,
    *,
    plugin_version: str = DEFAULT_PLUGIN_VERSION,
) -> TemplateArsenalResult:
    """Register a complete/draft template bundle as a template_suite weapon."""
    project = Path(project_dir)
    template = Path(template_dir)
    report = inspect_template_bundle(template)
    errors = [issue for issue in report.issues if issue.severity == "ERROR"]
    if report.card is None or errors:
        codes = ", ".join(issue.code for issue in errors) or "missing_template_card"
        raise ValueError(f"Template bundle is not registerable: {codes}")

    ensure_result = ensure_arsenal(project, plugin_version=plugin_version)
    if ensure_result.error:
        raise RuntimeError(ensure_result.error)
    arsenal_path = ensure_result.path
    before = arsenal_path.read_text(encoding="utf-8")
    data = load_arsenal(arsenal_path)
    data.setdefault("weapons", {})

    entry = _registration_entry(report.card, template, project)
    existing = data["weapons"].get(report.card.id)
    if existing and existing.get("registered_at"):
        entry["registered_at"] = existing["registered_at"]
        stable_existing = {key: value for key, value in existing.items() if key != "updated_at"}
        stable_entry = {key: value for key, value in entry.items() if key != "updated_at"}
        if stable_existing == stable_entry:
            return TemplateArsenalResult(changed=False, arsenal_path=_to_posix(arsenal_path), entry=dict(existing))
    data["weapons"][report.card.id] = entry
    data["updated_at"] = _now()
    data["plugin_version_updated"] = plugin_version
    after = json.dumps(data, ensure_ascii=False, indent=2) + "\n"
    changed = before != after
    if changed:
        _atomic_write_json(arsenal_path, data)
    return TemplateArsenalResult(changed=changed, arsenal_path=_to_posix(arsenal_path), entry=entry)


def list_registered_templates(project_dir: str | Path) -> list[dict]:
    """Return active/inventory template_suite entries from project arsenal."""
    path = Path(project_dir) / ".framepack" / "arsenal.json"
    if not path.is_file():
        return []
    data = load_arsenal(path)
    weapons = data.get("weapons") if isinstance(data.get("weapons"), dict) else {}
    templates = [dict(entry) for entry in weapons.values() if isinstance(entry, dict) and entry.get("kind") == "template_suite"]
    return sorted(templates, key=lambda item: str(item.get("id", "")).lower())


def _render_selection(
    entry: Mapping,
    *,
    brief: str | None,
    params: Mapping[str, str],
    assets: Sequence[str],
    missing_params: Sequence[str],
) -> str:
    lines = [
        "# Template Selection",
        "",
        f"template_id: {entry.get('id', '')}",
        f"template_name: {entry.get('name') or entry.get('id', '')}",
        f"template_path: {entry.get('path', '')}",
        f"hash: {entry.get('hash', '')}",
        "",
        "## Brief",
        "",
        brief or "TODO: collect user brief",
        "",
        "## Parameters",
        "",
    ]
    if params:
        for key in sorted(params):
            lines.append(f"- {key}: {params[key]}")
    else:
        lines.append("- TODO: collect template parameters")
    lines.extend(["", "## Assets", ""])
    if assets:
        for asset in assets:
            lines.append(f"- {asset}")
    else:
        lines.append("- TODO: collect required assets")
    lines.extend(["", "## Next co-creation questions", ""])
    if missing_params:
        for param in missing_params:
            lines.append(f"- What should `{param}` be for this video?")
    else:
        lines.append("- Confirm whether the user wants to stay within the template or intentionally break it.")
    lines.append("")
    return "\n".join(lines)


def select_template(
    project_dir: str | Path,
    template_id: str,
    *,
    brief: str | None = None,
    params: Mapping[str, str] | None = None,
    assets: Sequence[str] | None = None,
) -> dict:
    """Select a registered template and write `.framepack/template-selection.md`."""
    project = Path(project_dir)
    templates = {entry.get("id"): entry for entry in list_registered_templates(project)}
    if template_id not in templates:
        raise KeyError(template_id)
    entry = templates[template_id]
    supplied_params = dict(params or {})
    required_params = [str(item) for item in entry.get("params", [])]
    missing_params = [param for param in required_params if param not in supplied_params]
    selection_path = project / ".framepack" / "template-selection.md"
    selection_path.parent.mkdir(parents=True, exist_ok=True)
    selection_path.write_text(
        _render_selection(
            entry,
            brief=brief,
            params=supplied_params,
            assets=list(assets or []),
            missing_params=missing_params,
        ),
        encoding="utf-8",
        newline="\n",
    )
    return {
        "template_id": template_id,
        "selection_path": _to_posix(selection_path),
        "missing_params": missing_params,
        "entry": entry,
    }
