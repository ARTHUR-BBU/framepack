from pathlib import Path

from core.taste_audit import audit_project
from core.taste_read import parse_taste_context


def write_project(tmp_path: Path, frame: str = "", expanded: str = "") -> Path:
    project = tmp_path / "project"
    project.mkdir()
    if frame:
        (project / "frame.md").write_text(frame, encoding="utf-8")
    if expanded:
        hyper = project / ".hyperframes"
        hyper.mkdir()
        (hyper / "expanded-prompt.md").write_text(expanded, encoding="utf-8")
    return project


def test_parse_explicit_taste_read_from_frame_md():
    frame = """
taste_read:
  register: product_launch
  audience: technical founders
  visual_family: interface_ballet_saas
  anti_references:
    - animated PPT
    - AI purple SaaS gradient
taste_dials:
  design_variance: 7
  motion_intensity: 6
  visual_density: 4
  rationale: Product launch needs proof plus motion.
"""

    context = parse_taste_context(frame, "")

    assert context.register == "product_launch"
    assert context.explicit_taste_read is True
    assert context.audience == "technical founders"
    assert context.visual_family == "interface_ballet_saas"
    assert "animated PPT" in context.anti_references
    assert context.dials["design_variance"] == 7
    assert context.dials["motion_intensity"] == 6
    assert context.dials["visual_density"] == 4


def test_infer_product_launch_from_expanded_prompt():
    context = parse_taste_context("", "# Product launch video\nShow the new app.")

    assert context.register == "product_launch"
    assert context.explicit_taste_read is False


def test_infer_event_teaser_from_event_keywords():
    context = parse_taste_context("", "Conference teaser for launch date and speaker lineup.")

    assert context.register == "event_teaser"


def test_missing_taste_read_yields_issue_for_new_creative_project(tmp_path):
    project = write_project(tmp_path, expanded="# Product launch video\nScene 1: type only.")

    report = audit_project(project)

    issue = next(issue for issue in report.issues if issue.code == "missing_taste_read")
    assert issue.severity == "risk"
    assert issue.path and issue.path.endswith("frame.md")


def test_dials_map_to_control_profile_without_overwriting_existing_values():
    frame = """
control_profile:
  creative_autonomy: 0.2
  restraint_force: 0.8
taste_dials:
  design_variance: 8
  motion_intensity: 6
  visual_density: 4
"""

    context = parse_taste_context(frame, "")

    assert context.control_profile["creative_autonomy"] == 0.2
    assert context.control_profile["restraint_force"] == 0.8
    assert context.control_profile["motion_dynamism"] == 0.6
    assert context.control_profile["atmosphere_density"] == 0.4


def test_invalid_dial_values_are_reported_not_crashed():
    frame = """
taste_dials:
  design_variance: wild
  motion_intensity: 12
  visual_density: -1
"""

    context = parse_taste_context(frame, "")

    assert context.dials == {}
    assert {issue["code"] for issue in context.issues} == {"invalid_taste_dial"}


def test_invalid_taste_dials_surface_in_audit_report(tmp_path):
    frame = """
taste_read:
  register: product_launch
  audience: buyers
  visual_family: product-led commercial
  anti_references: [animated PPT]
taste_dials:
  design_variance: wild
  motion_intensity: 12
  visual_density: -1
"""
    project = write_project(tmp_path, frame=frame, expanded="Product: dashboard screenshot enters.")

    report = audit_project(project)

    issue = next(issue for issue in report.issues if issue.code == "invalid_taste_dial")
    assert issue.severity == "suggestion"
    assert issue.path and issue.path.endswith("frame.md")
