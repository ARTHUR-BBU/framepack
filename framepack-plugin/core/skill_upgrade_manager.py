"""Plan safe upgrades for local HyperFrames skill files.

The upgrade manager is a pure decision engine. It combines:
- old official upstream skill text,
- new official upstream skill text,
- current local installed skill text,
- Framepack hardening overlays,

and returns a merge/replace/manual-review decision without writing files.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Any

from .skill_overlay_manager import (
    SkillOverlay,
    _find_user_blocks,
    apply_overlays,
    has_any_malformed_framepack_marker,
)


@dataclass(frozen=True)
class SkillUpgradeInput:
    skill: str
    official_old: str
    official_new: str
    local_current: str
    overlays: list[SkillOverlay] | tuple[SkillOverlay, ...] = ()


@dataclass(frozen=True)
class SkillUpgradePlan:
    skill: str
    decision: str
    changed: bool
    manual_review_required: bool
    result_text: str | None = None
    applied_overlays: list[str] = field(default_factory=list)
    upstream_absorbed: list[str] = field(default_factory=list)
    user_local_blocks: list[str] = field(default_factory=list)
    notes: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        data = asdict(self)
        data["kind"] = "framepack_skill_upgrade_plan"
        return data


def plan_skill_upgrade(upgrade: SkillUpgradeInput) -> SkillUpgradePlan:
    user_blocks = _find_user_blocks(upgrade.local_current)
    if has_any_malformed_framepack_marker(upgrade.local_current):
        return SkillUpgradePlan(
            skill=upgrade.skill,
            decision="manual_review",
            changed=False,
            manual_review_required=True,
            user_local_blocks=user_blocks,
            notes=["malformed Framepack hardening marker detected"],
        )

    if upgrade.local_current == upgrade.official_old:
        return _build_replace_plan(upgrade, user_blocks=[])

    if user_blocks and _without_user_blocks(upgrade.local_current).strip() == upgrade.official_old.strip():
        return _build_auto_merge_plan(upgrade, user_blocks=user_blocks)

    return SkillUpgradePlan(
        skill=upgrade.skill,
        decision="manual_review",
        changed=False,
        manual_review_required=True,
        user_local_blocks=user_blocks,
        notes=["local_current differs from official_old without recognized provenance"],
    )


def _build_replace_plan(upgrade: SkillUpgradeInput, user_blocks: list[str]) -> SkillUpgradePlan:
    overlay_result = apply_overlays(upgrade.official_new, list(upgrade.overlays))
    return SkillUpgradePlan(
        skill=upgrade.skill,
        decision="replace",
        changed=overlay_result.text != upgrade.local_current,
        manual_review_required=overlay_result.manual_review_required,
        result_text=None if overlay_result.manual_review_required else overlay_result.text,
        applied_overlays=overlay_result.applied,
        upstream_absorbed=overlay_result.upstream_absorbed,
        user_local_blocks=user_blocks,
        notes=overlay_result.notes,
    )


def _build_auto_merge_plan(upgrade: SkillUpgradeInput, user_blocks: list[str]) -> SkillUpgradePlan:
    merged = upgrade.official_new.rstrip() + "\n\n" + _extract_user_blocks(upgrade.local_current).strip() + "\n"
    overlay_result = apply_overlays(merged, list(upgrade.overlays))
    return SkillUpgradePlan(
        skill=upgrade.skill,
        decision="auto_merge",
        changed=overlay_result.text != upgrade.local_current,
        manual_review_required=overlay_result.manual_review_required,
        result_text=None if overlay_result.manual_review_required else overlay_result.text,
        applied_overlays=overlay_result.applied,
        upstream_absorbed=overlay_result.upstream_absorbed,
        user_local_blocks=user_blocks,
        notes=["preserved user-local hardening blocks", *overlay_result.notes],
    )


def _without_user_blocks(text: str) -> str:
    import re

    return re.sub(
        r"\n?<!--\s*USER LOCAL HARDENING START\s+[^>]*-->.*?<!--\s*USER LOCAL HARDENING END\s+id=[^>]+-->\n?",
        "\n",
        text,
        flags=re.DOTALL,
    )


def _extract_user_blocks(text: str) -> str:
    import re

    return "\n\n".join(
        match.group(0).strip()
        for match in re.finditer(
            r"<!--\s*USER LOCAL HARDENING START\s+[^>]*-->.*?<!--\s*USER LOCAL HARDENING END\s+id=[^>]+-->",
            text,
            flags=re.DOTALL,
        )
    )
