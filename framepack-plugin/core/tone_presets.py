"""Tone/Rhythm Presets — data-driven creative constraints.

Tone should not mean copy flavor only. It decides scene count, cut speed,
motion density, music strategy, and text density.

This is a data table, not an engine. Agents read the selected preset and
apply its constraints during creative direction.
"""

from __future__ import annotations

import re
from typing import Optional


TONE_PRESETS: dict[str, dict] = {
    "cinematic": {
        "scene_count": [4, 6],
        "cut_density": "medium-low",
        "hold_style": "long-impact-hold",
        "music_strategy": "beat-locked-cues",
        "text_density": "low",
        "motion_density": "controlled",
        "preferred_assets": ["hero image", "texture", "epic bgm", "impact sfx"],
        "description": "Deep atmosphere, deliberate pacing, emotional weight. Each shot breathes.",
    },
    "chaotic": {
        "scene_count": [6, 8],
        "cut_density": "high",
        "hold_style": "fast-stop-punch",
        "music_strategy": "dense-beat-grid",
        "text_density": "medium-high",
        "motion_density": "high",
        "preferred_assets": ["fast-cut footage", "punchy bgm", "bold typography"],
        "description": "High energy, rapid cuts, dense information. Sports, trailers, hype reels.",
    },
    "deadpan": {
        "scene_count": [3, 4],
        "cut_density": "low",
        "hold_style": "awkward-pause",
        "music_strategy": "minimal-or-ironic",
        "text_density": "low",
        "motion_density": "minimal",
        "preferred_assets": ["single hero image", "deadpan bgm or silence"],
        "description": "Dry, spare, deliberate awkwardness. Comedy, indie, anti-hype.",
    },
    "editorial": {
        "scene_count": [4, 6],
        "cut_density": "medium",
        "hold_style": "measured-reveal",
        "music_strategy": "ambient-bed",
        "text_density": "medium",
        "motion_density": "smooth",
        "preferred_assets": ["product screenshots", "clean typography", "ambient bgm"],
        "description": "Clean, informative, professional. SaaS, product demos, explainers.",
    },
    "poetic": {
        "scene_count": [4, 6],
        "cut_density": "low",
        "hold_style": "slow-drift",
        "music_strategy": "melodic-spine",
        "text_density": "low",
        "motion_density": "flowing",
        "preferred_assets": ["lifestyle imagery", "textural video", "melodic bgm"],
        "description": "Lyrical, atmospheric, emotionally resonant. Brand films, artisanal products.",
    },
}

# Default fallback preset
_DEFAULT_PRESET = "editorial"


def get_preset(name: str) -> Optional[dict]:
    """Get a tone preset by name. Returns None if not found."""
    return TONE_PRESETS.get(name)


def list_presets() -> list[str]:
    """List all available preset names."""
    return list(TONE_PRESETS.keys())


def validate_scene_count(count: int, preset: dict) -> bool:
    """Check if a scene count is within the preset's recommended range."""
    lo, hi = preset["scene_count"]
    return lo <= count <= hi


# Intent → preset suggestion mapping
_INTENT_PATTERNS = [
    # Cinematic: brand launches, luxury, film-like
    (re.compile(r"品牌|发布|luxury|brand|launch|cinematic|电影", re.IGNORECASE), "cinematic"),
    # Poetic: artisanal, jewelry, lifestyle
    (re.compile(r"珍珠|珠宝|artisan|jewelry|lifestyle|poetic|诗意", re.IGNORECASE), "poetic"),
    # Chaotic: sports, energy, hype, trailer
    (re.compile(r"运动|球员|sports|transfer|hype|trailer|冲击|燃|energy", re.IGNORECASE), "chaotic"),
    # Deadpan: comedy, indie, anti-hype
    (re.compile(r"comedy|搞笑|indie|deadpan|冷幽默", re.IGNORECASE), "deadpan"),
    # Editorial: SaaS, product, explainer, educational
    (re.compile(r"saas|product|explainer|educational|教程|解释|RAG|科技", re.IGNORECASE), "editorial"),
]


def suggest_preset_for_intent(intent: str) -> str:
    """Suggest a tone preset name based on user intent text.

    Returns a preset name (always valid, falls back to _DEFAULT_PRESET).
    """
    for pattern, preset_name in _INTENT_PATTERNS:
        if pattern.search(intent):
            return preset_name
    return _DEFAULT_PRESET
