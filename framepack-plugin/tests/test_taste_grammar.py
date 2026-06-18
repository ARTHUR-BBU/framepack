from core.taste_grammar import (
    KINETIC_GRAMMAR,
    SURPRISE_OPERATORS,
    TASTE_MOVES,
    get_kinetic_grammar,
    get_surprise_operator,
    get_taste_move,
)


def _ids(items):
    return [item["id"] for item in items]


def test_kinetic_grammar_has_expected_stable_ids():
    assert _ids(KINETIC_GRAMMAR) == [
        "cause_reveal",
        "echo_transform",
        "mask_portal",
        "tension_release",
        "scatter_assemble",
        "follow_through",
        "breath_punch_silence",
    ]


def test_taste_moves_has_expected_stable_ids():
    assert _ids(TASTE_MOVES) == [
        "object_worship",
        "editorial_punch",
        "silence_before_drop",
        "motif_reincarnation",
        "interface_ballet",
        "data_cathedral",
        "liquid_brand",
        "cold_open",
        "kinetic_typography_attack",
        "product_reveal_ritual",
        "system_awakening",
        "human_imperfection",
    ]


def test_surprise_operators_has_expected_stable_ids():
    assert _ids(SURPRISE_OPERATORS) == [
        "scale_violation",
        "tempo_break",
        "material_shift",
        "spatial_flip",
        "negative_space_shock",
        "misdirection",
        "motif_mutation",
        "abrupt_stillness",
        "imperfect_human_touch",
        "impossible_transition",
    ]


def test_registry_entries_include_human_readable_fields():
    for collection in (KINETIC_GRAMMAR, TASTE_MOVES, SURPRISE_OPERATORS):
        for item in collection:
            assert item["id"]
            assert item["name_en"]
            assert item["name_zh"]
            assert item["description"]
            assert item["example"]


def test_lookup_helpers_return_entries_by_id():
    assert get_kinetic_grammar("mask_portal")["name_en"] == "Mask → Portal"
    assert get_taste_move("object_worship")["name_en"] == "Object Worship"
    assert get_surprise_operator("scale_violation")["name_en"] == "Scale Violation"


def test_lookup_helpers_raise_keyerror_for_unknown_id():
    for getter in (get_kinetic_grammar, get_taste_move, get_surprise_operator):
        try:
            getter("missing")
        except KeyError as exc:
            assert "missing" in str(exc)
        else:
            raise AssertionError("expected KeyError")


def test_every_taste_move_has_energy_level():
    """All 12 taste moves must declare an energy_level (low/medium/high)."""
    from core.taste_grammar import TASTE_MOVES
    valid = {"low", "medium", "high"}
    for move in TASTE_MOVES:
        level = move.get("energy_level")
        assert level in valid, f"{move['id']}: energy_level={level!r}, must be one of {valid}"


def test_moves_by_energy_level_returns_expected_classification():
    """The single source of truth for energy classification.

    taste_audit.py queries this instead of hardcoding subsets — if this
    test passes, the shadow vocabulary is gone.
    """
    from core.taste_grammar import moves_by_energy_level
    high = set(moves_by_energy_level("high"))
    medium = set(moves_by_energy_level("medium"))
    low = set(moves_by_energy_level("low"))

    # All 12 moves classified, no overlaps
    assert len(high) + len(medium) + len(low) == 12
    assert high & medium == set()
    assert high & low == set()
    assert medium & low == set()

    # High-energy set matches the original hardcoded values (regression guard)
    assert high == {
        "editorial_punch",
        "interface_ballet",
        "data_cathedral",
        "kinetic_typography_attack",
        "system_awakening",
    }


def test_taste_audit_uses_grammar_not_hardcoded_moves():
    """taste_audit.py must NOT hardcode high-energy move IDs.

    This test prevents the shadow vocabulary from creeping back in.
    """
    from pathlib import Path
    src = (Path(__file__).resolve().parent.parent / "core" / "taste_audit.py").read_text("utf-8")
    # The old pattern was a set literal of move IDs
    assert '"editorial_punch", "system_awakening"' not in src, (
        "taste_audit.py still hardcodes high_energy_moves — use moves_by_energy_level() instead"
    )
