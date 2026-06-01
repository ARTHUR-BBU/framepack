# Install Framepack With An Agent

Framepack is designed to be installed and operated by a coding agent.

## Recommended Prompt

```text
Read https://github.com/ARTHUR-BBU/framepack and install Framepack into this project. Configure the agent workflow and MCP if available. Verify the install, create a small workbench from my idea and assets, explain it in plain language, run the audit gates, then build and preview.
```

## What The Agent Should Do

1. Run `npm install framepack`.
2. Verify with `npx framepack --version`.
3. Inspect help with `npx framepack --help`.
4. Inspect MCP with `npx framepack mcp --describe`.
5. Confirm `AGENTS.md`, `CLAUDE.md`, `.mcp.json`, and project skills were created.
6. Create a workbench with `npx framepack create`.
7. Run `npx framepack workbench brief`.
8. Run phase audits: `preflight`, `design`, `composition`, `preview`, and `render`.
9. Build with `npx framepack build`.
10. Preview with `npx framepack preview --open`.
11. Render only after P0/P1 blockers are clear.

## What Gets Installed

Framepack is not only a CLI. It installs or exposes:

- project agent instructions
- Claude Code skills
- Codex project skills
- `.mcp.json` for MCP-aware tools
- workbench commands for create, brief, audit, build, preview, render
- template, Catalog, and animation recommendation surfaces

## Expected User Experience

The user should be able to speak naturally:

```text
Make this product video more premium, dynamic, business-like, with bigger focal text and stronger motion.
```

The agent should translate that into:

- `HUMAN.md` for plain-language progress
- `DIRECTION.md` for professional creative direction
- `DESIGN.md` and `DESIGN_TOKENS.md` for visual execution
- `ASSET_GAPS.md` for missing assets
- `COMPOSITION.md` for HyperFrames planning
- `ITERATIONS.md` for feedback and changes

## Release Or Installer Verification

For repository development, run:

```bash
npm run sandbox:benchmark
npm run release:gate
```

`sandbox:benchmark` is the preferred product-level rehearsal because it exercises the current workbench path and the audit gates.
