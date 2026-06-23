# Framepack Director Workflow Hardening Design

Date: 2026-06-23
Status: design draft for review
Scope: Framepack vNext after v0.15.0 HyperFrames 0.7.3 Director Workbench

## One-line thesis

Framepack's next step is not "more rules". It is turning director rules into hard, inspectable workflow gates.

Short version:

```text
/brag is small but hard.
Framepack is bigger, but still too soft.

Next version: keep Framepack's ambition, add /brag-style rails.
```

## Why this design exists

Two test reports point to the same root lesson from opposite sides:

1. `/brag` Claude Code skill report:
   - It is a thin layer above HyperFrames, not a full engine.
   - But its workflow is tight: `Inspect -> Plan -> Compose -> Deliver`.
   - Its best ideas are hard gates, beat cue assets, tone presets, and deliverable bundles.

2. Framepack Ederson-Manchester United case report:
   - The video rendered successfully.
   - HyperFrames lint/validate/inspect/render technically passed.
   - But the Framepack workflow failed: no asset intake, no script lanes, no Studio preview loop, no arsenal registry, no real catalog/weapon lifecycle.

Analogy:

```text
/brag is a small indoor riding arena: narrow track, hard railings.
Framepack is a bigger film studio: more rooms, better equipment, but the horse can still run through the kitchen.

This design adds doors, checklists, and stage managers.
```

## Evidence summary

### What /brag did well

From `F:/hyperframes-test/BRAG-TEST-REPORT.md`:

- Four-step workflow:
  - Inspect
  - Plan
  - Compose
  - Deliver
- Step 1 has a 9-question rubric.
- Step 2 produces a storyboard/plan before composition.
- Step 3 hands a specific brief to HyperFrames.
- Step 4 renders and delivers a complete package.
- Music cues are precomputed as cue JSON/MD and used as real timeline anchors.
- Tone presets affect scene count, pacing, and creative law, not just copy style.
- Lint/check gates catch real production bugs before render.
- Deliverables are bundled: mp4, share copy, plan, composition brief, product doc, source composition.

Weaknesses to avoid copying:

- Bundled music library is narrow: SaaS/indie-hacker happy beats.
- Default visual language can become pure text on black.
- Audio-reactive helper is documented but not shipped with `/brag`; dependency on HyperFrames skill is unclear.
- No license file.

### How `/brag` should be fused into Framepack

This design is not saying "admire `/brag` from a distance". It should become product input.

Borrow the rails, not the narrow taste.

| `/brag` strength | Framepack product fusion | Why it matters |
|---|---|---|
| `Inspect -> Plan -> Compose -> Deliver` | Framepack gates: Inspect/Intake -> Script Lanes -> Story Bible -> Build/Preview -> Readiness -> Deliver | Prevents the Agent from jumping straight to HTML. |
| 9-question inspect rubric | `.framepack/director-inspect.md` | Turns fuzzy intent into a reusable director diagnosis. |
| Storyboard/plan before compose | `.framepack/script-lanes.md` + selected lane | Prevents placeholder-smell copy and vibe-only scenes. |
| Music cue JSON/MD | `.framepack/audio-cues.json` | Makes rhythm a real timeline asset, not a vague adjective. |
| Tone presets with pacing rules | Tone = Rhythm Preset table | Tone controls scene count, cut density, text density, and music strategy. |
| Lint/check as production gate | Render Readiness Board consumes HyperFrames check/inspect evidence | Technical health becomes one visible green/yellow/red row. |
| Deliverable bundle | Framepack deliverable bundle: readiness, taste audit, share copy, case study, QA frames | A successful case becomes reusable evidence, not just a stray mp4. |

Concrete product translation:

```text
/brag Inspect     -> Framepack Director Inspect + Asset Intake
/brag Plan        -> Framepack Script Lanes + Tone/Rhythm Preset
/brag Compose     -> HyperFrames build with Arsenal/Catalog provenance
/brag Deliver     -> Framepack Readiness + Taste Audit + Render QA bundle
/brag cue JSON    -> Framepack Audio Cue Ledger
```

Do not copy:

```text
SaaS-only music taste
pure-text default visual language
unclear audio-reactive dependency
license ambiguity
```

### What the Ederson Framepack case exposed

From `F:/Framepack-01-test/cases/ederson-manutd-30s/TEST-REPORT-2026-06-23.md`:

