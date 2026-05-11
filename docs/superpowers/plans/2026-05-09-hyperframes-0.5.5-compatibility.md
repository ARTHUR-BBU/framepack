# HyperFrames 0.5.5 Compatibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update Framepack's HyperFrames runtime integration for HyperFrames 0.5.5 while preserving Framepack's role as an agent-native package compiler.

**Architecture:** Keep Framepack as the package compiler and lifecycle orchestrator. Upgrade runtime capability discovery and package commands for agent-safe HyperFrames 0.5.x workflows, but do not turn Framepack into a full HyperFrames CLI proxy.

**Tech Stack:** TypeScript, Node.js >=22, npm, Framepack CLI, HyperFrames CLI 0.5.5.

---

## Summary

HyperFrames latest npm version is `0.5.5`; Framepack currently depends on `^0.4.12`. HyperFrames 0.5.5 adds or strengthens agent-facing capabilities including `inspect`, `snapshot`, `publish`, `remove-background`, `skills`, and `upgrade --check --json`.

User decision:

- Use the broader "extended commands" path.
- Do not include `publish` as a Framepack 0.2 package command.

Confirmed facts:

- `npm view hyperframes version` returned `0.5.5`.
- Local installed HyperFrames is `0.4.12`.
- `hyperframes@0.5.5 --help` lists `publish`, `inspect`, `snapshot`, `remove-background`, `skills`, and `upgrade`.
- `inspect --help` supports `--json`, `--samples`, `--at`, `--tolerance`, `--timeout`, `--max-issues`, `--collapse-static`, `--no-collapse-static`, and `--strict`.
- `snapshot --help` supports `--frames`, `--at`, and `--timeout`.
- `render --help` supports `--format`, `--fps`, `--quality`, `--workers`, `--docker`, `--hdr`, `--crf`, `--video-bitrate`, `--gpu`, `--quiet`, `--strict`, `--strict-all`, and `--max-concurrent-renders`.
- `capture --help` supports `--json`, but Framepack already has its own package asset capture command.
- `remove-background --help` supports local AI background removal, but it is better treated as a future asset pipeline feature.

## M21: Upgrade And Capability Discovery

**Files:**

- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `src/runtime/hyperframes/discovery.ts`
- Modify: `src/runtime/hyperframes/types.ts`
- Modify: `scripts/run-tests.mjs`

- [ ] **Step 1: Write failing tests for HyperFrames 0.5.5 discovery**

Add tests asserting:

- `parseHyperframesVersion("0.5.5")` returns `0.5.5`.
- detected capabilities include `inspect`, `snapshot`, `upgrade`, `skills`, `capture`, and `remove-background`.
- render options include `format`, `fps`, `quality`, `workers`, `docker`, `hdr`, `gpu`, `strict`, and `strict-all`.

Run:

```bash
npm test -- --name "detect local runtime capabilities from a version probe"
```

Expected: FAIL because current defaults do not include the 0.5.x commands/options.

- [ ] **Step 2: Implement capability defaults**

Update runtime capability defaults so missing and detected runtimes both advertise the HyperFrames 0.5.x command and render-option surface.

Do not run `upgrade --check --json` from normal status or discovery.

- [ ] **Step 3: Upgrade dependency**

Run:

```bash
npm install hyperframes@^0.5.5
```

Expected:

- `package.json` depends on `hyperframes: "^0.5.5"`.
- `package-lock.json` resolves HyperFrames 0.5.5 or compatible 0.5.x.

- [ ] **Step 4: Verify M21**

Run:

```bash
npm run typecheck
npm test
npm run build
npm pack --dry-run --json
```

- [ ] **Step 5: Commit M21**

```bash
git add package.json package-lock.json src/runtime/hyperframes/discovery.ts src/runtime/hyperframes/types.ts scripts/run-tests.mjs
git commit -m "feat: update hyperframes runtime capabilities"
```

## M22: Runtime Command Expansion

**Files:**

- Modify: `src/runtime/hyperframes/types.ts`
- Modify: `src/runtime/hyperframes/commands.ts`
- Modify: `src/runtime/hyperframes/adapter.ts`
- Modify: `src/interfaces/cli/index.ts`
- Modify: `scripts/run-tests.mjs`

- [ ] **Step 1: Write failing command spec tests**

Add tests for:

