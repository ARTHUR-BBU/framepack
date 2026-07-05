from pathlib import Path

import sys

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))


def test_weapon_load_plan_round_trips_json_and_markdown(tmp_path):
    from core.weapon_load_plan import (
        HandwriteWaiver,
        SceneWeaponPlan,
        SkillLoad,
        WeaponLoadPlan,
        WeaponMatch,
        load_weapon_load_plan,
        write_weapon_load_plan,
    )

    plan = WeaponLoadPlan(
        version="0.1",
        source_prompt=".hyperframes/expanded-prompt.md",
        scenes=[
            SceneWeaponPlan(
                scene="scene_3",
                need="120+ numeric impact",
                matches=[
                    WeaponMatch(
                        source="framepack_builtin",
                        id="number-count-up",
                        confidence="high",
                        reuse_mode="full",
                        preset_id="luxury_metric",
                        score_class="B",
                        studio_editable=False,
                        load={"skill": "framepack-animation-library", "file_path": "parts/references/number-count-up.js"},
                        params_hint={"targetValue": 120, "suffix": "+"},
                    )
                ],
                selected="number-count-up",
                handwrite=False,
            ),
            SceneWeaponPlan(
                scene="scene_9",
                need="bespoke shader",
                matches=[],
                selected=None,
                handwrite=True,
                waiver=HandwriteWaiver(
                    scene="scene_9",
                    reason="bespoke WebGL shader",
                    checked_sources=["hyperframes_official", "framepack_builtin", "specialist_skill", "project_local"],
                    rejected_candidates=[],
                    planned_handwrite="fragment shader uniforms",
                ),
            ),
        ],
        required_skill_loads=[SkillLoad(name="software-development/hyperframes", reason="composition contract")],
        handwrite_waivers=[
            HandwriteWaiver(
                scene="scene_9",
                reason="bespoke WebGL shader",
                checked_sources=["hyperframes_official", "framepack_builtin", "specialist_skill", "project_local"],
                rejected_candidates=[],
                planned_handwrite="fragment shader uniforms",
            )
        ],
    )

    write_weapon_load_plan(tmp_path, plan)
    loaded = load_weapon_load_plan(tmp_path)

    assert loaded.scenes[0].selected == "number-count-up"
    assert loaded.scenes[0].matches[0].preset_id == "luxury_metric"
    assert loaded.scenes[0].matches[0].score_class == "B"
    assert loaded.scenes[0].matches[0].studio_editable is False
    assert loaded.scenes[1].handwrite is True
    assert loaded.handwrite_waivers[0].checked_sources
    assert (tmp_path / ".framepack" / "weapon-load-plan.json").exists()
    assert "number-count-up" in (tmp_path / ".framepack" / "weapon-load-plan.md").read_text(encoding="utf-8")
    assert "preset: `luxury_metric`" in (tmp_path / ".framepack" / "weapon-load-plan.md").read_text(encoding="utf-8")


def test_missing_weapon_load_plan_returns_none(tmp_path):
    from core.weapon_load_plan import load_weapon_load_plan

    assert load_weapon_load_plan(tmp_path) is None
