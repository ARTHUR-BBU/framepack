# Framepack Creative Harness v0.4 Beta.2

Design ID: `CREATIVE-HARNESS-BETA2-15`

Date: 2026-05-25

Status: strategic design for `0.4.0-beta.2`

## Purpose

Framepack 0.4 beta proved that the package protocol, MCP surface, runtime commands, workflow packs, capability atlas, and agent onboarding can form an agent-native video production harness. The first real user test also exposed a decisive gap: a valid package is not enough if the generated HyperFrames composition is visually empty, narratively flat, or indistinguishable from a generic slide deck.

This document defines the beta.2 strategic correction:

- Scheme B is the immediate beta.2 implementation scope: a minimal Creative Harness that fixes the visible value gap.
- Scheme C is the long-term target: a full creative system with multiple proposers, design systems, animation recipes, template packs, quality scoring, asset integration, and community extension.
- The current Framepack structure should not be thrown away, but it must be surgically upgraded at the planning-to-composition center.

In plain terms: Framepack must stop producing only plans and empty scaffolds. It must produce a package that already feels directed, designed, animated, and worth handing to HyperFrames.

## Strategic Position

Framepack is not a closed-track video app.

Framepack is a domain harness layered on top of general-purpose coding-agent harnesses such as Codex and Claude Code. Codex or Claude Code remains the broad brain. Framepack provides the specialized video-production field: what to initialize, what to propose, what to verify, what to persist, and how to hand off to HyperFrames.

The correct architecture is therefore not:

```text
input -> fixed workflow -> output
```

It is:

```text
input -> creative field initialization -> proposal -> verification -> package memory -> HyperFrames execution
```

The package should read like the work of a producer, writer, designer, choreographer, and technical director collaborating through structured artifacts.

## Why Not Throw Everything Away

The existing Framepack package protocol is not the failure point.

The following structures are valuable and should stay:

- `SOURCE_MANIFEST.json`
- `VIDEO_BRIEF.json`
- `SCENE_PLAN.json`
- `ASSET_PLAN.json`
- `ASSET_EXECUTION_PLAN.json`
- `SCENE_ASSET_MAP.json`
- `SOURCE_SCENE_MAP.json`
- `CAPABILITY_GRAPH.json`
- `RUNTIME_MANIFEST.json`
- `HANDOFF.md`
- MCP discovery and package lifecycle commands
- HyperFrames runtime commands

These files are agent-friendly memory and coordination surfaces. They make a video project recoverable, inspectable, repairable, and assignable across agents.

The failure is that the current pipeline treats these files as the main product, while the user judges the result through the composition and rendered video. The pipeline needs a creative decision layer between planning and rendering.

## Why Not Patch The Old Flow Blindly

Simply adding text or images into the current `index.html` emitter would fix the black-screen symptom but would not solve the product problem.

That approach would keep Framepack trapped in the old mental model:

```text
source -> scene plan -> thin HTML scaffold
```

It would still lack:

- a commercial intent model
- narrative arc
- emotional energy
- motion strategy
- scene treatment
- visual hierarchy
- proposal rationale
- quality verification
- a path to multiple creative systems

Beta.2 must fix black screen, but it must do so by opening the architectural path to Scheme C.

## Core Architecture

The Creative Harness introduces a three-part kernel:

```text
Initializer -> Proposer -> Verifier
```

This kernel is inserted between source planning and HyperFrames composition.

```text
content source
  -> SourceBundle
  -> VIDEO_BRIEF.json
  -> Initializer
  -> CREATIVE_BRIEF.json
  -> Proposer
  -> NARRATIVE_ARC.json
  -> VISUAL_DIRECTION.json
  -> MOTION_PLAN.json
  -> enriched SCENE_PLAN.json
  -> HyperFrames composition
  -> Verifier
  -> QUALITY_REPORT.json
  -> validate/status/runtime evidence
```

Beta.2 can run this once inside `generate`. Future versions can expose it as an iterative loop.

## Initializer

The Initializer turns raw source and route context into a creative field.

It should answer:

- What is being promoted or explained?
- Who is the audience?
- What business outcome matters?
- What emotional energy should the video carry?
- What narrative pattern fits the source?
- What visual and motion seeds are implied by the route?
- What constraints must the composition respect?

### Beta.2 Output

Create `CREATIVE_BRIEF.json`.

Minimum fields:

```json
{
  "version": "framepack.creative-brief.v1",
  "sourceType": "thread",
  "outputType": "case-explainer",
  "goal": "Promote Agent-Native Video Sprint",
  "audience": "Founders",
  "commercialIntent": "conversion",
  "contentType": "course-promo",
  "emotionalEnergy": ["urgent", "credible", "forward-moving"],
  "narrativePattern": "hook-problem-solution-proof-cta",
  "visualSeeds": ["high-contrast cards", "kinetic captions", "proof panels"],
  "motionSeeds": ["title reveal", "contrast cut", "stack build", "cta punch"],
  "constraints": ["no empty scenes", "text readable at 1080p", "fallback visual content required"]
}
```

Beta.2 can produce this deterministically from source type, goal, audience, workflow pack, creative direction pack, and scene purposes.

