from __future__ import annotations

import json

from core.weapon_scorecard import ScoreSet, WeaponScorecard, load_scorecard, save_scorecard


def test_scorecard_classification_a(tmp_path):
    card = WeaponScorecard(
        weapon_id="caption-clip-wipe",
        scores=ScoreSet(
            impact=5,
            polish=5,
            commercial_fit=5,
            parameter_safety=4,
            hyperframes_safety=5,
            composability=4,
        ),
        recommended_presets=["editorial_lower_third"],
        avoid=["long_body_copy"],
    )

    assert card.average_score == 4.67
    assert card.score_class == "A"

    path = tmp_path / "scorecard.json"
    save_scorecard(card, path)
    raw = json.loads(path.read_text(encoding="utf-8"))
    assert raw["weapon_id"] == "caption-clip-wipe"
    assert raw["score_class"] == "A"

    loaded = load_scorecard(path)
    assert loaded == card


def test_scorecard_classification_boundaries():
    assert WeaponScorecard(
        weapon_id="b",
        scores=ScoreSet(impact=4, polish=4, commercial_fit=4, parameter_safety=4, hyperframes_safety=4, composability=3),
    ).score_class == "B"

    assert WeaponScorecard(
        weapon_id="c",
        scores=ScoreSet(impact=3, polish=3, commercial_fit=3, parameter_safety=3, hyperframes_safety=2, composability=3),
    ).score_class == "C"

    assert WeaponScorecard(
        weapon_id="d",
        scores=ScoreSet(impact=2, polish=3, commercial_fit=2, parameter_safety=3, hyperframes_safety=2, composability=2),
    ).score_class == "D"


def test_scorecard_rejects_out_of_range_scores():
    try:
        ScoreSet(impact=6, polish=5, commercial_fit=5, parameter_safety=5, hyperframes_safety=5, composability=5)
    except ValueError as exc:
        assert "impact" in str(exc)
    else:
        raise AssertionError("ScoreSet should reject scores outside 1..5")
