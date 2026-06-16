"""Built-in reference specimens for Framepack Kinetic Taste Engine.

Specimens are not templates. They are compact DNA references that help Director
choose visual physics, kinetic grammar, taste moves, and controlled surprise.
"""

from __future__ import annotations

from typing import Any

REFERENCE_SPECIMENS: list[dict[str, Any]] = [
    {
        "id": "luxury_object_emergence",
        "name": "Luxury Object Emergence",
        "source": "internal:v0.11-mvp",
        "best_for": ["luxury", "jewelry", "beauty", "premium product reveal"],
        "hook_dna": {"type": "object_emergence", "description": "Hero object emerges from darkness before copy."},
        "energy_arc": {"type": "slow_burn_to_editorial_punch", "description": "Low-motion reveal builds to a title impact."},
        "motifs": ["black void", "soft specular edge", "circular halo"],
        "kinetic_grammar": ["tension_release", "mask_portal", "echo_transform"],
        "taste_moves": ["object_worship", "silence_before_drop", "product_reveal_ritual"],
        "surprise_operators": ["scale_violation", "abrupt_stillness"],
        "component_patterns": ["product_as_sculpture", "minimal_copy_after_object"],
        "transition_patterns": ["highlight_expands_to_wipe", "halo_as_portal"],
        "anti_patterns": ["generic fade stack", "random particles", "bouncy motion"],
    },
    {
        "id": "interface_ballet_saas",
        "name": "Interface Ballet SaaS",
        "source": "internal:v0.11-mvp",
        "best_for": ["saas", "developer tools", "product UI", "workflow automation"],
        "hook_dna": {"type": "system_boot", "description": "Interface pieces wake in sequence like performers."},
        "energy_arc": {"type": "ordered_build_to_snap", "description": "UI elements orbit, align, then snap into product clarity."},
        "motifs": ["cursor", "panel grid", "connection lines"],
        "kinetic_grammar": ["follow_through", "scatter_assemble", "cause_reveal"],
        "taste_moves": ["interface_ballet", "system_awakening", "editorial_punch"],
        "surprise_operators": ["spatial_flip", "tempo_break"],
        "component_patterns": ["mockup_as_choreographed_object", "cards_arc_into_dashboard"],
        "transition_patterns": ["cursor_drag_reveals_next_scene", "panel_edge_wipe"],
        "anti_patterns": ["static screenshot", "flat slide-in mockup", "unmotivated card cascade"],
    },
    {
        "id": "kinetic_type_event",
        "name": "Kinetic Type Event",
        "source": "internal:v0.11-mvp",
        "best_for": ["event promo", "conference", "launch", "announcement"],
        "hook_dna": {"type": "typographic_impact", "description": "Words are the first physical objects."},
        "energy_arc": {"type": "punch_breathe_punch_cta", "description": "Hard type impacts alternate with short pauses."},
        "motifs": ["oversized type", "registration marks", "beat-aligned lines"],
        "kinetic_grammar": ["breath_punch_silence", "tension_release", "follow_through"],
        "taste_moves": ["editorial_punch", "kinetic_typography_attack", "silence_before_drop"],
        "surprise_operators": ["tempo_break", "negative_space_shock"],
        "component_patterns": ["speaker_names_as_type_blocks", "agenda_as_rhythm"],
        "transition_patterns": ["letterform_mask", "underline_drags_next_title"],
        "anti_patterns": ["small polite titles", "even pacing", "default fade between title cards"],
    },
    {
        "id": "data_cathedral_explainer",
        "name": "Data Cathedral Explainer",
        "source": "internal:v0.11-mvp",
        "best_for": ["data", "ai", "analytics", "fintech", "research"],
        "hook_dna": {"type": "scale_of_system", "description": "Data appears as architecture, not a chart."},
        "energy_arc": {"type": "ambient_grid_to_spatial_reveal", "description": "A quiet grid grows into a large navigable space."},
        "motifs": ["grid hall", "light pillars", "scan lines"],
        "kinetic_grammar": ["cause_reveal", "scatter_assemble", "mask_portal"],
        "taste_moves": ["data_cathedral", "system_awakening", "editorial_punch"],
        "surprise_operators": ["spatial_flip", "scale_violation"],
        "component_patterns": ["metrics_as_architecture", "chart_as_environment"],
        "transition_patterns": ["scanline_opens_portal", "pillar_becomes_bar_chart"],
        "anti_patterns": ["flat chart dump", "numbers without hierarchy", "decorative grids with no role"],
    },
    {
        "id": "liquid_brand_story",
        "name": "Liquid Brand Story",
        "source": "internal:v0.11-mvp",
        "best_for": ["brand film", "wellness", "beauty", "soft technology"],
        "hook_dna": {"type": "flowing_mark", "description": "A brand line or ribbon flows through scenes."},
        "energy_arc": {"type": "continuous_flow_to_resolved_mark", "description": "Flowing motion accumulates into a final brand lockup."},
        "motifs": ["ribbon", "liquid line", "soft glow"],
        "kinetic_grammar": ["echo_transform", "follow_through", "mask_portal"],
        "taste_moves": ["liquid_brand", "motif_reincarnation", "human_imperfection"],
        "surprise_operators": ["material_shift", "motif_mutation"],
        "component_patterns": ["brand_line_as_navigation", "soft_copy_reveals"],
        "transition_patterns": ["ribbon_wipe", "line_becomes_container"],
        "anti_patterns": ["unrelated swooshes", "random organic blobs", "brand mark only at end"],
    },
    {
        "id": "cold_open_mystery",
        "name": "Cold Open Mystery",
        "source": "internal:v0.11-mvp",
        "best_for": ["teaser", "premium launch", "cinematic intro", "brand reveal"],
        "hook_dna": {"type": "visual_question", "description": "Open on a strong unanswered visual before explaining."},
        "energy_arc": {"type": "mystery_hold_to_reveal", "description": "Ambiguity holds long enough to create appetite, then resolves."},
        "motifs": ["single glowing sign", "shadow", "partial silhouette"],
        "kinetic_grammar": ["tension_release", "cause_reveal", "breath_punch_silence"],
        "taste_moves": ["cold_open", "silence_before_drop", "object_worship"],
        "surprise_operators": ["misdirection", "abrupt_stillness"],
        "component_patterns": ["delayed_copy", "single_object_before_context"],
        "transition_patterns": ["shadow_reveal", "silhouette_match_cut"],
        "anti_patterns": ["explaining too early", "headline first", "busy first frame"],
    },
]


def specimen_ids() -> list[str]:
    return [specimen["id"] for specimen in REFERENCE_SPECIMENS]


def get_reference_specimen(specimen_id: str) -> dict[str, Any]:
    for specimen in REFERENCE_SPECIMENS:
        if specimen["id"] == specimen_id:
            return specimen
    raise KeyError(f"Unknown reference specimen: {specimen_id}")
