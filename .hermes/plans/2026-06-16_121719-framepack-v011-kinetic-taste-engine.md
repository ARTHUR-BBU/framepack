# Framepack v0.11 Kinetic Taste Engine Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Build Framepack v0.11's Kinetic Taste Engine so Director outputs include visual physics, kinetic continuity, director taste moves, controlled surprise, and a report-first Taste Audit without changing Framepack's HTML/render boundary.

**Architecture:** Add a small pure-Python taste subsystem under `framepack-plugin/core/` plus a CLI wrapper under `framepack-plugin/scripts/`. Update the Director skill/reference docs so `frame.md` and `.hyperframes/expanded-prompt.md` carry compact taste semantics. Keep Quality Audit and Taste Audit separate: Quality Audit catches production/semantic risks; Taste Audit returns director critique and non-blocking suggestions.

**Tech Stack:** Python stdlib only, pytest, markdown skill/reference files, existing Framepack plugin deployment layout.

---

## 0. Source design

Approved design doc:

- `F:/hyperframes/.hermes/designs/2026-06-16--framepack-v0.11-kinetic-taste-engine.md`

老田-approved product decisions:

1. v0.11 MVP uses 6-8 high-quality built-in reference specimens first; do not block on external 31-template ingestion.
2. Taste Audit starts as CLI/script only; hook integration is later.
3. `frame.md` gets a compact `taste:` block; `.hyperframes/expanded-prompt.md` gets detailed `Kinetic Continuity` blocks.
4. Surprise Operator is recommended and audited as missing, but not a hard failure; allow opt-out for restrained use cases.
5. Stable English IDs + Chinese explanations for human-facing docs.

## 1. Hard constraints

- Framepack still does not write HTML.
- Framepack still does not render.
- Framepack does not replace HyperFrames lint/validate/render.
- Taste Audit must not produce fake total aesthetic scores.
- Taste Audit issues are `note | suggestion | risk`, not `P0/P1/P2/P3`.
- Existing v0.10.6 projects without taste blocks should get non-blocking suggestions, not failing quality issues.
- Any Python code change follows TDD: write failing test → run it → implement → run pass → refactor.
- After plugin/skill file changes, sync source to `F:/Hermes_windows/plugins/framepack/` and the active independent `framepack` skill if touched.
- Before claiming done: load `verification-before-completion`, run real tests, paste evidence.
- Before commit: load `requesting-code-review`, run security/quality checks.

## 2. Files likely to change

Create:

- `framepack-plugin/core/taste_grammar.py`
- `framepack-plugin/core/taste_specimens.py`
- `framepack-plugin/core/taste_audit.py`
- `framepack-plugin/scripts/framepack_taste_audit.py`
- `framepack-plugin/tests/test_taste_grammar.py`
- `framepack-plugin/tests/test_taste_specimens.py`
- `framepack-plugin/tests/test_taste_audit.py`
- `framepack-plugin/tests/test_taste_audit_cli.py`
- `framepack-plugin/skills/framepack-director/references/kinetic-taste-engine.md`
- `framepack-plugin/skills/framepack-director/references/reference-specimens.md`
- `framepack-plugin/skills/framepack-director/references/kinetic-grammar.md`
- `framepack-plugin/skills/framepack-director/references/taste-moves.md`
- `framepack-plugin/skills/framepack-director/references/surprise-operators.md`

Modify:

- `framepack-plugin/core/execution_manifest.py`
- `framepack-plugin/tests/test_execution_manifest.py`
- `framepack-plugin/skills/framepack-director/SKILL.md`
- `framepack-plugin/skills/framepack/SKILL.md` if product summary references v0.11 concepts
- `AGENTS.md` only if guardrails/product workflow needs current-session visible mention
- `README.md` / `docs/README.zh-CN.md` later if this becomes release-facing
- `framepack-plugin/tests/test_deploy_manifest.py` only if deploy manifest must include new files/scripts

Do not bump version until implementation is complete and release-prep begins.

---

## 3. Implementation tasks

### Task 1: Add taste grammar registry tests

**Objective:** Lock stable IDs for kinetic grammar, director taste moves, and controlled surprise operators before implementation.

**Files:**
- Create: `framepack-plugin/tests/test_taste_grammar.py`
- Create later: `framepack-plugin/core/taste_grammar.py`

**Step 1: Write failing tests**

Create `framepack-plugin/tests/test_taste_grammar.py`:

