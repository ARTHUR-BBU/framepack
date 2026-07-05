"""Weapon Load Plan schema and persistence.

The load plan is the mandatory receipt between director script and HTML authoring:
it records what weapon/skill/catalog sources were checked and what must be loaded
before writing index.html.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
import json
from pathlib import Path
from typing import Any


PLAN_JSON = "weapon-load-plan.json"
PLAN_MD = "weapon-load-plan.md"


@dataclass
class WeaponMatch:
    source: str
    id: str
    confidence: str
    reuse_mode: str
    preset_id: str | None = None
    score_class: str | None = None
    studio_editable: bool | None = None
    load: dict[str, Any] = field(default_factory=dict)
    params_hint: dict[str, Any] = field(default_factory=dict)
    reason: str = ""


@dataclass
class SkillLoad:
    name: str
    reason: str
    file_path: str | None = None


@dataclass
class HandwriteWaiver:
    scene: str
    reason: str
    checked_sources: list[str]
    rejected_candidates: list[dict[str, Any]] = field(default_factory=list)
    planned_handwrite: str = ""


@dataclass
class SceneWeaponPlan:
    scene: str
    need: str
    matches: list[WeaponMatch] = field(default_factory=list)
    selected: str | None = None
    handwrite: bool = False
    waiver: HandwriteWaiver | None = None


@dataclass
class WeaponLoadPlan:
    version: str
    source_prompt: str
    scenes: list[SceneWeaponPlan] = field(default_factory=list)
    required_skill_loads: list[SkillLoad] = field(default_factory=list)
    handwrite_waivers: list[HandwriteWaiver] = field(default_factory=list)
    kind: str = "framepack_weapon_load_plan"

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def _framepack_dir(project_dir: str | Path) -> Path:
    return Path(project_dir) / ".framepack"


def _match_from_dict(data: dict[str, Any]) -> WeaponMatch:
    return WeaponMatch(**data)


def _skill_from_dict(data: dict[str, Any]) -> SkillLoad:
    return SkillLoad(**data)


def _waiver_from_dict(data: dict[str, Any] | None) -> HandwriteWaiver | None:
    if not data:
        return None
    return HandwriteWaiver(**data)


def _scene_from_dict(data: dict[str, Any]) -> SceneWeaponPlan:
    data = dict(data)
    data["matches"] = [_match_from_dict(item) for item in data.get("matches", [])]
    data["waiver"] = _waiver_from_dict(data.get("waiver"))
    return SceneWeaponPlan(**data)


def weapon_load_plan_from_dict(data: dict[str, Any]) -> WeaponLoadPlan:
    return WeaponLoadPlan(
        version=data.get("version", "0.1"),
        source_prompt=data.get("source_prompt", ".hyperframes/expanded-prompt.md"),
        scenes=[_scene_from_dict(item) for item in data.get("scenes", [])],
        required_skill_loads=[_skill_from_dict(item) for item in data.get("required_skill_loads", [])],
        handwrite_waivers=[HandwriteWaiver(**item) for item in data.get("handwrite_waivers", [])],
        kind=data.get("kind", "framepack_weapon_load_plan"),
    )


def render_weapon_load_plan_markdown(plan: WeaponLoadPlan) -> str:
    lines = [
        "# Framepack Weapon Load Plan",
        "",
        f"- kind: `{plan.kind}`",
        f"- version: `{plan.version}`",
        f"- source_prompt: `{plan.source_prompt}`",
        "",
        "## Required skill/resource loads",
    ]
    if plan.required_skill_loads:
        for load in plan.required_skill_loads:
            suffix = f" / `{load.file_path}`" if load.file_path else ""
            lines.append(f"- `{load.name}`{suffix} — {load.reason}")
    else:
        lines.append("- (none)")

    lines.extend(["", "## Scene matches"])
    for scene in plan.scenes:
        lines.extend(["", f"### {scene.scene}", "", f"- need: {scene.need}"])
        if scene.selected:
            lines.append(f"- selected: `{scene.selected}`")
        if scene.handwrite:
            lines.append("- handwrite: true")
        if scene.matches:
            lines.append("- candidates:")
            for match in scene.matches:
                lines.append(
                    f"  - `{match.id}` ({match.source}, {match.confidence}, {match.reuse_mode})"
                )
                if match.preset_id:
                    lines.append(f"    - preset: `{match.preset_id}`")
                if match.score_class:
                    lines.append(f"    - score_class: `{match.score_class}`")
                if match.studio_editable is not None:
                    lines.append(f"    - studio_editable: `{str(match.studio_editable).lower()}`")
        if scene.waiver:
            lines.append(f"- waiver: {scene.waiver.reason}")
            lines.append(f"- checked_sources: {', '.join(scene.waiver.checked_sources)}")

    if plan.handwrite_waivers:
        lines.extend(["", "## HANDWRITE waivers"])
        for waiver in plan.handwrite_waivers:
            lines.append(f"- `{waiver.scene}` — {waiver.reason}; checked: {', '.join(waiver.checked_sources)}")
    return "\n".join(lines) + "\n"


def write_weapon_load_plan(project_dir: str | Path, plan: WeaponLoadPlan) -> None:
    framepack = _framepack_dir(project_dir)
    framepack.mkdir(parents=True, exist_ok=True)
    (framepack / PLAN_JSON).write_text(
        json.dumps(plan.to_dict(), ensure_ascii=False, indent=2),
        encoding="utf-8",
        newline="\n",
    )
    (framepack / PLAN_MD).write_text(
        render_weapon_load_plan_markdown(plan),
        encoding="utf-8",
        newline="\n",
    )


def load_weapon_load_plan(project_dir: str | Path) -> WeaponLoadPlan | None:
    path = _framepack_dir(project_dir) / PLAN_JSON
    if not path.is_file():
        return None
    return weapon_load_plan_from_dict(json.loads(path.read_text(encoding="utf-8")))
