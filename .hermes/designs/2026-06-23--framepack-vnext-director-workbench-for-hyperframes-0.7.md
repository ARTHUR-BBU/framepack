# Framepack vNext: Director Workbench for HyperFrames 0.7

Date: 2026-06-23
Status: Product design draft for review

## One-line thesis

Framepack should become the director workbench above HyperFrames 0.7: it turns a user's fuzzy idea into a rich, co-created, asset-aware director brief, routes it into the right HyperFrames workflow, audits quality before render, and turns successful outputs back into reusable templates or weapons.

Short version:

```text
HyperFrames makes the video possible.
Framepack makes the video intentional.
```

## Why this redesign now

HyperFrames 0.7 has grown from a render CLI into an agent-native video production system.

It now has:

- `/hyperframes` as an intent router.
- workflow skills such as product launch, website-to-video, faceless explainer, PR-to-video, captions, overlays, motion graphics, and general video.
- a standard pipeline: `capture → design → script → storyboard → voiceover → build → validate`.
- Studio preview before render.
- catalog blocks/components.
- variables for template reuse.
- local/cloud render surfaces.
- media tools: TTS, transcribe, remove-background, beat detection.

This means Framepack must not duplicate HyperFrames' factory floor.

Framepack's new value is the layer above it:

```text
user idea → richer intent → asset-aware creative direction → workflow handoff → pre-render taste QA → reusable learning
```

## Product metaphor

```text
Framepack = director + producer + taste inspector
HyperFrames = studio + camera crew + editor + render farm
HyperFrames catalog = official prop warehouse
Framepack arsenal = dynamic user-expandable prop warehouse
Studio = screening room before final export
```

Framepack should not fight HyperFrames for the camera. It should decide what movie we are making, what materials are missing, what style we are chasing, and whether the cut is ready to render.

## Core product spine

```text
1. User idea
   ↓
2. Framepack Intent Router
   ↓
3. Asset Intake + Co-creation Questions
   ↓
4. frame.md / Director Taste Card
   ↓
5. expanded-prompt.md / Director Story Bible
   ↓
6. User confirms or revises
   ↓
7. Handoff Manifest
   ↓
8. HyperFrames official workflow
   ↓
9. Studio preview
   ↓
10. Framepack Pre-render Taste Audit
   ↓
11. User decides: revise / add assets / render anyway
   ↓
12. HyperFrames render
   ↓
13. Post-render QA + reusable asset/template/weapon harvest
```

## Non-negotiable principle

Framepack must advise, not block.

Before render, Framepack can say:

```text
This still feels template-like.
The logo is missing.
The old props remain.
The storyboard lost the user's confirmed metaphor.
The video would improve if you add product screenshots or BGM.
```

But the final decision belongs to the user.

Framepack has no right to terminate or forbid render. It can mark risks and offer fixes; the user chooses whether to continue.

## Stage 1 — Intent Router

### Purpose

Framepack starts by deciding what kind of video task this is and which HyperFrames workflow knows the back kitchen best.

This is not a dumb classifier. It is a front desk that knows the chefs.

### Routes

```text
product / launch / SaaS promo       → /product-launch-video
website / portfolio / homepage tour → /website-to-video
topic / article / notes explainer   → /faceless-explainer
GitHub PR / code change             → /pr-to-video
existing talking-head + subtitles   → /embedded-captions
existing talking-head + graphics    → /graphic-overlays
short motion-first piece            → /motion-graphics
custom / longer / unclear           → /general-video
Remotion migration                  → /remotion-to-hyperframes
NOEMA-style reuse                   → template reuse path
reference video / dynamic webpage   → reference mining / template extraction path
```

### Router output

The router should produce a small routing card:

```json
{
  "workflow": "product-launch-video",
  "confidence": "high",
  "reason": "user wants a product promo from a product URL",
  "framepack_role": "creative expansion, asset intake, taste QA",
  "hyperframes_role": "capture, build, validate, studio, render",
  "questions_to_user": ["Do you have logo/screenshots/BGM?"],
  "likely_assets_needed": ["logo", "product screenshots", "brand colors"],
  "handoff_risks": ["without screenshots, result may become generic SaaS visuals"]
}
```

## Stage 2 — Asset Intake is mandatory

### Why

Some videos cannot become great with words alone.

