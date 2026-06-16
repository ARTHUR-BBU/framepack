from core.taste_grammar import KINETIC_GRAMMAR, SURPRISE_OPERATORS, TASTE_MOVES
from core.taste_specimens import REFERENCE_SPECIMENS, get_reference_specimen, specimen_ids


def test_specimen_count_is_mvp_sized():
    assert 6 <= len(REFERENCE_SPECIMENS) <= 8


def test_specimen_ids_are_unique_and_stable():
    ids = specimen_ids()
    assert len(ids) == len(set(ids))
    assert "luxury_object_emergence" in ids
    assert "interface_ballet_saas" in ids
    assert "kinetic_type_event" in ids


def test_specimens_have_required_fields():
    required = {
        "id",
        "name",
        "source",
        "best_for",
        "hook_dna",
        "energy_arc",
        "motifs",
        "kinetic_grammar",
        "taste_moves",
        "surprise_operators",
        "component_patterns",
        "transition_patterns",
        "anti_patterns",
    }
    for specimen in REFERENCE_SPECIMENS:
        assert required <= set(specimen)
        assert specimen["best_for"]
        assert specimen["hook_dna"]["type"]
        assert specimen["energy_arc"]["type"]


def test_specimen_references_known_taste_ids():
    grammar_ids = {item["id"] for item in KINETIC_GRAMMAR}
    move_ids = {item["id"] for item in TASTE_MOVES}
    surprise_ids = {item["id"] for item in SURPRISE_OPERATORS}
    for specimen in REFERENCE_SPECIMENS:
        assert set(specimen["kinetic_grammar"]) <= grammar_ids
        assert set(specimen["taste_moves"]) <= move_ids
        assert set(specimen["surprise_operators"]) <= surprise_ids


def test_get_reference_specimen_returns_by_id():
    specimen = get_reference_specimen("luxury_object_emergence")
    assert specimen["name"] == "Luxury Object Emergence"


def test_get_reference_specimen_raises_for_unknown_id():
    try:
        get_reference_specimen("missing")
    except KeyError as exc:
        assert "missing" in str(exc)
    else:
        raise AssertionError("expected KeyError")
