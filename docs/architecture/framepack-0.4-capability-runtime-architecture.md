# Framepack 0.4 Capability Runtime Architecture

Framepack 0.4 should treat video production as **Capability Orchestration** inside a video production **Agent Harness**.

The product thesis is not that Framepack is another video generator. The thesis is that a general-purpose coding agent needs a domain-specific nervous system before it can reliably perform video production work. Codex and Claude Code are the brain. Framepack is the video-production nervous system. HyperFrames is the rendering body.

The central upgrade is not "more commands". It is a clearer runtime model:

```text
user intent
-> production route
-> creative direction
-> capability graph
-> asset and template requirements
-> runtime assembly
-> HyperFrames execution
-> evidence-backed revision
```

Framepack remains a compiler and orchestration layer. It does not become a game engine, image generator, or full video editor. Its job is to describe, connect, and verify the capabilities an agent needs to produce a video package.

## Agent Harness Mapping

Framepack 0.4 maps the five-part Agent Harness model into concrete package artifacts and tool surfaces:

| Harness dimension | Framepack 0.4 implementation |
| --- | --- |
| Sense filter | `CAPABILITY_GRAPH.json` exposes available, missing, planned, external, and blocked capabilities instead of forcing the agent to infer from a raw file tree. |
| Motor pathways | MCP tools and CLI commands such as `generateProject`, `getStatus`, `validatePackage`, `repair`, `runtimeInspect`, and `runtimeSnapshot` turn decisions into controlled actions. |
| Reflexes | Validation, repair, runtime lint, runtime inspect, and capability scans catch drift before the model spends reasoning budget on obvious failures. |
| Memory encoding | The package file system persists briefs, scene plans, asset maps, execution plans, capability graphs, runtime manifests, motion grammar, and evidence. |
| Feedback loop | Runtime inspect reports, snapshot manifests, `VISUAL_QA.md`, and validation reports make readiness evidence-backed. |

This is field engineering rather than a fixed rail workflow. Framepack shapes the information field around the agent so it can choose the next correct production move without being forced through one opaque script.

## Learning Input

This architecture absorbs the recent discussion around Runtime, Capability Orchestration, MCP, CDN/API/library boundaries, Anime.js, Three.js, HyperFrames, and FramePack.

The key lessons are:

- Runtime is the moment where capability becomes active, observable, and testable.
- Libraries are not just helper functions; mature libraries package world rules, such as 3D, motion, audio, browser control, or rendering.
- MCP is not the capability itself; it is the protocol layer that lets agents discover, understand, and invoke capabilities.
- CDN, API, local library, CLI, and MCP are different delivery and invocation modes for capability.
- Framepack should become the agent-facing runtime orchestrator for motion/video packages.
- HyperFrames should remain the video runtime and rendering surface.

## Product Thesis

Framepack 0.4 should introduce a durable product concept:

> Framepack is a video production Agent Harness and Capability Runtime Orchestrator for agent-native video projects.

This means Framepack should answer:

- What capabilities does this project need?
- Where do those capabilities come from?
- Are they local libraries, CLI commands, MCP tools, remote APIs, CDN-loaded runtime modules, or manual/external production?
- Which agent should use them?
- What evidence proves they ran correctly?
- What remains blocked?

## Core 0.4 Concepts

### 1. Capability Graph

Add a package-level `CAPABILITY_GRAPH.json`.

It should describe required and optional capabilities:

```json
{
  "version": "framepack.capability-graph.v1",
  "nodes": [
    {
      "id": "video-runtime.hyperframes",
      "kind": "runtime",
      "provider": "hyperframes",
      "delivery": "npm-local",
      "required": true,
      "status": "available",
      "usedBy": ["runtime-lint", "runtime-snapshot", "render"]
    },
    {
      "id": "motion.animejs",
      "kind": "library",
      "provider": "animejs",
      "delivery": "npm-local",
      "required": false,
      "status": "planned",
      "usedBy": ["template-pack.kinetic-product"]
    },
    {
      "id": "asset-forge.agent-sprite-forge",
      "kind": "skill",
      "provider": "agent-sprite-forge",
      "delivery": "codex-skill",
      "required": false,
      "status": "not-detected",
      "usedBy": ["forge-character-pack", "forge-map-pack", "forge-fx-pack"]
    }
  ]
}
```

This graph should not execute anything by itself. It is a discoverable contract for agents and future UIs.

### 2. Runtime Manifest

Add a package-level `RUNTIME_MANIFEST.json`.

It should describe what is assembled at runtime:

- HyperFrames entrypoint
- required local npm dependencies
- optional runtime libraries such as Anime.js, Three.js, PixiJS, Tone.js, or Web Audio helpers
- browser/runtime assumptions
- render and inspect commands
- visual QA evidence files

This separates package protocol from runtime assembly. `PACKAGE_MANIFEST.json` indexes the package; `RUNTIME_MANIFEST.json` explains how the package becomes active.

### 3. Template Pack Contract

0.4 should introduce template packs as executable creative structure, not just design notes.

A template pack should declare:

- accepted source/output routes
- required scenes
- recommended motion grammar
- layout primitives
- supported runtime libraries
- asset requirements
- visual QA criteria

Example:

