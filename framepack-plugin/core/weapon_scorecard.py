"""Weapon visual scorecards for Framepack's weapon bench."""
from __future__ import annotations

from dataclasses import asdict, dataclass, field
from pathlib import Path
import json
from typing import Any


_SCORE_FIELDS = (
    "impact",
    "polish",
    "commercial_fit",
    "parameter_safety",
    "hyperframes_safety",
    "composability",
)


@dataclass(frozen=True)
class ScoreSet:
    impact: int
    polish: int
    commercial_fit: int
    parameter_safety: int
    hyperframes_safety: int
    composability: int

    def __post_init__(self) -> None:
        for name in _SCORE_FIELDS:
            value = getattr(self, name)
            if not isinstance(value, int) or not 1 <= value <= 5:
                raise ValueError(f"{name} must be an integer score from 1..5")

    @property
    def values(self) -> tuple[int, ...]:
        return tuple(getattr(self, name) for name in _SCORE_FIELDS)

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "ScoreSet":
        return cls(**{name: int(data[name]) for name in _SCORE_FIELDS})

    def to_dict(self) -> dict[str, int]:
        return {name: int(getattr(self, name)) for name in _SCORE_FIELDS}


@dataclass(frozen=True)
class WeaponScorecard:
    weapon_id: str
    scores: ScoreSet
    recommended_presets: list[str] = field(default_factory=list)
    avoid: list[str] = field(default_factory=list)
    evidence: dict[str, str] = field(default_factory=dict)
    notes: str = ""

    @property
    def average_score(self) -> float:
        return round(sum(self.scores.values) / len(self.scores.values), 2)

    @property
    def score_class(self) -> str:
        avg = self.average_score
        low = min(self.scores.values)
        if avg >= 4.5 and low >= 4:
            return "A"
        if avg >= 3.7 and low >= 3:
            return "B"
        if avg >= 2.8:
            return "C"
        return "D"

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "WeaponScorecard":
        return cls(
            weapon_id=str(data["weapon_id"]),
            scores=ScoreSet.from_dict(dict(data["scores"])),
            recommended_presets=list(data.get("recommended_presets", [])),
            avoid=list(data.get("avoid", [])),
            evidence={str(k): str(v) for k, v in dict(data.get("evidence", {})).items()},
            notes=str(data.get("notes", "")),
        )

    def to_dict(self) -> dict[str, Any]:
        data = asdict(self)
        data["scores"] = self.scores.to_dict()
        data["average_score"] = self.average_score
        data["score_class"] = self.score_class
        return data


def save_scorecard(card: WeaponScorecard, path: str | Path) -> None:
    target = Path(path)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(card.to_dict(), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def load_scorecard(path: str | Path) -> WeaponScorecard:
    return WeaponScorecard.from_dict(json.loads(Path(path).read_text(encoding="utf-8")))
