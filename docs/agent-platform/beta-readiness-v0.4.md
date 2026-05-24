# Framepack 0.4 Beta Readiness Review

Review ID: `BETA-READINESS-06`

Date: 2026-05-22

Status: beta published and trial passed

This document records the evidence that moved Framepack `0.4` from the npm `alpha` tag to the first npm `beta` release line.

## Current Beta Baseline

The current published beta line is `framepack@0.4.0-beta.1`.

The beta line has proven:

- The package installs from npm through `framepack@beta`.
- The CLI exposes stable `--version` and `--help` first-run checks.
- MCP discovery works through `framepack mcp --describe`.
- Codex and Claude Code project workflow files can be initialized.
- Workflow packs and creative direction packs can be recommended.
- Animation Capability Atlas recommendations can be queried.
- Game-ad sprite-video packages persist `capabilityStackSelection`.
- Backend-neutral forge tasks are generated for character, map, and FX assets.
- Package validation, status, repair, release smoke, scenario rehearsal, and install smoke gates are automated.
- The one-prompt onboarding path is now packaged for npm users.
- The beta candidate release note is recorded in [`release-candidate-v0.4.0-beta.1.md`](release-candidate-v0.4.0-beta.1.md).
- The beta feedback loop is recorded in [`beta-feedback-loop-v0.4.md`](beta-feedback-loop-v0.4.md).
- The beta product-state cutoff is recorded in [`v0.4-beta-product-state-cutoff.md`](v0.4-beta-product-state-cutoff.md).

## Evidence Already Collected

Release gate:

- `npm run release:gate` passes on `0.4.0-beta.1`.
- The gate includes typecheck, full test suite, npm pack dry-run, and real install smoke.
- Latest observed full suite for `0.4.0-beta.1`: `140/140 checks passed`.
- Latest observed npm pack dry-run for `0.4.0-beta.1`: `entryCount 202`.

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

Platform onboarding trials:

- `BETA-ONBOARDING-08` installed `framepack@alpha` in separate clean Codex and Claude Code projects.
- Trial evidence is recorded in [`beta-onboarding-trials-v0.4.md`](beta-onboarding-trials-v0.4.md).
- Codex onboarding generated `AGENTS.md`, `.framepack/agent/codex/SKILL.md`, and `.framepack/agent/codex/INSTALL.md` without creating `CLAUDE.md`.
- Claude Code onboarding generated `CLAUDE.md` and `.mcp.json` without creating the Codex skill file.
- Both trials generated, validated, and status-checked a package after install.

HyperFrames compatibility:

- `HYPERFRAMES-COMPAT-09` verified the runtime path against the current npm latest HyperFrames line.
- Review evidence is recorded in [`hyperframes-compat-v0.4.md`](hyperframes-compat-v0.4.md).
- npm reported HyperFrames `latest` as `0.6.40`.
- Framepack dependency was updated from `hyperframes ^0.5.5` to `hyperframes ^0.6.40`.
- A Framepack-generated markdown package passed validation, status, runtime lint, and runtime inspect with HyperFrames `0.6.40`.
- `npm run release:gate` passed after the dependency update, including install smoke from a packed tarball.

Published beta trial:

- `BETA-CANDIDATE-10` published `framepack@0.4.0-beta.1` to the npm `beta` tag.
- Trial evidence is recorded in [`real-user-trial-v0.4.0-beta.1.md`](real-user-trial-v0.4.0-beta.1.md).
- npm dist-tags were `latest: 0.4.0-alpha.1`, `alpha: 0.4.0-alpha.4`, and `beta: 0.4.0-beta.1`.
- A clean project installed `framepack@beta`, verified version/help/MCP, initialized Codex and Claude Code workflow files, generated a package, validated it, checked status, and detected HyperFrames `0.6.40`.

Published package verification:

- npm beta tag resolves to `0.4.0-beta.1`.
- npm alpha tag remains on `0.4.0-alpha.4`.
- GitHub prereleases exist for the alpha and beta lines.
- `latest` is intentionally not advanced to the beta line.

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

There are no remaining blockers for the first beta publication. Post-beta work should focus on feedback, visual QA artifacts, optional skill detection, and community pack expansion.

## Non-Blocking Alpha Debt

These can remain post-beta work if they are documented clearly:

- Automatic external skill detection for `agent-sprite-forge`.
- Automatic installation prompts for optional forge skills.
- Hosted model integration for Seedance 2.0, Gemini Omni, or Kling AI 3.0.
- Full template pack contract implementation.
- Community pack registry and contribution workflow.
- MCP long-running task persistence beyond current structured command surfaces.

## Recommended Next Work

1. Tag `v0.4.0-beta.1` after this published-beta evidence is committed.
2. Create the GitHub prerelease for `v0.4.0-beta.1`.
3. Treat [`BETA-CUTOFF-12`](v0.4-beta-product-state-cutoff.md) as the closed beta baseline.
4. Start the [`BETA-PATCH-RADAR-13`](beta-patch-radar-v0.4.md) loop from real `BETA-FEEDBACK-11` reports.

## Decision

Framepack `0.4.0-beta.1` is the first published beta.

The beta publication criteria have been met. `BETA-GATE-07` addressed route coverage and visual QA policy; `BETA-ONBOARDING-08` addressed separate Codex and Claude Code install trials; `HYPERFRAMES-COMPAT-09` addressed HyperFrames compatibility and updated the runtime dependency to `^0.6.40`; `BETA-CANDIDATE-10` published and verified `framepack@beta`.

## Plain-Language Summary

Framepack can now be installed from npm as `framepack@beta`, connected to agents, and used to generate valid video project packages. `BETA-GATE-07` added the missing website scenario and a clear visual QA rule: do not call a package visually ready without validation, runtime health, and inspect or snapshot evidence when runtime is available. `BETA-ONBOARDING-08` proved Codex and Claude Code onboarding separately. `HYPERFRAMES-COMPAT-09` proved the package still works with the newer HyperFrames runtime. `BETA-CANDIDATE-10` proved the published beta package works in a clean project.
