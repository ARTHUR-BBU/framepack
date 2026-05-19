# Changelog

## 0.3.0-rc.1

- added the Framepack MCP stdio server with project generation, status, validation, asset, runtime, resource, and prompt surfaces for coding agents
- added `framepack init-agent` for project-scoped Codex workflow files and Claude Code preview MCP configuration
- added Codex-first agent platform docs, templates, and README install guidance focused on natural language agent installation
- packaged agent-platform docs and templates for npm distribution
- added regression coverage for MCP surface discovery, Codex initialization, Claude Code MCP config, and packaged agent platform assets
- documented the long-term agent platform ecosystem, including workflow packs, creative direction, template packs, connectors, and community contribution paths
- added the first built-in workflow pack and creative direction pack registry, exposed through `framepack packs`, MCP tools, and MCP resources
- added workflow and creative direction pack selection during generation, with validation and durable `VIDEO_BRIEF.json` / `HANDOFF.md` output
- added pack recommendation through `framepack packs recommend` and MCP `recommendPacks`
- added one-step automatic pack recommendation during generation through CLI `--auto-pack` and MCP `autoRecommendPacks`
- added the agent-platform release smoke harness through CLI `release-smoke` and MCP `releaseSmoke`
- added `npm run release:smoke:install` for real npm tarball installation checks before publishing release candidates
- added `npm run release:gate` as the final release-candidate verification gate
- added release-candidate notes and the next architecture learning agenda for the Framepack 0.4 uplift
- added the Framepack 0.4 Capability Runtime Architecture proposal

## 0.2.0-rc.2

- fixed the published CLI bin entrypoint by preserving the Node shebang in `dist/cli.js`
- added release regression coverage to ensure the packaged CLI entrypoint remains directly executable
- verified clean tarball installation through `npx framepack`, markdown package generation, runtime checks, and game-ad forge package generation

## 0.2.0-rc.1

- added the Asset Forge Layer with backend-neutral forge execution kinds for sprite sheets, maps, FX, props, and character packs
- added the `--game-ad-description` demo route for game-style promotional video packages with sprite, map, and FX forge tasks
- added forge task contracts, `FORGE_TASKS.md`, richer `HANDOFF.md` guidance, and optional `agent-sprite-forge` backend recommendations without automatic skill installation
- added package readiness/status reporting with stable next-action IDs, forge breakdowns, and package command capability metadata
- upgraded the HyperFrames integration to 0.5.5 and added runtime `lint`, `inspect`, `snapshot`, and `upgrade-check` command flows
- expanded package protocol docs, agent workflow docs, repair behavior, and golden package regression coverage for the 0.2 package shape
- verified three real RC scenarios covering markdown, thread, website, and game-ad packages through status, validate, runtime checks, forge sync, snapshots, and draft render

## 0.1.0

- added markdown, website, and thread source compilers
- added package protocol files including `PACKAGE_MANIFEST.json`
- added source-aware asset execution planning and materialization
- added HyperFrames runtime detection, preview, and render command flows
