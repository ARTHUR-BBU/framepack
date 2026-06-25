# Framepack Gate Engine — Full Director Intent Closure

Date: 2026-06-25
Status: design draft

## Verdict

We should implement all P0/P1/P2 director-intent gates, but not by adding more ad-hoc `check_*()` functions into `render_readiness.py`.

The right shape is a small **Gate Engine**:

- one place collects project context;
- each gate is a small independent inspector;
- gate metadata lives in a registry;
- artifact parsers are reusable;
- readiness output stays user-readable.

Analogy: current readiness board is a clipboard with handwritten checks. We are about to add airport security, customs, boarding, baggage, and VIP lounge checks. If all staff write on the same clipboard, it becomes chaos. We need lanes.

## Problem

Framepack Director now has many important intentions:

1. Source content extraction before directing from URLs.
2. Design choice / Design Picker for ambiguous style direction.
3. Storyboard preview as the main user-facing creative confirmation.
4. Audio/BGM cue planning for beat/drop-bound timelines.
5. Scene fusion / Kinetic Continuity with boundary proof hooks.
6. Control Profile consistency for all five weights.
7. Conditional-depth Asset Intake based on workflow.

These must all be checked, but each has different inputs, severity rules, and waiver semantics.

If we keep adding functions directly into `core/render_readiness.py`, that file becomes a god object:

- too many unrelated parsers;
- hard to test one gate in isolation;
- hard to explain why a gate fired;
- hard to add workflow-specific rules;
- easy for old gates to drift from Director skill requirements.

## Design Goals

1. **Full closure** — every Director intent must land in one of: artifact, parser, audit, readiness gate, or explicit waiver.
2. **Small gates** — each gate should be understandable without reading the whole system.
3. **Shared context** — read project files once; gates inspect a `ProjectContext` object.
4. **Data-driven registry** — gate order, severity, category, and workflow applicability should be declared centrally.
5. **Explainable output** — every result says: what evidence was found, what risk remains, what the user can do.
6. **No blocking render** — Framepack advises; user decides. But red/yellow states must be uncomfortable and visible.
7. **Backward compatible** — existing projects without new artifacts should degrade to YELLOW/RED advisories, not crash.

## Proposed Architecture

### 1. New package: `core/gates/`

```text
core/gates/
├── __init__.py
├── types.py                 # GateStatus, GateResult, GateContext, GateDefinition
├── engine.py                # build_readiness_board(), evaluate_gate(), registry runner
├── registry.py              # ordered gate definitions
├── parsers.py               # shared markdown/json parsers
├── artifacts.py             # artifact paths + placeholder detection helpers
├── source_extraction.py     # Source Extraction gate
├── design_choice.py         # Design Choice / Design Picker gate
├── storyboard_preview.py    # Storyboard Preview gate
├── audio_cues.py            # Audio Cue Ledger gate
├── scene_continuity.py      # Kinetic Continuity / Boundary Proof gate
├── control_profile.py       # five-weight consistency gate adapter
├── asset_intake.py          # workflow-aware asset depth gate
└── legacy.py                # wrappers for existing gates during migration
```

`core/render_readiness.py` becomes a compatibility facade:

```python
from core.gates.engine import build_readiness_board, render_board_markdown, render_board_summary
```

Existing imports/tests can survive while internals move out.

### 2. Shared `GateContext`

Instead of every gate reading files independently:

```python
@dataclass(frozen=True)
class GateContext:
    project_dir: Path
    frame_md: str
    expanded_prompt: str
    index_html: str
    handoff_manifest: dict | None
    asset_intake: ArtifactText
    source_intake: ArtifactText
    design_choice: ArtifactText
    storyboard_preview: ArtifactText
    audio_cues: dict | None
    timeline_manifest: dict | None
    route_workflow: str | None
    mentioned_features: set[str]
```

This gives gates the same map of the kitchen before they inspect their station.

### 3. GateDefinition registry

```python
@dataclass(frozen=True)
class GateDefinition:
    key: str
    name: str
    category: str
    order: int
    applies_to: Callable[[GateContext], bool]
    checker: Callable[[GateContext], GateResult]
    red_blocks_standard_sample: bool = True
```

Categories:

- `intake` — source, assets, director inspect
- `creative` — design choice, frame.md, storyboard, story bible
- `production` — weapons, catalog, structure, audio cues, scene continuity
- `review` — studio preview, taste audit, director acceptance
- `context` — guardrails/context sync

### 4. New artifacts

Add templates in `core/gate_templates.py` and scaffold them only when relevant or as optional placeholders:

```text
.framepack/source-intake.md
.framepack/design-choice.md
.framepack/storyboard-preview.md
.framepack/audio-cues.json      # already exists as concept
```

Timeline continuity stays in:

```text
.framepack/timeline-manifest.json
```

but parser support must be extended so continuity does not stay empty forever.

## Gate Semantics

### Source Extraction Gate

Applies when:

- user/project route includes URL; or
- handoff source_inputs.url exists; or
- project intent mentions website/article/social/source link.

