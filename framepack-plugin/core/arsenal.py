"""Framepack Arsenal — reusable video weapons management.

Translated from v0.6 TypeScript (src/workbench/arsenal.ts).

This is the "brain" of the weapon recommendation system:
  - ArsenalItem: a reusable weapon (template, motion, library, or rule)
  - BUILT_IN_ARSENAL: the starter pack shipped with Framepack
  - recommend_arsenal(): scores weapons against creative intent

The agent is the director. Framepack recommends weapons and render rules
without making final creative decisions.
"""

from dataclasses import dataclass, field


# ── Types ──


@dataclass
class ArsenalSource:
    type: str          # "built-in" | "trusted-registry" | "project" | "candidate"
    uri: str
    trusted: bool
    license_note: str


@dataclass
class ArsenalItem:
    id: str
    kind: str          # "template" | "motion" | "library" | "reference" | "design" | "hyperframes-rule"
    name: str
    description: str
    tags: list[str]
    applies_to: list[str]
    source: ArsenalSource
    version: str = "1.0.0"
    reuse_count: int = 0


# ── Built-in Arsenal (the "starter pack") ──

BUILT_IN_ARSENAL: list[ArsenalItem] = [
    ArsenalItem(
        id="workflow.event-promo",
        kind="template",
        name="Event Promo Rhythm Blueprint",
        description="Activity/event promo rhythm blueprint: hook, event value, speakers/agenda, venue energy, countdown, CTA.",
        tags=["event", "promo", "summit", "conference", "webinar", "launch-event"],
        applies_to=["event-promo"],
        source=ArsenalSource(
            type="built-in",
            uri="framepack://workflow/event-promo",
            trusted=True,
            license_note="included",
        ),
    ),
    ArsenalItem(
        id="workflow.sports-highlight",
        kind="template",
        name="Sports Highlight Blueprint",
        description="Sports highlight reel: opening impact, player focus, dramatic beats, stats card, CTA.",
        tags=["sports", "highlight", "basketball", "football", "esports"],
        applies_to=["sports-highlight"],
        source=ArsenalSource(
            type="built-in",
            uri="framepack://workflow/sports-highlight",
            trusted=True,
            license_note="included",
        ),
    ),
    ArsenalItem(
        id="motion.event-countdown-pulse",
        kind="motion",
        name="Countdown Pulse",
        description="Countdown and registration CTA pulse animation — perfect for event warm-up, pre-stream, and ticket deadlines.",
        tags=["countdown", "pulse", "cta", "event", "fast"],
        applies_to=["event-promo", "course-promo", "launch"],
        source=ArsenalSource(
            type="built-in",
            uri="framepack://motion/event-countdown-pulse",
            trusted=True,
            license_note="included",
        ),
    ),
    ArsenalItem(
        id="motion.speaker-lineup-reveal",
        kind="motion",
        name="Speaker Lineup Reveal",
        description="Speakers revealed one by one — ideal for summits, launches, salons, and livestream previews.",
        tags=["speaker", "lineup", "event", "reveal", "cards"],
        applies_to=["event-promo"],
        source=ArsenalSource(
            type="built-in",
            uri="framepack://motion/speaker-lineup-reveal",
            trusted=True,
            license_note="included",
        ),
    ),
    ArsenalItem(
        id="motion.bento-reveal",
        kind="motion",
        name="Bento Grid Reveal",
        description="Bento-style staggered card reveal — modern, clean, suitable for SaaS launches and product showcases.",
        tags=["bento", "grid", "reveal", "saas", "product", "modern"],
        applies_to=["saas-launch", "course-promo"],
        source=ArsenalSource(
            type="built-in",
            uri="framepack://motion/bento-reveal",
            trusted=True,
            license_note="included",
        ),
    ),
    ArsenalItem(
        id="motion.kinetic-captions",
        kind="motion",
        name="Kinetic Captions",
        description="Dynamic text captions that animate with the speech rhythm — ideal for founder promos and talking-head videos.",
        tags=["captions", "kinetic", "text", "talking-head", "founder"],
        applies_to=["founder-story", "course-promo", "news-explainer"],
        source=ArsenalSource(
            type="built-in",
            uri="framepack://motion/kinetic-captions",
            trusted=True,
            license_note="included",
        ),
    ),
    ArsenalItem(
        id="library.gsap",
        kind="library",
        name="GSAP",
        description="Framepack's preferred timeline animation library — deterministic, HyperFrames-safe timeline orchestration.",
        tags=["gsap", "timeline", "animation", "hyperframes-safe"],
        applies_to=["event-promo", "saas-launch", "course-promo", "sports-highlight", "transfer-announcement"],
        source=ArsenalSource(
            type="trusted-registry",
            uri="https://registry.npmjs.org/gsap",
            trusted=True,
            license_note="external package; verify license before redistribution",
        ),
    ),
    ArsenalItem(
        id="rules.hyperframes-render-safe",
        kind="hyperframes-rule",
        name="HyperFrames Render-Safe Checklist",
        description="Final render QA rules: first scene visible, tl.set for scene switches, window.__timelines registration, no Math.random() or repeat:-1.",
        tags=["hyperframes", "lint", "render-safe", "qa"],
        applies_to=["all"],
        source=ArsenalSource(
            type="built-in",
            uri="framepack://rules/hyperframes-render-safe",
            trusted=True,
            license_note="included",
        ),
    ),
    ArsenalItem(
        id="reference.video-dna",
        kind="reference",
        name="Reference Video DNA",
        description="Reverse-engineer reference videos into VIDEO_DNA, STORYBOARD, and TEMPLATE_BLUEPRINT — extract reusable structure without copying blindly.",
        tags=["reference", "storyboard", "video-dna", "template-blueprint"],
        applies_to=["all"],
        source=ArsenalSource(
            type="built-in",
            uri="framepack://reference/video-dna",
            trusted=True,
            license_note="included",
        ),
    ),
]


