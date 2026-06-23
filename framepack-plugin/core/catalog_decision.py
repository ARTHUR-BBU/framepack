"""Catalog Decision Helper — HyperFrames catalog component evaluation.

Framepack should actively decide whether official catalog/components are
useful for each case. Not every case needs catalog, but the decision
should be explicit.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional


# Known HyperFrames catalog components with metadata
CATALOG_COMPONENTS: dict[str, dict] = {
    "kinetic-title": {
        "use_cases": ["brand launch", "product reveal", "title sequence", "品牌发布"],
        "description": "Animated kinetic typography title card.",
    },
    "data-card": {
        "use_cases": ["metrics display", "stats reveal", "数据展示", "指标"],
        "description": "Animated data/metric card with number counters.",
    },
    "caption-block": {
        "use_cases": ["subtitles", "captions", "voiceover text", "字幕", "旁白"],
        "description": "Synchronized caption/subtitle block.",
    },
    "lower-third": {
        "use_cases": ["name tag", "speaker intro", "名字", "介绍"],
        "description": "Lower-third name/title overlay.",
    },
    "scene-transition": {
        "use_cases": ["transition", "cut", "wipe", "转场"],
        "description": "Animated scene transition effect.",
    },
    "code-diff": {
        "use_cases": ["PR video", "code change", "git diff", "代码"],
        "description": "Animated code diff display for PR-to-video.",
    },
    "shimmer-sweep": {
        "use_cases": ["product showcase", "hero image", "sweep effect", "产品展示"],
        "description": "Light sweep/shimmer across content area.",
    },
}


@dataclass
class CatalogDecision:
    """A catalog usage decision for a case."""
    used_components: list[str] = field(default_factory=list)
    waived_components: list[str] = field(default_factory=list)
    reason_if_none_used: str = ""


def suggest_components(intent: str, scene_count: int = 5) -> list[str]:
    """Suggest catalog components based on user intent.

    Args:
        intent: User's video intent text.
        scene_count: Planned number of scenes (reserved for future heuristics).

    Returns list of component names that match the intent.
    """
    intent_lower = intent.lower()
    suggestions: list[str] = []

    for name, meta in CATALOG_COMPONENTS.items():
        for use_case in meta["use_cases"]:
            if use_case.lower() in intent_lower:
                suggestions.append(name)
                break

    return suggestions


def validate_decision(decision: CatalogDecision) -> list[str]:
    """Validate a catalog decision. Returns list of issue strings."""
    issues: list[str] = []

    if not decision.used_components and not decision.reason_if_none_used:
        issues.append(
            "No catalog components selected and no reason provided. "
            "Either use components or explain why they're not needed."
        )

    # Check for unknown component names in both selected and waived lists.
    for label, components in (
        ("used", decision.used_components),
        ("waived", decision.waived_components),
    ):
        for comp in components:
            if comp not in CATALOG_COMPONENTS:
                issues.append(f"Unknown {label} catalog component: '{comp}'.")

    return issues


def load_decision(path: Path | str) -> Optional[CatalogDecision]:
    """Load a catalog decision from markdown file.

    Reads the '## Decision' section from catalog-decision.md.
    """
    path = Path(path)
    if not path.is_file():
        return None

    try:
        text = path.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return None
    used: list[str] = []
    waived: list[str] = []
    reason = ""

    # Parse used_components
    used_match = re.search(r"used_components:\s*(.+)", text, re.IGNORECASE)
    if used_match:
        val = used_match.group(1).strip()
        if val and val.lower() not in ("none", "n/a", "-"):
            used = [c.strip() for c in re.split(r"[,，]", val) if c.strip()]

    waived_match = re.search(r"waived_components:\s*(.+)", text, re.IGNORECASE)
    if waived_match:
        val = waived_match.group(1).strip()
        if val and val.lower() not in ("none", "n/a", "-"):
            waived = [c.strip() for c in re.split(r"[,，]", val) if c.strip()]

    reason_match = re.search(r"reason_if_none_used:\s*(.+)", text, re.IGNORECASE)
    if reason_match:
        reason = reason_match.group(1).strip()

    return CatalogDecision(used_components=used, waived_components=waived, reason_if_none_used=reason)


def save_decision(decision: CatalogDecision, path: Path | str) -> None:
    """Save a catalog decision to markdown."""
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)

    lines = [
        "# HyperFrames Catalog Decision",
        "",
        "## Decision",
        f"- used_components: {', '.join(decision.used_components) if decision.used_components else 'none'}",
        f"- waived_components: {', '.join(decision.waived_components) if decision.waived_components else 'none'}",
        f"- reason_if_none_used: {decision.reason_if_none_used or 'n/a'}",
        "",
    ]

    if decision.used_components:
        lines.append("## Selected components")
        for comp in decision.used_components:
            meta = CATALOG_COMPONENTS.get(comp, {})
            desc = meta.get("description", "(unknown)")
            lines.append(f"- **{comp}**: {desc}")
        lines.append("")

    path.write_text("\n".join(lines), encoding="utf-8", newline="\n")