### Long-Term Scheme C

The Initializer becomes a richer intent-resolution and field-generation layer:

- brand extraction
- audience psychology
- creative risk level
- platform format fit
- style references
- competitive category
- campaign objective
- reusable creative memory

## Proposer

The Proposer is the creative engine. It should not merely map scenes to sections. It should propose how the video feels, moves, persuades, and resolves.

It should produce:

- narrative arc
- scene treatments
- visual direction
- motion plan
- improved script
- improved storyboard
- composition-ready layout and asset slots
- rationale for why each scene exists

### Beta.2 Outputs

Create `NARRATIVE_ARC.json`.

Minimum fields:

```json
{
  "version": "framepack.narrative-arc.v1",
  "pattern": "hook-problem-solution-proof-cta",
  "beats": [
    {
      "sceneId": "scene-1",
      "role": "hook",
      "intent": "Create immediate recognition and promise.",
      "tension": "Teams need video but production is fragmented.",
      "release": "A focused sprint gives them a path."
    }
  ]
}
```

Create `VISUAL_DIRECTION.json`.

Minimum fields:

```json
{
  "version": "framepack.visual-direction.v1",
  "style": "clean-saas-explainer",
  "paletteIntent": "credible dark base with high-energy accent",
  "typographyIntent": "large hook, compact proof text, strong CTA",
  "sceneTreatments": [
    {
      "sceneId": "scene-1",
      "treatment": "hero-hook",
      "layout": "centered title with kinetic subtitle and accent band",
      "visualHierarchy": ["title", "promise", "source badge"]
    }
  ]
}
```

Create `MOTION_PLAN.json`.

Minimum fields:

```json
{
  "version": "framepack.motion-plan.v1",
  "motionLanguage": "controlled kinetic explainer",
  "beats": [
    {
      "sceneId": "scene-1",
      "entry": "title reveal",
      "hold": "slow push with accent shimmer",
      "exit": "fast fade to problem contrast",
      "intensity": "medium"
    }
  ]
}
```

Upgrade existing files:

- `SCENE_PLAN.json`: scene text must be purpose-specific and not dominated by source headings.
- `SCRIPT.md`: voiceover must read as a video script, not `goal - body`.
- `STORYBOARD.md`: motion notes must vary by scene purpose.
- `index.html`: sections must contain visible designed content and fallback content before asset capture.

### Long-Term Scheme C

The Proposer becomes pluggable:

- deterministic proposer
- LLM-assisted proposer
- designer-pack proposer
- game-ad proposer
- launch-film proposer
- social-short proposer
- investor-update proposer
- community proposer packs

Each proposer can compete, explain tradeoffs, and be verified before handoff.

## Verifier

The Verifier ensures the package is not merely valid, but meaningfully usable.

Protocol validation asks:

```text
Are the required files present and structurally valid?
```

Creative verification asks:

```text
Does this package contain enough creative, visual, motion, and handoff substance to justify continuing?
```

### Beta.2 Output

Create `QUALITY_REPORT.json`.

Minimum fields:

```json
{
  "version": "framepack.quality-report.v1",
  "status": "passed",
  "checks": [
    {
      "id": "composition-visible-content",
      "status": "passed",
      "summary": "Every section contains visible fallback content."
    },
    {
      "id": "script-not-mechanical",
      "status": "passed",
      "summary": "Voiceover lines are purpose-specific."
    }
  ],
  "findings": [],
  "revisionHints": []
}
```

Beta.2 checks should include:

- no empty `<section>` scenes
- visible text fallback in every scene
- no all-scenes-identical motion notes
- no repeated on-screen text across most scenes
- no isolated Markdown headings as scene content
- script is not a repeated `goal - body` template
- thread route can produce non-black renderable content

### Long-Term Scheme C

The Verifier becomes a quality gate:

- visual inspect scoring
- snapshot evidence scoring
- brand consistency
- typography readability
- rhythm and pacing
- scene variety
- CTA clarity
- asset completeness
- accessibility
- platform fit
- creative risk calibration

## Package Protocol Impact

Beta.2 should add creative artifacts without breaking protocol v1.

Recommended additions to `PACKAGE_MANIFEST.json.artifacts.planning` or a new compatible group:

```json
{
  "creative": [
    "CREATIVE_BRIEF.json",
    "NARRATIVE_ARC.json",
    "VISUAL_DIRECTION.json",
    "MOTION_PLAN.json",
    "QUALITY_REPORT.json"
  ]
}
```

If adding a new artifact group creates too much compatibility risk, beta.2 can place these files under planning and document them as optional protocol extensions. The important rule is that agents must be able to discover them from `PACKAGE_MANIFEST.json`.

Do not remove or rename existing protocol files in beta.2.

## Composition Architecture

The current HyperFrames adapter should not become a dumping ground for all creative logic.

Beta.2 should introduce a boundary:

```text
Creative Harness artifacts -> Composition Model -> HyperFrames HTML emitter
```

Recommended internal concepts:

- `SceneTreatment`
- `MotionRecipe`
- `VisualTemplate`
- `CompositionProposal`

