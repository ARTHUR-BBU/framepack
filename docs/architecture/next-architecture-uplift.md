# Framepack Next Architecture Uplift

This document defines the learning and architecture agenda after Framepack `v0.3.0-rc.1`.

Framepack 0.4 should move from "agent can generate a correct package" toward "agent can continuously improve a video project through structured planning, creative judgment, asset production, runtime inspection, and revision."

The concrete 0.4 proposal is documented in [`framepack-0.4-capability-runtime-architecture.md`](framepack-0.4-capability-runtime-architecture.md). It turns the learning agenda into a capability runtime architecture with a package-level capability graph, runtime manifest, template pack contract, motion grammar layer, visual QA evidence, and Asset Forge Loop V2.

## Architecture Learning Agenda

The next phase should study and absorb patterns from:

- HyperFrames runtime evolution: composition APIs, inspection, snapshot verification, rendering, and future publish behavior
- MCP product surfaces: tools, resources, prompts, structured status, long-running task reporting, and install flows
- agent-first product packaging: skills, project instructions, workflow packs, and platform-specific adapters
- design systems for video: typography, layout density, motion rhythm, scene templates, and visual QA
- asset forge ecosystems: `agent-sprite-forge`, manual asset production, custom generators, and existing asset libraries
- community contribution models: template packs, creative direction packs, connector packs, and acceptance criteria

## Target Architecture

The durable pipeline remains:

```text
content source -> scene plan -> asset requirements -> asset forge adapter -> materialized assets -> HyperFrames composition/render
```

Framepack 0.4 should make more of this pipeline explicit and inspectable:

- Source Layer: markdown, thread, website, product/course descriptions, and future structured business sources
- Planning Layer: brief, script, scene plan, source-scene map, and creative direction selection
- Asset Requirement Layer: source captures, text cards, forge tasks, existing asset reuse, and acceptance criteria
- Asset Forge Adapter Layer: backend-neutral contracts for skills, manual production, custom tools, and future services
- Composition Layer: HyperFrames package entrypoints, layout rules, scene templates, and runtime capabilities
- Verification Layer: package status, runtime inspect, snapshots, release gates, and visual regression evidence

## Product Direction

The next architecture should preserve these constraints:

- Framepack remains a compiler and orchestration layer, not a game engine.
- HyperFrames remains the preview/render runtime, not merely an implementation detail.
- `agent-sprite-forge` remains the first recommended 2D backend, not a hard dependency.
- agent-first is a product principle: commands and files should be discoverable, structured, and safe for coding agents.
- Design and animation quality should become explicit package data, not hidden chat context.

## Candidate 0.4 Workstreams

1. Template Pack Contract
   - Define how reusable scene templates are discovered, selected, and validated.
   - Connect workflow packs and creative direction packs to concrete HyperFrames scene structures.

2. Visual QA Evidence
   - Persist runtime inspect and snapshot outputs as package artifacts.
   - Add status fields that let agents see whether visual checks have been run.

3. Asset Forge Execution Loop
   - Add optional skill detection and install guidance for `agent-sprite-forge`.
   - Preserve backend-neutral execution while making handoff and sync more automatic.

4. MCP Long-Running Tasks
   - Represent capture, forge, inspect, and render as structured operations with durable status.
   - Avoid forcing agents to parse terminal logs for workflow state.

5. Creative Direction System
   - Expand creative direction packs into typography, motion, shot language, and acceptance rubrics.
   - Support community-contributed packs without weakening protocol stability.

6. Release And Compatibility Gates
   - Keep `npm run release:gate` as the minimum RC check.
   - Add compatibility checks when HyperFrames changes.

## Next Review Questions

- Which HyperFrames updates change Framepack package assumptions?
- Which parts of creative quality should be protocol fields versus pack guidance?
- Which asset production steps should remain manual, and which should become MCP tools?
- What is the minimum useful template pack contract for Framepack 0.4?
- How should agents report visual evidence back to users without overwhelming them?

## Success Criteria

Framepack 0.4 is successful when an agent can:

- choose a workflow and creative direction,
- generate a package,
- identify missing assets,
- produce or request those assets through backend-neutral contracts,
- run HyperFrames inspection and snapshots,
- revise based on evidence,
- and explain the remaining work through structured status instead of vague chat notes.