A product launch without product screenshots is like filming a cooking show without food.

Framepack must ask for assets during co-creation, before the brief hardens.

### Asset classes to request

Ask for relevant assets based on route:

```text
brand assets:
- logo
- brand color palette
- typography
- existing DESIGN.md / brand guide
- mood board
- reference screenshots

media assets:
- product screenshots
- app recordings
- source videos
- talking-head footage
- BGM / sound logo
- voiceover preference
- captions / transcript

creative/technical assets:
- user's own HTML / landing page / dynamic webpage
- animation code
- GSAP/anime.js/Three.js examples
- existing HyperFrames composition
- reference video URL or file
- prior rendered video user likes

proof assets:
- metrics
- testimonials
- customer logos
- PR link
- case study material
- dataset / CSV
```

### Intake behavior

Framepack should not ask for everything every time.

It should say:

```text
This can be done without assets, but it will be more generic.
If you have any of these, upload/provide them now: logo, product screenshots, BGM, brand colors, reference video.
```

The user can choose:

```text
A. I have assets, use them.
B. I don't have assets, generate programmatic visuals.
C. Continue now, I'll add assets later.
```

## Stage 3 — Co-created Director Story Bible

### Positioning

The old `expanded-prompt.md` should not be removed.

It should become the central Framepack artifact:

```text
expanded-prompt.md = Director Story Bible
```

HyperFrames `STORYBOARD.md` is often too short and execution-oriented. It is useful, but it is not enough for user thinking, creative exploration, or taste alignment.

### Difference from HyperFrames STORYBOARD.md

```text
Framepack expanded-prompt.md:
- why this video should feel this way
- user-readable creative choices
- visual metaphors
- emotional rhythm
- scene intent
- optional directions
- asset needs
- catalog/weapon suggestions
- QA red lines

HyperFrames STORYBOARD.md:
- concrete beat execution
- composition files
- time windows
- assets to use
- animation implementation
```

Analogy:

```text
expanded-prompt.md = director's creative meeting notes
STORYBOARD.md = production team's shot list
```

### User interaction

Framepack must show a concise digest before handoff:

```text
Style: brutalist / poetic / high-energy / soft editorial
Rhythm: hook → proof → build → payoff
Scenes: 6-10 short one-line beats
Core metaphor: ...
Assets needed: ...
Risk if missing: ...
Choices: A/B/C
```

Then ask for confirmation or changes.

User should be able to say:

```text
more premium
less startup-ish
make it darker
use my BGM
replace the metaphor
shorter and punchier
keep this scene, remove that scene
```

## Stage 4 — Handoff Manifest

### Purpose

The Handoff Manifest is the bridge into HyperFrames.

It tells HyperFrames what to do without forcing Framepack to reimplement HyperFrames.

### Contents

```yaml
workflow: product-launch-video
source_inputs:
  url: ...
  assets: ...
creative_constraints:
  tone: ...
  metaphor: ...
  rhythm: ...
  forbidden: ...
hyperframes_pipeline_hints:
  capture: true
  voiceover: optional
  studio_preview_required: true
catalog_candidates:
  - caption-kinetic-slam
  - code-diff
  - shimmer-sweep
framepack_arsenal_candidates:
  - local-custom-template-x
  - user-reference-motion-y
qa_redlines:
  - no text-only reuse
  - no stale source-domain props
  - no remote random image providers
  - must preserve user-confirmed metaphor
user_decision_points:
  - after Director Story Bible
  - after Studio preview
  - before render
```

## Stage 5 — Dual weapon system

### Official HyperFrames catalog

HyperFrames catalog is the official warehouse.

Strengths:

```text
stable
standardized
well integrated
already renderable
good for common blocks/components
```

Weakness:

```text
not dynamic enough for every user's taste, reference, or private workflow
updates on official schedule
```

### Framepack dynamic arsenal

Framepack arsenal should be user-expandable and project-expandable.

It should support:

```text
satisfied rendered video → reusable template
reference video → motion DNA / template candidate
dynamic webpage → extractable animation pattern
user HTML/JS → custom weapon
anime.js / GSAP / Three.js / Lottie examples → runtime weapon
brand-specific scene pack → private template
```

### Arsenal lifecycle

```text
find → ingest → normalize → register → hash → tag → use → audit → archive/promote
```

