# Framepack v0.4.0-alpha.3 Real User Trial

Trial ID: `REAL-USER-TRIAL-03`

Date: 2026-05-22

Purpose: verify that a user or coding agent can start from the published npm alpha package, in a clean project outside the source checkout, and reach a valid Framepack package without relying on local repository state.

## Trial Setup

- Source package: `framepack@alpha`
- Resolved version: `0.4.0-alpha.3`
- Clean project root: `C:\Users\LENOVO\AppData\Local\Temp\framepack-real-user-alpha3-291ea807f09f4371824ac71917ecb955`
- Install command: `npm install framepack@alpha --no-audit --no-fund`
- Execution mode: installed package, invoked through `npx framepack`
- Source checkout dependency: none

## Commands Exercised

```bash
npm install framepack@alpha --no-audit --no-fund
npx framepack --version
npx framepack --help
npx framepack mcp --describe
npx framepack packs recommend --source-type game-ad --output-type game-ad --goal "Promote an agent-native video course" --audience "Founders" --format 9:16 --json
npx framepack atlas recommend --workflow-pack game-ad-sprite-video --creative-direction-pack game-ad-retro-arcade --output-type game-ad --format 9:16 --json
npx framepack init-agent --target codex --scope project
npx framepack init-agent --target claude-code --scope project
npx framepack generate --game-ad-description "A course that teaches founders to ship agent-native video systems." --output-dir out --goal "Promote the course" --audience "Founders" --project-name sprite-video-demo --format 9:16 --auto-pack
npx framepack validate --project-dir out/sprite-video-demo
npx framepack status --project-dir out/sprite-video-demo --json
```

## Result

Status: passed

Observed evidence:

- `npx framepack --version` returned `0.4.0-alpha.3`.
- `npx framepack --help` included the stable alpha checks:
  - `npx -y -p framepack@alpha framepack --version`
  - `npx -y -p framepack@alpha framepack --help`
  - `npm exec --yes --package=framepack@alpha -- framepack mcp --describe`
- `npx framepack mcp --describe` exposed `generateProject` and `framepack://capabilities/atlas`.
- `npx framepack init-agent --target codex --scope project` created `.framepack/agent/codex/SKILL.md`.
- `npx framepack init-agent --target claude-code --scope project` created `CLAUDE.md` and `.mcp.json`.
- `npx framepack generate ... --auto-pack` created `out/sprite-video-demo/PACKAGE_MANIFEST.json`.
- `npx framepack validate --project-dir out/sprite-video-demo` passed.
- `npx framepack status --project-dir out/sprite-video-demo --json` returned readiness `needs-assets`.
- Status next actions included `sync-assets` and `produce-forge-assets`.

## Generated Package Evidence

`VIDEO_BRIEF.json` recorded:

- workflow pack: `game-ad-sprite-video`
- creative direction pack: `game-ad-retro-arcade`
- capability stack: `game-ad-sprite-video-stack`

`ASSET_EXECUTION_PLAN.json` recorded forge execution kinds:

- `forge-character-pack`
- `forge-map-pack`
- `forge-fx-pack`

Forge backend and skills:

- backend: `agent-sprite-forge`
- required skills: `generate2dsprite`, `generate2dmap`

`HANDOFF.md` included agent-facing guidance for:

- using `$generate2dsprite` for character, sprite, prop, and FX packs when the skill is installed
- using `$generate2dmap` for map/background packs when the skill is installed
- leaving the task contract backend-neutral for manual, custom, or existing assets

## Review Notes

The first evidence-collection script completed the package generation path, but its final JSON summary failed because PowerShell passed `status` output as an object array into `ConvertFrom-Json`. The trial was not discarded; the generated package was inspected directly, and the evidence summary was rerun with `Out-String` normalization.

A separate npm-cache lesson from the previous alpha3 publish verification still applies: on Windows, do not run multiple fresh `npx -p framepack@alpha ...` commands in parallel against the same npm cache. Use installed `npx framepack` inside a clean project, or run public `npx -p` checks sequentially with isolated cache directories.

## Product Interpretation

The alpha3 package now supports the intended agent-first first run:

1. An agent can install Framepack from npm.
2. The agent can inspect CLI help and MCP surface.
3. The agent can initialize Codex and Claude Code workflow files.
4. The agent can ask Framepack for workflow and capability recommendations.
5. The agent can generate a game-ad sprite-video package.
6. The package clearly exposes missing assets and next actions instead of pretending the video is complete.

## Plain-Language Summary

This test pretended to be a brand-new user in a brand-new folder. It installed Framepack from npm, asked it what version it was, checked its help, checked its agent tools, initialized Codex and Claude Code support, generated a game-style video project package, and validated that package. The final result was not a finished video, because the sprite/map/FX assets still need to be produced, but Framepack correctly told the agent what assets are missing and what to do next.
