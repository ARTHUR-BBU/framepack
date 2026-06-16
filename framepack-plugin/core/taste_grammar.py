"""Kinetic taste vocabularies for Framepack Director.

These registries are deliberately small and stable. They are product language
for prompt generation and report-first critique, not rendering instructions.
"""

from __future__ import annotations

from typing import Any

KINETIC_GRAMMAR: list[dict[str, str]] = [
    {
        "id": "cause_reveal",
        "name_en": "Cause → Reveal",
        "name_zh": "因果显形",
        "description": "One visual action causes another element to appear.",
        "example": "A light sweep passes over the frame and reveals the headline.",
    },
    {
        "id": "echo_transform",
        "name_en": "Echo → Transform",
        "name_zh": "回声变形",
        "description": "A shape or motion from one beat returns in a transformed role.",
        "example": "A pearl dot becomes a data node, then becomes the CTA button.",
    },
    {
        "id": "mask_portal",
        "name_en": "Mask → Portal",
        "name_zh": "遮罩开门",
        "description": "A transition behaves like an opening portal, not a plain cut/fade.",
        "example": "A product highlight expands into a full-screen wipe.",
    },
    {
        "id": "tension_release",
        "name_en": "Tension → Release",
        "name_zh": "蓄力释放",
        "description": "Quiet restraint builds pressure before a decisive release.",
        "example": "Four seconds of near-stillness resolve into a hard editorial title slam.",
    },
    {
        "id": "scatter_assemble",
        "name_en": "Scatter → Assemble",
        "name_zh": "散点组装",
        "description": "Fragments disperse or orbit before assembling into meaning.",
        "example": "Small UI cards scatter, then lock into a product dashboard.",
    },
    {
        "id": "follow_through",
        "name_en": "Follow-through",
        "name_zh": "惯性接力",
        "description": "The inertia of one motion carries the next element into frame.",
        "example": "A departing underline drags the next mockup into view.",
    },
    {
        "id": "breath_punch_silence",
        "name_en": "Breath → Punch → Silence",
        "name_zh": "吸气出拳停顿",
        "description": "A paced sequence of inhale, impact, and held stillness.",
        "example": "A soft ambient build snaps into big type, then freezes for emphasis.",
    },
]

TASTE_MOVES: list[dict[str, str]] = [
    {
        "id": "object_worship",
        "name_en": "Object Worship",
        "name_zh": "物件崇拜",
        "description": "Treat the product like sculpture or a sacred object.",
        "example": "The hero object emerges slowly from darkness before any copy appears.",
    },
    {
        "id": "editorial_punch",
        "name_en": "Editorial Punch",
        "name_zh": "杂志重拳",
        "description": "Use oversized editorial typography as a kinetic event.",
        "example": "A single word slams in like a magazine cover headline.",
    },
    {
        "id": "silence_before_drop",
        "name_en": "Silence Before Drop",
        "name_zh": "爆发前静默",
        "description": "Create appetite through restraint before a release beat.",
        "example": "The frame holds nearly empty for one second before the CTA lands.",
    },
    {
        "id": "motif_reincarnation",
        "name_en": "Motif Reincarnation",
        "name_zh": "母题转生",
        "description": "A recurring visual motif changes form across scenes.",
        "example": "A pearl becomes a halo, then a portal, then the CTA ring.",
    },
    {
        "id": "interface_ballet",
        "name_en": "Interface Ballet",
        "name_zh": "界面编舞",
        "description": "UI and mockups move like choreographed performers.",
        "example": "Cards arc around a device mockup before snapping into a dashboard.",
    },
    {
        "id": "data_cathedral",
        "name_en": "Data Cathedral",
        "name_zh": "数据圣殿",
        "description": "Turn data into spatial architecture instead of flat charts.",
        "example": "Metrics rise as luminous pillars in a deep grid hall.",
    },
    {
        "id": "liquid_brand",
        "name_en": "Liquid Brand",
        "name_zh": "液态品牌",
        "description": "Brand elements flow through the film as liquid, ribbons, or light.",
        "example": "A brand line becomes a ribbon, then a wipe, then an underline.",
    },
    {
        "id": "cold_open",
        "name_en": "Cold Open",
        "name_zh": "冷开场",
        "description": "Start with a strong visual question before explanatory copy.",
        "example": "A glowing object pulses in silence before the product is named.",
    },
    {
        "id": "kinetic_typography_attack",
        "name_en": "Kinetic Typography Attack",
        "name_zh": "动态字体攻击",
        "description": "Let type become the main motion subject, not just labels.",
        "example": "Words split, collide, and reform in rhythm with the beat.",
    },
    {
        "id": "product_reveal_ritual",
        "name_en": "Product Reveal Ritual",
        "name_zh": "产品揭幕仪式",
        "description": "Make the product appearance feel ceremonial.",
        "example": "Light, shadow, and supporting elements prepare the frame before reveal.",
    },
    {
        "id": "system_awakening",
        "name_en": "System Awakening",
        "name_zh": "系统苏醒",
        "description": "A technical product wakes from grid, signal, or boot sequence.",
        "example": "Dim grid lines pulse on before UI panels initialize.",
    },
    {
        "id": "human_imperfection",
        "name_en": "Human Imperfection",
        "name_zh": "人味瑕疵",
        "description": "Small non-mechanical irregularities add hand feel.",
        "example": "Hand-drawn lines wobble slightly before locking into a precise layout.",
    },
]