Framepack should know both warehouses:

```text
official_catalog + project_arsenal + user_arsenal
```

The goal is not just to make one video. The goal is to turn good work into repeatable taste.

## Stage 6 — Pre-render Taste Audit

### Positioning

This is the user's second key correction and must be built into the product.

Framepack audit must happen before render, during/after Studio preview.

HyperFrames already does:

```text
lint
validate
inspect
snapshot
Studio preview
```

Framepack adds taste/product audit:

```text
Does this still match the confirmed Director Story Bible?
Does it feel deep enough?
Did it only change words but not props?
Are important assets missing?
Are old-domain visuals still present?
Is the catalog/component choice too generic?
Does the rhythm match the user's intent?
Should we ask for more material before rendering?
```

### Audit severity

Use advisory levels, not blockers:

```text
P0 advisory: likely fails user's stated goal
P1 advisory: major quality/taste mismatch
P2 advisory: improvement opportunity
P3 advisory: polish/nice-to-have
```

But never block render.

Report format:

```text
Pre-render Framepack Audit

Verdict: READY / WARN / NEEDS USER DECISION

What works:
- ...

What feels undercooked:
- ...

Suggested fixes before render:
- ...

Optional assets that would improve it:
- ...

User choices:
A. revise now
B. add assets
C. render anyway
```

### Why before render

After render is expensive and psychologically late.

Pre-render audit is like tasting soup before serving it. Post-render audit is the restaurant review after the customer has eaten.

Both matter, but they do different jobs.

## Stage 7 — Post-render Summary Audit

After render, Framepack can still produce a summary:

```text
what was produced
what passed technically
what compromises remained
what could become a template/weapon
what should be improved next time
```

But this is not the main correction point.

The main correction point is pre-render.

## Artifact mapping

| Framepack | HyperFrames | Relationship |
|---|---|---|
| asset-intake.md | capture/ | Framepack asks and classifies; HyperFrames captures/processes |
| frame.md | DESIGN.md | frame.md = taste/field; DESIGN.md = brand facts |
| expanded-prompt.md | STORYBOARD.md | expanded = director bible; storyboard = production shot list |
| Handoff Manifest | workflow skill | Framepack routes and constrains official workflow |
| arsenal.json | catalog/add | Framepack chooses and tracks; HyperFrames installs/wires |
| Pre-render Audit | Studio preview | Framepack taste layer around Studio review |
| Post-render QA | render/ffprobe/snapshots | final proof and reusable harvest |

## MVP proposal

Do not rewrite everything.

Build the smallest product slice:

### MVP 1 — Intent Router + Asset Intake + Handoff Manifest

- detect likely HyperFrames workflow
- ask route-specific asset questions
- generate Director Story Bible digest
- produce Handoff Manifest

### MVP 2 — Pre-render Taste Audit

- compare Studio/current project against expanded-prompt.md
- advise, never block
- offer user choices

### MVP 3 — Catalog-aware arsenal

- query/capture HyperFrames catalog metadata
- recommend official catalog blocks/components
- register selected items into Framepack arsenal

### MVP 4 — Dynamic template/weapon harvest

- turn successful outputs into template candidates
- turn reference videos/pages into reusable patterns
- support user-supplied animation code and newer runtimes such as anime.js

## Open design questions

1. Should Framepack keep the filename `expanded-prompt.md`, or rename the user-facing title to `Director Story Bible` while keeping path compatibility?
2. Should Handoff Manifest be YAML, JSON, or a section at the end of expanded-prompt.md?
3. How much of HyperFrames `DESIGN.md` should Framepack generate directly vs let HyperFrames derive from capture?
4. Should Pre-render Audit run automatically after `preview`, after `snapshot`, or after a user says "looks okay"?
5. How should Framepack store user-level private arsenal separate from project arsenal?
6. How should user-imported templates be quality-gated before becoming reusable?

## Recommended product decision

Keep expanded-prompt.md.

Do not shrink it. Upgrade it.

Framepack's moat is not that it can produce a valid HyperFrames file. HyperFrames can increasingly do that itself.

Framepack's moat is that it can help a human think, choose, refine, and preserve taste before engineering begins.

The new product promise:

```text
Framepack helps users turn fuzzy intent into a confirmed director-grade brief, then guides HyperFrames to produce it without losing the soul.
```