Passed:

- Render output exists.
- ffprobe confirmed 1920x1080, 30fps, 900 frames, 30s.
- `npm run check` had lint 0 errors, validate 0 errors, inspect 0 layout issues.

Failed as Framepack workflow:

- No `.framepack/asset-intake.md`.
- No asset list or missing-asset decision.
- No BGM/SFX/voiceover/reference/video/logo/club identity intake.
- No script lane selection.
- No true Studio/preview iteration.
- Weapons were declared in Execution Manifest but re-handwritten in local JS.
- No `.framepack/arsenal.json`.
- Official HyperFrames catalog support existed in config/docs but was not used or evaluated.
- Placeholder-smell copy remained in the final HTML.

Most important diagnosis:

```text
The output was a renderable draft.
It was not a Framepack-standard director workflow sample.
```

## Root cause

The problem is not mainly HyperFrames.
The problem is not mainly that the user failed to provide assets.
The problem is workflow softness.

Current Framepack has many rules in AGENTS.md, skills, and design docs. But rules written as text are not enough for creative production.

A model under pressure will usually take the shortest familiar path:

```text
idea -> write HTML/GSAP -> lint -> render
```

Framepack needs to force the better path:

```text
idea
-> inspect/intake
-> script lanes
-> story bible
-> handoff manifest
-> arsenal/catalog decision
-> Studio preview evidence
-> render readiness board
-> taste audit
-> user decision
-> render
```

This is the key product shift:

```text
Framepack v0.15 = Director Workbench MVP
Framepack vNext = Director Harness / Workflow Gatekeeper
```

## Product principle

Framepack still advises; user still decides.

But "advises" does not mean "silently lets the workflow disappear".

Framepack should not hard-block render forever. It should make missing workflow evidence visible and uncomfortable:

```text
Green  = evidence exists
Yellow = missing but user can waive
Red    = impossible to honestly claim Framepack workflow completion
```

So the user can say:

```text
Render anyway. I accept this is a draft.
```

But the Agent cannot honestly say:

```text
This is a standard Framepack sample.
```

unless the gates are satisfied.

## Proposed workflow spine

```text
0. Director Inspect + Asset Intake
   -> .framepack/asset-intake.md
   -> .framepack/director-inspect.md

1. Script Lane Selection
   -> .framepack/script-lanes.md
   -> user-selected lane or explicit waiver

2. Visual Identity + Story Bible
   -> frame.md
   -> .hyperframes/expanded-prompt.md
   -> concise user confirmation digest

3. Handoff + Execution Contract
   -> .framepack/handoff-manifest.md
   -> Execution Manifest inside expanded-prompt.md

4. Arsenal + Catalog Binding
   -> .framepack/arsenal.json
   -> .framepack/catalog-decision.md
   -> weapon provenance or HANDWRITE waiver

5. HyperFrames Build + Studio Preview
   -> index.html / composition files
   -> preview server/browser/snapshot evidence
   -> .framepack/studio-preview.md

6. Initialization Context Hydration
   -> project/case AGENTS.md managed blocks updated
   -> .framepack/context-sync.md

7. Render Readiness Board
   -> .framepack/render-readiness.md
   -> green/yellow/red gate summary

8. Pre-render Taste Audit
   -> .framepack/taste-audit.md
   -> user decides revise/add assets/render anyway

9. Render + Post-render QA
   -> mp4
   -> ffprobe evidence
   -> optional CASE-STUDY.md / share-copy.txt
```

## Gate 0 — Director Inspect + Asset Intake

### Purpose

Before writing scenes, Framepack asks what movie is being made and what materials exist.

This borrows `/brag`'s Inspect step, but expands it for Framepack's asset-aware director role.

### Required artifact

`.framepack/asset-intake.md`

Already designed in `2026-06-17--framepack-asset-intake.md`; this design upgrades it from "nice workflow" to gate evidence.

### New companion artifact

`.framepack/director-inspect.md`

Suggested structure:

