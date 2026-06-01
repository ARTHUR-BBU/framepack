# Framepack With Claude Code

Claude Code support is project-skill oriented. Framepack installs Claude-facing guidance and playbooks so Claude Code can run the same workbench/audit/build flow as Codex.

## Ask Claude Code

```text
Read https://github.com/ARTHUR-BBU/framepack and install Framepack into this project. Configure the Claude Code workflow, verify Framepack, create a workbench from my idea and assets, explain it in plain language, run the audit gates, then build and preview the HyperFrames composition.
```

## Install And Verify

```bash
npm install framepack
npx framepack --version
npx framepack --help
npx framepack mcp --describe
```

The npm postinstall step should create:

```text
CLAUDE.md
.mcp.json
.claude/skills/framepack-director/
.claude/skills/framepack-template-fuser/
.claude/skills/framepack-hyperframes-builder/
.claude/skills/framepack-reference-miner/
```

If needed, run:

```bash
npx framepack init-agent --target claude-code --scope project
```

On native Windows, the generated MCP config uses `cmd /c npx -y framepack mcp`, which is required for local `npx` MCP servers.

## Claude Code Workflow

Claude Code should:

1. Create a workbench with `framepack create`.
2. Read the workbench files, starting with `FRAMEPACK.md` and `HUMAN.md`.
3. Run `framepack workbench audit --phase preflight`.
4. Use `framepack-director` for fuzzy taste, style, structure, and acceptance criteria.
5. Use `framepack-template-fuser` for template/Catalog/user-asset fusion.
6. Run `framepack workbench audit --phase design`.
7. Run `framepack workbench audit --phase composition`.
8. Use `framepack-hyperframes-builder` for HTML implementation.
9. Build, preview, and run preview audit.
10. Render only after P0/P1 blockers are clear.

## MCP Role

Framepack MCP exposes knowledge and automation. It is not a replacement for the project skills or the durable workbench files. Claude Code should use MCP where available, but should keep decisions and progress in `HUMAN.md`, `DIRECTION.md`, `COMPOSITION.md`, and `ITERATIONS.md`.
