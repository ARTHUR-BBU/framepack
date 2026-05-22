# Framepack With Codex

## Install with Codex

Ask Codex:

```text
Read https://github.com/ARTHUR-BBU/framepack and install Framepack into this project. Configure its MCP server, initialize the Codex workflow, verify version/help/MCP, then generate and validate a small Framepack video package.
```

Codex should install Framepack, run `framepack init-agent --target codex --scope project`, inspect `framepack mcp --describe`, and then use the Framepack MCP tools for package generation and follow-up work. The expected first report should include package `readiness`, `nextActionItems`, and any missing assets or runtime gaps.

For the published npm alpha, Codex can verify the install path before project setup:

```bash
npx -y -p framepack@alpha framepack --version
npx -y -p framepack@alpha framepack --help
npm exec --yes --package=framepack@alpha -- framepack mcp --describe
```

For broad video requests, Codex should first call `recommendPacks`, or run `framepack packs recommend --json` if MCP is not connected. This makes the agent choose a workflow route and visual direction before it generates files.

When generating, Codex should pass `autoRecommendPacks: true` for broad requests, or pass explicit `workflowPackId` and `creativeDirectionPackId` when the route is already chosen. CLI equivalents are `--auto-pack`, or `--workflow-pack` and `--creative-direction-pack`. This records the decision inside the package handoff instead of leaving it as chat-only context.

Codex should prefer `readiness`, `nextActionItems`, and `forgeBreakdown` over parsing human-readable command output.

For release-candidate verification, Codex should run MCP `releaseSmoke` or CLI `framepack release-smoke --output-dir out/release-smoke --json`. This checks the agent workflow files, MCP surface, Arsenal Exposure, pack recommendation, auto-pack generation, capability/runtime artifacts, package status, and package validation in one structured pass.