SURPRISE_OPERATORS: list[dict[str, str]] = [
    {
        "id": "scale_violation",
        "name_en": "Scale Violation",
        "name_zh": "尺度冒犯",
        "description": "Make an element intentionally larger or smaller than expected.",
        "example": "A pearl appears as a moon, not a jewelry detail.",
    },
    {
        "id": "tempo_break",
        "name_en": "Tempo Break",
        "name_zh": "节奏断裂",
        "description": "Break the established pacing for emphasis.",
        "example": "After slow drift, three title cards hit within 0.4 seconds.",
    },
    {
        "id": "material_shift",
        "name_en": "Material Shift",
        "name_zh": "材质突变",
        "description": "Let an element unexpectedly change material language.",
        "example": "Silk-textured typography becomes liquid metal.",
    },
    {
        "id": "spatial_flip",
        "name_en": "Spatial Flip",
        "name_zh": "空间翻转",
        "description": "Flip a flat composition into spatial depth.",
        "example": "A 2D interface unfolds into a 3D control room.",
    },
    {
        "id": "negative_space_shock",
        "name_en": "Negative Space Shock",
        "name_zh": "留白震荡",
        "description": "Use sudden emptiness as impact.",
        "example": "A dense data scene cuts to one tiny glowing dot in black space.",
    },
    {
        "id": "misdirection",
        "name_en": "Misdirection",
        "name_zh": "误导转向",
        "description": "Set up one expectation, then reveal a different meaning.",
        "example": "A decorative ring becomes the product control dial.",
    },
    {
        "id": "motif_mutation",
        "name_en": "Motif Mutation",
        "name_zh": "母题变异",
        "description": "Let the recurring motif mutate toward a final payoff.",
        "example": "A pearl orbit gradually becomes the brand mark.",
    },
    {
        "id": "abrupt_stillness",
        "name_en": "Abrupt Stillness",
        "name_zh": "突然凝固",
        "description": "Freeze after high motion so the viewer feels impact.",
        "example": "After a cascade, everything stops for 0.8 seconds on the claim.",
    },
    {
        "id": "imperfect_human_touch",
        "name_en": "Imperfect Human Touch",
        "name_zh": "非机械手感",
        "description": "Add controlled imperfection to avoid sterile motion.",
        "example": "A line draws with tiny uneven timing before becoming a clean rule.",
    },
    {
        "id": "impossible_transition",
        "name_en": "Impossible Transition",
        "name_zh": "不可能转场",
        "description": "Make one scene element become the next scene subject in a physically impossible way.",
        "example": "A product reflection peels off and becomes the next scene's background.",
    },
]


def _lookup(items: list[dict[str, Any]], item_id: str) -> dict[str, Any]:
    for item in items:
        if item["id"] == item_id:
            return item
    raise KeyError(f"Unknown taste id: {item_id}")


def get_kinetic_grammar(item_id: str) -> dict[str, Any]:
    return _lookup(KINETIC_GRAMMAR, item_id)


def get_taste_move(item_id: str) -> dict[str, Any]:
    return _lookup(TASTE_MOVES, item_id)


def get_surprise_operator(item_id: str) -> dict[str, Any]:
    return _lookup(SURPRISE_OPERATORS, item_id)
