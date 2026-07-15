# Framepack Build Studio Revision Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Framepack own versioned creative builds, skill-driven motion decisions, and a compact Codex-consistent preview/approval studio before handing a frozen build to HyperFrames.

**Architecture:** A build becomes an immutable directory at `.framepack/builds/<build-id>/`; root-level files are no longer the working preview source. Skills produce a classified decision ledger, the arsenal can schedule several actions per scene, and the audit consumes those receipts. The browser becomes a three-column review desk: build list, preview/timeline, and judgment/approval.

**Tech Stack:** TypeScript, Zod, Vitest, Node HTTP server, vanilla browser JavaScript and CSS.

---

## Scope and non-goals

- This revision changes Framepack's pre-handoff workspace only. HyperFrames remains the final compatibility and rendering adapter.
- The studio does not become a timeline editor or a second creative runtime. Codex remains the authoring surface.
- An old root `index.html` is never modified by `build`; it can only be created by explicit handoff export in a later integration step.
- Existing baseline failures caused by the stale official-GSAP hashes are recorded separately; they are not silently weakened or bypassed.

## Planned files

- Create `packages/director-contracts/src/build.ts` — immutable build, skill decision, and motion-coverage schemas.
- Modify `packages/director-contracts/src/index.ts` — export build contracts and define build-root paths.
- Modify `packages/director-contracts/src/arsenal.ts` — permit several timed weapon selections per scene.
- Modify `packages/director-engine/src/preview-composer.ts` — compose only into an immutable build directory and persist receipts there.
- Modify `packages/director-engine/src/approval.ts` and `audit.ts` — resolve evidence from the current build and require coverage evidence for approval/handoff.
- Modify `packages/director-engine/src/skill-runtime.ts` — write a classified, output-linked decision ledger.
- Modify `packages/director-engine/src/weapon-runtime.ts` — schedule multiple weapon calls and prove every selection was invoked.
- Create `packages/director-engine/src/motion-coverage.ts` — calculate per-scene active time, quiet gaps, and coverage status from scheduled actions.
- Modify `apps/director-workbench/src/api.ts` and `server.ts` — serve the selected immutable build and expose build/motion data.
- Modify `apps/director-workbench/public/index.html`, `main.js`, and `style.css` — compact Codex-style review desk.
- Modify focused tests in `tests/preview-composer.test.ts`, `tests/audit.test.ts`, `tests/skill-runtime.test.ts`, `tests/weapon-runtime.test.ts`, `tests/server.test.ts`, and `tests/workbench-copy.test.ts`.

## Todo list

### Task 1: Introduce immutable build contracts

- [ ] Add a failing contract test for a `FramepackBuild` whose `root`, `htmlEntry`, storyboard, weapon receipt, snapshots, audit, and approval all stay under one build directory.
- [ ] Add `BuildManifestSchema`, `SkillDecisionLedgerSchema`, and `MotionCoverageSchema` to `packages/director-contracts/src/build.ts`.
- [ ] Add `buildRoot`, `buildManifest`, `motionCoverage`, and `skillDecisionLedger` to `PROJECT_FILES`.
- [ ] Re-run the contract test and commit this schema-only change.

### Task 2: Build into `.framepack/builds/<build-id>`

- [ ] Add a failing composer test proving two builds create two distinct directories and neither changes a pre-existing project-root `index.html`.
- [ ] Compute the semantic build id before writing files, then write `index.html`, `public/`, build report, weapon receipt, and manifest under `.framepack/builds/<build-id>/`.
- [ ] Store the current build pointer in `.framepack/current-build.json` and make `readCurrentBuildEvidence` resolve it.
- [ ] Re-run composer and approval tests and commit the isolated-build change.

### Task 3: Turn skill loading into classified production decisions

- [ ] Add a failing runtime test asserting every loaded skill has one role: `director`, `producer`, `motion`, `review`, or `adapter`.
- [ ] Write `.framepack/skill-decision-ledger.json`; each applied skill must declare its output paths and output hashes.
- [ ] Require the composer to reject a build if a ledger-declared storyboard, weapon-plan, or motion output has changed without a refreshed skill application.
- [ ] Re-run skill runtime tests and commit the decision-ledger change.

### Task 4: Upgrade weapons from one-per-scene to an action package

- [ ] Add a failing weapon-runtime test with three actions in one scene: entrance, emphasis, and transition-out.
- [ ] Extend a weapon selection with `atSeconds`, `durationSeconds`, and `stage`; validate that its window stays inside its scene.
- [ ] Resolve multiple proven weapons per matching scene, schedule each at a distinct beat, and verify every planned call appears in HTML.
- [ ] Re-run weapon and composer tests and commit the action-package change.

### Task 5: Add motion-coverage evidence and approval gate

- [ ] Add failing tests for a scene with only an opening animation (`motion-density-low`) and for a layered scene that passes coverage.
- [ ] Calculate active seconds, coverage ratio, and quiet gaps from planned action windows; save `motion-coverage.json` in the build.
- [ ] Make audit include motion coverage and make approval/handoff reject a build with a critical coverage finding unless it is explicitly waived as taste risk.
- [ ] Re-run audit tests and commit the coverage gate.

### Task 6: Replace the nine-stage cockpit with a compact review desk

- [ ] Add failing copy/layout tests for the required three regions: Builds, Preview, and Judgment.
- [ ] Replace the phase ribbon with compact build status, build hash, and a single primary action.
- [ ] Show scene timeline, motion coverage, evidence freshness, compare state, revise/approve/waive controls, and a disabled handoff action until all gates pass.
- [ ] Preserve Chinese primary copy, accessible controls, connection-loss state, and no fake Codex chat.
- [ ] Re-run server/workbench tests and commit the review-desk change.

### Task 7: Validate and document the new boundary

- [ ] Update the director-workbench design document with the new immutable-build, skill-category, and compact-studio rules.
- [ ] Run focused tests, typecheck, plugin validation, migration validation, then the full test suite.
- [ ] Record stale GSAP-hash baseline failures separately if still present; do not mark the full suite green unless they are genuinely fixed.
- [ ] Commit the final documentation and verification evidence.

## Acceptance checks

- A rebuild creates a new `.framepack/builds/<build-id>/` and cannot overwrite any existing build or root `index.html`.
- An approval and handoff only refer to the exact current build directory and its content hash.
- Every applied skill has a category, concrete output paths, output hashes, and a receipt that the build can verify.
- A scene can contain multiple scheduled weapons; their windows are proven in the generated timeline.
- Motion coverage identifies long static gaps before approval.
- The Studio is a compact, keyboard-friendly review desk that visually continues Codex's restrained dark language.
