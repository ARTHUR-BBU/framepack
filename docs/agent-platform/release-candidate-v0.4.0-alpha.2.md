# Framepack v0.4.0-alpha.2 Release Candidate

Framepack `v0.4.0-alpha.2` is the first install-experience hardening release after the initial video-production Agent Harness alpha.

It keeps the `v0.4.0-alpha.1` architecture intact and tightens the first-run path for users and agents installing Framepack from npm:

- `framepack --version` returns the package version.
- `framepack --help` prints a compact first-run command guide.
- The npm `bin.framepack` path is normalized to `dist/cli.js` to avoid publish-time bin cleanup warnings.
- The recommended public install check is `npm exec --package=framepack@alpha -- framepack mcp --describe`.
- The Animation Capability Atlas and `capabilityStackSelection` behavior from `v0.4.0-alpha.1` remain in scope.

## What Changed Since v0.4.0-alpha.1

- Added first-run CLI affordances for npm users.
- Clarified the npm alpha execution path in README and AGENTS guidance.
- Preserved the MCP, workflow pack, creative direction pack, release smoke, scenario, capability graph, runtime manifest, and Asset Forge Layer gates from the previous alpha.

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

`release:smoke:install` builds the package, creates a real npm tarball, installs that tarball into a temporary empty consumer project, then runs the installed `framepack` binary through MCP discovery, Atlas discovery, `release-smoke`, `generate --auto-pack`, `validate`, and `status --json`.

## In Scope

- First-run CLI help and version checks.
- Agent-native workflow installation for Codex and Claude Code.
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
- Framepack does not publish or tag the release automatically.
- Framepack does not become a game engine, full video editor, or image generator.
- Framepack does not make frontier model availability guarantees for Seedance 2.0, Gemini Omni, or Kling AI 3.0.

## Manual Release Checklist

1. Confirm branch `framepack-agent-platform` is clean.
2. Run `npm run release:gate`.
3. Run `npm run release:scenarios`.
4. Review `CHANGELOG.md`, `README.md`, `README.zh-CN.md`, `AGENTS.md`, and this alpha note.
5. Check `npm publish --access public --tag alpha --dry-run` for tarball contents and publish warnings.
6. Tag `v0.4.0-alpha.2` only after human review.
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
