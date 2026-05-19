# Framepack v0.3.0-rc.1 Release Candidate

Framepack `v0.3.0-rc.1` is the first agent-platform release candidate.

It upgrades Framepack from a package generator into an agent-facing product surface:

- MCP tools and resources for generation, status, validation, repair, asset work, runtime checks, workflow packs, and release smoke checks
- project-scoped Codex and Claude Code installation files through `framepack init-agent`
- workflow packs and creative direction packs for route selection and taste guidance
- backend-neutral Asset Forge Layer contracts with `agent-sprite-forge` as the first recommended 2D forge backend
- one-step `--auto-pack` generation for broad agent requests
- release verification through `release-smoke`, `release:smoke:install`, and `release:gate`

## Final Gate

Before tagging or publishing this release candidate, run:

```bash
npm run release:gate
```

The gate runs:

- `npm run typecheck`
- `npm test`
- `npm pack --dry-run --json`
- `npm run release:smoke:install`

`release:smoke:install` builds the package, creates a real npm tarball, installs that tarball into a temporary empty consumer project, then runs the installed `framepack` binary through:

- `framepack mcp --describe`
- `framepack release-smoke --json`
- `framepack generate --auto-pack`
- `framepack validate --project-dir`
- `framepack status --json`

## Release Notes

This release candidate should be described as:

> Framepack is now an agent-native video project compiler with MCP, Codex and Claude Code installation workflows, workflow pack recommendation, creative direction packs, backend-neutral 2D forge tasks, and release-grade smoke gates.

## What Is In Scope

- Agent installation and workflow discovery
- Package generation for markdown, thread, website, and game-ad inputs
- `game-ad-sprite-video` workflow pack with `game-ad-retro-arcade` creative direction
- Backend-neutral forge tasks for sprites, maps, FX, props, and character packs
- `agent-sprite-forge` recommendation without automatic external skill installation
- Structured package readiness through `status --json`
- HyperFrames runtime doctor, lint, inspect, snapshot, preview, and render command paths

## What Is Not In Scope

- Automatic image generation
- Automatic `agent-sprite-forge` installation
- Full game engine behavior
- HyperFrames publish/upload automation
- Stable public template marketplace

## Manual Release Checklist

1. Confirm branch `framepack-agent-platform` is clean.
2. Run `npm run release:gate`.
3. Review `CHANGELOG.md`, `README.md`, `README.zh-CN.md`, and `AGENTS.md`.
4. Create or update the release PR.
5. After review, tag `v0.3.0-rc.1`.
6. Publish only after the tag and package contents are confirmed.

## Agent Handoff

Agents should start from `AGENTS.md`, then use `framepack mcp --describe` or MCP discovery directly. For broad content-to-video requests, agents should prefer `recommendPacks` or `autoRecommendPacks: true`; for explicit routes, they should pass durable `workflowPackId` and `creativeDirectionPackId`.
