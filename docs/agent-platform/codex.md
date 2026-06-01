# Framepack With Codex

Framepack's current Codex path is the 0.6 workbench workflow, not the older package-generation workflow.

## Ask Codex

```text
Read https://github.com/ARTHUR-BBU/framepack and install Framepack into this project. Configure the agent workflow and MCP if available, create a Framepack workbench from my idea and assets, explain it in plain language, run the audit gates, then build and preview the HyperFrames composition.
```

## Install And Verify

```bash
npm install framepack
npx framepack --version
npx framepack --help
npx framepack mcp --describe
```

The npm postinstall step should create project-facing instructions and skills. If needed, run:

```bash
npx framepack init-agent --target codex --scope project
```

Expected project files:

```text
AGENTS.md
.mcp.json
.framepack/agent/codex/SKILL.md
.framepack/agent/codex/skills/
```

## Codex Workflow

Codex should:

1. Create a workbench with `framepack create`.
2. Read `FRAMEPACK.md`, `HUMAN.md`, `ASSETS.md`, `ASSET_GAPS.md`, `STYLE.md`, `DESIGN.md`, `DESIGN_TOKENS.md`, `DIRECTION.md`, `COMPOSITION.md`, and `ITERATIONS.md`.
3. Run `framepack workbench audit --phase preflight`.
4. Explain the plan to the user with `framepack workbench brief`.
5. Run `framepack workbench audit --phase design`.
6. Run `framepack workbench audit --phase composition`.
7. Build with `framepack build`.
8. Preview with `framepack preview --open`.
9. Run `framepack workbench audit --phase preview`.
10. Render only after P0/P1 blockers are clear.
11. Record feedback and decisions in `ITERATIONS.md`.

## MCP Role

MCP is useful for knowledge queries and automation, but it is not the whole product. Codex should treat MCP as an assistant surface for templates, animation recommendations, and compatibility tooling. The public user path remains:

```text
create -> audit -> build -> preview -> render -> iterate
```

Legacy MCP/package tools remain available for compatibility. Do not make them the first path in new user onboarding unless the user explicitly asks for legacy package protocol work.

## Quality Gate

Codex should not claim a workbench is ready when phase audits still report P0/P1 blockers.
