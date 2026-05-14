# Framepack Agent Platform Ecosystem

Framepack should become an agent-installable video workflow system, not just a command-line compiler.

## Product Layers

- Core Compiler: source ingest, scene planning, package protocol, validation, and HyperFrames bridge.
- MCP Server: structured tools, resources, and prompts that agents can call.
- Skills: reusable playbooks that teach agents how to run video production workflows.
- Workflow Packs: installable workflows for product explainers, thread videos, website videos, game ads, course promos, launch reviews, investor updates, and future formats.
- Creative Direction Layer: design taste, animation taste, narrative rhythm, template selection, and visual acceptance criteria.
- Connectors: content sources, asset forge backends, render systems, publishing systems, and third-party integrations.
- Community Ecosystem: shared templates, motion presets, example packages, skills, adapters, and best practices.

## Why This Matters

The product goal is not simply to generate a valid folder of JSON files.

The goal is to let an agent install a workflow, understand the user's video intent, call stable tools, follow package state, materialize or request assets, choose a fitting creative direction, and produce a HyperFrames-ready project that a human can inspect, improve, preview, and render.

## Creative Direction Layer

Framepack needs explicit creative direction because video quality depends on taste as much as protocol correctness.

The layer should guide:

- visual language
- typography and hierarchy
- composition density
- animation vocabulary
- transition rhythm
- scene pacing
- asset style coherence
- template fit
- acceptance criteria

This guidance may start as markdown playbooks and template notes, then become structured package metadata as the system matures.

## Template And Community Model

Template packs should be first-class ecosystem objects.

A template pack can include:

- composition templates
- scene layouts
- motion presets
- typography and palette tokens
- asset slots
- fallback rules
- visual acceptance checklists
- example packages

Community contributors should be able to add workflow packs, design systems, motion presets, forge adapters, content connectors, and example projects without changing Framepack Core.

## Near-Term Direction

After MCP and `init-agent`, the next product layer is workflow packs and creative direction packs.

Recommended initial packs:

- Product Explainer Video
- Thread-to-Video
- Website-to-Video
- Game Ad / Sprite Video
- Course Promo Video
- Investor Update Video
- Launch Review Video

Each pack should include a setup interview, required inputs, style defaults, asset policy, runtime checks, handoff criteria, and acceptance checklist.

## Current Registry Surface

Framepack now exposes the first built-in pack registry through:

```bash
framepack packs
framepack packs --json
framepack packs recommend --source-type game-ad --output-type game-ad --goal "Promote a course" --audience "Founders" --format 9:16 --json
framepack mcp --describe
```

MCP clients can also use:

- `listWorkflowPacks`
- `getWorkflowPack`
- `listCreativeDirectionPacks`
- `getCreativeDirectionPack`
- `recommendPacks`

This registry is intentionally separate from the package protocol. It helps agents choose the right workflow and creative direction before generating or continuing a package, without forcing every existing project package to change shape.

When a pack is selected during generation, Framepack writes the selection into `VIDEO_BRIEF.json` and `HANDOFF.md`. This makes creative and workflow decisions durable package context rather than temporary chat history.
