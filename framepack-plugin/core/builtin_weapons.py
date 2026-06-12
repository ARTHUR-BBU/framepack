"""Concrete builtin weapon catalog for Arsenal Registry.

This is the runtime catalog (管物), not the creative recommendation brain in
`core/arsenal.py`. Keep entries concrete enough for `.framepack/arsenal.json`.
"""

from __future__ import annotations

import copy


BUILTIN_WEAPONS: dict[str, dict] = {
    "text-split-enter": {
        "id": "text-split-enter",
        "source": "builtin",
        "kind": "part",
        "skill": "framepack:framepack-animation-library",
        "file": "parts/text-split-enter.md",
        "code": "parts/references/text-split-enter.js",
        "engine": "GSAP+CSS",
    },
    "caption-clip-wipe": {
        "id": "caption-clip-wipe",
        "source": "builtin",
        "kind": "part",
        "skill": "framepack:framepack-animation-library",
        "file": "parts/caption-clip-wipe.md",
        "code": "parts/references/caption-clip-wipe.js",
        "engine": "GSAP+CSS",
    },
    "bg-blur-mask": {
        "id": "bg-blur-mask",
        "source": "builtin",
        "kind": "part",
        "skill": "framepack:framepack-animation-library",
        "file": "parts/bg-blur-mask.md",
        "code": "parts/references/bg-blur-mask.js",
        "engine": "GSAP+CSS",
    },
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