```python
from core.taste_grammar import (
    KINETIC_GRAMMAR,
    SURPRISE_OPERATORS,
    TASTE_MOVES,
    get_kinetic_grammar,
    get_surprise_operator,
    get_taste_move,
)


def _ids(items):
    return [item["id"] for item in items]


def test_kinetic_grammar_has_expected_stable_ids():
    assert _ids(KINETIC_GRAMMAR) == [
        "cause_reveal",
        "echo_transform",
        "mask_portal",
        "tension_release",
        "scatter_assemble",
        "follow_through",
        "breath_punch_silence",
    ]


def test_taste_moves_has_expected_stable_ids():
    assert _ids(TASTE_MOVES) == [
        "object_worship",
        "editorial_punch",
        "silence_before_drop",
        "motif_reincarnation",
        "interface_ballet",
        "data_cathedral",
        "liquid_brand",
        "cold_open",
        "kinetic_typography_attack",
        "product_reveal_ritual",
        "system_awakening",
        "human_imperfection",
    ]


def test_surprise_operators_has_expected_stable_ids():
    assert _ids(SURPRISE_OPERATORS) == [
        "scale_violation",
        "tempo_break",
        "material_shift",
        "spatial_flip",
        "negative_space_shock",
        "misdirection",
        "motif_mutation",
        "abrupt_stillness",
        "imperfect_human_touch",
        "impossible_transition",
    ]


def test_registry_entries_include_human_readable_fields():
    for collection in (KINETIC_GRAMMAR, TASTE_MOVES, SURPRISE_OPERATORS):
        for item in collection:
            assert item["id"]
            assert item["name_en"]
            assert item["name_zh"]
            assert item["description"]
            assert item["example"]


def test_lookup_helpers_return_entries_by_id():
    assert get_kinetic_grammar("mask_portal")["name_en"] == "Mask → Portal"
    assert get_taste_move("object_worship")["name_en"] == "Object Worship"
    assert get_surprise_operator("scale_violation")["name_en"] == "Scale Violation"


def test_lookup_helpers_raise_keyerror_for_unknown_id():
    for getter in (get_kinetic_grammar, get_taste_move, get_surprise_operator):
        try:
            getter("missing")
        except KeyError as exc:
            assert "missing" in str(exc)
        else:
            raise AssertionError("expected KeyError")
```

**Step 2: Run test to verify failure**

Run:

```bash
cd F:/hyperframes/framepack-plugin && python -m pytest tests/test_taste_grammar.py -q -o "addopts="
```

Expected: FAIL because `core.taste_grammar` does not exist.

**Step 3: Implement minimal registry**

Create `framepack-plugin/core/taste_grammar.py` with Python stdlib only:

```python
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
```

**Step 4: Run test to verify pass**

Run:

```bash
cd F:/hyperframes/framepack-plugin && python -m pytest tests/test_taste_grammar.py -q -o "addopts="
```

Expected: `6 passed`.

---

### Task 2: Add reference specimen registry tests

**Objective:** Add 6-8 high-signal built-in reference specimens and validate they reference known taste IDs.

**Files:**
- Create: `framepack-plugin/tests/test_taste_specimens.py`
- Create later: `framepack-plugin/core/taste_specimens.py`

**Step 1: Write failing tests**

Create `framepack-plugin/tests/test_taste_specimens.py`:

```python
from core.taste_grammar import KINETIC_GRAMMAR, SURPRISE_OPERATORS, TASTE_MOVES
from core.taste_specimens import REFERENCE_SPECIMENS, get_reference_specimen, specimen_ids


def test_specimen_count_is_mvp_sized():
    assert 6 <= len(REFERENCE_SPECIMENS) <= 8


def test_specimen_ids_are_unique_and_stable():
    ids = specimen_ids()
    assert len(ids) == len(set(ids))
    assert "luxury_object_emergence" in ids
    assert "interface_ballet_saas" in ids
    assert "kinetic_type_event" in ids


def test_specimens_have_required_fields():
    required = {
        "id",
        "name",
        "source",
        "best_for",
        "hook_dna",
        "energy_arc",
        "motifs",
        "kinetic_grammar",
        "taste_moves",
        "surprise_operators",
        "component_patterns",
        "transition_patterns",
        "anti_patterns",
    }
    for specimen in REFERENCE_SPECIMENS:
        assert required <= set(specimen)
        assert specimen["best_for"]
        assert specimen["hook_dna"]["type"]
        assert specimen["energy_arc"]["type"]


def test_specimen_references_known_taste_ids():
    grammar_ids = {item["id"] for item in KINETIC_GRAMMAR}
    move_ids = {item["id"] for item in TASTE_MOVES}
    surprise_ids = {item["id"] for item in SURPRISE_OPERATORS}
    for specimen in REFERENCE_SPECIMENS:
        assert set(specimen["kinetic_grammar"]) <= grammar_ids
        assert set(specimen["taste_moves"]) <= move_ids
        assert set(specimen["surprise_operators"]) <= surprise_ids


def test_get_reference_specimen_returns_by_id():
    specimen = get_reference_specimen("luxury_object_emergence")
    assert specimen["name"] == "Luxury Object Emergence"


def test_get_reference_specimen_raises_for_unknown_id():
    try:
        get_reference_specimen("missing")
    except KeyError as exc:
        assert "missing" in str(exc)
    else:
        raise AssertionError("expected KeyError")
```

**Step 2: Run test to verify failure**

Run:

```bash
cd F:/hyperframes/framepack-plugin && python -m pytest tests/test_taste_specimens.py -q -o "addopts="
```

Expected: FAIL because `core.taste_specimens` does not exist.

**Step 3: Implement minimal specimens**

Create `framepack-plugin/core/taste_specimens.py`:

```python
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
```

**Step 4: Run tests**

