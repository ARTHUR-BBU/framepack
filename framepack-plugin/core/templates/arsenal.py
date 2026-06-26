"""Register and select template bundles as arsenal template_suite weapons."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
from typing import Iterable, Mapping, Sequence

from core.arsenal_registry import DEFAULT_PLUGIN_VERSION, _atomic_write_json, ensure_arsenal, load_arsenal

from .types import TemplateCard, inspect_template_bundle

_INTENT_TAG_ALIASES = {
    "产品发布": "product launch",
    "产品广告": "product launch",
    "新品发布": "product launch",
    "推广": "product launch",
    "品牌视频": "brand video",
    "品牌讲解": "brand explainer",
    "品牌故事": "brand explainer",
    "科普": "educational",
    "教育": "educational",
    "社交媒体": "social teaser",
    "动效": "motion graphic",
    "字幕": "caption",
    "法律报告": "legal report",
    "legal report": "legal report",
    "legal-report": "legal report",
}


def _match_intent_tags(user_intent: str, candidates: Iterable[str]) -> list[str]:
    """Return canonical tags detected in user_intent from a candidate set.

    Candidates are template-declared tags (suitable_for / not_suitable_for).
    Matching tries, in order, for each candidate:
      1. the raw candidate text (ASCII substring match)
      2. the alias-normalized canonical form
      3. any CJK alias that maps to that canonical form (reverse alias lookup)
    Longest-first ordering + span-claim prevents CJK short-tag false positives
    like "品牌" matching inside "品牌视频".
    """
    lowered = (user_intent or "").lower()
    raw_candidates = [str(candidate).strip() for candidate in candidates if str(candidate).strip()]
    canonicals = []
    for raw in raw_candidates:
        canonicals.append(_INTENT_TAG_ALIASES.get(raw.lower(), raw.lower()))
    # Build reverse alias lookup: canonical -> list of source texts
    reverse_aliases: dict[str, list[str]] = {}
    for source, canonical in _INTENT_TAG_ALIASES.items():
        reverse_aliases.setdefault(canonical.lower(), []).append(source.lower())
    for raw in raw_candidates:
        reverse_aliases.setdefault(raw.lower(), []).append(raw.lower())

    consumed_spans: list[tuple[int, int]] = []

    def _claim(value: str) -> bool:
        start = 0
        while True:
            index = lowered.find(value, start)
            if index == -1:
                return False
            span = (index, index + len(value))
            if any(not (span[1] <= existing[0] or span[0] >= existing[1]) for existing in consumed_spans):
                start = index + 1
                continue
            consumed_spans.append(span)
            return True

    # Order probes longest-first so longer CJK aliases win over shorter ones.
    probes_by_canonical: dict[str, list[str]] = {}
    for raw, canonical in zip(raw_candidates, canonicals):
        probes = probes_by_canonical.setdefault(canonical, [])
        probes.extend(reverse_aliases.get(canonical, []))
        probes.append(raw.lower())
        probes.append(canonical)
    for canonical in probes_by_canonical:
        probes_by_canonical[canonical] = sorted(set(probes_by_canonical[canonical]), key=len, reverse=True)

    matched: list[str] = []
    for canonical in canonicals:
        if canonical in matched:
            continue
        for probe in probes_by_canonical.get(canonical, []):
            if _claim(probe):
                matched.append(canonical)
                break
    return matched


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


def recommend_templates(project_dir: str | Path, user_intent: str) -> list[dict]:
    """Score registered template_suite weapons by fit against user intent.

    The match is tag-overlap based: each registered template declares
    ``suitable_for`` and ``not_suitable_for`` tags. We normalize both the
    template tags and the user intent into canonical tags, then score:

    - +2 per suitable_for tag matched
    - -3 per not_suitable_for tag matched (hard penalty; misfit matters)
    - templates with the same score stay sorted by id

    Returns a list of recommendation dicts sorted by score desc. Templates
    with negative net score are still returned (score can be negative) so the
    caller can show "this template is a stretch because X" if it wants.
    """
    templates = list_registered_templates(project_dir)
    if not templates:
        return []
    recommendations: list[dict] = []
    for template in templates:
        suitable_raw = list(template.get("suitable_for", []))
        not_suitable_raw = list(template.get("not_suitable_for", []))
        matched = _match_intent_tags(user_intent, suitable_raw)
        excluded = _match_intent_tags(user_intent, not_suitable_raw)
        score = 2 * len(matched) - 3 * len(excluded)
        recommendations.append(
            {
                "template_id": template.get("id", ""),
                "template_name": template.get("name", template.get("id", "")),
                "description": template.get("description", ""),
                "score": score,
                "matched_tags": matched,
                "excluded_tags": excluded,
                "params": list(template.get("params", [])),
                "path": template.get("path", ""),
            }
        )
    recommendations.sort(key=lambda item: (-item["score"], item["template_id"].lower()))
    return recommendations
