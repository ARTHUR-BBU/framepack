# Framepack Product Principles

## Summary

Framepack is a video project compiler.

Its job is to turn content inputs into executable video projects.

It is not a traditional video editor, and it is not identical to HyperFrames itself.

## Product Definition

### What Framepack is

Framepack is:

- a compiler for video engineering projects
- a packaging system for reusable video work
- a planning and validation layer above a rendering runtime
- an execution-oriented middleware layer between content sources and final video rendering
- an agent-installable video workflow system that can grow through MCP tools, skills, workflow packs, creative direction packs, connectors, and community templates

Framepack takes content inputs such as:

- Markdown
- PRDs
- case materials
- websites
- product, course, or brand descriptions for lightweight game-ad packages

And produces a video project package containing:

- brief
- scene plan
- script
- storyboard
- asset plan
- asset execution plan
- guardrails
- validation reports
- runtime entry files

### What Framepack outputs

Framepack outputs a project package for agents and runtimes to continue executing.

That package is not usually the final human-facing video asset.

It is the production-ready intermediate that contains:

- the source inputs
- the planned dish, meaning what video should be made
- the preparation notes, meaning how to make it
- the ingredient list, meaning what assets exist and what assets are still missing
- the execution contract for materializing captures, text cards, or forge-produced assets
- the runtime entry points needed for HyperFrames to finish preview and render work

The intended execution chain is:

- content source into Framepack
- Framepack project package into an agent workflow
- optional asset forge backend into materialized 2D assets
- agent workflow into HyperFrames runtime execution
- HyperFrames runtime into preview and final video output

Framepack should therefore be described as a high-value video production middleware layer, not as a final renderer.

## Asset Forge Relationship

Framepack owns the asset requirement and execution contract, not image generation itself.

The package protocol can describe forge tasks in `ASSET_EXECUTION_PLAN.json` using execution kinds such as:

- `forge-sprite-sheet`
- `forge-map-pack`
- `forge-fx-pack`
- `forge-prop-pack`
- `forge-character-pack`

These tasks are backend-neutral. A task may recommend `agent-sprite-forge` and a skill such as `$generate2dsprite` or `$generate2dmap`, but those values are guidance, not a hard dependency. Manual producers and custom tools must be able to satisfy the same task contract.

Framepack should not silently install forge backends or call image generation models. It should generate prompts, expected outputs, scene linkage, output paths, and acceptance criteria so an agent or external producer can continue the work.

Asset execution status is part of the package protocol. Execution items can be `pending`, `available`, `failed`, `skipped`, or `external`; `sync-assets` should preserve producer-reported metadata status instead of reducing every result to available or pending. For forge metadata, `available` and `external` require an `outputs` array of package-relative paths so the package can verify the declared files exist.

## Agent Platform And Ecosystem

Framepack's product direction is broader than a CLI. It should become an agent-facing workflow platform:

- Core compiler: source ingest, package protocol, validation, and runtime bridge.
- MCP server: stable tools, resources, and prompts for agent platforms.
- Skills: reusable playbooks that teach agents how to run video production workflows.
- Workflow packs: installable task packages for product explainers, thread videos, website videos, game ads, course promos, launch reviews, and investor updates.
- Connectors: content sources, asset forge backends, render systems, publishing systems, and third-party integrations.
- Community registry: examples, templates, style packs, connector packs, and best-practice packages contributed by users and builders.

The guiding benchmark is not "can a user run a command?" but "can an agent install the workflow, understand the task, call the right tools, continue from package state, and produce a video project that is useful to humans?"

## Creative Direction Layer

Framepack needs an explicit creative direction layer. Protocol correctness is necessary but not sufficient.

This layer should capture:

- design taste: typography, hierarchy, layout density, visual language, and brand fit
- animation taste: motion vocabulary, transitions, rhythm, camera movement, and timing
- narrative taste: hook, pacing, information reveal, emotional arc, and ending
- template selection: which composition or template pack fits the source and audience
- asset style: how generated, captured, manual, or existing assets should look together
- acceptance criteria: not only "files exist" but "the result is visually coherent and motion-aware"

Creative direction should be encoded as structured package guidance where possible, and as workflow-pack playbooks where taste is still subjective. Framepack should leave room for designers, motion specialists, hobbyists, and third-party communities to contribute template packs, motion presets, and best-practice examples.

## Template And Community Ecosystem

Templates are first-class product assets, not incidental examples.

A future Framepack template pack should be able to include:

- composition templates
- scene layouts
- motion presets
- typography and color tokens
- asset slots and fallback rules
- creative acceptance checklists
- example packages and screenshots

Community participation is part of the product logic. Framepack should make it possible for:

