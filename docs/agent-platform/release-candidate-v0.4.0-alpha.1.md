# Framepack v0.4.0-alpha.1 Release Candidate

Framepack `v0.4.0-alpha.1` is the first alpha for the video-production Agent Harness architecture.

It upgrades Framepack from an agent-facing package compiler into a capability-aware video production harness:

- `CAPABILITY_GRAPH.json` describes the capability state of a specific generated package.
- `RUNTIME_MANIFEST.json` describes HyperFrames runtime entrypoints, commands, capabilities, and evidence paths.
- Arsenal Exposure exposes workflow packs, creative direction packs, capability graph summaries, and common technology fit.
- Animation Capability Atlas describes the broader technology map across programmatic animation, generative media, asset forge backends, runtime composition, agent skills, MCP tools, plugins, and verification.
- `capabilityStackSelection` persists the selected Atlas technology stack into `VIDEO_BRIEF.json` and `HANDOFF.md` when packages use workflow or creative direction packs.
- `release-smoke`, `release:smoke:install`, and `release:gate` verify the agent platform surface before publishing.

## What Changed Since v0.3.0-rc.1

- Added strict capability graph validation and repair.
- Added runtime manifest generation and validation.
- Added Arsenal Exposure through CLI/MCP-adjacent surfaces.
- Added the Animation Capability Atlas registry.
- Exposed Atlas through `framepack atlas`, MCP tools, and `framepack://capabilities/atlas`.
- Persisted capability stack selections into generated packages when a pack-selected route has a matching Atlas stack.
- Hardened release gates to check package artifacts, MCP discovery, installed CLI behavior, and generated package status.

## Final Gate

Before tagging or publishing this alpha, run:

```bash
npm run release:gate
```

The gate runs:

- `npm run typecheck`
- `npm test`
- `npm pack --dry-run --json`
- `npm run release:smoke:install`

`release:smoke:install` builds the package, creates a real npm tarball, installs that tarball into a temporary empty consumer project, then runs the installed `framepack` binary through MCP discovery, Atlas discovery, `release-smoke`, `generate --auto-pack`, `validate`, and `status --json`.

## In Scope

- Agent-native workflow installation for Codex and Claude Code.
- Workflow and creative direction pack recommendation.
- Animation Capability Atlas read surfaces.
- Atlas-backed `capabilityStackSelection` in generated package context.
- Backend-neutral 2D forge task contracts.
- `agent-sprite-forge` as the first recommended 2D asset forge backend.
- HyperFrames runtime doctor, lint, inspect, snapshot, preview, and render command paths.
- Evidence-backed package status, validation, repair, and release gates.

## Out Of Scope

- Framepack does not install external skills automatically.
- Framepack does not call hosted video models automatically.
- Framepack does not publish or tag the release automatically.
- Framepack does not become a game engine, full video editor, or image generator.
- Framepack does not make frontier model availability guarantees for Seedance 2.0, Gemini Omni, or Kling AI 3.0.

## Manual Release Checklist

1. Confirm branch `framepack-agent-platform` is clean.
2. Run `npm run release:gate`.
3. Review `CHANGELOG.md`, `README.md`, `README.zh-CN.md`, `AGENTS.md`, and this alpha note.
4. Review generated package samples for `CAPABILITY_GRAPH.json`, `RUNTIME_MANIFEST.json`, and `VIDEO_BRIEF.json.capabilityStackSelection`.
5. Create or update the release PR.
6. Tag `v0.4.0-alpha.1` only after human review.
7. Publish only after the tag and npm tarball contents are confirmed.

## Agent Handoff

Agents should start from `AGENTS.md`, then use `framepack mcp --describe`, `framepack packs recommend`, and `framepack atlas recommend` before package generation when the user request is broad or technology-sensitive.

For existing packages, agents should inspect:

- `PACKAGE_MANIFEST.json`
- `HANDOFF.md`
- `VIDEO_BRIEF.json`
- `CAPABILITY_GRAPH.json`
- `RUNTIME_MANIFEST.json`
- `ASSET_EXECUTION_PLAN.json`

`capabilityStackSelection` is a selected technology route, not proof that every external capability is installed. Agents must still use package status, capability graph gaps, runtime doctor, and validation before claiming readiness.
