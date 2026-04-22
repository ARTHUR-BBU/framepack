# Framepack Phase 2 HyperFrames Runtime Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade Framepack from a HyperFrames-ready package generator into a runtime-aware tool that can detect, describe, and invoke the local HyperFrames CLI.

**Architecture:** Keep planning and packaging stable, and deepen only the `src/runtime/hyperframes/*` boundary. Runtime discovery, capability normalization, command construction, and execution wrapping all stay behind the adapter so CLI and future Studio interfaces only express intent.

**Tech Stack:** TypeScript, Node.js child-process APIs, file-system manifests, HyperFrames CLI integration, JSON/Markdown package artifacts, TDD

---

## Progress Tracking

### Milestones

- `M1` Runtime discovery works and reports local HyperFrames version/capabilities
- `M2` Package-to-runtime contract produces stable preview/validate/render commands
- `M3` CLI can run `runtime doctor` and `preview`
- `M4` CLI can run `render`
- `M5` Docs and smoke coverage reflect the runtime-integrated workflow

### Status Board

- `M1`: pending
- `M2`: pending
- `M3`: pending
- `M4`: pending
- `M5`: pending

### Reporting Format

Every execution update should include:

1. current batch
2. completed items
3. verification results
4. risks or blockers
5. next step

## File Structure

- Modify: `F:\hyperframes\src\runtime\hyperframes\types.ts`
  - Enrich runtime contracts for command construction and execution results.
- Modify: `F:\hyperframes\src\runtime\hyperframes\adapter.ts`
  - Add discovery, capability normalization, command building, and execution wrappers.
- Create: `F:\hyperframes\src\runtime\hyperframes\commands.ts`
  - Centralize command-intent to CLI-args mapping.
- Create: `F:\hyperframes\src\runtime\hyperframes\discovery.ts`
  - Probe local HyperFrames installation and parse CLI metadata.
- Create: `F:\hyperframes\src\runtime\hyperframes\execution.ts`
  - Wrap child-process execution and normalize output.
- Modify: `F:\hyperframes\src\video\package\project-package.ts`
  - Emit richer runtime manifest and dynamic `COMMANDS.md`.
- Modify: `F:\hyperframes\src\packaging\documents.ts`
  - Generate runtime-aware command docs and doctor guidance.
- Modify: `F:\hyperframes\src\interfaces\cli\index.ts`
  - Add `runtime doctor`, `preview`, and `render` orchestration.
- Modify: `F:\hyperframes\src\cli.ts`
  - Keep as thin wrapper around the CLI interface layer.
- Modify: `F:\hyperframes\scripts\run-tests.mjs`
  - Cover discovery, command building, runtime docs, and CLI surfaces.
- Modify: `F:\hyperframes\README.md`
  - Document runtime prerequisites and workflow.

## Batch A: Runtime discovery and capability model

**Files:**
- Create: `F:\hyperframes\src\runtime\hyperframes\discovery.ts`
- Modify: `F:\hyperframes\src\runtime\hyperframes\types.ts`
- Modify: `F:\hyperframes\src\runtime\hyperframes\adapter.ts`
- Modify: `F:\hyperframes\scripts\run-tests.mjs`

- [ ] **Step 1: Write the failing discovery tests**

Add tests that verify:
- capability detection can represent `available` vs `missing`
- version parsing can normalize a detected CLI version
- fallback notes explain missing runtime clearly

Expected failure: runtime discovery helpers and new capability fields do not exist.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`  
Expected: FAIL on missing discovery module or missing fields.

- [ ] **Step 3: Implement runtime discovery**

Add a discovery module that can:
- inspect a provided version string for tests
- probe local `hyperframes --version` or equivalent runtime entry
- report whether the runtime is available

Do not execute preview/render yet.

- [ ] **Step 4: Extend capability contracts**

Add minimum new fields:
- `available: boolean`
- `binary: string`
- `detectedAt: string`

Keep existing fields stable so Phase 1 callers do not break.

- [ ] **Step 5: Update adapter entrypoints**

Make `detectHyperframesCapabilities()` delegate to discovery and return normalized capability data.

- [ ] **Step 6: Run test to verify it passes**

Run: `npm test`  
Expected: PASS with runtime discovery covered.

- [ ] **Step 7: Commit**

```bash
git add src/runtime/hyperframes/discovery.ts src/runtime/hyperframes/types.ts src/runtime/hyperframes/adapter.ts scripts/run-tests.mjs
git commit -m "feat: add hyperframes runtime discovery"
```

## Batch B: Command builder and package runtime contract

**Files:**
- Create: `F:\hyperframes\src\runtime\hyperframes\commands.ts`
- Modify: `F:\hyperframes\src\runtime\hyperframes\types.ts`
- Modify: `F:\hyperframes\src\runtime\hyperframes\adapter.ts`
- Modify: `F:\hyperframes\src\video\package\project-package.ts`
- Modify: `F:\hyperframes\src\packaging\documents.ts`
- Modify: `F:\hyperframes\scripts\run-tests.mjs`

- [ ] **Step 1: Write the failing command-builder tests**

Add tests that verify:
- preview/validate/render command specs are built from package metadata
- CLI and packaging code no longer embed raw `npx hyperframes ...` strings
- `COMMANDS.md` reflects the built runtime command specs

Expected failure: command builder does not exist and docs still use static command text.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`  
Expected: FAIL on missing command builder or stale package docs.

