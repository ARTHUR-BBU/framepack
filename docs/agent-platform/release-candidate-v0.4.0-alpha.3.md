# Framepack v0.4.0-alpha.3 Release Candidate

Framepack `v0.4.0-alpha.3` is a first-run documentation and CLI guidance hardening release.

It keeps the `v0.4.0-alpha.2` install-experience work intact and fixes the public alpha command guidance so agents and users have a stable cross-platform path:

- Use `npx -y -p framepack@alpha framepack --version` for the published alpha version check.
- Use `npx -y -p framepack@alpha framepack --help` for the first-run help check.
- Use `npm exec --yes --package=framepack@alpha -- framepack mcp --describe` for MCP surface discovery.
- The CLI `--help` output now prints all three checks.
- README, Chinese README, AGENTS, Codex, Claude Code, and install-with-agent docs all use the same command set.

## What Changed Since v0.4.0-alpha.2

- Replaced unstable public `npm exec ... --version` and `npm exec ... --help` examples with stable `npx -y -p framepack@alpha ...` examples.
- Kept `npm exec --yes --package=framepack@alpha -- framepack mcp --describe` for the MCP surface check.
- Added regression coverage so CLI help and install smoke verification keep the stable first-run commands.
- Preserved the MCP, workflow pack, creative direction pack, release smoke, scenario, capability graph, runtime manifest, Animation Capability Atlas, and Asset Forge Layer gates from previous alpha releases.

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
- Agent-native workflow installation guidance for Codex and Claude Code.
- Workflow and creative direction pack recommendation.
- Animation Capability Atlas read surfaces.
- Atlas-backed `capabilityStackSelection` in generated package context.
- Backend-neutral 2D forge task contracts.
- `agent-sprite-forge` as the first recommended 2D asset forge backend.
- HyperFrames runtime doctor, lint, inspect, snapshot, preview, and render command paths.
- Evidence-backed package status, validation, repair, release gates, and real scenario rehearsal.

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
6. Tag `v0.4.0-alpha.3` only after human review.
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
