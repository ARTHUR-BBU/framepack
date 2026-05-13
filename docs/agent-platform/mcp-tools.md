# Framepack MCP Tools

Framepack exposes an MCP stdio server with tools for the complete package lifecycle:

- `generateProject`
- `getStatus`
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

It also exposes project resources for manifest, handoff, asset execution plan, forge tasks, and status, plus registry resources for workflow packs and creative direction packs:

- `framepack://packs/workflows`
- `framepack://packs/creative-directions`

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

Future versions can move from registry guidance into richer template selection and project metadata, but agents should already treat these packs as part of the planning step.
