# Framepack v0.4.0-beta.1 Release Candidate

Framepack `v0.4.0-beta.1` is the first beta candidate for the 0.4 agent-platform line.

It promotes the alpha line after the beta gates added evidence for:

- four practical generation routes: markdown, thread, website, and game-ad sprite-video
- separate Codex and Claude Code onboarding trials
- HyperFrames `0.6.40` compatibility
- release gate coverage with typecheck, full tests, npm pack dry-run, and installed-package smoke

The stable beta first-run checks are:

```bash
npx -y -p framepack@beta framepack --version
npx -y -p framepack@beta framepack --help
npm exec --yes --package=framepack@beta -- framepack mcp --describe
```

## What Changed Since v0.4.0-alpha.4

- Promoted the package version to `0.4.0-beta.1`.
- Updated the CLI first-run guidance from the npm `alpha` tag to the npm `beta` tag.
- Upgraded the HyperFrames dependency from `^0.5.5` to `^0.6.40`.
- Added `HYPERFRAMES-COMPAT-09` evidence for `runtime doctor`, `runtime lint`, `runtime inspect`, and `runtime upgrade-check`.
- Added `BETA-ONBOARDING-08` evidence for separate Codex and Claude Code clean install trials.
- Added the website route to the release scenario gate.
- Kept `latest` untouched; beta should publish to the npm `beta` tag.

## Final Gate

Before publishing this beta, run:

```bash
npm run release:gate
npm run release:scenarios
```

The release gate runs:

- `npm run typecheck`
- `npm test`
- `npm pack --dry-run --json`
- `npm run release:smoke:install`

`release:smoke:install` builds the package, creates a real npm tarball, installs that tarball into a temporary empty consumer project, and then exercises version, help, MCP discovery, Atlas discovery, `release-smoke`, `generate --auto-pack`, `validate`, and `status --json`.

## Beta Trial Requirement

After publishing to npm `beta`, run a fresh real user trial against `framepack@beta`, not the source checkout.

The trial should verify:

- `npx -y -p framepack@beta framepack --version`
- `npx -y -p framepack@beta framepack --help`
- `npm exec --yes --package=framepack@beta -- framepack mcp --describe`
- `framepack init-agent --target codex --scope project`
- `framepack init-agent --target claude-code --scope project`
- `framepack packs recommend`
- `framepack atlas recommend`
- package generation
- package validation
- package status with stable `readiness` and `nextActionItems`
- HyperFrames runtime availability through the installed dependency

## In Scope

- Agent-first npm beta onboarding.
- Codex and Claude Code workflow initialization.
- MCP generation, status, validation, repair, capture, sync, runtime, workflow-pack, and capability-atlas surfaces.
- Backend-neutral Asset Forge task contracts.
- `agent-sprite-forge` recommendation without automatic external skill installation.
- HyperFrames `0.6.40` as the beta runtime dependency.
- Evidence-backed readiness, visual QA boundaries, release gates, and real scenario rehearsals.

## Out Of Scope

- Advancing npm `latest`.
- Installing external skills automatically.
- Calling hosted video models automatically.
- Claiming final rendered videos without runtime and visual evidence.
- Orchestrating HyperFrames `lambda` in this beta.

## Manual Release Checklist

1. Confirm branch `framepack-agent-platform` is clean.
2. Run `npm run release:gate`.
3. Run `npm run release:scenarios`.
4. Run `npm publish --access public --tag beta --dry-run`.
5. Publish with `npm publish --access public --tag beta`.
6. Verify `npm view framepack dist-tags versions --json`.
7. Run the fresh beta real user trial and record the evidence.
8. Tag `v0.4.0-beta.1` only after npm and trial evidence are confirmed.

## Plain-Language Summary

This beta candidate means Framepack is no longer just proving isolated alpha features. It has enough packaging, agent onboarding, MCP surface, route coverage, runtime compatibility, and release-gate evidence to invite beta users. The beta still does not mean Framepack creates finished videos by itself; it means agents can reliably install Framepack, generate executable video project packages, inspect what is missing, and hand those packages to HyperFrames and optional asset-production tools.