Run:

```bash
cd F:/hyperframes/framepack-plugin && python -m pytest tests/test_taste_grammar.py tests/test_taste_specimens.py -q -o "addopts="
```

Expected: all pass.

---

### Task 3: Add Taste Audit data model and missing artifact detection

**Objective:** Create `taste_audit.py` with report model and first non-blocking checks for missing taste/continuity.

**Files:**
- Create: `framepack-plugin/tests/test_taste_audit.py`
- Create later: `framepack-plugin/core/taste_audit.py`

**Step 1: Write failing tests**

Add to `framepack-plugin/tests/test_taste_audit.py`:

```python
from pathlib import Path

from core.taste_audit import TasteAuditIssue, audit_project


def write_project(tmp_path: Path, frame: str = "", expanded: str = "") -> Path:
    project = tmp_path / "project"
    project.mkdir()
    if frame:
        (project / "frame.md").write_text(frame, encoding="utf-8")
    if expanded:
        hyper = project / ".hyperframes"
        hyper.mkdir()
        (hyper / "expanded-prompt.md").write_text(expanded, encoding="utf-8")
    return project


def test_audit_project_returns_report_shape(tmp_path):
    project = write_project(tmp_path)
    report = audit_project(project)
    data = report.to_dict()
    assert data["kind"] == "framepack_taste_audit"
    assert data["project_dir"] == str(project)
    assert "summary" in data
    assert "issues" in data


def test_missing_taste_block_is_suggestion_not_failure(tmp_path):
    project = write_project(tmp_path, frame="---\ncolors: {}\n---\n")
    report = audit_project(project)
    issue = next(issue for issue in report.issues if issue.code == "missing_taste_block")
    assert issue.severity == "suggestion"
    assert "taste" in issue.message


def test_missing_kinetic_continuity_is_suggestion(tmp_path):
    expanded = """
# Video

## Scene 1 — Hook
Concept: object reveal.

## Execution Manifest
scene_1:
  weapon: text-split-enter
"""
    project = write_project(tmp_path, expanded=expanded)
    report = audit_project(project)
    issue = next(issue for issue in report.issues if issue.code == "missing_kinetic_continuity")
    assert issue.severity == "suggestion"


def test_complete_taste_sections_avoid_missing_section_issues(tmp_path):
    frame = """
---
taste:
  reference_dna:
    - luxury_object_emergence
  visual_physics:
    gravity: low
    materials: [pearl, silk]
    motion_law: [slow drift]
    transformation_rule: [circles become halos]
    forbidden_motion: [generic slide-in]
  energy_arc: slow_burn_to_punch
  motif: pearl_as_moon
  taste_moves: [object_worship]
  surprise_operator:
    type: scale_violation
    intent: Make the pearl celestial.
---
"""
    expanded = """
## Scene 1 — Hook

#### Kinetic Continuity
- Incoming energy: silence.
- Action relay: pearl orbit reveals title.
- Outgoing transition seed: halo expands.
- Motif state: pearl → halo.

## Execution Manifest
scene_1:
  motion_role: hook_mystery
  grammar: tension_release
  taste_move: object_worship
  surprise: scale_violation
  weapon: text-split-enter
"""
    project = write_project(tmp_path, frame=frame, expanded=expanded)
    report = audit_project(project)
    codes = {issue.code for issue in report.issues}
    assert "missing_taste_block" not in codes
    assert "missing_kinetic_continuity" not in codes
```

**Step 2: Run test to verify failure**

Run:

```bash
cd F:/hyperframes/framepack-plugin && python -m pytest tests/test_taste_audit.py -q -o "addopts="
```

Expected: FAIL because `core.taste_audit` does not exist.

**Step 3: Implement minimal audit model/checks**

Create `framepack-plugin/core/taste_audit.py`:

