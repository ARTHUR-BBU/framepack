# Framepack v0.4.0-alpha.4 Release Candidate

Framepack `v0.4.0-alpha.4` is a one-prompt agent onboarding packaging release.

It keeps the `v0.4.0-alpha.3` CLI and package behavior intact, and packages the final agent-first onboarding copy so npm users see the same path that passed the real user trial:

- Start with one natural-language prompt in Codex or Claude Code.
- Let the agent install Framepack, configure MCP, initialize the agent workflow, verify version/help/MCP, then generate and validate a small video package.
- Report package `readiness`, `nextActionItems`, missing assets, and runtime gaps instead of stopping at installation.
- Keep the stable alpha checks:
  - `npx -y -p framepack@alpha framepack --version`
  - `npx -y -p framepack@alpha framepack --help`
  - `npm exec --yes --package=framepack@alpha -- framepack mcp --describe`

This release preserves the `v0.4.0-alpha.2` first-run hardening path, the Animation Capability Atlas, and Atlas-backed `capabilityStackSelection` behavior from earlier `0.4` alpha releases.

## What Changed Since v0.4.0-alpha.3

- Added the `Start With One Prompt` README entry.
- Added the Chinese `用一句话开始` entry.
- Updated Codex, Claude Code, and install-with-agent docs to make the first report include `readiness`, `nextActionItems`, missing assets, and runtime gaps.
- Added regression coverage for the one-prompt onboarding copy.
- Preserved the real user trial report from `v0.4.0-alpha.3`.

## Final Gate

Before tagging or publishing this alpha, run:

```bash
npm run release:gate
```

For product-readiness rehearsal, also run:

```bash
npm run release:scenarios
```

The gate runs:

- `npm run typecheck`
- `npm test`
- `npm pack --dry-run --json`
- `npm run release:smoke:install`

`release:smoke:install` builds the package, creates a real npm tarball, installs that tarball into a temporary empty consumer project, then runs the installed `framepack` binary through version, help, MCP discovery, Atlas discovery, `release-smoke`, `generate --auto-pack`, `validate`, and `status --json`.

## In Scope

- Public npm alpha first-run checks.
- One-prompt agent onboarding for Codex and Claude Code.
- Agent workflow initialization.
- Workflow and creative direction pack recommendation.
- Animation Capability Atlas read surfaces.
- Atlas-backed `capabilityStackSelection` in generated package context.
- Backend-neutral 2D forge task contracts.
- `agent-sprite-forge` as the first recommended 2D asset forge backend.
- HyperFrames runtime doctor, lint, inspect, snapshot, preview, and render command paths.
- Evidence-backed package status, validation, repair, release gates, real scenario rehearsal, and real user trial documentation.

## Out Of Scope

- Framepack does not install external skills automatically.
- Framepack does not call hosted video models automatically.
- Framepack does not publish or tag releases automatically during release smoke or release gates.
- Framepack does not become a game engine, full video editor, or image generator.
- Framepack does not make frontier model availability guarantees for Seedance 2.0, Gemini Omni, or Kling AI 3.0.

## Manual Release Checklist

1. Confirm branch `framepack-agent-platform` is clean.
2. Run `npm run release:gate`.
3. Run `npm run release:scenarios`.
4. Review `CHANGELOG.md`, `README.md`, `README.zh-CN.md`, `AGENTS.md`, and this alpha note.
5. Check `npm publish --access public --tag alpha --dry-run` for tarball contents and publish warnings.
6. Tag `v0.4.0-alpha.4` only after human review.
7. Publish with `npm publish --access public --tag alpha` only after the tag and npm tarball contents are confirmed.

## Agent Handoff

Agents should start from `AGENTS.md`, then use `framepack --help`, `framepack mcp --describe`, `framepack packs recommend`, and `framepack atlas recommend` before package generation when the user request is broad or technology-sensitive.

For existing packages, agents should inspect:

- `PACKAGE_MANIFEST.json`
- `HANDOFF.md`
- `VIDEO_BRIEF.json`
- `CAPABILITY_GRAPH.json`
- `RUNTIME_MANIFEST.json`
- `ASSET_EXECUTION_PLAN.json`

`capabilityStackSelection` is a selected technology route, not proof that every external capability is installed. Agents must still use package status, capability graph gaps, runtime doctor, and validation before claiming readiness.
