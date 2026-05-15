---
name: framepack
description: Use Framepack to compile content into executable video project packages for agents and HyperFrames.
---

# Framepack Codex Skill

Use Framepack MCP tools when the user asks to create or continue a video project package.

For broad requests, start with `recommendPacks` so you can choose the right production route and visual direction.

Then use `generateProject` with `autoRecommendPacks: true`, or with explicit `workflowPackId` and `creativeDirectionPackId` when the route is already chosen. Run `getStatus` and `validatePackage`, and follow `nextActionItems`.
