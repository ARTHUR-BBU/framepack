"""Concrete builtin weapon catalog for Arsenal Registry.

This is the runtime catalog (管物), not the creative recommendation brain in
`core/arsenal.py`. Keep entries concrete enough for `.framepack/arsenal.json`.
"""

from __future__ import annotations

import copy


def _part(weapon_id: str, engine: str = "GSAP+CSS") -> dict:
    return {
        "id": weapon_id,
        "source": "builtin",
        "kind": "part",
        "skill": "framepack:framepack-animation-library",
        "file": f"parts/{weapon_id}.md",
        "code": f"parts/references/{weapon_id}.js",
        "engine": engine,
    }


BUILTIN_WEAPONS: dict[str, dict] = {
    "text-split-enter": _part("text-split-enter"),
    "caption-clip-wipe": _part("caption-clip-wipe"),
    "bg-blur-mask": _part("bg-blur-mask"),
    "typewriter-cursor": _part("typewriter-cursor"),
    "glitch-flicker": _part("glitch-flicker"),
    "light-leak-cinema": _part("light-leak-cinema"),
    "elastic-scale-enter": _part("elastic-scale-enter"),
    "gradient-shift": _part("gradient-shift"),
    "splittext-stagger-chars": _part("splittext-stagger-chars", engine="GSAP SplitText"),
    "float-3d-card": _part("float-3d-card"),
    "card-cascade-reveal": _part("card-cascade-reveal"),
    "rules.hyperframes-render-safe": {
        "id": "rules.hyperframes-render-safe",
        "source": "builtin",
        "kind": "hyperframes-rule",
        "skill": "framepack:framepack-arsenal",
        "file": "SKILL.md",
        "code": None,
        "engine": "HyperFrames",
    },
}


def resolve_builtin_weapon(weapon_id: str) -> dict | None:
    """Return a copy of a builtin weapon record, or None if unknown."""
    weapon = BUILTIN_WEAPONS.get(weapon_id)
    return copy.deepcopy(weapon) if weapon else None


def list_builtin_weapon_ids() -> list[str]:
    """Return canonical builtin weapon IDs sorted for deterministic output."""
    return sorted(BUILTIN_WEAPONS)