```python
"""Report-first Kinetic Taste Audit for Framepack creative artifacts.

Taste Audit is separate from Quality Audit. It does not lint, render, or mutate
files. It gives director critique for frame.md and expanded-prompt.md.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any


@dataclass
class TasteAuditIssue:
    code: str
    severity: str
    message: str
    suggestion: str | None = None
    path: str | None = None
    scene: str | None = None
    details: dict[str, Any] | None = None


@dataclass
class TasteAuditReport:
    project_dir: str
    issues: list[TasteAuditIssue]
    summary: dict[str, int]

    def to_dict(self) -> dict[str, Any]:
        return {
            "kind": "framepack_taste_audit",
            "project_dir": self.project_dir,
            "summary": dict(self.summary),
            "issues": [asdict(issue) for issue in self.issues],
        }


SEVERITIES = ("risk", "suggestion", "note")


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8") if path.is_file() else ""


def _summary(issues: list[TasteAuditIssue]) -> dict[str, int]:
    summary = {severity: 0 for severity in SEVERITIES}
    for issue in issues:
        summary[issue.severity] = summary.get(issue.severity, 0) + 1
    return summary


def _has_taste_block(frame_md: str) -> bool:
    return "taste:" in frame_md and "visual_physics" in frame_md


def _has_kinetic_continuity(expanded_prompt: str) -> bool:
    return "Kinetic Continuity" in expanded_prompt and "Action relay" in expanded_prompt


def audit_project(project_dir: str | Path) -> TasteAuditReport:
    project = Path(project_dir)
    frame_path = project / "frame.md"
    expanded_path = project / ".hyperframes" / "expanded-prompt.md"
    frame_md = _read(frame_path)
    expanded_prompt = _read(expanded_path)

    issues: list[TasteAuditIssue] = []
    if frame_md and not _has_taste_block(frame_md):
        issues.append(
            TasteAuditIssue(
                code="missing_taste_block",
                severity="suggestion",
                message="frame.md has no compact taste block; Director output may lack visual physics and controlled surprise.",
                suggestion="Add taste.reference_dna, taste.visual_physics, taste.energy_arc, taste.motif, taste_moves, and optional surprise_operator.",
                path=str(frame_path),
            )
        )
    if expanded_prompt and not _has_kinetic_continuity(expanded_prompt):
        issues.append(
            TasteAuditIssue(
                code="missing_kinetic_continuity",
                severity="suggestion",
                message="expanded-prompt.md has no Kinetic Continuity blocks; scenes may behave like isolated entrances.",
                suggestion="For each scene, add Incoming energy, Action relay, Outgoing transition seed, and Motif state.",
                path=str(expanded_path),
            )
        )
    return TasteAuditReport(str(project), issues, _summary(issues))
```

**Step 4: Run tests**

Run:

```bash
cd F:/hyperframes/framepack-plugin && python -m pytest tests/test_taste_audit.py -q -o "addopts="
```

Expected: pass.

---

### Task 4: Expand Taste Audit heuristics for boring/unsafe taste patterns

**Objective:** Detect common “safe but dead” creative risks: generic fade stack, static mockup, missing/too many surprises, surprise without intent, motif not transformed, flat energy.

**Files:**
- Modify: `framepack-plugin/tests/test_taste_audit.py`
- Modify: `framepack-plugin/core/taste_audit.py`

**Step 1: Add failing tests**

Append tests:

```python

def test_detects_generic_fade_stack(tmp_path):
    expanded = """
## Scene 1
Transition out: crossfade.
## Scene 2
Transition out: fade.
## Scene 3
Transition out: blur crossfade.
"""
    project = write_project(tmp_path, expanded=expanded)
    report = audit_project(project)
    assert any(issue.code == "generic_fade_stack" for issue in report.issues)


def test_detects_static_mockup_language(tmp_path):
    expanded = "Scene 2: show static mockup centered on screen."
    project = write_project(tmp_path, expanded=expanded)
    report = audit_project(project)
    issue = next(issue for issue in report.issues if issue.code == "static_mockup_risk")
    assert issue.severity == "risk"


def test_detects_missing_controlled_surprise_when_taste_exists(tmp_path):
    frame = """
---
taste:
  visual_physics:
    gravity: low
  taste_moves: [object_worship]
---
"""
    project = write_project(tmp_path, frame=frame)
    report = audit_project(project)
    assert any(issue.code == "no_controlled_surprise" for issue in report.issues)


def test_detects_too_many_surprises(tmp_path):
    expanded = """
surprise: scale_violation
surprise: tempo_break
surprise: material_shift
"""
    project = write_project(tmp_path, expanded=expanded)
    report = audit_project(project)
    issue = next(issue for issue in report.issues if issue.code == "too_many_surprises")
    assert issue.severity == "risk"


def test_detects_surprise_without_intent(tmp_path):
    frame = """
---
taste:
  surprise_operator:
    type: scale_violation
---
"""
    project = write_project(tmp_path, frame=frame)
    report = audit_project(project)
    assert any(issue.code == "surprise_without_intent" for issue in report.issues)


def test_detects_motif_not_transformed(tmp_path):
    frame = """
---
taste:
  motif: pearl_as_moon
---
"""
    expanded = "pearl appears as decoration in every scene."
    project = write_project(tmp_path, frame=frame, expanded=expanded)
    report = audit_project(project)
    assert any(issue.code == "motif_not_transformed" for issue in report.issues)
```

**Step 2: Run failures**

Run:

```bash
cd F:/hyperframes/framepack-plugin && python -m pytest tests/test_taste_audit.py -q -o "addopts="
```

Expected: new tests fail.

**Step 3: Implement heuristics**

Add helper functions in `taste_audit.py`:

- `_audit_generic_fade_stack(project, expanded_prompt, expanded_path)`
- `_audit_static_mockup(project, expanded_prompt, expanded_path)`
- `_audit_surprise_usage(project, frame_md, expanded_prompt, frame_path, expanded_path)`
- `_audit_motif_transformation(project, frame_md, expanded_prompt, frame_path, expanded_path)`

Suggested simple heuristics:

