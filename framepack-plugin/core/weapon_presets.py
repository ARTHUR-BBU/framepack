"""Weapon preset registry for meaningful Framepack weapon usage."""
from __future__ import annotations

from dataclasses import dataclass
import json
from pathlib import Path
import re
from typing import Any


_PRESET_DIR = Path(__file__).resolve().parents[1] / "weapon-presets"


@dataclass(frozen=True)
class WeaponPreset:
    preset_id: str
    motion_role: str
    duration: float
    ease: str
    max_lines: int
    safe_for: list[str]
    avoid: list[str]
    params: dict[str, Any]

    @classmethod
    def from_dict(cls, preset_id: str, data: dict[str, Any]) -> "WeaponPreset":
        return cls(
            preset_id=preset_id,
            motion_role=str(data.get("motion_role", "")),
            duration=float(data.get("duration", 0)),
            ease=str(data.get("ease", "")),
            max_lines=int(data.get("max_lines", 0)),
            safe_for=[str(item) for item in data.get("safe_for", [])],
            avoid=[str(item) for item in data.get("avoid", [])],
            params=dict(data.get("params", {})),
        )

    def to_params_hint(self) -> dict[str, Any]:
        hint = dict(self.params)
        hint.update(
            {
                "preset_id": self.preset_id,
                "motion_role": self.motion_role,
                "duration": self.duration,
                "ease": self.ease,
                "max_lines": self.max_lines,
                "safe_for": list(self.safe_for),
                "avoid": list(self.avoid),
            }
        )
        return hint


@dataclass(frozen=True)
class WeaponPresetPack:
    weapon_id: str
    presets: dict[str, WeaponPreset]


def load_preset_registry(preset_dir: str | Path | None = None) -> dict[str, WeaponPresetPack]:
    root = Path(preset_dir) if preset_dir else _PRESET_DIR
    registry: dict[str, WeaponPresetPack] = {}
    if not root.is_dir():
        return registry
    for path in sorted(root.glob("*.json")):
        data = json.loads(path.read_text(encoding="utf-8"))
        weapon_id = str(data.get("weapon_id") or path.stem)
        presets = {
            str(preset_id): WeaponPreset.from_dict(str(preset_id), dict(preset_data))
            for preset_id, preset_data in dict(data.get("presets", {})).items()
        }
        registry[weapon_id] = WeaponPresetPack(weapon_id=weapon_id, presets=presets)
    return registry


def load_weapon_presets(weapon_id: str, preset_dir: str | Path | None = None) -> WeaponPresetPack:
    return load_preset_registry(preset_dir).get(weapon_id, WeaponPresetPack(weapon_id=weapon_id, presets={}))


def choose_recommended_preset(weapon_id: str, scene_text: str, preset_dir: str | Path | None = None) -> WeaponPreset | None:
    pack = load_weapon_presets(weapon_id, preset_dir)
    if not pack.presets:
        return None
    text = scene_text.lower()
    scored: list[tuple[int, WeaponPreset]] = []
    for preset in pack.presets.values():
        safe_hits = sum(1 for signal in preset.safe_for if re.search(re.escape(signal.lower()), text, re.I))
        role_hit = 1 if preset.motion_role and re.search(re.escape(preset.motion_role.lower()), text, re.I) else 0
        avoid_hits = sum(1 for signal in preset.avoid if re.search(re.escape(signal.lower()), text, re.I))
        score = safe_hits * 10 + role_hit * 3 - avoid_hits * 20
        scored.append((score, preset))
    scored.sort(key=lambda item: item[0], reverse=True)
    best_score, best = scored[0]
    if best_score <= 0:
        return next(iter(pack.presets.values()))
    return best
