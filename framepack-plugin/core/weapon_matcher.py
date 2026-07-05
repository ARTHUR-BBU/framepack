"""Weapon Matching Pass: script/story bible → pre-HTML load plan."""

from __future__ import annotations

from dataclasses import dataclass
import re
from pathlib import Path
from typing import Iterable

from .weapon_scorecard import load_scorecard
from .weapon_load_plan import (
    HandwriteWaiver,
    SceneWeaponPlan,
    SkillLoad,
    WeaponLoadPlan,
    WeaponMatch,
    write_weapon_load_plan,
)
from .weapon_presets import choose_recommended_preset
from .weapon_sources import WeaponSource, list_all_weapon_sources


CHECKED_SOURCES = ["hyperframes_official", "framepack_builtin", "specialist_skill", "project_local"]
_SCORECARD_DIR = Path(__file__).resolve().parents[1] / "weapon-scorecards"


@dataclass
class SceneBlock:
    scene: str
    text: str


def extract_scene_blocks(prompt: str) -> list[SceneBlock]:
    heading_re = re.compile(r"^(#{1,4})\s+(?P<title>(?:Scene|S|场景)\s*[_-]?\s*\d+[^\n]*)$", re.I | re.M)
    matches = list(heading_re.finditer(prompt))
    blocks: list[SceneBlock] = []
    for idx, match in enumerate(matches):
        start = match.start()
        end = matches[idx + 1].start() if idx + 1 < len(matches) else len(prompt)
        title = match.group("title").strip()
        num = re.search(r"(\d+)", title)
        scene_id = f"scene_{num.group(1)}" if num else title.lower().replace(" ", "_")
        blocks.append(SceneBlock(scene_id, prompt[start:end].strip()))

    if blocks:
        return blocks

    keyed_re = re.compile(r"^(?P<scene>scene[_-]?\d+|s\d+)\s*:\s*$", re.I | re.M)
    keyed = list(keyed_re.finditer(prompt))
    for idx, match in enumerate(keyed):
        start = match.start()
        end = keyed[idx + 1].start() if idx + 1 < len(keyed) else len(prompt)
        scene = match.group("scene").lower().replace("-", "_")
        if scene.startswith("s") and not scene.startswith("scene"):
            scene = f"scene_{scene[1:]}"
        blocks.append(SceneBlock(scene, prompt[start:end].strip()))
    return blocks or [SceneBlock("scene_1", prompt.strip())]


def _specificity_guard(source: WeaponSource, text: str, hit_count: int) -> bool:
    if source.id in {"caption-clip-wipe", "skill:hyperframes:captions"} and re.search(
        r"\b(?:no|without)\s+(?:caption|captions|callout|callouts|overlay|overlays)\b|(?:不要|无|不加)(?:字幕|标注|标签)",
        text,
        re.I,
    ):
        return False
    if source.id == "number-count-up":
        return bool(re.search(r"\b\d", text)) and bool(re.search(r"数字|number|count|计数|跳动|数据冲击|KPI|指标", text, re.I))
    if source.id == "text-split-enter":
        return hit_count >= 2 or bool(re.search(r"文字分裂|split[-\s]?enter|左右合拢|拼合|东方之润", text, re.I))
    if source.id == "card-cascade-reveal":
        return hit_count >= 2 or bool(re.search(r"card\s*(?:cascade|fan|grid)|依次翻出|扇形|功能卡", text, re.I))
    return True


def _source_priority(source: WeaponSource) -> int:
    return {
        "hyperframes_official": 400,
        "framepack_builtin": 300,
        "specialist_skill": 250,
        "project_local": 350,
    }.get(source.source_type, 100)


def _reuse_mode(source: WeaponSource) -> str:
    if source.source_type == "specialist_skill":
        return "specialist-skill"
    if source.source_type == "project_local":
        return "partial"
    if source.id in {"data-chart-editorial", "sticky-flowchart", "card-cascade-reveal", "hero-3d-device-spin"}:
        return "full"
    if source.kind == "block":
        return "structural"
    return "full"


def _confidence(score: int) -> str:
    if score >= 420:
        return "high"
    if score >= 300:
        return "medium"
    return "low"


def _score_source(source: WeaponSource, text: str) -> tuple[int, list[str]]:
    hits = [pattern for pattern in source.keywords if re.search(pattern, text, re.I)]
    if not hits:
        return 0, []
    if not _specificity_guard(source, text, len(hits)):
        return 0, []
    return _source_priority(source) + len(hits) * 20, hits


