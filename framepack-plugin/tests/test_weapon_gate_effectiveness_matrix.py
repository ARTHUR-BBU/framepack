"""Strict weapon gate effectiveness matrix.

This is not a normal happy-path unit test. It is a red-team matrix for the
ways an Agent can appear to use a weapon while still bypassing the real
contract.
"""
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fixtures.weapon_gate_cases import GATE_BYPASS_CASES


def _make_number_count_plan_project(tmp_path: Path, html: str) -> Path:
    from core.weapon_load_plan import (
        SceneWeaponPlan,
        WeaponLoadPlan,
        WeaponMatch,
        write_weapon_load_plan,
    )

    project = tmp_path / "project"
    project.mkdir(parents=True)
    plan = WeaponLoadPlan(
        version="0.1",
        source_prompt="test",
        scenes=[
            SceneWeaponPlan(
                scene="scene_1",
                need="count KPI number",
                matches=[
                    WeaponMatch(
                        source="framepack_builtin",
                        id="number-count-up",
                        confidence="high",
                        reuse_mode="full",
                        load={
                            "skill": "framepack-animation-library",
                            "file_path": "parts/references/number-count-up.js",
                        },
                        params_hint={"preset_id": "luxury_metric"},
                    )
                ],
                selected="number-count-up",
            )
        ],
    )
    write_weapon_load_plan(project, plan)
    (project / "index.html").write_text(html, encoding="utf-8")
    return project


def test_gate_bypass_matrix_has_required_cases():
    ids = {case.case_id for case in GATE_BYPASS_CASES}

    assert "function_in_comment_only" in ids
    assert "function_string_only" in ids
    assert "function_referenced_not_called" in ids
    assert "wrong_function_casing" in ids
    assert "fake_local_shim" in ids
    assert "empty_preset_call" in ids
    assert "proper_weapon_call_with_load_marker" in ids
    assert "terminal_redirect_index_html" in ids
    assert "handwrite_vague_waiver" in ids


def test_current_gate_effectiveness_matrix(tmp_path):
    """Current gate must block realistic fake-weapon patterns."""
    from core.weapon_enforcement import check_weapon_implementation

    failures = []
    html_cases = [case for case in GATE_BYPASS_CASES if not case.case_id.startswith("terminal_")]
    for case in html_cases:
        project = _make_number_count_plan_project(tmp_path / case.case_id, case.html)
        blocked = bool(check_weapon_implementation(project))
        if blocked != case.should_block:
            failures.append(
                f"{case.case_id}: expected block={case.should_block}, got block={blocked} ({case.reason})"
            )

    assert not failures, "Weapon gate effectiveness misses:\n" + "\n".join(failures)


def test_weapon_usage_evidence_distinguishes_real_loaded_call_from_fake_shim():
    from core.weapon_enforcement import analyze_weapon_usage

    fake = analyze_weapon_usage(
        "<script>function numberCountUp(){}; numberCountUp({ target: '#metric' });</script>",
        weapon_id="number-count-up",
        function_name="numberCountUp",
        ref_path="parts/references/number-count-up.js",
        params_hint={"preset_id": "luxury_metric"},
    )
    real = analyze_weapon_usage(
        """<script src="parts/references/number-count-up.js"></script>
        <script>numberCountUp({ preset: 'luxury_metric', target: '#metric', duration: 1.4 });</script>""",
        weapon_id="number-count-up",
        function_name="numberCountUp",
        ref_path="parts/references/number-count-up.js",
        params_hint={"preset_id": "luxury_metric"},
    )

    assert fake.function_called is True
    assert fake.local_shim_detected is True
    assert fake.script_loaded is False
    assert fake.passes_gate is False

    assert real.function_called is True
    assert real.local_shim_detected is False
    assert real.script_loaded is True
    assert real.preset_or_params_present is True
    assert real.passes_gate is True


def test_weapon_usage_evidence_rejects_empty_params():
    from core.weapon_enforcement import analyze_weapon_usage

    evidence = analyze_weapon_usage(
        """<script src="parts/references/number-count-up.js"></script><script>numberCountUp({});</script>""",
        weapon_id="number-count-up",
        function_name="numberCountUp",
        ref_path="parts/references/number-count-up.js",
        params_hint={"preset_id": "luxury_metric"},
    )

    assert evidence.function_called is True
    assert evidence.script_loaded is True
    assert evidence.preset_or_params_present is False
    assert evidence.passes_gate is False


def test_weapon_usage_evidence_requires_preset_or_equivalent_required_params():
    from core.weapon_enforcement import analyze_weapon_usage

    loose = analyze_weapon_usage(
        """<script src="parts/references/caption-clip-wipe.js"></script><script>captionClipWipe(tl, { target: '.caption-line', duration: 0.45 });</script>""",
        weapon_id="caption-clip-wipe",
        function_name="captionClipWipe",
        ref_path="parts/references/caption-clip-wipe.js",
        params_hint={
            "preset_id": "editorial_lower_third",
            "target": ".caption-line",
            "duration": 0.45,
            "direction": "left-to-right",
            "stagger": 0.08,
        },
    )
    explicit = analyze_weapon_usage(
        """<script src="parts/references/caption-clip-wipe.js"></script><script>captionClipWipe(tl, { preset: 'editorial_lower_third', target: '.caption-line', duration: 0.45 });</script>""",
        weapon_id="caption-clip-wipe",
        function_name="captionClipWipe",
        ref_path="parts/references/caption-clip-wipe.js",
        params_hint={"preset_id": "editorial_lower_third"},
    )
    equivalent = analyze_weapon_usage(
        """<script src="parts/references/caption-clip-wipe.js"></script><script>captionClipWipe(tl, { target: '.caption-line', duration: 0.45, direction: 'left-to-right', stagger: 0.08 });</script>""",
        weapon_id="caption-clip-wipe",
        function_name="captionClipWipe",
        ref_path="parts/references/caption-clip-wipe.js",
        params_hint={
            "preset_id": "editorial_lower_third",
            "target": ".caption-line",
            "duration": 0.45,
            "direction": "left-to-right",
            "stagger": 0.08,
        },
    )

    assert loose.preset_or_params_present is False
    assert loose.passes_gate is False
    assert explicit.passes_gate is True
    assert equivalent.passes_gate is True
