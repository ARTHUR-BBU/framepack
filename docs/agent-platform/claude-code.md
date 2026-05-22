# Framepack With Claude Code

Claude Code support is preview-level in this release.

Ask Claude Code:

```text
Read https://github.com/ARTHUR-BBU/framepack and install Framepack into this project. Configure its MCP server, initialize the Claude Code workflow, verify version/help/MCP, then generate and validate a small Framepack video package.
```

Run:

```bash
framepack init-agent --target claude-code --scope project
```

For the published npm alpha, verify the package before wiring the project:

```bash
npx -y -p framepack@alpha framepack --version
npx -y -p framepack@alpha framepack --help
npm exec --yes --package=framepack@alpha -- framepack mcp --describe
```

This writes `CLAUDE.md` and `.mcp.json` in the current project. On native Windows, the generated MCP config uses `cmd /c npx -y framepack mcp`, which is required for local `npx` MCP servers.

For broad video requests, Claude Code should call `recommendPacks` before generation. If MCP is not connected yet, run `framepack packs recommend --json` as the fallback discovery command.

When generating, pass `autoRecommendPacks: true` through MCP `generateProject` for broad requests, or pass explicit `workflowPackId` and `creativeDirectionPackId` when the route is already chosen. CLI equivalents are `--auto-pack`, or `--workflow-pack` and `--creative-direction-pack`.

For release-candidate verification, Claude Code should run MCP `releaseSmoke` or CLI `framepack release-smoke --output-dir out/release-smoke --json`. This keeps Arsenal Exposure, capability/runtime artifact, installer, and package-readiness checks structured instead of relying on chat notes.
