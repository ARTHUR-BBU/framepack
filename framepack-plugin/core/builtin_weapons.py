"""Concrete builtin weapon catalog for Arsenal Registry.

This is the runtime catalog (管物), not the creative recommendation brain in
`core/arsenal.py`. Keep entries concrete enough for `.framepack/arsenal.json`.
"""

from __future__ import annotations

import copy


def _part(weapon_id: str, function: str, engine: str = "GSAP+CSS") -> dict:
    return {
        "id": weapon_id,
        "source": "builtin",
        "kind": "part",
        "skill": "framepack:framepack-animation-library",
        "file": f"parts/{weapon_id}.md",
        "code": f"parts/references/{weapon_id}.js",
        "engine": engine,
        "function": function,
    }


def _block(weapon_id: str, function: str, engine: str = "GSAP") -> dict:
    """Register a scene-level block weapon.

    Blocks live in blocks/ (not parts/) and compose multiple parts into
    a complex scene. Their .js files expose build*() entry points.
    """
    return {
        "id": weapon_id,
        "source": "builtin",
        "kind": "block",
        "skill": "framepack:framepack-animation-library",
        "file": f"blocks/{weapon_id}.md",
        "code": f"blocks/references/{weapon_id}.js",
        "engine": engine,
        "function": function,
    }


BUILTIN_WEAPONS: dict[str, dict] = {
    # ── GSAP weapons ──
    "text-split-enter": _part("text-split-enter", "textSplitEnter"),
    "caption-clip-wipe": _part("caption-clip-wipe", "captionClipWipe"),
    "bg-blur-mask": _part("bg-blur-mask", "bgBlurMask"),
    "typewriter-cursor": _part("typewriter-cursor", "typewriterCursor"),
    "glitch-flicker": _part("glitch-flicker", "glitchFlicker"),
    "light-leak-cinema": _part("light-leak-cinema", "lightLeakCinema"),
    "elastic-scale-enter": _part("elastic-scale-enter", "elasticScaleEnter"),
    "gradient-shift": _part("gradient-shift", "gradientShift"),
    "splittext-stagger-chars": _part("splittext-stagger-chars", "splitTextStagger", engine="GSAP SplitText"),
    "float-3d-card": _part("float-3d-card", "float3DCard"),
    # ── Orphan parts/ weapons (drift repair v0.11.1) ──
    "stagger-grid-reveal": _part("stagger-grid-reveal", "staggerGridReveal", engine="GSAP"),
    "particle-blob-bg": _part("particle-blob-bg", "createParticleBlob", engine="anime.js"),
    "macos-notification": _part("macos-notification", "showMacOSNotification", engine="GSAP"),
    "number-count-up": _part("number-count-up", "numberCountUp", engine="GSAP"),
    # ── anime.js weapons (v0.12 NEW) ──
    "anime-text-split": _part("anime-text-split", "animeTextSplit", engine="anime.js"),
    "svg-morph-transition": _part("svg-morph-transition", "svgMorph", engine="anime.js"),
    # ── Sprite sheet weapons (v0.12 NEW) ──
    "sprite-animation": _part("sprite-animation", "spriteAnimation", engine="GSAP+CSS sprite sheet"),
    # ── Block weapons (scene-level compositions) ──
    "card-cascade-reveal": _block("card-cascade-reveal", "buildCardCascade", engine="GSAP"),
    "data-chart-editorial": _block("data-chart-editorial", "buildDataChart", engine="GSAP"),
    "hero-3d-device-spin": _block("hero-3d-device-spin", "buildDeviceSpin", engine="GSAP"),
    "sticky-flowchart": _block("sticky-flowchart", "buildStickyFlowchart", engine="GSAP"),
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
