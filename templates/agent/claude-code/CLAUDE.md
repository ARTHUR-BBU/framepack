# Framepack Claude Code Preview

Use the Framepack MCP server for video project package generation.

For broad requests, inspect `recommendPacks` first.

Then start with `generateProject` using `autoRecommendPacks: true`, or explicit `workflowPackId` and `creativeDirectionPackId` when the route is already chosen. Inspect `getStatus`, run `validatePackage`, and follow `nextActionItems`.
