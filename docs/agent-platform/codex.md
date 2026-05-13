# Framepack With Codex

## Install with Codex

Ask Codex:

```text
Read https://github.com/ARTHUR-BBU/framepack and install Framepack into this project as an agent-native video project compiler. Configure its MCP server and verify generate/status/validate.
```

Codex should install Framepack, run `framepack init-agent --target codex --scope project`, inspect `framepack mcp --describe`, and then use the Framepack MCP tools for package generation and follow-up work.

For broad video requests, Codex should first call `listWorkflowPacks` and `listCreativeDirectionPacks`, or run `framepack packs --json` if MCP is not connected. This makes the agent choose a workflow route and visual direction before it generates files.

Codex should prefer `readiness`, `nextActionItems`, and `forgeBreakdown` over parsing human-readable command output.