```python
import re


def _audit_generic_fade_stack(expanded_prompt: str, path: Path) -> list[TasteAuditIssue]:
    transition_mentions = re.findall(r"transition[^\n]*(?:crossfade|fade|blur crossfade)", expanded_prompt, re.I)
    if len(transition_mentions) >= 3:
        return [TasteAuditIssue(
            "generic_fade_stack",
            "risk",
            "Multiple transitions rely on fade/crossfade language; the film may feel like independent slides instead of one kinetic world.",
            "Replace at least one fade with Mask → Portal, Echo → Transform, or motif-driven transition.",
            str(path),
            details={"count": len(transition_mentions)},
        )]
    return []
```

Mockup heuristic:

```python
if re.search(r"static\s+mockup|mockup\s+(?:centered|sits|placed)", expanded_prompt, re.I): ...
```

Surprise heuristic:

- Count `surprise:` occurrences in frame + expanded.
- If taste exists but neither `surprise_operator` nor `surprise:` exists → `no_controlled_surprise` suggestion.
- If count > 2 → `too_many_surprises` risk.
- If `surprise_operator` exists but no `intent:` nearby/in text → `surprise_without_intent` risk.

Motif heuristic:

- If `motif:` exists and expanded prompt lacks transformation arrows or verbs like `becomes`, `turns into`, `transforms`, `→`, `mutation`, `reincarnation`, emit suggestion.

**Step 4: Run tests**

Run:

```bash
cd F:/hyperframes/framepack-plugin && python -m pytest tests/test_taste_audit.py -q -o "addopts="
```

Expected: all taste audit tests pass.

---

### Task 5: Add Taste Audit CLI and markdown renderer

**Objective:** Provide report-first CLI similar to `framepack_quality_audit.py`.

**Files:**
- Create: `framepack-plugin/tests/test_taste_audit_cli.py`
- Create: `framepack-plugin/scripts/framepack_taste_audit.py`

**Step 1: Write failing tests**

Create `framepack-plugin/tests/test_taste_audit_cli.py`:

```python
import json
from pathlib import Path

from scripts.framepack_taste_audit import main, render_markdown
from core.taste_audit import TasteAuditIssue, TasteAuditReport


def test_render_markdown_includes_summary_and_issues():
    report = TasteAuditReport(
        project_dir="/tmp/project",
        summary={"risk": 1, "suggestion": 0, "note": 0},
        issues=[TasteAuditIssue("static_mockup_risk", "risk", "Static mockup.", "Choreograph it.")],
    )
    rendered = render_markdown(report)
    assert "# Framepack Taste Audit" in rendered
    assert "| risk | 1 |" in rendered
    assert "static_mockup_risk" in rendered
    assert "Choreograph it." in rendered


def test_main_outputs_json(tmp_path, capsys):
    project = tmp_path / "project"
    project.mkdir()
    (project / "frame.md").write_text("---\ncolors: {}\n---\n", encoding="utf-8")
    exit_code = main([str(project), "--format", "json"])
    assert exit_code == 0
    data = json.loads(capsys.readouterr().out)
    assert data["kind"] == "framepack_taste_audit"


def test_main_writes_output_file(tmp_path):
    project = tmp_path / "project"
    project.mkdir()
    (project / "frame.md").write_text("---\ncolors: {}\n---\n", encoding="utf-8")
    output = tmp_path / "taste.md"
    exit_code = main([str(project), "--format", "markdown", "--output", str(output)])
    assert exit_code == 0
    assert "Framepack Taste Audit" in output.read_text(encoding="utf-8")
```

**Step 2: Run failure**

Run:

```bash
cd F:/hyperframes/framepack-plugin && python -m pytest tests/test_taste_audit_cli.py -q -o "addopts="
```

Expected: FAIL because script does not exist.

**Step 3: Implement CLI**

Create `framepack-plugin/scripts/framepack_taste_audit.py`:

```python
#!/usr/bin/env python
"""Run Framepack Kinetic Taste Audit for creative artifacts."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from core.taste_audit import TasteAuditReport, audit_project  # noqa: E402


def render_markdown(report: TasteAuditReport) -> str:
    data = report.to_dict()
    lines = [
        "# Framepack Taste Audit",
        "",
        f"Project: `{data['project_dir']}`",
        "",
        "## Summary",
        "",
        "| Severity | Count |",
        "|---|---:|",
    ]
    for severity in ("risk", "suggestion", "note"):
        lines.append(f"| {severity} | {data['summary'].get(severity, 0)} |")
    lines.extend(["", "## Director Critique", ""])
    if not data["issues"]:
        lines.append("✅ No kinetic taste risks detected.")
    for issue in data["issues"]:
        lines.append(f"### {issue['severity']} · {issue['code']}")
        lines.append("")
        lines.append(issue["message"])
        if issue.get("suggestion"):
            lines.append(f"- Suggestion: {issue['suggestion']}")
        if issue.get("scene"):
            lines.append(f"- Scene: `{issue['scene']}`")
        if issue.get("path"):
            lines.append(f"- Path: `{issue['path']}`")
        if issue.get("details"):
            lines.append("- Details:")
            lines.append("```json")
            lines.append(json.dumps(issue["details"], ensure_ascii=False, indent=2))
            lines.append("```")
        lines.append("")
    return "\n".join(lines).rstrip() + "\n"


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("project_dir", help="HyperFrames project directory to audit")
    parser.add_argument("--format", choices=("json", "markdown"), default="json")
    parser.add_argument("--output", help="Optional output file path")
    args = parser.parse_args(argv)

    report = audit_project(Path(args.project_dir))
    if args.format == "json":
        rendered = json.dumps(report.to_dict(), ensure_ascii=False, indent=2) + "\n"
    else:
        rendered = render_markdown(report)

    if args.output:
        output_path = Path(args.output)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(rendered, encoding="utf-8")
    sys.stdout.write(rendered)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
