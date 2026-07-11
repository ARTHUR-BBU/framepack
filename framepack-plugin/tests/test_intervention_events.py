import pytest

from core.intervention_events import (
    InterventionEvent,
    group_events,
    make_event,
    summarize_events,
)


def test_make_event_requires_known_department_and_action():
    event = make_event(
        department="taste",
        code="opening_visual_absence",
        severity="decision_required",
        reason="Opening scene has copy but no visual hook.",
        required_action="revise",
        artifact=".hyperframes/expanded-prompt.md",
        acceptance="Add a product-led visual hook before render.",
    )

    assert event.department == "taste"
    assert event.severity == "decision_required"
    assert event.required_action == "revise"
    assert event.to_dict()["code"] == "opening_visual_absence"


def test_unknown_event_values_fail_fast():
    with pytest.raises(ValueError, match="Unknown intervention department"):
        make_event(
            department="vibes",
            code="x",
            severity="advisory",
            reason="x",
            required_action="revise",
            artifact="frame.md",
            acceptance="x",
        )

    with pytest.raises(ValueError, match="Unknown intervention severity"):
        make_event(
            department="taste",
            code="x",
            severity="panic",
            reason="x",
            required_action="revise",
            artifact="frame.md",
            acceptance="x",
        )

    with pytest.raises(ValueError, match="Unknown intervention action"):
        make_event(
            department="taste",
            code="x",
            severity="advisory",
            reason="x",
            required_action="freestyle",
            artifact="frame.md",
            acceptance="x",
        )


def test_group_events_dedupes_by_department_code_artifact():
    first = make_event(
        department="weapon",
        code="fake_weapon_call",
        severity="hard_stop",
        reason="Weapon appears only in a comment.",
        required_action="load_weapon",
        artifact="index.html",
        acceptance="Call the real registered weapon helper.",
    )
    duplicate = make_event(
        department="weapon",
        code="fake_weapon_call",
        severity="hard_stop",
        reason="Same finding from a second scanner.",
        required_action="load_weapon",
        artifact="index.html",
        acceptance="Call the real registered weapon helper.",
    )
    taste = make_event(
        department="taste",
        code="text_dominance",
        severity="decision_required",
        reason="Text carries the film.",
        required_action="revise",
        artifact=".hyperframes/expanded-prompt.md",
        acceptance="Promote product visuals.",
    )

    grouped = group_events([first, duplicate, taste])

    assert list(grouped) == ["hard_stop", "decision_required"]
    assert len(grouped["hard_stop"]) == 1
    assert grouped["hard_stop"][0].reason == "Weapon appears only in a comment."
    assert grouped["decision_required"] == [taste]


def test_summarize_events_counts_by_severity_and_action():
    events = [
        make_event(
            department="audit",
            code="no_proof_frames",
            severity="decision_required",
            reason="No sampled frames exist.",
            required_action="attach_proof",
            artifact=".framepack/proof-frames",
            acceptance="Attach representative proof frames.",
        ),
        make_event(
            department="platform",
            code="deploy_not_synced",
            severity="hard_stop",
            reason="Source and deployed plugin differ.",
            required_action="stop",
            artifact="F:/Hermes_windows/plugins/framepack",
            acceptance="MD5 source/deploy match.",
        ),
    ]

    assert summarize_events(events) == {
        "total": 2,
        "by_severity": {"decision_required": 1, "hard_stop": 1},
        "by_action": {"attach_proof": 1, "stop": 1},
    }


# ── Phase 5: Audit → Intervention bridge ──

def test_pre_render_finding_p1_maps_to_decision_required():
    from core.pre_render_audit import PreRenderFinding
    from core.intervention_events import intervention_events_for_pre_render

    findings = [
        PreRenderFinding(
            severity="P1",
            code="missing_director_story_bible",
            message="Director Story Bible is missing before render.",
            suggestion="Create expanded-prompt.md.",
        ),
    ]

    events = intervention_events_for_pre_render(findings)
    assert len(events) == 1
    assert events[0].department == "audit"
    assert events[0].severity == "decision_required"
    assert events[0].code == "missing_director_story_bible"
    assert events[0].required_action == "revise"


def test_pre_render_finding_p0_maps_to_hard_stop():
    from core.pre_render_audit import PreRenderFinding
    from core.intervention_events import intervention_events_for_pre_render

    findings = [
        PreRenderFinding(
            severity="P0",
            code="critical_structural_failure",
            message="HTML is empty.",
            suggestion="Write HTML.",
        ),
    ]

    events = intervention_events_for_pre_render(findings)
    assert len(events) == 1
    assert events[0].severity == "hard_stop"


def test_pre_render_finding_p2_maps_to_advisory():
    from core.pre_render_audit import PreRenderFinding
    from core.intervention_events import intervention_events_for_pre_render

    findings = [
        PreRenderFinding(
            severity="P2",
            code="optional_bgm_missing",
            message="No BGM plan.",
            suggestion="Ask about BGM.",
        ),
    ]

    events = intervention_events_for_pre_render(findings)
    assert len(events) == 1
    assert events[0].severity == "advisory"


def test_quality_issue_p1_maps_to_decision_required():
    from core.quality_audit import QualityIssue
    from core.intervention_events import intervention_events_for_quality_audit

    issues = [
        QualityIssue(
            code="stale_arsenal_entry",
            severity="P1",
            message="Arsenal references a weapon not used in HTML.",
            path="index.html",
        ),
    ]

    events = intervention_events_for_quality_audit(issues)
    assert len(events) == 1
    assert events[0].department == "audit"
    assert events[0].severity == "decision_required"
    assert events[0].code == "stale_arsenal_entry"
    assert events[0].required_action == "revise"


def test_quality_issue_p0_maps_to_hard_stop():
    from core.quality_audit import QualityIssue
    from core.intervention_events import intervention_events_for_quality_audit

    issues = [
        QualityIssue(
            code="manifest_html_drift",
            severity="P0",
            message="Execution manifest and HTML disagree on weapons.",
        ),
    ]

    events = intervention_events_for_quality_audit(issues)
    assert len(events) == 1
    assert events[0].severity == "hard_stop"


def test_quality_issue_p3_maps_to_advisory():
    from core.quality_audit import QualityIssue
    from core.intervention_events import intervention_events_for_quality_audit

    issues = [
        QualityIssue(
            code="minor_naming",
            severity="P3",
            message="Inconsistent naming.",
        ),
    ]

    events = intervention_events_for_quality_audit(issues)
    assert len(events) == 1
    assert events[0].severity == "advisory"