```json
{
  "id": "kinetic-saas-proof",
  "kind": "template-pack",
  "requires": ["video-runtime.hyperframes"],
  "optionalCapabilities": ["motion.animejs"],
  "sceneTemplates": ["hook-proof", "workflow-map", "outcome-card"],
  "acceptanceCriteria": [
    "No text overflow in runtime inspect",
    "At least one snapshot captures the main proof moment",
    "Motion pacing matches the selected creative direction"
  ]
}
```

Workflow packs answer "what job are we doing?" Creative direction packs answer "what taste should guide it?" Template packs answer "what executable scene structure should we use?"

### 4. Motion Grammar Layer

Framepack needs a middle layer between vague creative direction and concrete code.

Call it `MOTION_GRAMMAR.json`.

It should describe:

- entrance patterns
- emphasis patterns
- camera/pan/zoom rules
- transition families
- timing tokens
- allowed runtime engines

This lets an agent choose between CSS transitions, Anime.js, Three.js, or HyperFrames-native timing without hiding the decision in generated code.

### 5. Capability Delivery Modes

0.4 should explicitly model how a capability is consumed:

| Delivery | Meaning | Example |
| --- | --- | --- |
| `npm-local` | installed package in the project/runtime | `hyperframes`, `three`, `animejs` |
| `cdn-runtime` | loaded at runtime through URL | `https://unpkg.com/three` |
| `cli-local` | local command-line capability | `ffmpeg`, `git`, `framepack` |
| `mcp-tool` | discoverable tool through MCP | `generateProject`, `releaseSmoke` |
| `remote-api` | remote service call | image/audio/model API |
| `codex-skill` | agent skill installed in Codex | `agent-sprite-forge` |
| `manual-external` | human or external production | existing assets, designer handoff |

This is the practical bridge between the CDN/API/MCP/library distinction and the Framepack package protocol.

### 6. Visual QA Evidence

0.4 should persist visual verification output into the package:

- `RUNTIME_INSPECT_REPORT.json`
- `RUNTIME_SNAPSHOT_MANIFEST.json`
- `VISUAL_QA.md`

`status --json` should expose whether visual QA has run and what remains unresolved.

Agents should not say a package is visually ready without evidence from runtime inspect or snapshots.

### 7. Asset Forge Loop V2

The current forge layer describes work. 0.4 should add a clearer loop:

```text
task contract -> capability detection -> production route -> output metadata -> sync -> visual QA -> revision
```

Framepack should still avoid automatic external skill installation by default. It can, however, report:

- recommended skill
- detected skill status
- install guidance
- manual fallback
- custom backend hook

This keeps `agent-sprite-forge` as the first recommended backend without hard-binding Framepack to it.

## Proposed Package Files

0.4 candidate additions:

- `CAPABILITY_GRAPH.json`
- `RUNTIME_MANIFEST.json`
- `TEMPLATE_PACK_SELECTION.json`
- `MOTION_GRAMMAR.json`
- `RUNTIME_INSPECT_REPORT.json`
- `RUNTIME_SNAPSHOT_MANIFEST.json`
- `VISUAL_QA.md`

Existing files remain:

- `PACKAGE_MANIFEST.json`
- `VIDEO_BRIEF.json`
- `SCENE_PLAN.json`
- `SCENE_ASSET_MAP.json`
- `SOURCE_SCENE_MAP.json`
- `ASSET_EXECUTION_PLAN.json`
- `FORGE_TASKS.md`
- `HANDOFF.md`

## MCP Surface Direction

0.4 MCP should add tools only when they return structured state.

Candidate tools:

- `listCapabilities`
- `getCapabilityGraph`
- `selectTemplatePack`
- `getRuntimeManifest`
- `runVisualInspect`
- `recordVisualEvidence`
- `explainCapabilityGaps`

Avoid tools that merely wrap human-readable CLI output.

## Implementation Milestones

### 0.4-A: Capability Graph Foundation

- Add `CAPABILITY_GRAPH.json` to generated packages.
- Add package manifest indexing.
- Add status summary for missing capability nodes.
- Keep all capabilities descriptive; do not execute new external tools.

### 0.4-B: Runtime Manifest And Visual QA

- Add `RUNTIME_MANIFEST.json`.
- Persist runtime inspect and snapshot reports.
- Surface visual QA state in `status --json`.

### 0.4-C: Template Pack Contract

- Define template pack registry.
- Add one real template pack for `game-ad-sprite-video`.
- Connect template pack requirements to capability graph.

### 0.4-D: Motion Grammar

- Add `MOTION_GRAMMAR.json`.
- Map creative direction packs to motion grammar defaults.
- Let templates declare compatible motion grammar families.

### 0.4-E: Forge Loop V2

- Detect whether recommended skills are available where possible.
- Preserve manual/custom fallback.
- Add clearer sync evidence and revision guidance.

## Success Criteria

Framepack 0.4 is successful if an agent can:

1. Generate a package.
2. Read its capability graph.
3. Understand which runtime, library, MCP, skill, API, or manual capabilities are needed.
4. Select an executable template pack.
5. Run visual QA and persist evidence.
6. Explain readiness without parsing logs.
7. Continue the project through asset production and HyperFrames verification.

## Non-Goals

- Do not replace HyperFrames.
- Do not build a full editor UI.
- Do not auto-install third-party forge skills without explicit user approval.
- Do not hard-code a single asset forge provider.
- Do not make template packs opaque code blobs without acceptance criteria.

## Design Principle

The Framepack 0.4 architecture should make this sentence true:

> The agent does not just generate files; it understands and orchestrates the capabilities required to make a video runtime come alive.