- [ ] **Step 3: Implement command builder**

Create a module that converts:
- action: `doctor | preview | validate | render`
- package runtime info
- capabilities

Into a normalized command spec:
- executable
- args
- cwd
- summary

- [ ] **Step 4: Update runtime adapter**

Expose adapter methods:
- `describePackage(...)`
- `buildCommand(...)`

The adapter must own the mapping from engineering package to runtime entrypoints.

- [ ] **Step 5: Update package docs**

Generate `meta.json` and `COMMANDS.md` from the adapter output rather than static strings.

- [ ] **Step 6: Run test to verify it passes**

Run: `npm test`  
Expected: PASS with package runtime contract and command docs covered.

- [ ] **Step 7: Commit**

```bash
git add src/runtime/hyperframes/commands.ts src/runtime/hyperframes/types.ts src/runtime/hyperframes/adapter.ts src/video/package/project-package.ts src/packaging/documents.ts scripts/run-tests.mjs
git commit -m "feat: add hyperframes runtime command builder"
```

## Batch C: Runtime execution wrapper and CLI integration

**Files:**
- Create: `F:\hyperframes\src\runtime\hyperframes\execution.ts`
- Modify: `F:\hyperframes\src\runtime\hyperframes\types.ts`
- Modify: `F:\hyperframes\src\runtime\hyperframes\adapter.ts`
- Modify: `F:\hyperframes\src\interfaces\cli\index.ts`
- Modify: `F:\hyperframes\src\cli.ts`
- Modify: `F:\hyperframes\scripts\run-tests.mjs`

- [ ] **Step 1: Write the failing runtime-execution tests**

Add tests that verify:
- `runtime doctor` reports available/missing runtime
- `preview` uses adapter-built command specs
- `render` returns a normalized execution result

Expected failure: execution wrapper and CLI commands do not exist.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`  
Expected: FAIL on missing CLI command paths or missing execution wrapper.

- [ ] **Step 3: Implement execution wrapper**

Wrap child-process execution so runtime actions return:
- `action`
- `success`
- `outputPaths`
- `warnings`
- `summary`
- `exitCode`
- `stdout`
- `stderr`

- [ ] **Step 4: Integrate CLI commands**

Add CLI actions:
- `runtime doctor`
- `preview`
- `render`

Keep existing `init / generate / validate` behavior unchanged.

- [ ] **Step 5: Make preview/render respect package contract**

Require these commands to run against a generated engineering package directory and resolve:
- root entry
- composition directory
- asset directory

- [ ] **Step 6: Run verification**

Run:
- `npm run typecheck`
- `npm test`
- `npm run build`

Expected:
- all pass
- new CLI commands are covered

- [ ] **Step 7: Commit**

```bash
git add src/runtime/hyperframes/execution.ts src/runtime/hyperframes/types.ts src/runtime/hyperframes/adapter.ts src/interfaces/cli/index.ts src/cli.ts scripts/run-tests.mjs
git commit -m "feat: add hyperframes runtime execution commands"
```

## Batch D: Docs, prerequisites, and smoke coverage

**Files:**
- Modify: `F:\hyperframes\README.md`
- Modify: `F:\hyperframes\src\packaging\documents.ts`
- Modify: `F:\hyperframes\scripts\run-tests.mjs`
- Modify: `F:\hyperframes\src\video\package\project-package.ts`

- [ ] **Step 1: Write the failing doc/smoke tests**

Add tests that verify:
- README documents runtime prerequisites
- package docs explain missing-runtime guidance
- doctor output and package docs stay consistent

Expected failure: docs and smoke coverage do not reflect the runtime-integrated workflow.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`  
Expected: FAIL on missing text or stale docs.

- [ ] **Step 3: Update docs**

Document:
- HyperFrames is required for runtime execution, not for package generation
- Framepack detects runtime availability
- users can generate packages before installing HyperFrames
- `runtime doctor`, `preview`, and `render` workflows

- [ ] **Step 4: Update package docs**

Ensure generated `COMMANDS.md` and `HANDOFF.md` explain:
- runtime availability assumptions
- next commands to run
- install guidance when runtime is missing

- [ ] **Step 5: Run final verification**

Run:
- `npm run typecheck`
- `npm test`
- `npm run build`

Expected:
- all pass
- README and generated docs match the implemented workflow

- [ ] **Step 6: Commit**

```bash
git add README.md src/packaging/documents.ts src/video/package/project-package.ts scripts/run-tests.mjs
git commit -m "docs: add runtime integration workflow guidance"
```

## Self-Review Checklist

- Spec coverage:
  - runtime discovery: covered by Batch A
  - command builder and runtime manifest: covered by Batch B
  - runtime execution and CLI actions: covered by Batch C
  - docs and smoke coverage: covered by Batch D
- Placeholder scan:
  - no TODO/TBD markers
  - every batch has explicit verification and commit steps
- Type consistency:
  - capability, command spec, package runtime info, and execution result remain adapter-owned types
