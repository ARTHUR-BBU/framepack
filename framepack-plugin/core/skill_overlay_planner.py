"""Plan and apply Framepack hardening overlays to local Hermes skills.

This module is local-file only: no network, no package manager, no skill
installation. It owns only Framepack managed overlay blocks and delegates text
merging to ``skill_overlay_manager``.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any

from .skill_overlay_manager import SkillOverlay, apply_overlays, has_any_malformed_framepack_marker


@dataclass(frozen=True)
class SkillOverlayPlanItem:
    skill: str
    overlay_ids: list[str]
    path: str
    action: str
    changed: bool = False
    manual_review_required: bool = False
    applied: list[str] = field(default_factory=list)
    upstream_absorbed: list[str] = field(default_factory=list)
    preserved_user_blocks: list[str] = field(default_factory=list)
    notes: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        data = asdict(self)
        data["overlay_id"] = self.overlay_ids[0] if len(self.overlay_ids) == 1 else None
        return data


@dataclass(frozen=True)
class SkillOverlayPlan:
    skills_dir: str
    apply: bool
    status: str
    changed: bool
    items: list[SkillOverlayPlanItem]

    def to_dict(self) -> dict[str, Any]:
        return {
            "kind": "framepack_skill_overlay_plan",
            "skills_dir": self.skills_dir,
            "apply": self.apply,
            "status": self.status,
            "changed": self.changed,
            "items": [item.to_dict() for item in self.items],
        }


def run_skill_overlay_plan(
    *,
    skills_dir: str | Path,
    overlays: list[SkillOverlay] | tuple[SkillOverlay, ...],
    apply: bool = False,
) -> SkillOverlayPlan:
    root = Path(skills_dir)
    grouped = _group_by_skill(overlays)
    items: list[SkillOverlayPlanItem] = []

    for skill, skill_overlays in grouped.items():
        skill_path = root / skill / "SKILL.md"
        overlay_ids = [overlay.id for overlay in skill_overlays]
        if not skill_path.is_file():
            items.append(
                SkillOverlayPlanItem(
                    skill=skill,
                    overlay_ids=overlay_ids,
                    path=str(skill_path),
                    action="missing_skill",
                    changed=False,
                    notes=[f"target skill {skill} is missing"],
                )
            )
            continue

        original = skill_path.read_text(encoding="utf-8")
        if has_any_malformed_framepack_marker(original):
            items.append(
                SkillOverlayPlanItem(
                    skill=skill,
                    overlay_ids=overlay_ids,
                    path=str(skill_path),
                    action="manual_review",
                    changed=False,
                    manual_review_required=True,
                    notes=["malformed Framepack hardening marker detected; automated writes blocked"],
                )
            )
            continue

        result = apply_overlays(original, skill_overlays)
        if result.manual_review_required:
            items.append(
                SkillOverlayPlanItem(
                    skill=skill,
                    overlay_ids=overlay_ids,
                    path=str(skill_path),
                    action="manual_review",
                    changed=False,
                    manual_review_required=True,
                    applied=result.applied,
                    upstream_absorbed=result.upstream_absorbed,
                    preserved_user_blocks=result.preserved_user_blocks,
                    notes=result.notes,
                )
            )
            continue

        if result.changed:
            if apply:
                skill_path.write_text(result.text, encoding="utf-8")
            items.append(
                SkillOverlayPlanItem(
                    skill=skill,
                    overlay_ids=overlay_ids,
                    path=str(skill_path),
                    action="write_overlay",
                    changed=True,
                    applied=result.applied,
                    upstream_absorbed=result.upstream_absorbed,
                    preserved_user_blocks=result.preserved_user_blocks,
                    notes=result.notes,
                )
            )
            continue

        action = "upstream_absorbed" if result.upstream_absorbed else "noop"
        items.append(
            SkillOverlayPlanItem(
                skill=skill,
                overlay_ids=overlay_ids,
                path=str(skill_path),
                action=action,
                changed=False,
                applied=result.applied,
                upstream_absorbed=result.upstream_absorbed,
                preserved_user_blocks=result.preserved_user_blocks,
                notes=result.notes,
            )
        )

    changed = any(item.changed for item in items)
    status = _status(items, changed, apply)
    return SkillOverlayPlan(
        skills_dir=str(root),
        apply=apply,
        status=status,
        changed=changed,
        items=items,
    )


def _group_by_skill(overlays: list[SkillOverlay] | tuple[SkillOverlay, ...]) -> dict[str, list[SkillOverlay]]:
    grouped: dict[str, list[SkillOverlay]] = {}
    for overlay in overlays:
        grouped.setdefault(overlay.target_skill, []).append(overlay)
    return grouped


def _status(items: list[SkillOverlayPlanItem], changed: bool, apply: bool) -> str:
    if any(item.action == "manual_review" for item in items):
        return "manual_review"
    if any(item.action == "missing_skill" for item in items):
        return "needs_setup"
    if changed:
        return "changed" if apply else "would_change"
    return "ready"