```markdown
# Director Inspect

## Project intent
- video_type:
- audience:
- platform:
- duration:
- format:

## 9-question director rubric
1. Who is this for?
2. What must the first second make them feel?
3. What is the story turn?
4. What proof or concrete material makes it believable?
5. What assets are available?
6. What assets are missing but important?
7. Is music background, spine, or optional?
8. What must never appear?
9. What does success look like?

## Risk if we continue now
- missing_assets:
- likely_quality_ceiling:
- recommended_next_action:

## User decision
- provide_assets / generate_assets / continue_as_draft / waive_specific_missing_assets
```

### Gate rule

If no asset-intake exists:

- Render readiness = red for "Framepack workflow sample".
- User may continue, but output must be labeled draft.
- Agent must not claim full Framepack process was followed.

## Gate 1 — Script Lane Selection

### Purpose

Prevent placeholder-smell copy by making narrative direction explicit before HTML.

The Ederson case had words, but not a script. It generated atmosphere labels instead of a chosen story.

### Required artifact

`.framepack/script-lanes.md`

Suggested structure:

```markdown
# Script Lanes

## Lane A — Cinematic arrival
- hook:
- beats:
- final line:
- why it fits:

## Lane B — Data monster
- hook:
- beats:
- final line:
- why it fits:

## Lane C — Fan energy
- hook:
- beats:
- final line:
- why it fits:

## Selected lane
- lane:
- user_confirmed: true/false
- waiver_reason:
```

### Gate rule

If no script lane is selected:

- `expanded-prompt.md` may be generated as draft only.
- Placeholder-smell audit becomes mandatory before render.
- Render readiness = yellow or red depending on severity.

### `/brag` lesson

`/brag` does not let the model jump straight from idea to composition. It forces Plan before Compose. Framepack needs the same rail, but richer.

## Gate 2 — Tone = Rhythm Preset

### Purpose

Tone should not mean copy flavor only. It should decide scene count, cut speed, motion density, music strategy, and text density.

Borrow from `/brag`'s tone system.

### Proposed preset schema

`.framepack/tone-presets.json` or a Python data table:

```json
{
  "cinematic": {
    "scene_count": [4, 6],
    "cut_density": "medium-low",
    "hold_style": "long-impact-hold",
    "music_strategy": "beat-locked-cues",
    "text_density": "low",
    "motion_density": "controlled",
    "preferred_assets": ["hero image", "texture", "epic bgm", "impact sfx"]
  },
  "chaotic": {
    "scene_count": [6, 8],
    "cut_density": "high",
    "hold_style": "fast-stop-punch",
    "music_strategy": "dense-beat-grid",
    "text_density": "medium-high",
    "motion_density": "high"
  },
  "deadpan": {
    "scene_count": [3, 4],
    "cut_density": "low",
    "hold_style": "awkward-pause",
    "music_strategy": "minimal-or-ironic",
    "text_density": "low"
  }
}
```

### Gate rule

`frame.md` or `expanded-prompt.md` must record selected tone/rhythm preset.

If no preset is selected:

- Render readiness = yellow: pacing may be arbitrary.

## Gate 3 — Audio Cue Ledger

### Purpose

Absorb `/brag`'s strongest idea: music cues are assets, not vibes.

For rhythm-first videos, Framepack should turn BGM into timeline anchors.

### Required artifact when music is used as spine

`.framepack/audio-cues.json`

Example:

```json
{
  "track": "assets/audio/ederson-epic.mp3",
  "source": "user-provided",
  "analysis_method": "hyperframes beats or external analyzer",
  "strong_cues": [8.74, 13.11, 17.47, 24.80],
  "beat_grid": [0.43, 0.86, 1.29],
  "cue_bindings": [
    {
      "time": 8.74,
      "scene": "scene_2",
      "event": "name impact",
      "tolerance_seconds": 0.15
    },
    {
      "time": 17.47,
      "scene": "scene_4",
      "event": "fee reveal",
      "tolerance_seconds": 0.15
    }
  ]
}
```

### Behavior

Framepack does not need to own beat extraction. It can delegate to:

- HyperFrames beat tools when available.
- A bundled analyzer if later added.
- User-provided cue JSON.
- Manual cue marks for simple cases.

### Gate rule

If tone/rhythm preset says music is the spine and BGM exists, but no cue ledger exists:

- Render readiness = yellow.
- Taste audit should say: "music is only background; no beat-lock evidence."

If no BGM exists for a cinematic/sports/trailer case:

- Render readiness = yellow/red depending on user goal.

## Gate 4 — Arsenal + Weapon Provenance