```

**Step 4: Run CLI tests**

Run:

```bash
cd F:/hyperframes/framepack-plugin && python -m pytest tests/test_taste_audit_cli.py -q -o "addopts="
```

Expected: pass.

---

### Task 6: Extend Execution Manifest parser backward-compatibly

**Objective:** Parse new optional motion semantic fields without breaking existing weapon parsing.

**Files:**
- Modify: `framepack-plugin/core/execution_manifest.py`
- Modify: `framepack-plugin/tests/test_execution_manifest.py`

**Step 1: Add failing test**

Append to `tests/test_execution_manifest.py`:

```python

def test_parse_scene_keyed_manifest_with_motion_semantics():
    text = """
## Execution Manifest
scene_1:
  motion_role: hook_mystery
  grammar: tension_release
  taste_move: object_worship
  surprise: scale_violation
  weapon: text-split-enter
  code: parts/references/text-split-enter.js
  params:
    target: "#s1-title"
"""
    weapons = parse_execution_manifest(text)
    assert len(weapons) == 1
    weapon = weapons[0]
    assert weapon.id == "text-split-enter"
    assert weapon.motion_role == "hook_mystery"
    assert weapon.grammar == "tension_release"
    assert weapon.taste_move == "object_worship"
    assert weapon.surprise == "scale_violation"
```

**Step 2: Run failure**

Run:

```bash
cd F:/hyperframes/framepack-plugin && python -m pytest tests/test_execution_manifest.py::test_parse_scene_keyed_manifest_with_motion_semantics -q -o "addopts="
```

Expected: FAIL because dataclass lacks fields/parser ignores fields.

**Step 3: Implement backward-compatible fields**

Modify `ManifestWeapon` dataclass to add optional fields at the end:

```python
    motion_role: str | None = None
    grammar: str | None = None
    taste_move: str | None = None
    surprise: str | None = None
```

Modify `_parse_kv_block` to pass cleaned values.

Modify kv regex:

```python
kv = re.match(r"^(id|weapon|source|used_by|scene|scenes|code|reason|motion_role|grammar|taste_move|surprise)\s*:\s*(.+)$", stripped)
```

**Step 4: Run tests**

Run:

```bash
cd F:/hyperframes/framepack-plugin && python -m pytest tests/test_execution_manifest.py -q -o "addopts="
```

Expected: existing tests still pass plus new test.

---

### Task 7: Add Director references for Kinetic Taste Engine

**Objective:** Give the Director skill durable reference docs for the new taste vocabulary.

**Files:**
- Create: `framepack-plugin/skills/framepack-director/references/kinetic-taste-engine.md`
- Create: `framepack-plugin/skills/framepack-director/references/reference-specimens.md`
- Create: `framepack-plugin/skills/framepack-director/references/kinetic-grammar.md`
- Create: `framepack-plugin/skills/framepack-director/references/taste-moves.md`
- Create: `framepack-plugin/skills/framepack-director/references/surprise-operators.md`

**Step 1: Create docs**

Use concise docs, not massive dumps.

`kinetic-taste-engine.md` should include:

- Product thesis: 合格不等于惊艳。
- Four pillars: Reference DNA, Visual Physics, Kinetic Grammar, Taste Moves, Controlled Surprise.
- frame.md taste block example.
- expanded-prompt Kinetic Continuity example.
- Execution Manifest motion semantic example.
- Rules: 1-2 surprise max, intent required, no HTML writing.

`reference-specimens.md` should list the 6 internal specimens from `taste_specimens.py` with IDs and when to use them.

`kinetic-grammar.md` should list 7 grammar IDs and examples.

`taste-moves.md` should list 12 move IDs and examples.

`surprise-operators.md` should list 10 operator IDs and constraints.

**Step 2: Keep ID spelling exactly aligned with Python registries**

After writing docs, run content searches:

```bash
cd F:/hyperframes && python - <<'PY'
from pathlib import Path
for path in Path('framepack-plugin/skills/framepack-director/references').glob('*.md'):
    print(path, path.read_text(encoding='utf-8')[:80].replace('\n', ' '))
PY
```

Expected: docs readable. This is inspection only; final alignment is tested in later deploy/doc tests if added.

---

### Task 8: Update Director skill Phase 1 and Phase 2 prompts

**Objective:** Make Director generate compact taste block and Kinetic Continuity during creative handoff.

**Files:**
- Modify: `framepack-plugin/skills/framepack-director/SKILL.md`

**Step 1: Patch Phase 1 frame.md section**

At `### Step 4: Generate frame.md`, extend YAML example to include:

