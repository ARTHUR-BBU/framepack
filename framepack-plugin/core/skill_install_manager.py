"""Install official HyperFrames skills into Hermes safely.

This module is intentionally source-driven and offline-safe: it does not fetch
packages or call npm. Callers provide official skill texts that were acquired by
a separate, approval-gated step. The manager plans or applies local file writes,
then delegates Framepack hardening insertion to the overlay planner.
"""

from __future__ import annotations

import hashlib
import json
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any

from .skill_overlay_manager import SkillOverlay
from .skill_overlay_planner import run_skill_overlay_plan


@dataclass(frozen=True)
class OfficialSkill:
    name: str
    version: str
    text: str


@dataclass(frozen=True)
class SkillInstallPlanItem:
    skill: str
    path: str
    action: str
    changed: bool = False
    official_version: str | None = None
    backup_path: str | None = None
    overlay_ids: list[str] = field(default_factory=list)
    notes: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(frozen=True)
class SkillInstallPlan:
    skills_dir: str
    manifest_path: str
    apply: bool
    status: str
    changed: bool
    items: list[SkillInstallPlanItem]
    manifest: dict[str, Any] | None = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "kind": "framepack_skill_install_plan",
            "skills_dir": self.skills_dir,
            "manifest_path": self.manifest_path,
            "apply": self.apply,
            "status": self.status,
            "changed": self.changed,
            "items": [item.to_dict() for item in self.items],
            "manifest": self.manifest,
        }


def run_skill_install_plan(
    *,
    skills_dir: str | Path,
    official_skills: list[OfficialSkill] | tuple[OfficialSkill, ...],
    overlays: list[SkillOverlay] | tuple[SkillOverlay, ...],
    manifest_path: str | Path,
    apply: bool = False,
    required_skills: list[str] | tuple[str, ...] | None = None,
    backup_dir: str | Path | None = None,
    replace_existing: bool = False,
) -> SkillInstallPlan:
    root = Path(skills_dir)
    manifest_file = Path(manifest_path)
    official_by_name = {skill.name: skill for skill in official_skills}
    required = list(required_skills) if required_skills is not None else list(official_by_name)

    missing_sources = [name for name in required if name not in official_by_name]
    if missing_sources:
        items = [
            SkillInstallPlanItem(
                skill=name,
                path=str(root / name / "SKILL.md"),
                action="missing_official_source",
                changed=False,
                notes=[f"official source for {name} is missing"],
            )
            for name in missing_sources
        ]
        return SkillInstallPlan(
            skills_dir=str(root),
            manifest_path=str(manifest_file),
            apply=apply,
            status="needs_source",
            changed=False,
            items=items,
            manifest=None,
        )

    items: list[SkillInstallPlanItem] = []
    changed = False
    manual_review = False
    needs_source = False

    for name in required:
        skill_path = root / name / "SKILL.md"
        official = official_by_name.get(name)
        if official is None:
            needs_source = True
            items.append(
                SkillInstallPlanItem(
                    skill=name,
                    path=str(skill_path),
                    action="missing_official_source",
                    changed=False,
                    notes=[f"official source for {name} is missing"],
                )
            )
            continue

        if skill_path.exists() and not replace_existing:
            manual_review = True
            items.append(
                SkillInstallPlanItem(
                    skill=name,
                    path=str(skill_path),
                    action="already_exists",
                    changed=False,
                    official_version=official.version,
                    notes=["existing skill would not be overwritten without replace_existing=True"],
                )
            )
            continue

        action = "replace_skill" if skill_path.exists() else "install_skill"
        backup_path: str | None = None
        if apply:
            skill_path.parent.mkdir(parents=True, exist_ok=True)
            if skill_path.exists():
                backup_root = Path(backup_dir) if backup_dir else manifest_file.parent / "backups"
                backup_root.mkdir(parents=True, exist_ok=True)
                backup = backup_root / f"{name}.SKILL.md.bak"
                backup.write_text(skill_path.read_text(encoding="utf-8"), encoding="utf-8")
                backup_path = str(backup)
            skill_path.write_text(official.text, encoding="utf-8")
        changed = True
        items.append(
            SkillInstallPlanItem(
                skill=name,
                path=str(skill_path),
                action=action,
                changed=True,
                official_version=official.version,
                backup_path=backup_path,
                notes=[f"{action} planned" if not apply else f"{action} applied"],
            )
        )

    overlay_ids_by_skill: dict[str, list[str]] = {}
    if apply and not manual_review and not needs_source and overlays:
        overlay_plan = run_skill_overlay_plan(skills_dir=root, overlays=overlays, apply=True)
        for overlay_item in overlay_plan.items:
            overlay_ids_by_skill.setdefault(overlay_item.skill, []).extend(overlay_item.applied)
            if overlay_item.action == "manual_review":
                manual_review = True
    elif not apply:
        for overlay in overlays:
            overlay_ids_by_skill.setdefault(overlay.target_skill, []).append(overlay.id)

    item_map = {item.skill: item for item in items}
    if overlay_ids_by_skill:
        new_items: list[SkillInstallPlanItem] = []
        for item in items:
            new_items.append(
                SkillInstallPlanItem(
                    skill=item.skill,
                    path=item.path,
                    action=item.action,
                    changed=item.changed,
                    official_version=item.official_version,
                    backup_path=item.backup_path,
                    overlay_ids=overlay_ids_by_skill.get(item.skill, item.overlay_ids),
                    notes=item.notes,
                )
            )
        items = new_items

    manifest = _build_manifest(root, official_by_name, overlays) if apply and not manual_review and not needs_source else None
    if manifest is not None:
        manifest_file.parent.mkdir(parents=True, exist_ok=True)
        manifest_file.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    status = _status(changed, manual_review, needs_source, apply)
    return SkillInstallPlan(
        skills_dir=str(root),
        manifest_path=str(manifest_file),
        apply=apply,
        status=status,
        changed=changed and not manual_review and not needs_source,
        items=items,
        manifest=manifest,
    )


def _build_manifest(root: Path, official_by_name: dict[str, OfficialSkill], overlays: list[SkillOverlay] | tuple[SkillOverlay, ...]) -> dict[str, Any]:
    overlay_ids_by_skill: dict[str, list[str]] = {}
    for overlay in overlays:
        overlay_ids_by_skill.setdefault(overlay.target_skill, []).append(overlay.id)

    skills: dict[str, Any] = {}
    for name, official in official_by_name.items():
        installed_path = root / name / "SKILL.md"
        installed_text = installed_path.read_text(encoding="utf-8") if installed_path.is_file() else ""
        skills[name] = {
            "official_version": official.version,
            "official_sha256": _sha256(official.text),
            "installed_sha256": _sha256(installed_text),
            "framepack_overlays": overlay_ids_by_skill.get(name, []),
            "user_local_blocks": [],
        }
    return {"kind": "framepack_skill_install_manifest", "schema_version": "1.0.0", "skills": skills}


def _sha256(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def _status(changed: bool, manual_review: bool, needs_source: bool, apply: bool) -> str:
    if needs_source:
        return "needs_source"
    if manual_review:
        return "manual_review"
    if changed:
        return "changed" if apply else "would_install"
    return "ready"