### Purpose

Stop treating weapons as names to imitate.

A declared weapon must have a source, binding, or waiver.

### Required artifact

`.framepack/arsenal.json`

The existing AGENTS.md already defines the arsenal lifecycle. This design makes its absence visible.

### Binding modes

Every Execution Manifest weapon must resolve to one of:

```text
builtin_weapon       -> known Framepack weapon / skill reference
project_weapon       -> .framepack/weapons/<file>
hyperframes_catalog  -> official catalog/component/block
reference_only       -> inspiration only; no execution obligation
handwrite            -> intentionally hand-written; reason required
missing              -> declared but no source/provenance found
```

### Example record

```json
{
  "weapons": {
    "text-split-enter": {
      "binding": "builtin_weapon",
      "source": "framepack-animation-library",
      "canonical_function": "textSplitEnter",
      "used_by": ["scene_1"],
      "params_mapped": true,
      "hash": null
    },
    "sprite-animation": {
      "binding": "handwrite",
      "reason": "project-specific sprite sheet timing; no reusable weapon available",
      "used_by": ["scene_3"]
    }
  }
}
```

### Gate rule

If Execution Manifest declares a weapon and binding is missing:

- Render readiness = red for standard Framepack sample.
- User may render draft, but audit must say weapons were not actually governed.

If handwrite is used:

- It is allowed only with explicit reason.
- It must not be presented as weapon-library reuse.

### Relationship to existing design

This extends `2026-06-21--execution-contract-audit.md`.
That design checks whether declared canonical functions are called.
This design adds the missing product layer: where did the weapon come from and was its lifecycle recorded?

## Gate 5 — HyperFrames Catalog Decision

### Purpose

Do not claim catalog support just because `hyperframes.json` exists.

Framepack should actively decide whether official catalog/components are useful for this case.

### Required artifact

`.framepack/catalog-decision.md`

Suggested structure:

```markdown
# HyperFrames Catalog Decision

## Case needs
- lower thirds:
- kinetic title:
- data card:
- caption block:
- scene transition:

## Catalog candidates evaluated
| candidate | use? | reason |
|---|---|---|
| kinetic-title | yes/no | ... |
| data-card | yes/no | ... |

## Decision
- used_components:
- waived_components:
- reason_if_none_used:
```

### Gate rule

If a case claims HyperFrames 0.7 catalog-aware workflow but no catalog decision exists:

- Render readiness = yellow.

If catalog is not useful, that is fine. The decision must be explicit.

## Gate 6 — Studio Preview Evidence

### Purpose

HyperFrames should be treated as a studio, not just a renderer.

The Ederson report says the preview monitor was never opened. This must become visible.

### Required artifact

`.framepack/studio-preview.md`

Suggested structure:

```markdown
# Studio Preview Evidence

## Preview command
- command:
- started_at:
- URL:

## Inspection method
- browser / screenshot / snapshot / user live preview / skipped

## Observations
- scene_1:
- scene_2:
- scene_3:

## Changes after preview
- changed:
- reason:

## Waiver
- skipped: true/false
- reason:
```

### Gate rule

If no Studio preview evidence exists before final render:

- Render readiness = yellow/red.
- Agent must say "closed-door render" or "preview skipped", not "Studio workflow complete".

### Practical note

Some environments cannot run browser preview reliably. That is acceptable with evidence:

- preview server failed and logs are recorded;
- fallback snapshots/contact sheet are used;
- user waived live preview.

The gate requires evidence or waiver, not a perfect browser every time.

## Workbench and Case Scaffolding

### Current reality

`F:/Framepack-01-test/WORKBENCH.md` already defines the test root as a workbench, not a single video project:

```text
F:/Framepack-01-test/
├── AGENTS.md
├── WORKBENCH.md
├── .hermes/
├── cases/
├── reports/
└── scratch/
```

It also says new cases should go under `cases/`.

But the current case tree is mixed historical terrain:

```text
Some cases have full HyperFrames project files:
- AGENTS.md
- CLAUDE.md
- hyperframes.json
- package.json
- frame.md
- .hyperframes/expanded-prompt.md
- index.html

Some older/research cases only have:
- frame.md
- expanded-prompt.md
- index.html

Some research folders are not real video cases.
```

So the answer is:

