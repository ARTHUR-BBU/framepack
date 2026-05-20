# Framepack MCP Tools

Framepack exposes an MCP stdio server with tools for the complete package lifecycle:

- `generateProject`
- `getStatus`
- `getCapabilityGraph`
- `explainCapabilityGaps`
- `exposeArsenal`
- `validatePackage`
- `repairPackage`
- `captureAssets`
- `syncAssets`
- `runtimeDoctor`
- `runtimeLint`
- `runtimeInspect`
- `runtimeSnapshot`
- `explainNextActions`
- `listWorkflowPacks`
- `getWorkflowPack`
- `listCreativeDirectionPacks`
- `getCreativeDirectionPack`
- `recommendPacks`
- `releaseSmoke`

It also exposes project resources for manifest, handoff, asset execution plan, capability graph, forge tasks, and status, plus registry resources for workflow packs and creative direction packs:

- `framepack://packs/workflows`
- `framepack://packs/creative-directions`
- `framepack://project/{projectName}/capability-graph`

## Role In The Ecosystem

MCP is the tool interface, not the whole product.

Framepack's agent platform is expected to combine:

- MCP tools for execution
- skills for workflow playbooks
- workflow packs for repeatable video jobs
- creative direction packs for design and animation guidance
- connectors for content sources, asset forge tools, render systems, and publishing systems

MCP tools should stay stable and structured so higher-level skills and workflow packs can depend on them without parsing human-readable CLI output.

## Creative Direction Through Tools

The MCP surface now exposes the first creative direction registry.

Agents should call `listWorkflowPacks` and `listCreativeDirectionPacks` before generating a project when the user request is broad or product-shaped. The workflow pack helps choose the source route and expected execution kinds. The creative direction pack helps choose visual language, motion language, template guidance, and acceptance criteria before rendering.

For fuzzy user requests, call `exposeArsenal` before choosing a route. It returns the raw user signal, full workflow pack list, full creative direction pack list, capability graph summary when a project exists, and common technology fit checks for libraries or backends such as Three.js, GSAP, Anime.js, PixiJS, and agent-sprite-forge. This is intentionally not an intent resolver: Framepack shapes the information field, while Codex or Claude Code makes the creative and technical decision.

For a conservative default, call `recommendPacks` with `sourceType`, `outputType`, optional `goal`, optional `audience`, and optional `format`. The response includes `workflowPack`, `creativeDirectionPack`, `packSelection`, and a human-readable `reason`. Agents should rely on IDs and `packSelection` for automation; `reason` is explanatory text.

After a package exists, use `getCapabilityGraph` to read `CAPABILITY_GRAPH.json` plus its compact summary. Use `explainCapabilityGaps` when the next decision depends on missing runtime, skill, backend, or externally supplied capabilities.

`generateProject` accepts optional `workflowPackId` and `creativeDirectionPackId`. When provided, Framepack validates the workflow pack against the selected source/output route and writes the pack selection into `VIDEO_BRIEF.json` and `HANDOFF.md`.

`generateProject` also accepts `autoRecommendPacks: true`. When this is set and no explicit pack IDs are provided, Framepack applies the conservative recommendation automatically during generation. Explicit IDs always take priority.

`releaseSmoke` runs the agent-platform RC smoke harness from MCP. It creates Codex and Claude Code workflow files, checks the MCP surface, recommends packs, generates an auto-packed game-ad package, then runs package status and validation. It is intended for release candidates and agent installer verification; it does not install external forge skills, call image generation, or require HyperFrames rendering.

Future versions can move from registry guidance into richer template selection and project metadata, but agents should already treat these packs as part of the planning step.
