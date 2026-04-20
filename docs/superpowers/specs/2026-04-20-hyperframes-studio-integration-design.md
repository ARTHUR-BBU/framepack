# HyperFrames Studio Integration Design

## Goal

Define how our AI Studio integrates HyperFrames as the video rendering backend for a flywheel-driven content production system.

## Product Definition

This project is a software product.

Its core differentiation is a workflow engine that turns domain workflows into executable project systems.

Its current strongest delivery form is a Codex/Claude Code-friendly project package that agents can continue to operate on after generation.

In this system:

- The software product is the outer shell.
- The workflow engine is the core.
- The executable project package is the delivery format.

## Problem

We need a stable way to turn business materials, case documents, and structured inputs into videos that are:

- renderable
- editable by agents
- repeatable
- governed by our flywheel logic

HyperFrames already solves HTML-to-video rendering well, but it should not become the owner of business logic, planning, or workflow governance.

## Decision

Use HyperFrames as the rendering backend inside Studio, not as the primary business layer.

Studio owns:

- intake
- normalization
- planning
- review
- flywheel governance
- project package generation

HyperFrames owns:

- composition authoring target
- preview
- lint and validate
- render

## System Boundary

### Studio responsibilities

Studio is responsible for:

- accepting mixed input sources
- normalizing them into a shared video brief
- generating scenes, narration, on-screen text, and asset placeholders
- reviewing output before composition generation
- applying brand and guardrail rules
- producing a reusable project package
- recording retro feedback

### HyperFrames responsibilities

HyperFrames is responsible for:

- receiving compiled composition input
- producing HTML-based compositions
- previewing compositions
- validating compositions
- rendering compositions to video

### Boundary rule

Users and most agents should interact with `VideoBrief` and `ScenePlan`, not raw HyperFrames HTML.

This keeps our planning layer stable and preserves the option to swap or add render backends later.

## Primary Use Case

The first supported use case is:

`mixed input -> case explainer video -> HyperFrames render -> reusable project package`

Mixed input means both of the following are accepted:

- structured form-style input
- unstructured long-form input such as Markdown, PRD, or case notes

## Data Model

The system uses a three-stage internal model:

`VideoBrief -> ScenePlan -> CompositionSpec`

### VideoBrief

`VideoBrief` is the normalized entry format for all inputs.

Required fields:

- `goal`
- `audience`
- `format`
- `style`
- `source_materials`
- `constraints`
- `output_type`

Definitions:

- `goal`: what the video must achieve
- `audience`: who the video is for
- `format`: output ratio such as `16:9`, `9:16`, or `1:1`
- `style`: brand voice, pacing, visual tone
- `source_materials`: Markdown, PRD, links, screenshots, media, data
- `constraints`: time limit, must-include points, exclusions
- `output_type`: case explainer, product demo, or social short

### ScenePlan

`ScenePlan` is the reviewable planning layer.

Each scene contains:

- `scene_id`
- `purpose`
- `start_time`
- `duration`
- `narration`
- `on_screen_text`
- `visual_type`
- `assets`
- `transition`
- `validation_notes`

Why this layer matters:

- it is human-readable
- it is agent-readable
- it allows review before render
- it is the best place for flywheel checks

### CompositionSpec

`CompositionSpec` is the compiled render target for HyperFrames.

It contains:

- composition metadata such as width, height, fps, duration
- scene tracks
- media and text elements
- animation hints
- asset references
- theme tokens

`CompositionSpec` is then translated into HyperFrames composition files.

## Flywheel Integration

The flywheel is embedded in two places.

### A. Studio production flywheel

Studio uses this fixed loop:

1. `Intake`
2. `Plan`
3. `Review`
4. `Compose`
5. `Render`
6. `Retro`

Definitions:

- `Intake`: collect form input, Markdown, PRD, or case material and normalize into `VideoBrief`
- `Plan`: convert `VideoBrief` into `ScenePlan`
- `Review`: validate completeness, duration, brand fit, asset gaps, and information density
- `Compose`: compile approved scenes into `CompositionSpec` and HyperFrames composition output
- `Render`: run preview, lint, validate, and render
- `Retro`: record quality, rework points, and reusable lessons for future generations

Key rule:

The most important checks happen at `ScenePlan`, not after render.

### B. Output package flywheel

Every generated project package should include a simplified flywheel so the result is not a one-shot artifact.

Each package should include:

- `FLYWHEEL.md`
- `VIDEO_BRIEF.json` or `VIDEO_BRIEF.md`
- `SCENE_PLAN.json`
- `COMMANDS.md`
- `GUARDRAILS.md`
- `RETRO_LOG.md`
- agent instructions or skills metadata

This turns each output into a maintainable execution environment.

## First Version Scope

The first version should be narrow and complete.

### In scope

- two input paths:
  - structured form input
  - Markdown or long-form document input
- normalization into `VideoBrief`
- one supported video category:
  - case explainer video
- two supported aspect ratios:
  - `16:9`
  - `9:16`
- a small scene catalog:
  - cover
  - problem/background
  - solution/method
  - workflow/steps
  - highlights/results
  - ending
- HyperFrames preview, lint, validate, and render support
- reusable project package output with flywheel files

### Out of scope

- full visual timeline editor
- freeform drag-and-drop editing
- automatic UI recording
- advanced product-demo capture
- large asset management system
- broad social-short optimization engine
- many scene families at once

## Success Criteria

Version one succeeds if all of the following are true:

1. Given a case document, the system can generate a previewable and renderable video.
2. The output is a reusable project package, not only a final media file.
3. Each run preserves `VideoBrief`, `ScenePlan`, and retro artifacts.

## Recommended Rollout

Use this expansion order:

1. Case explainer video
2. Product demo video
3. Social short video

Rationale:

- case explainer is closest to current Studio positioning
- it is the most stable path for mixed-input normalization
- it lays the schema and planning foundation for later formats

## Long-Term Architecture

The platform should evolve into four major modules:

1. `VideoBriefCompiler`
2. `ScenePlanningEngine`
3. `RenderBackendAdapter`
4. `ProjectPackageGenerator`

Responsibilities:

- `VideoBriefCompiler`: convert raw inputs into normalized briefs
- `ScenePlanningEngine`: convert briefs into scene plans according to template and policy
- `RenderBackendAdapter`: compile to HyperFrames first, with room for more render backends later
- `ProjectPackageGenerator`: emit reusable agent-friendly project packages with flywheel files and commands

## Positioning Summary

The product is best described as:

`A flywheel-driven AI Studio that compiles business and case materials into executable video project packages, using HyperFrames as the rendering backend.`

## Risks

- letting users edit raw HyperFrames output too early would collapse system boundaries
- trying to support all video types in version one would scatter the schema and planning layer
- pushing review too late in the pipeline would create expensive render-stage failures

## Non-Goals

- replacing HyperFrames
- building a full general-purpose video editor in version one
- centering the product on raw composition editing instead of workflow-driven generation
