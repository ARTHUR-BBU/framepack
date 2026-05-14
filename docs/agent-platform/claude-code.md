# Framepack With Claude Code

Claude Code support is preview-level in this release.

Run:

```bash
framepack init-agent --target claude-code --scope project
```

This writes `CLAUDE.md` and `.mcp.json` in the current project. On native Windows, the generated MCP config uses `cmd /c npx -y framepack mcp`, which is required for local `npx` MCP servers.

For broad video requests, Claude Code should call `recommendPacks` before generation. If MCP is not connected yet, run `framepack packs recommend --json` as the fallback discovery command.

When generating, pass `workflowPackId` and `creativeDirectionPackId` through MCP `generateProject`, or use CLI `--workflow-pack` and `--creative-direction-pack`, so the selected route is written into `VIDEO_BRIEF.json` and `HANDOFF.md`.
