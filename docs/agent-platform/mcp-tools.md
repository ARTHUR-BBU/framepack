# Framepack MCP Tools

Framepack MCP is an agent-facing knowledge and automation surface. It is not the entire product and should not replace the durable workbench files.

The current user-facing workflow is:

```text
create -> brief -> audit -> build -> preview -> render -> iterate
```

MCP helps agents query templates, animation suggestions, components, and compatibility data while they execute that workflow.

## Describe The Surface

```bash
npx framepack mcp --describe
```

## Knowledge Tools

Current core knowledge tools:

- `querySceneTemplate`
- `recommendAnimation`
- `getComponentCode`

These answer questions such as:

- Which scene template fits this purpose?
- What GSAP pattern should animate this element?
- What bundled Catalog component code should be used?

## Compatibility Tools

The MCP surface still exposes package-era tools such as:

- `generateProject`
- `getStatus`
- `validatePackage`
- `repairPackage`
- `runtimeDoctor`
- `runtimeLint`
- `runtimeInspect`
- `runtimeSnapshot`
- `recommendPacks`
- `recommendCapabilityStack`

These are retained for compatibility, regression testing, and agent automation around the 0.4 package protocol. New onboarding should not present them as the primary user workflow.

## How Agents Should Use MCP

Agents should:

1. Use workbench files as durable project memory.
2. Use MCP for structured lookups and recommendations.
3. Write decisions into `HUMAN.md`, `DIRECTION.md`, `COMPOSITION.md`, and `ITERATIONS.md`.
4. Run CLI audit gates before build, preview, and render.

MCP is one layer in the product:

```text
skills + instructions + workbench files + MCP + CLI + HyperFrames runtime
```

## Audit Relationship

The strongest quality gate is currently CLI-based:

```bash
npx framepack workbench audit --phase all --project-dir <dir> --json
```

Agents may use MCP for context, but they should use the audit report as the gatekeeper for P0/P1 blockers.
