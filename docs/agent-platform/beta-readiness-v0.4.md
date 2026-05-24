# Framepack 0.4 Beta Readiness Review

Review ID: `BETA-READINESS-06`

Date: 2026-05-22

Status: beta-track candidate, beta gate in progress

This document evaluates what must be true before Framepack `0.4` should move from the npm `alpha` tag to a beta release line.

## Current Alpha Baseline

The current published alpha line is `framepack@0.4.0-alpha.4`.

The alpha line has proven:

- The package installs from npm through `framepack@alpha`.
- The CLI exposes stable `--version` and `--help` first-run checks.
- MCP discovery works through `framepack mcp --describe`.
- Codex and Claude Code project workflow files can be initialized.
- Workflow packs and creative direction packs can be recommended.
- Animation Capability Atlas recommendations can be queried.
- Game-ad sprite-video packages persist `capabilityStackSelection`.
- Backend-neutral forge tasks are generated for character, map, and FX assets.
- Package validation, status, repair, release smoke, scenario rehearsal, and install smoke gates are automated.
- The one-prompt onboarding path is now packaged for npm users.

## Evidence Already Collected

Release gate:

- `npm run release:gate` passes on `0.4.0-alpha.4`.
- The gate includes typecheck, full test suite, npm pack dry-run, and real install smoke.
- Latest observed full suite before `BETA-GATE-07`: `137/137 checks passed`.
- Latest observed npm pack dry-run before `BETA-GATE-07`: `entryCount 198`.

Real scenario rehearsal:

- `npm run release:scenarios` passes.
- `markdown-product-explainer` validates and reaches readiness `ready`.
- `thread-editorial-video` validates and reaches readiness `needs-assets`.
- `website-product-video` validates and reaches readiness `needs-assets`.
- `game-ad-sprite-video` validates and reaches readiness `needs-assets`.
- Game-ad next actions include `sync-assets` and `produce-forge-assets`.

BETA-GATE-07 promotes the website route into `release:scenarios`, turning the rehearsal from three routes into four routes.

Real user trial:

- `REAL-USER-TRIAL-03` installed `framepack@alpha` in a clean project outside the source checkout.
- The trial initialized Codex and Claude Code workflow files.
- The trial generated and validated a game-ad sprite-video package.
- The package recorded workflow pack `game-ad-sprite-video`, creative direction pack `game-ad-retro-arcade`, capability stack `game-ad-sprite-video-stack`, and forge execution kinds `forge-character-pack`, `forge-map-pack`, and `forge-fx-pack`.

Published package verification:

- npm alpha tag resolves to the latest alpha.
- GitHub prereleases exist for the alpha line.
- `latest` is intentionally not advanced to the alpha line.

## Beta Entry Criteria

Framepack can enter beta when these criteria are true:

1. Installation path is repeatable.
   - `framepack@alpha` or the beta candidate installs in a clean project.
   - `npx framepack --version`, `--help`, and `mcp --describe` work after install.
   - Codex and Claude Code setup files are generated and documented.

2. Package protocol is stable enough for agent handoff.
   - `PACKAGE_MANIFEST.json`, `HANDOFF.md`, `VIDEO_BRIEF.json`, `ASSET_EXECUTION_PLAN.json`, `CAPABILITY_GRAPH.json`, and `RUNTIME_MANIFEST.json` are documented and tested.
   - `validate`, `status --json`, and `repair` preserve package consistency.
   - `readiness` and `nextActionItems` are the primary automation surface.

3. Route coverage proves practical use.
   - Markdown/product explainer route passes.
   - Thread/editorial route passes.
   - Game-ad sprite-video route passes.
   - Website route passes in the scenario rehearsal.

4. Agent-first MCP surface is coherent.
   - MCP `generateProject`, `getStatus`, `validatePackage`, `repairPackage`, `captureAssets`, `syncAssets`, `runtimeDoctor`, `listWorkflowPacks`, `recommendPacks`, `listCapabilityAtlas`, and `recommendCapabilityStack` remain discoverable.
   - `exposeArsenal`, `getCapabilityGraph`, and `explainCapabilityGaps` continue to expose information without pretending to make creative decisions.

5. Asset Forge Layer is honest.
   - `agent-sprite-forge` remains recommended, not required.
   - Packages tell agents when to use `$generate2dsprite` or `$generate2dmap` if those skills are installed.
   - Manual, custom, and existing-asset paths remain valid.
   - Framepack does not claim assets are produced until outputs and metadata exist.

6. Runtime and visual evidence boundaries are explicit.
   - HyperFrames runtime commands remain discoverable.
   - `runtime doctor`, `lint`, `inspect`, and `snapshot` behavior is documented.
   - Beta documentation must not imply a finished video exists when only a project package exists.
   - Visual-ready claims require package validation plus runtime/visual evidence when HyperFrames is available.

## Visual QA Minimum For Beta

Before an agent may say a Framepack package is visually ready or render-ready in beta, it must have evidence for:

1. Package protocol health.
   - `framepack validate --project-dir <package>` passes.
   - `framepack status --project-dir <package> --json` reports `protocolStatus: "passed"`.

2. Runtime health.
   - `framepack runtime doctor --project-dir <package>` passes, or the agent reports that runtime availability is the blocker.

3. Visual inspection evidence when runtime is available.
   - Run `framepack runtime inspect --project-dir <package> --json`, or
   - run `framepack runtime snapshot --project-dir <package>` and preserve snapshot evidence.

4. Asset honesty.
   - Pending capture or forge assets prevent render-ready claims.
   - Forge outputs must have existing files and synced metadata before being treated as available.

This policy does not require HyperFrames rendering in every release gate. It defines the minimum evidence an agent must collect before making visual-readiness claims to a user.

## Beta Blockers

These are the main gaps before a credible beta:

- Separate beta-tag real user trials remain required after a beta candidate exists.
- A beta candidate should run a fresh real user trial against the actual beta tag, not only alpha3/alpha4.
- HyperFrames compatibility should be checked explicitly near beta tagging, including `runtime upgrade-check` or a documented manual check.
- Agent onboarding should be tested in one clean Codex-oriented project and one clean Claude Code-oriented project, not only initialized in the same trial workspace.

## Non-Blocking Alpha Debt

These can remain post-beta work if they are documented clearly:

- Automatic external skill detection for `agent-sprite-forge`.
- Automatic installation prompts for optional forge skills.
- Hosted model integration for Seedance 2.0, Gemini Omni, or Kling AI 3.0.
- Full template pack contract implementation.
- Community pack registry and contribution workflow.
- MCP long-running task persistence beyond current structured command surfaces.

## Recommended Next Work

1. Run `npm run release:scenarios` and confirm all four routes pass.
2. Run a clean Codex-oriented install trial and a clean Claude Code-oriented install trial separately.
3. Run HyperFrames compatibility review.
4. Publish `0.4.0-beta.1` only after the above gates pass.

## Decision

Framepack `0.4.0-alpha.4` is strong enough to serve as the alpha baseline for beta preparation.

It is not yet beta-ready because beta should still prove platform onboarding separation and HyperFrames compatibility near the beta tag. `BETA-GATE-07` addresses route coverage and visual QA policy; the next gate should address separate Codex and Claude Code install trials.

## Plain-Language Summary

Framepack can already be installed from npm, connected to agents, and used to generate valid video project packages. `BETA-GATE-07` adds the missing website scenario and a clear visual QA rule: do not call a package visually ready without validation, runtime health, and inspect or snapshot evidence when runtime is available. To call it beta, we still need separate Codex and Claude Code install trials and a near-release HyperFrames compatibility check.