```yaml
taste:
  reference_dna:
    - luxury_object_emergence
  visual_physics:
    gravity: low
    materials: [pearl, silk, shadow]
    motion_law: [slow drift, orbital reveal]
    transformation_rule:
      - circles become halos
      - halos become portals
    forbidden_motion:
      - generic slide-in
      - random bounce
  energy_arc: slow_burn_to_punch
  motif: pearl_as_moon
  taste_moves:
    - object_worship
    - silence_before_drop
  surprise_operator:
    type: scale_violation
    intent: "Make the pearl feel celestial, not decorative."
```

Add instruction:

- Keep taste block compact.
- Choose 1-2 reference DNA IDs.
- Choose 1-3 taste moves.
- Surprise is recommended, not mandatory; if used, include intent.
- Use English stable IDs; explain to user in Chinese summary when appropriate.

**Step 2: Patch Phase 2 per-scene beats section**

Add required `Kinetic Continuity` block after animation choreography or before transition out:

```markdown
#### Kinetic Continuity
- Incoming energy: <what this scene inherits>
- Action relay: <what action causes/reveals/transforms the next action>
- Outgoing transition seed: <what element becomes the transition>
- Motif state: <how the motif evolves here>
```

Add warning:

- If every scene is independent entrance animation, output is invalid.
- At least 2 scene boundaries should use kinetic grammar other than generic fade/crossfade.

**Step 3: Patch Execution Manifest example**

Add optional motion fields to each scene example:

```yaml
  motion_role: hook_mystery
  grammar: tension_release
  taste_move: object_worship
  surprise: scale_violation
```

Do not remove existing `weapon`, `code`, `params` fields.

**Step 4: Run text sanity search**

Run:

```bash
cd F:/hyperframes && python - <<'PY'
from pathlib import Path
p = Path('framepack-plugin/skills/framepack-director/SKILL.md')
text = p.read_text(encoding='utf-8')
for token in ['taste:', 'visual_physics', 'Kinetic Continuity', 'motion_role', 'Controlled Surprise']:
    assert token in text, token
print('director skill taste tokens ok')
PY
```

Expected: `director skill taste tokens ok`.

---

### Task 9: Add Director prompt contract tests

**Objective:** Keep docs/skill instructions from drifting away from v0.11 taste contract.

**Files:**
- Create: `framepack-plugin/tests/test_director_taste_prompt_contract.py`

**Step 1: Write tests**

Create:

```python
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DIRECTOR = ROOT / "skills" / "framepack-director" / "SKILL.md"
REFS = ROOT / "skills" / "framepack-director" / "references"


def test_director_skill_contains_taste_block_contract():
    text = DIRECTOR.read_text(encoding="utf-8")
    for token in [
        "taste:",
        "reference_dna",
        "visual_physics",
        "energy_arc",
        "taste_moves",
        "surprise_operator",
    ]:
        assert token in text


def test_director_skill_contains_kinetic_continuity_contract():
    text = DIRECTOR.read_text(encoding="utf-8")
    for token in [
        "Kinetic Continuity",
        "Incoming energy",
        "Action relay",
        "Outgoing transition seed",
        "Motif state",
    ]:
        assert token in text


def test_director_skill_manifest_contains_motion_semantics():
    text = DIRECTOR.read_text(encoding="utf-8")
    for token in ["motion_role", "grammar", "taste_move", "surprise"]:
        assert token in text


def test_taste_reference_docs_exist():
    for name in [
        "kinetic-taste-engine.md",
        "reference-specimens.md",
        "kinetic-grammar.md",
        "taste-moves.md",
        "surprise-operators.md",
    ]:
        assert (REFS / name).is_file()
```

**Step 2: Run tests**

Run:

```bash
cd F:/hyperframes/framepack-plugin && python -m pytest tests/test_director_taste_prompt_contract.py -q -o "addopts="
```

Expected: pass after docs/skill update.

---

### Task 10: Update deploy manifest tests if needed

**Objective:** Ensure new scripts/core files deploy and smoke correctly.

**Files:**
- Inspect/modify: `framepack-plugin/tests/test_deploy_manifest.py`

**Step 1: Inspect existing deploy manifest test**

Read `tests/test_deploy_manifest.py` and see whether it enumerates required core/scripts.

**Step 2: If required, add new files**

Add new core modules and script to the required deployment list:

- `core/taste_grammar.py`
- `core/taste_specimens.py`
- `core/taste_audit.py`
- `scripts/framepack_taste_audit.py`

**Step 3: Run deploy manifest tests**

Run:

```bash
cd F:/hyperframes/framepack-plugin && python -m pytest tests/test_deploy_manifest.py -q -o "addopts="
```

Expected: pass.

---

### Task 11: Run focused suite

**Objective:** Verify v0.11 taste subsystem and touched compatibility tests.

Run:

```bash
cd F:/hyperframes/framepack-plugin && python -m pytest \
  tests/test_taste_grammar.py \
  tests/test_taste_specimens.py \
  tests/test_taste_audit.py \
  tests/test_taste_audit_cli.py \
  tests/test_execution_manifest.py \
  tests/test_director_taste_prompt_contract.py \
  tests/test_deploy_manifest.py \
  -q -o "addopts="
```

