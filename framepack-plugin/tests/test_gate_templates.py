from __future__ import annotations

from core.gate_templates import ALL_TEMPLATES


def test_director_intent_gate_templates_are_registered():
    for name in ["source-intake.md", "design-choice.md", "storyboard-preview.md"]:
        assert name in ALL_TEMPLATES
        assert ALL_TEMPLATES[name].startswith("# ")


def test_source_intake_template_captures_extraction_contract():
    template = ALL_TEMPLATES["source-intake.md"]

    assert "extraction_method" in template
    assert "source_summary" in template
    assert "narrative_type" in template
    assert "must_preserve_points" in template
    assert "extraction_failed_reason" in template


def test_design_choice_template_captures_user_selection_contract():
    template = ALL_TEMPLATES["design-choice.md"]

    assert "ambiguity_detected" in template
    assert "options_presented" in template
    assert "selected_style" in template
    assert "user_confirmed" in template


def test_storyboard_preview_template_captures_preview_contract():
    template = ALL_TEMPLATES["storyboard-preview.md"]

    assert "Visual" in template
    assert "Feel" in template
    assert "Key" in template
    assert "recurring_motifs" in template
    assert "user_confirmed" in template