States:

- GREEN: source-intake has extraction method + summary + narrative type + must-preserve points.
- YELLOW: extraction attempted but failed with reason/waiver.
- RED: URL/source-driven project but no source-intake.

### Design Choice Gate

Applies when:

- route confidence is low/medium; or
- workflow is `general-video`; or
- frame.md lacks clear style source; or
- control_profile creative_autonomy is low.

States:

- GREEN: style options/selection/user confirmation recorded.
- YELLOW: style selected but no user confirmation or rationale.
- GREEN/NA equivalent: high-confidence specific brief with frame.md style rationale.

### Storyboard Preview Gate

Applies when:

- expanded-prompt exists for any user-facing video.

States:

- GREEN: storyboard-preview exists, has scene rows with Visual/Feel/Key, recurring motifs, scene count matches story bible, and user_confirmed true or waiver.
- YELLOW: storyboard exists but not confirmed or scene mismatch.
- RED: no storyboard preview for non-trivial video.

### Audio Cue Gate

Applies when:

- asset-intake or expanded-prompt mentions BGM, beat, drop, audio-reactive, captions, voiceover, TTS/transcribe.

States:

- GREEN: audio-cues.json valid or explicit manual cue plan/waiver exists.
- YELLOW: audio mentioned but only vibe-level notes.
- RED: rhythm/drop-critical project with no cue evidence.

### Scene Continuity Gate

Applies when:

- expanded-prompt has more than one scene.

States:

- GREEN: each boundary has kinetic continuity and required proof/waiver where needed.
- YELLOW: continuity text exists but no timeline/proof binding.
- RED: scenes are independent entrances or continuity absent.

### Control Profile Gate

Applies when:

- frame.md has control_profile.

Extends existing checks:

- atmosphere_density vs layer count;
- weapon_reliance vs HANDWRITE ratio;
- restraint_force vs surprise count;
- caution_motion use;
- motion_dynamism vs animation verb intensity;
- creative_autonomy vs support level from style/reference/weapons.

### Workflow-Aware Asset Gate

Applies always, but required depth depends on workflow.

Examples:

- product-launch-video expects logo/product screenshots/CTA/audio decision/reference decision.
- faceless-explainer expects topic/source notes/script/audio decision/reference decision.
- embedded-captions expects source video/transcript/caption style/fonts.

The gate should distinguish:

- missing but optional;
- missing and quality-limiting;
- explicitly waived by user.

## Migration Plan

### Phase A — Foundation

1. Create `core/gates/types.py`, `engine.py`, `registry.py`, `artifacts.py`, `parsers.py`.
2. Move existing `GateStatus`, `GateResult`, `ReadinessBoard` into types.
3. Wrap existing checkers as legacy gates without changing behavior.
4. Keep `render_readiness.py` as facade for backward compatibility.
5. Tests: old readiness tests must still pass.

### Phase B — New artifacts + templates

1. Add templates for source-intake, design-choice, storyboard-preview.
2. Update case scaffolder to include new templates carefully.
3. Update readiness markdown rendering to group gates by category.

### Phase C — Implement P0/P1 gates

1. Source Extraction Gate.
2. Storyboard Preview Gate.
3. Scene Continuity Gate.
4. Audio Cue Gate.

### Phase D — Implement P2 gates

1. Design Choice Gate.
2. Control Profile expanded consistency.
3. Workflow-aware Asset Intake.

### Phase E — Integration hardening

1. Extend timeline manifest parser for Kinetic Continuity.
2. Ensure proof_audit consumes boundary proofs from timeline manifest.
3. Update pre-render hook summary to avoid overwhelming the user.
4. Add compact board summary: top 3 risks + full markdown file path.

## Output Management

As gates grow, user output must not become a wall of red/yellow rows.

Render modes:

1. **Compact hook injection**
   - Overall status
   - label
   - top 3 highest-risk gates
   - path to `.framepack/render-readiness.md`

2. **Full markdown board**
   - grouped by category
   - all gates
   - evidence/risk/action

3. **JSON mode**
   - stable schema for tests and future tooling

## Testing Strategy

Use TDD for each gate:

- missing artifact → expected RED/YELLOW;
- placeholder artifact → YELLOW;
- filled valid artifact → GREEN;
- waiver → YELLOW/GREEN depending on risk;
- workflow-specific applicability;
- legacy compatibility.

Regression tests:

- old projects still evaluate without crash;
- existing readiness board public functions still import;
- full plugin test suite passes;
- deployed plugin files are md5-synced after changes.

## Key Risk

The largest risk is not implementation difficulty. It is **gate fatigue**.

If every gate shouts equally, agents and users will ignore the board. The engine must rank and summarize:

- P0/P1 risks first;
- category grouping;
- top 3 action list;
- explicit waivers.

## Recommendation

Build the Gate Engine foundation first, then add all gates through it.

Do not bolt P0/P1/P2 directly onto `render_readiness.py`. That would solve this week and create the next AI debt.
