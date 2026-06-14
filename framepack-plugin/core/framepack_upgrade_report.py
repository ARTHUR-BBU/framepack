"""Build user-facing Framepack/HyperFrames upgrade reports.

Report-only formatter: it does not probe, install, upgrade, or write skills. It
summarizes already-produced evidence from doctor/install/upgrade/smoke steps.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Any


@dataclass(frozen=True)
class FramepackUpgradeReport:
    status: str
    hyperframes: dict[str, Any]
    environment_status: str | None
    install_status: str | None
    skills: list[dict[str, Any]]
    smoke: dict[str, Any]
    recommended_actions: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        data = asdict(self)
        data["kind"] = "framepack_upgrade_report"
        return data


def build_upgrade_report(
    *,
    environment: dict[str, Any] | None = None,
    install_plan: dict[str, Any] | None = None,
    skill_upgrades: list[dict[str, Any]] | None = None,
    smoke: dict[str, Any] | None = None,
) -> FramepackUpgradeReport:
    environment = environment or {}
    install_plan = install_plan or {}
    skill_upgrades = skill_upgrades or []
    smoke = smoke or {}

    hyperframes = _hyperframes_summary(environment)
    skills = [_skill_summary(item) for item in skill_upgrades]
    recommended_actions = _dedupe(list(environment.get("recommended_actions", [])) + _install_actions(install_plan) + _skill_actions(skills))
    status = _overall_status(environment.get("status"), install_plan.get("status"), skills, smoke)
    return FramepackUpgradeReport(
        status=status,
        hyperframes=hyperframes,
        environment_status=environment.get("status"),
        install_status=install_plan.get("status"),
        skills=skills,
        smoke=smoke,
        recommended_actions=recommended_actions,
    )


def _hyperframes_summary(environment: dict[str, Any]) -> dict[str, Any]:
    cli = environment.get("checks", {}).get("hyperframes_cli", {})
    support = environment.get("support", {})
    return {
        "installed_version": support.get("installed_version") or cli.get("version"),
        "support_status": support.get("status"),
    }


def _skill_summary(item: dict[str, Any]) -> dict[str, Any]:
    return {
        "skill": item.get("skill"),
        "decision": item.get("decision") or item.get("action"),
        "applied_overlays": list(item.get("applied_overlays") or item.get("overlay_ids") or []),
        "upstream_absorbed": list(item.get("upstream_absorbed") or []),
        "user_local_blocks": list(item.get("user_local_blocks") or []),
        "manual_review_required": bool(item.get("manual_review_required", False)),
    }


def _overall_status(environment_status: str | None, install_status: str | None, skills: list[dict[str, Any]], smoke: dict[str, Any]) -> str:
    if any(skill.get("manual_review_required") or skill.get("decision") == "manual_review" for skill in skills):
        return "manual_review"
    if install_status in {"manual_review", "needs_source"}:
        return install_status
    if environment_status in {"blocked", "needs_upgrade", "guarded", "needs_setup"}:
        return environment_status
    if any(value == "fail" for value in smoke.values()):
        return "smoke_failed"
    return "ready"


def _install_actions(install_plan: dict[str, Any]) -> list[str]:
    status = install_plan.get("status")
    if status == "needs_source":
        return ["provide_official_skill_sources"]
    if status == "manual_review":
        return ["review_existing_skills"]
    if status in {"would_install", "would_change"}:
        return ["apply_skill_install_plan"]
    return []


def _skill_actions(skills: list[dict[str, Any]]) -> list[str]:
    actions: list[str] = []
    for skill in skills:
        if skill.get("manual_review_required"):
            actions.append("review_skill_merge_conflicts")
    return actions


def _dedupe(values: list[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for value in values:
        if value not in seen:
            seen.add(value)
            result.append(value)
    return result
