import json
from pathlib import Path

from core.taste_control import build_taste_control


def write_project(tmp_path: Path, expanded: str) -> Path:
    project = tmp_path / "project"
    project.mkdir()
    (project / "frame.md").write_text("# minimal frame\n", encoding="utf-8")
    hyper = project / ".hyperframes"
    hyper.mkdir()
    hyper.joinpath("expanded-prompt.md").write_text(expanded, encoding="utf-8")
    return project


def ppt_like_expanded() -> str:
    return """
# Storyboard
Text: Transform your workflow with next generation intelligent automation for every team.
Text: More productivity, more clarity, more growth, more speed.
Text: Join thousands of teams today with a platform built for modern operations.
Product: none.
"""


def product_led_expanded() -> str:
    return """
# Storyboard
Product: device mockup with real dashboard UI is the hero.
Text: Intelligent automation.
Depth layers: product shadow, UI glow, restrained grid.
"""


def load_audit(project: Path) -> dict:
    return json.loads((project / ".framepack" / "taste-audit.json").read_text(encoding="utf-8"))


def test_p1_taste_issue_generates_open_action_card(tmp_path):
    project = write_project(tmp_path, ppt_like_expanded())

    report = build_taste_control(project)

    assert report.open_count == 1
    card = report.cards[0]
    assert card.code == "text_dominance"
    assert card.status == "open"
    assert card.required_action == "revise"
    assert "product visuals" in card.acceptance.lower() or "product" in card.acceptance.lower()
    assert (project / ".framepack" / "taste-audit.json").is_file()
    assert (project / ".framepack" / "taste-debt.md").is_file()
    persisted = load_audit(project)
    assert persisted["summary"]["open"] == 1
    assert persisted["cards"][0]["code"] == "text_dominance"


def test_matching_waiver_marks_card_waived(tmp_path):
    project = write_project(tmp_path, ppt_like_expanded())
    fp = project / ".framepack"
    fp.mkdir()
    fp.joinpath("taste-waivers.json").write_text(
        json.dumps(
            {
                "waivers": [
                    {
                        "code": "text_dominance",
                        "reason": "No product assets available; typography-led teaser is intentional for this cut.",
                        "approved_by": "user",
                    }
                ]
            }
        ),
        encoding="utf-8",
    )

    report = build_taste_control(project)

    assert report.open_count == 0
    assert report.cards[0].status == "waived"
    assert report.cards[0].waiver is not None
    debt = (project / ".framepack" / "taste-debt.md").read_text(encoding="utf-8")
    assert "WAIVED" in debt
    assert "No product assets" in debt


def test_disappeared_previous_issue_becomes_resolved(tmp_path):
    project = write_project(tmp_path, ppt_like_expanded())
    first = build_taste_control(project)
    assert first.open_count == 1

    (project / ".hyperframes" / "expanded-prompt.md").write_text(product_led_expanded(), encoding="utf-8")
    second = build_taste_control(project)

    assert second.open_count == 0
    resolved = [card for card in second.cards if card.code == "text_dominance"]
    assert resolved
    assert resolved[0].status == "resolved"
    persisted = load_audit(project)
    assert persisted["summary"]["resolved"] >= 1