- `runtime lint --project-dir <package>` -> `hyperframes lint <package>`
- `runtime inspect --project-dir <package> --json --samples 9` -> `hyperframes inspect --json --samples 9 <package>`
- `runtime snapshot --project-dir <package> --frames 5` -> `hyperframes snapshot --frames 5 <package>`
- `runtime upgrade-check` -> `hyperframes upgrade --check --json`
- `render --format webm --fps 60 --quality high --strict` passes those options through.

Expected: FAIL because CLI parsing and runtime action types do not yet support these commands.

- [ ] **Step 2: Extend runtime action types and command builder**

Add runtime actions:

- `lint`
- `inspect`
- `snapshot`
- `upgrade-check`

Keep command construction package-scoped for `lint`, `inspect`, and `snapshot`. `upgrade-check` should not require a package directory.

- [ ] **Step 3: Extend CLI parsing**

Add supported CLI commands:

- `framepack runtime lint --project-dir <package>`
- `framepack runtime inspect --project-dir <package> ...`
- `framepack runtime snapshot --project-dir <package> ...`
- `framepack runtime upgrade-check`

Do not add `publish` in Framepack 0.2.

- [ ] **Step 4: Extend passthrough options**

Support:

- inspect: `--json`, `--samples`, `--at`, `--tolerance`, `--timeout`, `--max-issues`, `--collapse-static`, `--no-collapse-static`, `--strict`
- snapshot: `--frames`, `--at`, `--timeout`
- render: `--format`, `--fps`, `--quality`, `--workers`, `--docker`, `--hdr`, `--crf`, `--video-bitrate`, `--gpu`, `--quiet`, `--strict`, `--strict-all`, `--max-concurrent-renders`

- [ ] **Step 5: Verify M22**

Run:

```bash
npm run typecheck
npm test
npm run build
npm pack --dry-run --json
```

- [ ] **Step 6: Commit M22**

```bash
git add src/runtime/hyperframes src/interfaces/cli/index.ts scripts/run-tests.mjs
git commit -m "feat: add hyperframes runtime inspection commands"
```

## M23: Package Protocol And Handoff Alignment

**Files:**

- Modify: `src/core/types.ts`
- Modify: `src/packaging/package-protocol.ts`
- Modify: `src/packaging/documents.ts`
- Modify: `docs/architecture/package-protocol-v1.md`
- Modify: `README.md`
- Modify: `README.zh-CN.md`
- Modify: `AGENTS.md`
- Modify: `scripts/run-tests.mjs`

- [ ] **Step 1: Write failing protocol tests**

Assert `capabilities.packageCommands` includes:

- `runtime-lint`
- `runtime-inspect`
- `runtime-snapshot`
- `runtime-upgrade-check`

Do not include `publish`.

- [ ] **Step 2: Update package protocol commands**

Extend package command types and centralized protocol constants with the new runtime commands.

- [ ] **Step 3: Update generated handoff and command docs**

Generated `HANDOFF.md` and `COMMANDS.md` should explain:

- `runtime lint` validates composition mistakes.
- `runtime inspect` checks visual layout/text overflow across the timeline.
- `runtime snapshot` captures PNG key frames for visual verification.
- `runtime upgrade-check` checks HyperFrames updates explicitly.
- `publish` exists in HyperFrames 0.5.5 but is not orchestrated by Framepack 0.2 because it uploads externally and returns a public URL.

- [ ] **Step 4: Update public docs**

Update README, Chinese README, AGENTS, and protocol docs with the same command boundaries.

- [ ] **Step 5: Golden review**

Run/update golden package protocol summary tests for:

- markdown
- thread
- website
- game-ad

Confirm the command list and handoff text are consistent across routes.

- [ ] **Step 6: Verify M23**

Run:

```bash
npm run typecheck
npm test
npm run build
npm pack --dry-run --json
```

- [ ] **Step 7: Commit M23**

```bash
git add src/core/types.ts src/packaging/package-protocol.ts src/packaging/documents.ts docs/architecture/package-protocol-v1.md README.md README.zh-CN.md AGENTS.md scripts/run-tests.mjs
git commit -m "docs: align package protocol with hyperframes 0.5"
```

## Assumptions

- Framepack 0.2 remains a compiler/orchestrator, not a full HyperFrames wrapper.
- `publish` is excluded from Framepack package lifecycle for 0.2 because it performs external upload/public URL behavior.
- `remove-background` and HyperFrames `capture` are discovered/documented but not package commands in this slice.
- `upgrade-check` is explicit only; no automatic network checks during `status`.
- After M21-M23, proceed to `0.2 release candidate`.
