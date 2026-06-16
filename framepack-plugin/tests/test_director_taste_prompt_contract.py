from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DIRECTOR = ROOT / "skills" / "framepack-director" / "SKILL.md"
REFS = ROOT / "skills" / "framepack-director" / "references"


def test_director_skill_contains_taste_block_contract():
    text = DIRECTOR.read_text(encoding="utf-8")
    for token in [
        "taste:",
        "reference_dna",
        "visual_physics",
        "energy_arc",
        "taste_moves",
        "surprise_operator",
    ]:
        assert token in text


def test_director_skill_contains_kinetic_continuity_contract():
    text = DIRECTOR.read_text(encoding="utf-8")
    for token in [
        "Kinetic Continuity",
        "Incoming energy",
        "Action relay",
        "Outgoing transition seed",
        "Motif state",
    ]:
        assert token in text


def test_director_skill_manifest_contains_motion_semantics():
    text = DIRECTOR.read_text(encoding="utf-8")
    for token in ["motion_role", "grammar", "taste_move", "surprise"]:
        assert token in text


def test_taste_reference_docs_exist():
    for name in [
        "kinetic-taste-engine.md",
        "reference-specimens.md",
        "kinetic-grammar.md",
        "taste-moves.md",
        "surprise-operators.md",
    ]:
        assert (REFS / name).is_file()
