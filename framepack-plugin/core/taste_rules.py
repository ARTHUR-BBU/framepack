"""Data-driven taste rule registry for Framepack.

The registry is the small source of truth behind taste-audit messages,
severity mapping, repair targets, and Taste Control acceptance text. Detector
modules decide whether a rule fires; this module explains what the rule means.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Mapping


@dataclass(frozen=True)
class TasteRule:
    id: str
    category: str
    default_severity: str
    message: str
    acceptance: str
    artifacts: tuple[str, ...]
    repair_target: str = "frame.md or .hyperframes/expanded-prompt.md"
    source_refs: tuple[str, ...] = ()
    registers: Mapping[str, str] = field(default_factory=dict)


_RULES: tuple[TasteRule, ...] = (
    TasteRule(
        id="text_dominance",
        category="asset_truth",
        default_severity="P1",
        registers={"product_launch": "P1", "website_to_video": "P1", "event_teaser": "P2"},
        message="Text is carrying the film while product presence is missing; this can collapse into animated PPT instead of a commercial video.",
        acceptance="Revise so product visuals, UI, footage, logo, or proof imagery carry the scene; copy becomes premium labels/cue words.",
        repair_target=".hyperframes/expanded-prompt.md",
        artifacts=("expanded_prompt",),
        source_refs=("framepack:taste_audit", "tasteskill:4.8"),
    ),
    TasteRule(
        id="product_absence",
        category="asset_truth",
        default_severity="P1",
        registers={"product_launch": "P1", "website_to_video": "P1", "brand_film": "P2"},
        message="Commercial/product intent is declared, but no concrete product visual is planned.",
        acceptance="Add concrete product screenshots, device mockups, UI cards, logo moments, footage, or an explicit asset waiver.",
        repair_target=".hyperframes/expanded-prompt.md",
        artifacts=("expanded_prompt",),
        source_refs=("framepack:taste_audit", "tasteskill:4.8"),
    ),
    TasteRule(
        id="static_mockup_risk",
        category="motion_slop",
        default_severity="P1",
        message="Mockup appears as a static placed object; this risks a screenshot-on-slide feel.",
        acceptance="Choreograph the mockup as a product moment: entrance, relationship to UI/cards, and outgoing transition seed.",
        repair_target=".hyperframes/expanded-prompt.md",
        artifacts=("expanded_prompt",),
        source_refs=("framepack:taste_audit",),
    ),
    TasteRule(
        id="generic_fade_stack",
        category="motion_slop",
        default_severity="P1",
        registers={"event_teaser": "P1", "brand_film": "P2"},
        message="Multiple transitions rely on fade/crossfade language; the film may feel like independent slides instead of one kinetic world.",
        acceptance="Replace at least one generic fade/crossfade with a motif-driven transition or documented proof that the repetition is intentional.",
        repair_target=".hyperframes/expanded-prompt.md",
        artifacts=("expanded_prompt",),
        source_refs=("framepack:taste_audit", "tasteskill:5"),
    ),
    TasteRule(
        id="no_proof_frames",
        category="evidence_gap",
        default_severity="P2",
        registers={"product_launch": "P1", "website_to_video": "P1", "brand_film": "P1"},
        message="index.html exists but no proof frames/snapshots were found; taste cannot be checked from prose alone.",
        acceptance="Capture representative proof frames/contact sheet so taste can be checked from pixels, not prose alone.",
        repair_target="index.html or .framepack/proof-frames/",
        artifacts=("html", "proof_frames"),
        source_refs=("framepack:taste_audit", "impeccable:critique"),
    ),
    TasteRule(
        id="missing_taste_block",
        category="brief_read",
        default_severity="P2",
        message="frame.md has no compact taste block; Director output may lack visual physics and controlled surprise.",
        acceptance="Add taste.reference_dna, taste.visual_physics, taste.energy_arc, taste.motif, taste_moves, and optional surprise_operator.",
        repair_target="frame.md",
        artifacts=("frame",),
        source_refs=("framepack:taste_audit",),
    ),
    TasteRule(
        id="missing_kinetic_continuity",
        category="motion_slop",
        default_severity="P2",
        message="expanded-prompt.md has no Kinetic Continuity blocks; scenes may behave like isolated entrances.",
        acceptance="For each scene, add Incoming energy, Action relay, Outgoing transition seed, and Motif state.",
        repair_target=".hyperframes/expanded-prompt.md",
        artifacts=("expanded_prompt",),
        source_refs=("framepack:taste_audit",),
    ),
    TasteRule(
        id="no_controlled_surprise",
        category="brief_read",
        default_severity="P2",
        message="Taste direction exists but no controlled surprise is declared; output may be tasteful but too safe.",
        acceptance="Add one optional surprise_operator with intent, or explicitly document why this piece should stay restrained.",
        repair_target="frame.md",
        artifacts=("frame", "expanded_prompt"),
        source_refs=("framepack:taste_grammar",),
    ),
    TasteRule(
        id="too_many_surprises",
        category="brief_read",
        default_severity="P1",
        message="More than two surprise operators are declared; surprise may become random chaos instead of controlled contrast.",
        acceptance="Keep at most 1-2 surprise operators and make each serve the brand/story.",
        repair_target=".hyperframes/expanded-prompt.md",
        artifacts=("frame", "expanded_prompt"),
        source_refs=("framepack:taste_grammar",),
    ),
    TasteRule(
        id="surprise_without_intent",
        category="brief_read",
        default_severity="P1",
        message="A frame.md surprise_operator is declared without an intent; controlled surprise needs a reason, not random weirdness.",
        acceptance="Add an intent explaining what the surprise should make the viewer feel or remember.",
        repair_target="frame.md",
        artifacts=("frame",),
        source_refs=("framepack:taste_grammar",),
    ),
    TasteRule(
        id="motif_not_transformed",
        category="motion_slop",
        default_severity="P2",
        message="A visual motif is declared but the expanded prompt does not describe how it transforms across scenes.",
        acceptance="Give the motif a state path, e.g. pearl → halo → portal → CTA ring, or document it as a persistent structural element.",
        repair_target=".hyperframes/expanded-prompt.md",
        artifacts=("frame", "expanded_prompt"),
        source_refs=("framepack:taste_grammar",),
    ),
    TasteRule(
        id="flat_background",
        category="composition_slop",
        default_severity="P2",
        message="Scene uses a flat/solid background with no depth layers; this risks a slide-deck look.",
        acceptance="Add 2-5 restrained atmosphere layers: product shadow, gradient wash, grid, particles, depth cards, or motif echoes.",
        repair_target=".hyperframes/expanded-prompt.md",
        artifacts=("expanded_prompt",),
        source_refs=("framepack:taste_audit", "tasteskill:4.8"),
    ),
    TasteRule(
        id="weapon_preset_missing",
        category="implementation_slop",
        default_severity="P2",
        message="A selected reusable weapon has no preset recommendation; the Agent may use the tool without a quality recipe.",
        acceptance="Add a preset or params_hint for this weapon, or record a waiver explaining why the scene is hand-tuned.",
        repair_target=".framepack/weapon-load-plan.json",
        artifacts=("weapon_plan",),
        source_refs=("framepack:weapon_matching",),
    ),
    TasteRule(
        id="bgm_unplanned",
        category="evidence_gap",
        default_severity="P2",
        message="Rhythm/audio is mentioned but BGM planning is unresolved; motion may lose its spine.",
        acceptance="Choose a BGM direction, beat cues, or an explicit no-music waiver before render planning.",
        repair_target=".hyperframes/expanded-prompt.md",
        artifacts=("expanded_prompt",),
        source_refs=("framepack:taste_audit",),
    ),
    TasteRule(
        id="missing_taste_read",
        category="brief_read",
        default_severity="P1",
        message="No explicit taste_read declares the video register, audience, visual family, and anti-references.",
        acceptance="Add a taste_read block naming register, audience, visual_family, and anti_references before expanding or rendering.",
        repair_target="frame.md",
        artifacts=("frame",),
        source_refs=("tasteskill:0", "impeccable:PRODUCT.md"),
    ),
    TasteRule(
        id="missing_taste_dials",
        category="brief_read",
        default_severity="P2",
        message="No explicit taste_dials declare design variance, motion intensity, and visual density.",
        acceptance="Add taste_dials with design_variance, motion_intensity, visual_density, and rationale tied to the brief.",
        repair_target="frame.md",
        artifacts=("frame",),
        source_refs=("tasteskill:1"),
    ),
    TasteRule(
        id="opening_visual_absence",
        category="asset_truth",
        default_severity="P1",
        registers={"event_teaser": "P2", "explainer": "P2"},
        message="Opening beat appears to rely on text without a concrete visual subject; the film may start like a slide, not a commercial.",
        acceptance="Give the opening beat a visual subject: product, UI, footage, logo/object, mascot, texture, generated image, or a documented kinetic-type exception.",
        repair_target=".hyperframes/expanded-prompt.md",
        artifacts=("expanded_prompt",),
        source_refs=("tasteskill:4.8", "impeccable:brand"),
    ),
    TasteRule(
        id="fake_product_ui_divs",
        category="asset_truth",
        default_severity="P1",
        message="Product preview appears to be div-built fake UI instead of a real screenshot, generated image, or real component preview.",
        acceptance="Replace with a real product screenshot, generated product image, real component preview, or explicit user-approved asset waiver.",
        repair_target="index.html",
        artifacts=("html",),
        source_refs=("tasteskill:4.8", "impeccable:detector"),
    ),
    TasteRule(
        id="copy_punctuation_slop",
        category="copy_slop",
        default_severity="P2",
        registers={"product_launch": "P2", "brand_film": "P2", "event_teaser": "P2"},
        message="Visible copy uses em/en dash punctuation, a high-frequency generated-copy tell.",
        acceptance="Rewrite visible copy with commas, periods, colons, line breaks, or regular hyphens only.",
        repair_target=".hyperframes/expanded-prompt.md",
        artifacts=("frame", "expanded_prompt", "html"),
        source_refs=("tasteskill:9.G", "impeccable:em-dash-overuse"),
    ),
    TasteRule(
        id="fake_precision",
        category="copy_slop",
        default_severity="P2",
        message="Copy uses fake-precise metrics without a source, which reads like AI-invented proof.",
        acceptance="Remove unsupported precise numbers, label them as sample/mock, or attach the real source in the brief.",
        repair_target=".hyperframes/expanded-prompt.md",
        artifacts=("frame", "expanded_prompt", "html"),
        source_refs=("tasteskill:4.9", "impeccable:copy"),
    ),
    TasteRule(
        id="ui_debris_copy",
        category="copy_slop",
        default_severity="P2",
        message="Decorative UI debris appears in visible copy: version labels, scroll cues, section numbers, weather/time strips, or fake captions.",
        acceptance="Remove decorative UI debris unless it carries real product, navigation, status, or place information.",
        repair_target=".hyperframes/expanded-prompt.md",
        artifacts=("frame", "expanded_prompt", "html"),
        source_refs=("tasteskill:9.F", "impeccable:detector"),
    ),
    TasteRule(
        id="scene_layout_repetition",
        category="composition_slop",
        default_severity="P2",
        message="Multiple scenes repeat the same layout grammar, making the film feel templated.",
        acceptance="Vary scene families: product reveal, interface ballet, kinetic type, proof frame, brand lockup, or motif transition.",
        repair_target=".hyperframes/expanded-prompt.md",
        artifacts=("expanded_prompt",),
        source_refs=("tasteskill:14"),
    ),
    TasteRule(
        id="product_presence_weak",
        category="asset_truth",
        default_severity="P1",
        registers={"brand_film": "P2", "event_teaser": "P2"},
        message="Product-led direction is declared, but scene beats do not give the product/UI/logo enough concrete visual presence.",
        acceptance="Give at least one scene a concrete product/UI/device/logo/footage hero moment, or document why this cut is intentionally abstract.",
        repair_target=".hyperframes/expanded-prompt.md",
        artifacts=("expanded_prompt",),
        source_refs=("tasteskill:4.8", "impeccable:product-presence"),
    ),
    TasteRule(
        id="copy_overcrowding",
        category="copy_slop",
        default_severity="P1",
        registers={"event_teaser": "P2", "brand_film": "P2"},
        message="Visible copy is carrying too many beats across scenes; the film risks becoming narrated slides instead of visual storytelling.",
        acceptance="Cut copy density and let product visuals, proof frames, motion motifs, or real imagery carry at least one major beat.",
        repair_target=".hyperframes/expanded-prompt.md",
        artifacts=("expanded_prompt",),
        source_refs=("tasteskill:9", "impeccable:copy"),
    ),
    TasteRule(
        id="decorative_generated_surface",
        category="composition_slop",
        default_severity="P2",
        message="Decorative generated surface detected: grid, glow, stripe, or crosshair treatment without a story or data role.",
        acceptance="Tie the surface to product structure/data/story, or remove it in favor of real assets or a quieter surface.",
        repair_target="index.html",
        artifacts=("html",),
        source_refs=("impeccable:detector:codex-grid-background"),
    ),
    TasteRule(
        id="raw_scroll_listener",
        category="implementation_slop",
        default_severity="P2",
        message="Raw scroll listener or scrollY animation logic detected; this is janky and hard to render reliably.",
        acceptance="Use GSAP ScrollTrigger, Motion useScroll, IntersectionObserver, or CSS scroll-driven animation with cleanup.",
        repair_target="index.html",
        artifacts=("html",),
        source_refs=("tasteskill:5.D", "impeccable:motion"),
    ),
    TasteRule(
        id="missing_reduced_motion",
        category="implementation_slop",
        default_severity="P2",
        message="Motion is present but no reduced-motion fallback is declared.",
        acceptance="Add prefers-reduced-motion or equivalent runtime guard so motion can collapse safely.",
        repair_target="index.html",
        artifacts=("html",),
        source_refs=("tasteskill:6.B", "impeccable:motion"),
    ),
    TasteRule(
        id="motion_claim_unproven",
        category="evidence_gap",
        default_severity="P1",
        message="The plan claims significant motion but no proof frames/contact sheet demonstrate it.",
        acceptance="Attach representative proof frames/contact sheet or lower the motion claim to match what is actually shown.",
        repair_target=".framepack/proof-frames/",
        artifacts=("expanded_prompt", "proof_frames"),
        source_refs=("tasteskill:5", "impeccable:critique"),
    ),
    TasteRule(
        id="gradient_text_slop",
        category="implementation_slop",
        default_severity="P2",
        message="Gradient text (background-clip:text) detected; this is a high-frequency generated design tell.",
        acceptance="Use solid color, or tie the gradient to a concrete brand/identity decision, not default aesthetics.",
        repair_target="index.html",
        artifacts=("html",),
        source_refs=("impeccable:detector:gradient-text"),
    ),
    TasteRule(
        id="bounce_or_elastic_easing",
        category="implementation_slop",
        default_severity="P2",
        message="Bounce or elastic easing detected; these read as playful/cheap unless the brand voice explicitly calls for it.",
        acceptance="Use a professional easing (power2, power3, expo) unless the brand voice is intentionally bouncy.",
        repair_target="index.html",
        artifacts=("html",),
        source_refs=("impeccable:detector:easing"),
    ),
    TasteRule(
        id="over_rounded_codex_cards",
        category="implementation_slop",
        default_severity="P2",
        message="Excessive border-radius (32px+) on cards or containers detected; this reads like a default generated template.",
        acceptance="Use moderate radius (4–16px), or justify the extreme radius with an explicit brand-system decision.",
        repair_target="index.html",
        artifacts=("html",),
        source_refs=("impeccable:detector:codex-rounded"),
    ),
    TasteRule(
        id="ghost_card_shadow_border",
        category="implementation_slop",
        default_severity="P2",
        message="Card has both a 1px border and a wide diffuse shadow, producing a muddy 'ghost' effect.",
        acceptance="Pick border or shadow, not both; or use a structured design-token system for card depth.",
        repair_target="index.html",
        artifacts=("html",),
        source_refs=("impeccable:detector:ghost-shadow"),
    ),
)

_RULE_BY_ID = {rule.id: rule for rule in _RULES}


def all_rules() -> tuple[TasteRule, ...]:
    return _RULES


def get_rule(rule_id: str) -> TasteRule:
    try:
        return _RULE_BY_ID[rule_id]
    except KeyError as exc:
        raise KeyError(f"Unknown taste rule: {rule_id}") from exc


def severity_for(rule: TasteRule | str, register: str | None = None, dials: Mapping[str, Any] | None = None) -> str:
    resolved = get_rule(rule) if isinstance(rule, str) else rule
    if register and register in resolved.registers:
        return resolved.registers[register]
    return resolved.default_severity


_AUDIT_SEVERITY_TO_PRIORITY = {
    "blocker": "P0",
    "risk": "P1",
    "suggestion": "P2",
    "note": "P3",
}


def priority_for_audit_severity(severity: str) -> str:
    """Return Taste Control priority for a Taste audit severity."""
    return _AUDIT_SEVERITY_TO_PRIORITY.get(severity, "P2")


def acceptance_for(rule_id: str) -> str:
    return get_rule(rule_id).acceptance


def repair_target_for(rule_id: str, path: str | None = None) -> str:
    if path:
        return path
    return get_rule(rule_id).repair_target
