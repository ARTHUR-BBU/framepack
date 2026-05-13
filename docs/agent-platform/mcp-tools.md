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

It also exposes project resources for manifest, handoff, asset execution plan, forge tasks, and status.

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

The current MCP surface focuses on package lifecycle tools. Future versions should expose creative direction and template selection as first-class capabilities, so agents can reason about visual quality, animation rhythm, template fit, and acceptance criteria before rendering.
