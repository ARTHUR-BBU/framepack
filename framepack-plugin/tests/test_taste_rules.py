import pytest

from core.taste_rules import (
    acceptance_for,
    all_rules,
    get_rule,
    repair_target_for,
    severity_for,
)


def test_rule_ids_are_unique():
    ids = [rule.id for rule in all_rules()]

    assert len(ids) == len(set(ids))


def test_all_p1_rules_have_acceptance():
    for rule in all_rules():
        if rule.default_severity == "P1" or "P1" in rule.registers.values():
            assert rule.acceptance.strip(), rule.id
            assert rule.message.strip(), rule.id


def test_severity_defaults_to_rule_default():
    rule = get_rule("copy_punctuation_slop")

    assert severity_for(rule, register="brand_film", dials={}) == rule.default_severity


def test_register_override_changes_severity():
    rule = get_rule("text_dominance")

    assert severity_for(rule, register="product_launch", dials={}) == "P1"
    assert severity_for(rule, register="event_teaser", dials={}) == "P2"


def test_unknown_rule_raises_clear_error():
    with pytest.raises(KeyError, match="Unknown taste rule"):
        get_rule("missing_recipe_card")


def test_current_acceptance_strings_match_existing_behavior_for_legacy_rules():
    assert "product visuals" in acceptance_for("text_dominance").lower()
    assert "product screenshots" in acceptance_for("product_absence").lower()
    assert "mockup" in acceptance_for("static_mockup_risk").lower()
    assert "generic fade" in acceptance_for("generic_fade_stack").lower()
    assert "proof frames" in acceptance_for("no_proof_frames").lower()


def test_repair_target_uses_explicit_path_before_rule_default():
    assert repair_target_for("text_dominance", "custom.md") == "custom.md"
    assert repair_target_for("opening_visual_absence", None) == ".hyperframes/expanded-prompt.md"