```text
Design target: yes, new Framepack video cases should be scaffolded consistently.
Current reality: no, old cases are inconsistent and must be treated as legacy/migrated/draft unless upgraded.
```

### Workbench root contract

A Framepack test workbench should have:

```text
WORKBENCH.md          -> human map of the workbench
AGENTS.md             -> workbench-level current Framepack rules
CLAUDE.md             -> optional mirror for Claude Code / external harnesses
.hermes/CONTEXT.md    -> current handoff
cases/                -> video cases only
reports/              -> test reports
scratch/              -> temporary experiments
```

`WORKBENCH.md` is not per-video. It is the front-door map for the whole testing studio.

### Case root contract

Every new standard Framepack video case should be created under:

```text
F:/Framepack-01-test/cases/<case-slug>/
```

A standard case should be both a Framepack case and a HyperFrames project:

```text
cases/<case-slug>/
├── AGENTS.md                         -> case-level managed rules
├── CLAUDE.md                         -> optional Claude Code mirror
├── package.json                      -> HyperFrames commands, pinned version
├── hyperframes.json                  -> HyperFrames project registry/composition config
├── frame.md                          -> visual identity
├── .hyperframes/expanded-prompt.md   -> Director Story Bible seed
├── .framepack/                       -> Framepack workflow evidence
│   ├── asset-intake.md
│   ├── director-inspect.md
│   ├── script-lanes.md
│   ├── handoff-manifest.md
│   ├── arsenal.json
│   ├── catalog-decision.md
│   ├── studio-preview.md
│   ├── render-readiness.md
│   └── taste-audit.md
├── assets/
├── index.html or composition entry
├── renders/                          -> mp4 not committed; QA frames may be kept
└── CASE-STUDY.md or TEST-REPORT.md   -> when promoted to reusable evidence
```

### Automatic scaffolding rule

When Framepack starts a new video case inside a workbench, it should not rely on the Agent remembering folder hygiene. It should scaffold the case.

Required behavior:

1. Detect workbench root by `WORKBENCH.md` or `.hermes/CONTEXT.md` plus `cases/`.
2. Create or select `cases/<case-slug>/`.
3. Initialize a HyperFrames project in that case root.
4. Create case-level `AGENTS.md` managed block.
5. Create optional `CLAUDE.md` mirror for Claude Code / external comparison tests.
6. Create `.framepack/` evidence directory.
7. Create `.hyperframes/` directory.
8. Pin HyperFrames version in `package.json` commands.
9. Record the scaffold result in `.framepack/context-sync.md` or `.framepack/case-scaffold.md`.

This should become a deterministic helper, not an LLM memory test.

Possible command/helper:

```text
scripts/framepack_scaffold_case.py --workbench F:/Framepack-01-test --case ederson-manutd-30s --hyperframes 0.7.3
```

### Legacy case policy

Do not pretend old cases follow the new standard. Label them honestly:

```text
standard_case       -> fully scaffolded and current
legacy_case         -> older structure; useful evidence but not current workflow proof
research_case       -> experiment, not a video production sample
renderable_draft    -> can render but lacks workflow evidence
```

A legacy case can be upgraded by running the scaffold/hydration helper, but the helper must preserve existing files and write an upgrade report.

### Why this matters

If each Agent creates a slightly different folder, every test becomes archaeology.

A workbench should feel like a film studio:

```text
WORKBENCH.md = studio map
cases/ = each film room
case AGENTS/CLAUDE = room-specific safety card
.framepack/ = producer clipboard
.hyperframes/ + package.json = camera/editor setup
```

Without this, testing cannot tell whether Framepack failed or the room was never set up.

## Gate 7 — Initialization Context Hydration

### Purpose

Make sure the project and test-case instruction files are not stale.

This is a real test risk, not housekeeping. The test workbench currently has stale context:

```text
F:/Framepack-01-test/AGENTS.md
  version: 0.11.0
  positioning: Prompt Factory for HyperFrames
```

But the active deployed plugin is v0.15.0 and the product positioning is HyperFrames 0.7.3 Director Workbench.

If test projects keep old AGENTS/CLAUDE guidance, every new test starts with a ghost director from four versions ago. The Agent then follows stale rules, and the report measures the wrong workflow.

Analogy:

```text
We renovated the kitchen, but the recipe card on the wall still says where the old stove is.
The cook is not crazy for walking to the wrong stove.
The wall card is stale.
```

