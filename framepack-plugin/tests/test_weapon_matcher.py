from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))


def test_match_numeric_scene_selects_number_count_up():
    from core.weapon_matcher import match_weapons_for_prompt

    prompt = """
## Scene 3 — 120+ 数据冲击
The KPI number 120+ should count up with snap.
"""

    plan = match_weapons_for_prompt(prompt)

    assert plan.scenes[0].selected == "number-count-up"
    assert plan.scenes[0].handwrite is False
    assert any(load.file_path == "parts/references/number-count-up.js" for load in plan.required_skill_loads)


def test_match_chart_scene_selects_data_chart_editorial():
    from core.weapon_matcher import match_weapons_for_prompt

    prompt = """
## Scene 4 — 市场图表
NYT editorial chart with SVG path stroke-dashoffset and data points.
"""

    plan = match_weapons_for_prompt(prompt)

    assert plan.scenes[0].selected == "data-chart-editorial"
    assert plan.scenes[0].matches[0].reuse_mode == "full"


def test_match_word_synced_caption_selects_hyperframes_caption_reference():
    from core.weapon_matcher import match_weapons_for_prompt

    prompt = """
## Scene 2 — captions
Voiceover needs word-synced captions with karaoke highlight.
"""

    plan = match_weapons_for_prompt(prompt)
    ids = {match.id for scene in plan.scenes for match in scene.matches}

    assert "skill:hyperframes:captions" in ids
    assert any(load.name == "software-development/hyperframes" for load in plan.required_skill_loads)


def test_no_match_still_emits_handwrite_waiver():
    from core.weapon_matcher import match_weapons_for_prompt

    prompt = """
## Scene 9 — custom shader
Bespoke WebGL pearl refraction shader over product photography.
"""

    plan = match_weapons_for_prompt(prompt)

    assert plan.scenes[0].handwrite is True
    assert plan.handwrite_waivers
    assert set(plan.handwrite_waivers[0].checked_sources) == {
        "hyperframes_official",
        "framepack_builtin",
        "specialist_skill",
        "project_local",
    }


def test_deprecated_transitions_pack_not_selected_for_blur_crossfade():
    from core.weapon_matcher import match_weapons_for_prompt

    prompt = """
## Scene 5 — transition
Use blur crossfade between clips through HyperFrames native scene timing.
"""

    plan = match_weapons_for_prompt(prompt)
    selected = {scene.selected for scene in plan.scenes}

    assert "transitions-pack" not in selected
    assert any(match.id == "skill:hyperframes:transitions" for scene in plan.scenes for match in scene.matches)