def _score_class_for_weapon(weapon_id: str) -> str | None:
    path = _SCORECARD_DIR / f"{weapon_id}.json"
    if not path.is_file():
        return None
    return load_scorecard(path).score_class


def _studio_editable_for_weapon(weapon_id: str, preset_id: str | None) -> bool | None:
    if preset_id and weapon_id in {"caption-clip-wipe"}:
        return False
    return None


def _build_weapon_match(scene: SceneBlock, score: int, source: WeaponSource, hits: list[str]) -> WeaponMatch:
    preset = choose_recommended_preset(source.id, scene.text)
    params_hint = preset.to_params_hint() if preset else {}
    preset_id = preset.preset_id if preset else None
    return WeaponMatch(
        source=source.source_type,
        id=source.id,
        confidence=_confidence(score),
        reuse_mode=_reuse_mode(source),
        preset_id=preset_id,
        score_class=_score_class_for_weapon(source.id),
        studio_editable=_studio_editable_for_weapon(source.id, preset_id),
        load=dict(source.load),
        params_hint=params_hint,
        reason=f"matched signals: {', '.join(hits[:3])}",
    )


def _match_scene(scene: SceneBlock, sources: Iterable[WeaponSource]) -> SceneWeaponPlan:
    scored: list[tuple[int, WeaponSource, list[str]]] = []
    for source in sources:
        score, hits = _score_source(source, scene.text)
        if score:
            scored.append((score, source, hits))
    scored.sort(key=lambda item: item[0], reverse=True)

    matches = [_build_weapon_match(scene, score, source, hits) for score, source, hits in scored[:5]]

    selected_match = next((match for match in matches if match.source != "hyperframes_official"), matches[0] if matches else None)
    if selected_match:
        return SceneWeaponPlan(
            scene=scene.scene,
            need=_summarize_need(scene.text),
            matches=matches,
            selected=selected_match.id,
            handwrite=False,
        )

    waiver = HandwriteWaiver(
        scene=scene.scene,
        reason="No source layer produced a useful full/partial/structural/specialist match.",
        checked_sources=list(CHECKED_SOURCES),
        rejected_candidates=[],
        planned_handwrite=_summarize_need(scene.text),
    )
    return SceneWeaponPlan(
        scene=scene.scene,
        need=_summarize_need(scene.text),
        matches=[],
        selected=None,
        handwrite=True,
        waiver=waiver,
    )


def _summarize_need(text: str) -> str:
    line = " ".join(part.strip() for part in text.splitlines() if part.strip())
    return line[:180] + ("…" if len(line) > 180 else "")


def _skill_loads_from_scenes(scenes: list[SceneWeaponPlan]) -> list[SkillLoad]:
    loads: dict[tuple[str, str | None], SkillLoad] = {
        ("software-development/hyperframes", None): SkillLoad("software-development/hyperframes", "composition contract"),
    }
    for scene in scenes:
        for match in scene.matches:
            if not scene.selected or match.id != scene.selected:
                continue
            skill = match.load.get("skill")
            file_path = match.load.get("file_path")
            if skill:
                reason = f"{scene.scene}: {match.id} ({match.reuse_mode})"
                loads[(str(skill), str(file_path) if file_path else None)] = SkillLoad(str(skill), reason, str(file_path) if file_path else None)
    return list(loads.values())


def match_weapons_for_prompt(
    prompt: str,
    project_dir: str | Path | None = None,
    source_prompt: str = ".hyperframes/expanded-prompt.md",
) -> WeaponLoadPlan:
    sources = list_all_weapon_sources(project_dir)
    scenes = [_match_scene(block, sources) for block in extract_scene_blocks(prompt)]
    waivers = [scene.waiver for scene in scenes if scene.waiver is not None]
    return WeaponLoadPlan(
        version="0.1",
        source_prompt=source_prompt,
        scenes=scenes,
        required_skill_loads=_skill_loads_from_scenes(scenes),
        handwrite_waivers=waivers,
    )


def match_weapons_for_project(project_dir: str | Path, prompt_path: str | Path | None = None, write: bool = True) -> WeaponLoadPlan:
    project = Path(project_dir)
    prompt = Path(prompt_path) if prompt_path else project / ".hyperframes" / "expanded-prompt.md"
    if not prompt.is_absolute():
        prompt = project / prompt
    text = prompt.read_text(encoding="utf-8") if prompt.is_file() else ""
    plan = match_weapons_for_prompt(text, project, str(prompt.relative_to(project)) if prompt.is_relative_to(project) else str(prompt))
    if write:
        write_weapon_load_plan(project, plan)
    return plan
