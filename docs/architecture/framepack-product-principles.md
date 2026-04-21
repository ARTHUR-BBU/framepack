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

Framepack takes content inputs such as:

- Markdown
- PRDs
- case materials
- websites

And produces a video project package containing:

- brief
- scene plan
- script
- storyboard
- asset plan
- guardrails
- validation reports
- runtime entry files

### What Framepack is not

Framepack is not:

- a drag-and-drop video editor
- a thin wrapper around one render command
- a replacement for the rendering runtime

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