### Required artifact

`.framepack/context-sync.md`

Suggested structure:

```markdown
# Framepack Context Sync

## Source of truth
- deployed_plugin: F:/Hermes_windows/plugins/framepack/plugin.yaml
- version: 0.15.0
- guardrails_hash:
- synced_at:

## Files checked
| file | status | detected_version | action |
|---|---|---|---|
| AGENTS.md | stale/synced/missing | 0.11.0 | updated managed block |
| CLAUDE.md | synced/missing | - | no action |
| cases/ederson-manutd-30s/AGENTS.md | stale | 0.14.x | updated managed block |

## Result
- project_context_current: true/false
- stale_files:
- manual_review_needed:
```

### What should be hydrated

Framepack should manage only a bounded block, not overwrite user-owned instructions.

Targets:

```text
project root:
- AGENTS.md
- CLAUDE.md if present

case roots:
- cases/*/AGENTS.md
- cases/*/CLAUDE.md if present

generated HyperFrames project roots:
- my-video/AGENTS.md
- composition/AGENTS.md if present
```

Managed block contents should include:

- Framepack version and guardrails hash.
- Product positioning: HyperFrames 0.7.3 Director Workbench.
- Current workflow spine.
- Required artifacts: asset-intake, script-lanes, arsenal, catalog decision, studio-preview, render-readiness, taste-audit.
- Test-workbench role warning: test instance should report, not silently fix plugin code.

### Gate rule

At session/case startup and before test execution:

- Compare AGENTS/CLAUDE managed block version/hash to deployed plugin guardrails.
- If stale, update managed block automatically or produce a red `context_stale` readiness issue.
- Do not rewrite user-authored content outside the managed block.
- If no managed block exists, append one.

Before a case is labeled a standard Framepack sample:

- `context-sync.md` must say project/case context is current, or the stale files must be explicitly listed as a test limitation.

### Hook integration

Existing Guardrail Hydrator already knows the pattern: plugin `guardrails.md` is source of truth and project `AGENTS.md` gets a managed block.

The hardening work is to extend this from "current project when Framepack is summoned" to "test workbench and case roots that the Agent actually operates inside".

Trigger points:

- Framepack skill load.
- HyperFrames production command in a project/case directory.
- Reading or writing `frame.md`, `.hyperframes/expanded-prompt.md`, `index.html`.
- Test-workbench startup helper.

### Why this belongs in the same design

Workflow gates only work if the Agent is reading the current rulebook.

If `AGENTS.md` says v0.11 Prompt Factory while plugin.yaml says v0.15 Director Workbench, then asset/script/preview/arsenal gates will keep being skipped in tests. This is not a separate docs chore; it is part of the harness.

## Gate 8 — Render Readiness Board

### Purpose

Make all gates visible in one place.

This is the control tower. The user should not have to infer workflow health from scattered hook messages.

### Required artifact

`.framepack/render-readiness.md`

Example:

```markdown
# Render Readiness Board

| Gate | Status | Evidence | Risk |
|---|---|---|---|
| Asset Intake | RED | missing .framepack/asset-intake.md | no asset decision; output likely generic |
| Script Lanes | RED | missing .framepack/script-lanes.md | placeholder-smell risk |
| Story Bible | GREEN | .hyperframes/expanded-prompt.md | - |
| Arsenal Binding | RED | missing .framepack/arsenal.json | weapons not governed |
| Catalog Decision | YELLOW | no decision doc | catalog support unevaluated |
| Studio Preview | RED | no preview evidence | closed-door render |
| Context Sync | RED | root AGENTS.md still says 0.11.0 Prompt Factory | stale test rules can invalidate workflow results |
| HyperFrames Check | GREEN | lint/validate/inspect pass | 35 contrast warnings |
| Taste Audit | YELLOW | audit found placeholder copy | quality risk |

## Overall
- technical_render_ready: yes
- framepack_standard_ready: no
- recommended_label: draft /草模

## User options
1. revise now
2. add assets
3. open Studio preview
4. render anyway as draft
```

### Gate rule

Before final render, Framepack should generate or update this board.

If board is missing:

- Framepack cannot claim readiness.

## Gate 9 — Placeholder-Smell Audit

### Purpose

