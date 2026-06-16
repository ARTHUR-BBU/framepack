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