Expected: all pass.

---

### Task 12: Run full plugin tests

**Objective:** Catch regressions outside taste subsystem.

Run:

```bash
cd F:/hyperframes/framepack-plugin && python -m pytest tests/ -q -o "addopts="
```

Expected: all pass. Current baseline from handoff was `247 passed`; count may increase after new tests.

---

### Task 13: Sync deployment directories

**Objective:** Make active Hermes plugin/skills match source after implementation.

Only after tests pass.

Run source → deployed plugin sync using safe copy commands from project convention. On Windows git-bash:

```bash
cd F:/hyperframes
cp -r framepack-plugin/. /f/Hermes_windows/plugins/framepack/
```

If independent active `framepack` skill changed, sync it too. Confirm exact source path before copying. The active independent skill path is:

```text
F:/Hermes_windows/skills/software-development/framepack/
```

Verify deployed files exist:

```bash
test -f /f/Hermes_windows/plugins/framepack/core/taste_audit.py
test -f /f/Hermes_windows/plugins/framepack/scripts/framepack_taste_audit.py
```

Then run deploy manifest smoke:

```bash
cd F:/hyperframes/framepack-plugin && python -m pytest tests/test_deploy_manifest.py -q -o "addopts="
```

Expected: pass.

---

### Task 14: Manual smoke on a tiny fake project

**Objective:** Verify CLI works on realistic artifact paths.

Create a temporary fake project under `F:/hyperframes/tmp/taste-audit-smoke/` or pytest temp, not committed.

Files:

```text
frame.md
.hyperframes/expanded-prompt.md
```

Run:

```bash
cd F:/hyperframes/framepack-plugin
python scripts/framepack_taste_audit.py F:/hyperframes/tmp/taste-audit-smoke --format markdown
python scripts/framepack_taste_audit.py F:/hyperframes/tmp/taste-audit-smoke --format json
```

Expected:

- markdown report prints `# Framepack Taste Audit`
- JSON has `kind: framepack_taste_audit`
- missing/boring taste patterns produce suggestions/risks
- exit code 0

Do not commit temp smoke project.

---

### Task 15: Documentation and release surface hygiene

**Objective:** Ensure product docs mention v0.11 taste system without pretending it is released before version bump/release-prep.

Modify only if implementation is ready:

- `README.md` / `docs/README.zh-CN.md`: add Unreleased / upcoming v0.11 section, not official version bump.
- `AGENTS.md`: add a small product-context note only if active project agents need to follow the taste rules before release.
- `framepack-plugin/skills/framepack/SKILL.md`: update product summary if necessary, but do not bump `version: 0.10.6` unless doing formal release-prep.

Important: distinguish source development from official version. Do not write “v0.11 released” until tag/release.

---

### Task 16: Pre-commit review and final verification

**Objective:** Follow project rules before claiming completion.

Load mandatory skills:

- `verification-before-completion`
- `requesting-code-review`

Run:

```bash
cd F:/hyperframes
python /f/Hermes_windows/skills/software-development/requesting-code-review/scripts/scan_worktree_added_lines.py
cd F:/hyperframes/framepack-plugin && python -m pytest tests/ -q -o "addopts="
git diff --check
git status --short
```

Expected:

- security scan clean
- tests pass
- diff check exit 0
- status shows only intended source/docs/test files and possibly plan/design docs

Then summarize results and ask 老田 whether to commit now or first do simplify + review, because user preference is simplify + 审核 before commit.

---

## 4. Suggested commit breakdown

After implementation and verification, commit in small chunks:

1. `feat: add kinetic taste registries`
   - grammar/specimens + tests

2. `feat: add framepack taste audit`
   - audit core + CLI + tests

3. `feat: extend execution manifest taste semantics`
   - parser + tests

4. `docs: teach director kinetic taste engine`
   - Director skill + references + prompt contract tests

5. `chore: sync framepack deployment for taste engine`
   - only if deployment files are tracked or relevant in repo; otherwise mention copy evidence in final response.

If 老田 prefers one commit after simplify/review, squash these into one coherent commit:

```bash
git commit -m "feat: add framepack kinetic taste engine"
```

## 5. Risks and mitigation

- Risk: Taste Audit becomes moralizing scorecard.
  - Mitigation: no numeric total; director critique only.

- Risk: New prompt sections bloat expanded-prompt.
  - Mitigation: compact `taste:` in frame.md; one concise `Kinetic Continuity` block per scene.

- Risk: Surprise operators encourage chaos.
  - Mitigation: audit max 1-2 and require intent.

- Risk: Existing v0.10 projects look “bad” because they lack taste blocks.
  - Mitigation: suggestion severity only; no quality failure.

- Risk: Execution Manifest parser change breaks existing users.
  - Mitigation: optional fields appended to dataclass; existing fields unchanged; full parser tests.

## 6. Stop condition

Stop after the plan if running under planning mode.

Implementation begins only after switching into execution mode and loading the mandatory development skills for code changes.