Catch copy that feels like scaffolding, internal labels, or vibe filler.

The Ederson report proved this class matters.

### Audit examples

High-risk patterns:

```text
ARRIVAL PENDING
LOAD
PUNCH
CALL
MIDFIELD DOSSIER
WELCOME THE ENGINE
WORLD CUP DUTY
```

These words are not always forbidden. The issue is when they replace narrative meaning.

### Proposed signal types

```text
internal_workflow_word  -> LOAD, CALL, PUNCH, HOLD, BLOCK
placeholder_status      -> ARRIVAL PENDING, COMING SOON, TBD
generic_hype            -> UNLEASHED, NEXT LEVEL, GAME CHANGER
unsupported_claim       -> WORLD CLASS, OFFICIAL, CONFIRMED without source
context_mismatch        -> SaaS/business copy in sports/cinematic topic
```

### Gate rule

If no script lane is selected, placeholder-smell audit is mandatory.

If placeholder smell is high:

- Render readiness = yellow/red.
- Audit should suggest replacing placeholders with lane-specific copy.

## Hook integration design

### pre_tool_call

When a user-visible production command is detected:

```text
hyperframes preview
hyperframes render
hyperframes publish
hyperframes cloud
```

Framepack should:

1. Hydrate guardrails.
2. Sync/validate arsenal registry.
3. Evaluate required workflow artifacts.
4. Generate/update render readiness board.
5. Inject concise readiness summary.
6. For render/publish/cloud, include explicit user options.

Important:

- Do not block render by default.
- Do not nag on discovery commands like `--version`, `help`, `init`, registry listing.
- Do not claim failure when user intentionally waived a gate.

### post_tool_call

When files are written:

- `asset-intake.md` -> validate structure.
- `script-lanes.md` -> record selected lane.
- `expanded-prompt.md` -> reconcile Execution Manifest to arsenal.
- `index.html` -> scan declared weapon usage, placeholder smell, root/clip safety.
- preview/browser/snapshot tool evidence -> update studio-preview.

### Why hook gates instead of more skill text

Skill text is a sign on the wall.
Hook gates are a turnstile.

We need both, but the missing part is the turnstile.

## CLI / script support

Add small deterministic commands/scripts before adding more LLM prose.

Possible scripts:

```text
scripts/framepack_readiness.py
scripts/framepack_placeholder_audit.py
scripts/framepack_audio_cues.py
scripts/framepack_catalog_decision.py
scripts/framepack_workflow_doctor.py
```

### `framepack_readiness.py`

Inputs:

- project root
- expected route / video type if known
- HyperFrames check output if available

Outputs:

- `.framepack/render-readiness.md`
- optional JSON summary for hooks/tests

### `framepack_placeholder_audit.py`

Inputs:

- `index.html`
- `.framepack/script-lanes.md`
- `expanded-prompt.md`

Outputs:

- issue list with severity and line refs.

### `framepack_audio_cues.py`

Inputs:

- BGM file or existing cue JSON

Outputs:

- `.framepack/audio-cues.json`

Non-goal for first implementation: build a full beat detector if HyperFrames already has one.

## Data model summary

Recommended `.framepack/` structure:

```text
.framepack/
├── asset-intake.md
├── director-inspect.md
├── script-lanes.md
├── handoff-manifest.md
├── arsenal.json
├── catalog-decision.md
├── audio-cues.json
├── studio-preview.md
├── render-readiness.md
├── taste-audit.md
└── weapons/
```

## Acceptance criteria

A standard Framepack case is not considered complete unless:

0. The case lives under `cases/<case-slug>/` when inside a workbench and has the standard scaffold files or an explicit legacy label.
1. `.framepack/asset-intake.md` exists or has explicit waiver.
2. `.framepack/script-lanes.md` exists with selected lane or waiver.
3. `frame.md` exists.
4. `.hyperframes/expanded-prompt.md` exists.
5. Handoff/Execution Manifest exists.
6. Declared weapons have provenance in `.framepack/arsenal.json` or HANDWRITE waiver.
7. Catalog decision exists, even if decision is "not useful for this case".
8. Studio preview evidence exists or is explicitly waived.
9. Context sync evidence exists and project/case AGENTS/CLAUDE managed blocks are current or explicitly flagged stale.
10. HyperFrames check/lint/inspect evidence exists.
11. Render readiness board exists.
12. Taste audit exists before final render.
13. ffprobe evidence exists after render.

