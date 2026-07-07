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