# ── Recommendation Engine ──

def list_arsenal_items() -> list[ArsenalItem]:
    """Return a deep copy of all built-in arsenal items."""
    import copy
    return copy.deepcopy(BUILT_IN_ARSENAL)


def recommend_arsenal(idea: str, fmt: str = "16:9", video_type: str = "general-video") -> dict:
    """Score and recommend arsenal items based on creative intent.

    The scoring algorithm is deliberately simple — it's a "security gate"
    not a "creative director." It surfaces relevant weapons; the agent
    makes the final creative decision.

    Args:
        idea: The creative brief or description
        fmt: Video format (e.g. "16:9", "9:16")
        video_type: Project type hint (e.g. "event-promo", "sports-highlight")

    Returns:
        dict with:
          - type: detected/input video type
          - items: list[dict] of recommended ArsenalItem as dicts
          - agent_boundary: str — reminder that the agent is the director
          - candidate_sources: list[dict] — external references found but not yet trusted
    """
    import re

    signal = f"{idea} {fmt} {video_type}".lower()
    scored = []

    for item in list_arsenal_items():
        haystack = " ".join(item.tags + item.applies_to + [item.name, item.description]).lower()
        score = 0

        # Exact video_type match = strong signal
        if video_type in item.applies_to:
            score += 8

        # Tag-level scoring
        for tag in item.tags:
            if tag.lower() in signal:
                score += 3

        # Pattern-based scoring for event promos
        if re.search(r"event|summit|conference|webinar|launch|promo", signal):
            if "event" in haystack or "promo" in haystack:
                score += 6

        # Pattern-based scoring for sports
        if re.search(r"sport|highlight|goal|touchdown|player|match|game", signal):
            if "sport" in haystack or "highlight" in haystack:
                score += 6

        # Pattern-based scoring for SaaS / product
        if re.search(r"saas|product|app|software|launch|startup", signal):
            if "saas" in haystack or "product" in haystack:
                score += 4

        # Library baseline — always slightly relevant
        if item.kind == "library":
            score += 1

        # HyperFrames rules — always relevant since we target HyperFrames
        if item.kind == "hyperframes-rule":
            score += 2

        if score > 0:
            scored.append((score, item))

    # Sort by score descending, break ties by id
    scored.sort(key=lambda x: (-x[0], x[1].id))

    # Top 8, or all if fewer than 8
    items = [item for _, item in scored[:8]] if scored else list_arsenal_items()[:8]

    return {
        "type": video_type,
        "items": [item.__dict__ for item in items],
        "agent_boundary": (
            "Agent is the director. Framepack recommends weapons, references, "
            "and render rules without making final creative decisions."
        ),
        "candidate_sources": [],
    }