Case labels:

```text
standard_sample      -> all required gates green or intentionally waived
renderable_draft     -> technical render passes but workflow gates missing
technical_smoke      -> only proves structure/render path
failed_workflow      -> cannot honestly claim Framepack process occurred
```

The Ederson case should currently be labeled:

```text
renderable_draft / technical_smoke
not standard_sample
```

## P0 implementation plan candidates

No code yet; this is design-only. But the first implementation slice should be small and hard.

### P0.1 Render Readiness Board

Build the central board first because it exposes all missing gates without requiring every gate to be fully automated.

- Add `core/render_readiness.py`.
- Read known artifacts.
- Emit green/yellow/red summary.
- Hook into pre-render commands.
- Tests: Ederson-like missing artifacts should produce red/yellow board.

### P0.2 Asset + Script Gate Artifacts

- Ensure Director skill creates `.framepack/asset-intake.md` and `.framepack/script-lanes.md` for new cases.
- Add tests that a fuzzy video request path produces those artifacts before HTML handoff.

### P0.3 Arsenal Provenance Gate

- Extend existing arsenal/quality audit to flag declared weapons without provenance.
- Do not require perfect weapon execution yet; require honest accounting.

### P0.4 Studio Preview Evidence Gate

- Add `.framepack/studio-preview.md` format.
- Hook detects preview/browser/snapshot evidence where possible.
- If absent before render, readiness board marks yellow/red.

### P0.5 Initialization Context Hydrator

- Extend Guardrail Hydrator to check/update managed blocks in workbench root and case root AGENTS/CLAUDE files.
- Generate `.framepack/context-sync.md` with source version/hash, checked files, stale files, and action taken.
- Add a regression using `F:/Framepack-01-test`-style stale `AGENTS.md` (`0.11.0 Prompt Factory`) to prove the hydrator flags or updates it.
- Render readiness must include a `Context Sync` row.

### P0.6 Workbench/Case Scaffolder

- Add a deterministic case scaffolder that detects a workbench and creates `cases/<case-slug>/` instead of writing video files into the root.
- New standard cases must get HyperFrames project files (`package.json`, `hyperframes.json`), case `AGENTS.md`, optional `CLAUDE.md`, `.framepack/`, `.hyperframes/`, and pinned commands.
- Add a legacy-case detector so old partial cases are labeled `legacy_case` or `renderable_draft`, not standard samples.
- Add tests using a workbench fixture with stale root `AGENTS.md` and an empty `cases/` directory.

## P1 implementation candidates

- Placeholder-smell audit.
- Tone/rhythm presets as data table.
- Audio cue ledger support.
- Catalog decision helper.
- Deliverable bundle: share-copy, case-study, QA frames.

## P2 implementation candidates

- Real beat analyzer integration.
- Better HyperFrames catalog component discovery.
- Template/weapon promotion after successful renders.
- Cross-case case-study mining.

## What not to do

### Do not add more prose-only iron laws

We already have enough signs on the wall. The failure is not that AGENTS.md lacks warnings. The failure is that missing steps do not become visible enough at execution time.

### Do not make Framepack block all renders

Users must remain able to render drafts. The system should label the result honestly, not become a bureaucrat.

### Do not force catalog use

Some cases do not need official catalog components. But the decision should be explicit.

### Do not ban hand-written animation

Handwriting is allowed for case-specific motion. But if we handwrite, we should call it handwrite, not pretend the weapon library was used.

### Do not copy `/brag`'s narrow asset taste

Borrow its workflow rails and audio cue discipline, not its SaaS-only music/material defaults.

## Communication style to user

Framepack should summarize readiness like a producer, not a compiler:

```text
能渲，但只能叫草模。

绿灯：结构、lint、inspect、ffprobe。
黄灯：没有音乐踩点、catalog 未评估。
红灯：没做素材清单、没选脚本路线、武器没有台账、没开 Studio 预览。

你可以：补料 / 预览一轮 / 继续当草模渲。
```

This is the product tone: direct, useful, not legalistic.

## Final product direction

Framepack should become the harness around creative agents.

```text
Prompt tells the horse where to go.
Skills teach the horse technique.
Hooks and artifacts build the fence.
```

The next version should build the fence.
