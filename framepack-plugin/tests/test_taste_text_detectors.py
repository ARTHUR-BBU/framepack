from core.taste_read import TasteContext
from core.taste_text_detectors import detect_text_taste_issues


def context(register: str = "product_launch") -> TasteContext:
    return TasteContext(register=register, explicit_taste_read=True)


def codes_for(expanded: str, register: str = "product_launch") -> set[str]:
    return {issue.code for issue in detect_text_taste_issues("", expanded, context(register))}


def test_detects_opening_visual_absence_when_hook_is_text_only():
    expanded = """
## Scene 1 — Hook
Text: Transform your workflow.
Headline: Intelligent operations for every team.
Transition out: fade.
"""

    assert "opening_visual_absence" in codes_for(expanded)


def test_allows_opening_visual_when_product_or_object_is_present():
    expanded = """
## Scene 1 — Hook
Product: real dashboard screenshot fills the frame.
Text: Intelligent operations.
"""

    assert "opening_visual_absence" not in codes_for(expanded)


def test_event_teaser_kinetic_type_downgrades_opening_visual_absence():
    expanded = """
## Scene 1 — Hook
Kinetic typography attack: launch date slams into a speaker lineup.
Text: See you at dawn.
"""

    issues = detect_text_taste_issues("", expanded, context("event_teaser"))
    issue = next(issue for issue in issues if issue.code == "opening_visual_absence")
    assert issue.severity == "suggestion"


def test_detects_copy_punctuation_slop_only_in_visible_copy():
    expanded = """
## Scene 2
Headline: Deploy faster — without the chaos.
Transition out: motif-driven wipe — not visible copy.
"""

    issues = detect_text_taste_issues("", expanded, context())

    assert [issue.code for issue in issues].count("copy_punctuation_slop") == 1


def test_ignores_markdown_separator_dashes_for_copy_punctuation():
    expanded = """
---
## Scene 1 — Hook
Concept: product reveal.
Transition out: motif-driven wipe — not visible copy.
"""

    assert "copy_punctuation_slop" not in codes_for(expanded)


def test_integrated_detectors_return_paths_and_actionable_suggestions():
    expanded = """
## Scene 1 — Hook
Text: Premium automation — built for everyone.
"""

    issues = detect_text_taste_issues("", expanded, context())

    by_code = {issue.code: issue for issue in issues}
    assert by_code["opening_visual_absence"].path == ".hyperframes/expanded-prompt.md"
    assert "visual subject" in (by_code["opening_visual_absence"].suggestion or "")
    assert by_code["copy_punctuation_slop"].path == ".hyperframes/expanded-prompt.md"


def test_copy_punctuation_slop_points_to_frame_when_copy_is_in_frame_md():
    frame = "Headline: Premium automation — built for operators."

    issues = detect_text_taste_issues(frame, "Product: dashboard screenshot enters.", context())

    issue = next(issue for issue in issues if issue.code == "copy_punctuation_slop")
    assert issue.path == "frame.md"