Beta.2 can implement only one default template family, but the interfaces should not assume a single permanent style.

The emitter should only translate a proposal into HTML/CSS/runtime data. It should not decide the entire commercial narrative.

## Handling Existing Bugs Within The Creative Harness Strategy

The first test reported concrete blockers. They should be fixed as part of beta.2, but each fix should serve the Creative Harness direction.

### Runtime Path Spaces

Fix Windows paths with spaces in HyperFrames discovery and execution.

Strategic reason: the harness cannot be trusted if the runtime body disappears in ordinary Windows project paths.

### Repair Broken Asset Execution Plan

Allow `repair` to rebuild a malformed `ASSET_EXECUTION_PLAN.json`.

Strategic reason: package memory must be recoverable. A harness that cannot self-repair its execution plan cannot support real agent work.

### Thread Markdown Parsing

Treat Markdown headings plus following paragraphs as logical units.

Strategic reason: Initializer needs clean semantic material. If headings become fake posts, the creative field is poisoned.

### Empty Composition

Generate visible, styled, renderable sections.

Strategic reason: this is the user-facing proof that Framepack is more than a plan generator.

### Weak Script And Storyboard

Use purpose-specific templates and narrative beats.

Strategic reason: the package should feel like a director handoff. The user should be able to imagine the video before it renders.

## Beta.2 Scope

Beta.2 must include:

- `CREATIVE_BRIEF.json`
- `NARRATIVE_ARC.json`
- `VISUAL_DIRECTION.json`
- `MOTION_PLAN.json`
- `QUALITY_REPORT.json`
- non-empty HyperFrames composition sections
- visible fallback text in every generated scene
- purpose-specific scene treatments for thread route
- improved thread parsing for Markdown-like input
- improved script generation for standard narrative route
- improved storyboard motion notes
- repair recovery for malformed `ASSET_EXECUTION_PLAN.json`
- Windows path-space runtime fix
- tests proving the above

Beta.2 should not include:

- full community template registry
- automatic external skill installation
- full user video clip import workflow
- `framepack add-asset`
- hosted model integrations
- multi-proposer competition
- complete quality scoring
- visual marketplace

## Scheme C Target

Scheme C remains the real target.

The full target is a Creative Harness ecosystem:

```text
Initializer
  -> multiple Proposers
  -> proposal comparison
  -> Verifier scoring
  -> revision loop
  -> asset forge routing
  -> template pack selection
  -> motion recipe registry
  -> visual QA
  -> HyperFrames render
  -> feedback memory
```

Long-term components:

- creative direction pack registry
- template pack registry
- animation recipe registry
- programmatic animation atlas integration
- asset forge backend routing
- user asset ingestion
- video clip composition support
- quality scoring and gates
- snapshot-based visual review
- agent revision prompts
- community contribution format
- pack recommendation based on business goal and audience

Beta.2 should be implemented so these are natural extensions, not rewrites.

## Strategic Constraints

To avoid being welded into the old structure:

1. Do not make `SCENE_PLAN.json` the only creative source of truth.
2. Do not put all creative logic inside the HyperFrames HTML emitter.
3. Do not treat validation as only protocol validation.
4. Do not make workflow packs merely descriptive text; they must inform proposals.
5. Do not make creative direction packs optional decoration; they must affect scene treatment.
6. Do not claim visual readiness without runtime inspect or snapshot evidence.
7. Do not hide creative artifacts from `PACKAGE_MANIFEST.json`.

## Acceptance Criteria For Beta.2

Beta.2 is acceptable only if the real Route 1 thread test improves visibly.

Required evidence:

- `generate` creates the Creative Harness artifacts.
- `index.html` contains non-empty sections.
- `index.html` includes visible text and styled fallback content.
- `SCRIPT.md` reads as a coherent promotional video script.
- `STORYBOARD.md` includes differentiated motion notes.
- `SCENE_PLAN.json` does not use Markdown headings as standalone scene content.
- `QUALITY_REPORT.json` reports creative checks.
- `validate` and `status` surface quality-related findings or readiness implications.
- `runtime doctor` works in a path containing spaces.
- `repair` can recover a malformed `ASSET_EXECUTION_PLAN.json`.
- render output is not black because of empty composition.

The subjective bar:

> A user should be able to read the script and storyboard and imagine how the video will move. A user should be able to open the composition and see a directed visual draft, not a technical placeholder.

## Implementation Stance

This is not a rewrite.

This is also not a patch.

It is a central-layer surgery:

```text
keep the package skeleton
insert a Creative Harness kernel
route composition through proposal artifacts
verify expressive quality before claiming readiness
```

The existing package protocol remains the skeleton. The Creative Harness becomes the specialized nervous system and creative muscle. HyperFrames remains the rendering body.

## Plain-Language Summary

Framepack already has a strong engineering skeleton, but the first real beta test showed that users judge the product by the video project they can see. Beta.2 must therefore do more than fix black screens. It must add a minimal creative brain: initialize the creative intent, propose a real narrative and motion plan, and verify that the generated package has visible, directed, useful content. The long-term goal is still the full creative system, but beta.2 should be the first version where a user can feel that Framepack makes the video better, not just more structured.