- motion designers to contribute template packs
- agent builders to contribute workflow packs and skills
- asset tool builders to contribute forge adapters
- product teams to share example packages
- communities to encode design and animation best practices

### What Framepack is not

Framepack is not:

- a drag-and-drop video editor
- a thin wrapper around one render command
- a replacement for the rendering runtime
- a low-value format conversion shim

## Input Positioning

### Why websites are mentioned explicitly

Websites are not the only supported or intended input.

They are called out because they are an important future source type and because the official HyperFrames ecosystem already demonstrates website-to-video workflows.

The correct long-term framing is:

**Framepack turns content into executable video projects.**

That content may include:

- docs
- websites
- PRDs
- case materials
- product, course, or brand descriptions

Default external positioning:

- English: `Turn content into executable video projects.`
- Product shorthand: `Build executable video projects from content.`

## HyperFrames Relationship

### Current state

Framepack does not currently provide deep HyperFrames runtime integration.

Today it produces HyperFrames-ready engineering output, but it does not yet depend on or execute the official HyperFrames runtime as part of the required workflow.

Current scope:

- planning
- validation
- package generation
- runtime-ready entry generation

Not yet in scope:

- runtime version detection
- capability detection
- registry or catalog integration
- preview, validate, and render execution through official HyperFrames
- production-grade multi-composition runtime orchestration

### Long-term relationship

HyperFrames is the first runtime backend for Framepack.

It is not the whole product.

The stable ownership split is:

- Framepack owns ingest, planning, packaging, validation, and project structure
- HyperFrames owns rendering runtime behavior

### Practical mental model

The most accurate practical mental model is:

- raw ingredients: websites, threads, Markdown, PRDs, case materials, product descriptions
- prep and dish plan: Framepack
- kitchen equipment: HyperFrames runtime
- cook: the agent
- finished dish: the rendered video

Framepack is the layer that gets the work to the point where the kitchen can start.

It is not a thin middleware layer because it performs high-value production judgments:

- what should be explained
- how the material should be decomposed into scenes
- which source units should become assets
- which assets support which scenes, expressed through `SCENE_ASSET_MAP.json`
- which asset execution tasks can be performed by capture, text-card composition, manual production, or an optional asset forge backend
- what is still missing before rendering can finish
- what the next agent step should be

## Animation And Runtime Capabilities

HyperFrames supports advanced runtime and composition techniques such as:

- GSAP
- Lottie
- shaders
- Three.js
- footage compositing
- captions
- SFX

Framepack should acknowledge these capabilities at the architecture level, but it should not design around detailed animation implementation in Phase 1.

### Phase 1 rule

Phase 1 must:

- preserve room for advanced runtime features
- support root composition plus sub-composition package structure
- avoid locking the planning layer to a single-file output model

Phase 1 must not:

- implement an animation system
- model detailed runtime-specific motion primitives in planning
- treat advanced composition techniques as a planning concern

The planning layer should stay runtime-agnostic.

## Installation And Execution Model

### Current model

In the current phase, users do not need HyperFrames installed in order to use Framepack's core compiler workflow.

They can:

- generate a project package
- inspect and edit project artifacts
- continue work through Codex or Claude Code

They cannot yet assume that Framepack will execute official HyperFrames render flows on their machine.

### Long-term model

The preferred long-term runtime model is:

**environment detection + install guidance + optional bootstrap**

That means:

- Framepack detects whether HyperFrames is installed
- Framepack reports missing runtime dependencies clearly
- Framepack can provide bootstrap commands or guided installation
- Framepack may automate installation only through an explicit, visible workflow

Framepack should not rely on opaque, silent runtime installation.

Framepack should also not assume that Claude Code alone will always solve environment setup reliably.

## Phase Boundaries

### Phase 1

Framepack is a compiler and project-packaging system.

Primary outputs:

- engineering package skeleton
- planning artifacts
- validation artifacts
- runtime-ready structure

HyperFrames installation is not required.

### Phase 2

Framepack adds real HyperFrames runtime integration.

Primary additions:

- runtime adapter
- version detection
- capability detection
- preview, validate, and render command execution
- install guidance and bootstrap path

### Phase 3

Framepack adds new source compilers such as website ingestion.

Primary additions:

- URL input route
- collected website artifacts
- asset capture planning
- source manifest expansion

## Decision Rules

When architecture decisions are unclear, use these defaults:

1. Prefer compiler boundaries over runtime-specific shortcuts.
2. Prefer content-level inputs over format-specific assumptions.
3. Prefer explicit package artifacts over hidden internal state.
4. Prefer install detection and guidance over silent dependency installation.
5. Keep advanced animation concerns in runtime and composition layers, not in planning.
