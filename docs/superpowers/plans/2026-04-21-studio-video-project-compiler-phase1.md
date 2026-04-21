# Studio Video Project Compiler Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the current repository into a Phase 1 Studio Video Project Compiler skeleton that produces a production-style video engineering package from markdown input.

**Architecture:** Reorganize the codebase into ingest, planning, packaging, runtime, and interface layers. Introduce SourceBundle, Script, Storyboard, AssetPlan, HANDOFF, root entry, and composition directory skeletons while keeping HyperFrames as an abstract runtime boundary. Preserve the current `init / generate / validate` CLI surface and existing validation behavior.

**Tech Stack:** TypeScript, Node.js file system APIs, markdown input normalization, file-based package generation, CLI orchestration, JSON and Markdown artifacts

---

## File Structure

- Create: `F:\hyperframes\src\core\types.ts`
  - Shared compiler-level types for source, planning, packaging, and runtime.
- Create: `F:\hyperframes\src\ingest\markdown\index.ts`
  - Markdown-to-SourceBundle compiler.
- Create: `F:\hyperframes\src\planning\brief\index.ts`
  - SourceBundle-to-VideoBrief compiler.
- Create: `F:\hyperframes\src\planning\scenes\index.ts`
  - VideoBrief-to-ScenePlan planner.
- Create: `F:\hyperframes\src\planning\script\index.ts`
  - ScenePlan-to-Script generator.
- Create: `F:\hyperframes\src\planning\storyboard\index.ts`
  - ScenePlan-to-Storyboard generator.
- Create: `F:\hyperframes\src\planning\assets\index.ts`
  - ScenePlan-to-AssetPlan generator.
- Create: `F:\hyperframes\src\planning\validation\index.ts`
  - Validation report generation and guardrail checks.
- Create: `F:\hyperframes\src\packaging\project-package.ts`
  - Package assembly and write-to-disk logic for the expanded engineering layout.
- Create: `F:\hyperframes\src\packaging\documents.ts`
  - Dynamic Markdown document builders for `GUARDRAILS.md`, `HANDOFF.md`, `SCRIPT.md`, and `STORYBOARD.md`.
- Create: `F:\hyperframes\src\runtime\hyperframes\types.ts`
  - Runtime capability and execution-result contracts.
- Create: `F:\hyperframes\src\runtime\hyperframes\adapter.ts`
  - Placeholder HyperFrames runtime adapter and package-entry mapping.
- Create: `F:\hyperframes\src\interfaces\cli\index.ts`
  - CLI command orchestration over the new compiler layers.
- Create: `F:\hyperframes\src\compiler\index.ts`
  - End-to-end orchestration entrypoint.
- Modify: `F:\hyperframes\src\cli.ts`
  - Keep as thin executable wrapper that delegates to `src/interfaces/cli`.
- Modify or replace: legacy `F:\hyperframes\src\video\*`
  - Either remove after migration or re-export temporarily to preserve compatibility during the refactor.
- Modify: `F:\hyperframes\scripts\run-tests.mjs`
  - Cover the new package skeleton and planning artifacts.
- Modify: `F:\hyperframes\test\video\project-package.test.ts`
  - Verify the expanded package output and document content.
- Modify: `F:\hyperframes\README.md`
  - Update repository description and user flow around engineering packages.

## Task 1: Introduce the compiler-level types and boundaries

**Files:**
- Create: `F:\hyperframes\src\core\types.ts`
- Modify: `F:\hyperframes\src\video\types.ts` or replace with re-export shim
- Test: `F:\hyperframes\test\video\project-package.test.ts`

- [ ] **Step 1: Write the failing type-coverage test**

Add a test case that instantiates:
- `SourceBundle`
- `VideoBrief`
- `ScenePlan`
- `Script`
- `Storyboard`
- `AssetPlan`
- `ValidationReport`
- `RuntimeCapabilities`

Expected failure: the new compiler-level types do not exist yet.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`  
Expected: FAIL because the new types are missing from the compiler boundary.

- [ ] **Step 3: Add the shared types**

Define minimum viable interfaces for:
- `SourceBundle`
- `VideoBrief`
- `ScenePlan`
- `Script`
- `Storyboard`
- `AssetPlan`
- `ValidationReport`
- `RuntimeCapabilities`
- `RuntimeExecutionResult`

Keep `website`-related fields as type-level placeholders only. Do not implement fetch logic.

- [ ] **Step 4: Keep compatibility shims**

Update legacy `src/video/types.ts` to re-export from `src/core/types.ts`, or remove the legacy path and update imports in one pass.

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test`  
Expected: PASS for the new type-coverage case.

- [ ] **Step 6: Commit**

```bash
git add src/core/types.ts src/video/types.ts test/video/project-package.test.ts
git commit -m "refactor: add compiler-level shared types"
```

## Task 2: Split markdown ingest from planning

**Files:**
- Create: `F:\hyperframes\src\ingest\markdown\index.ts`
- Create: `F:\hyperframes\src\planning\brief\index.ts`
- Modify: `F:\hyperframes\src\compiler\index.ts`
- Modify: `F:\hyperframes\scripts\run-tests.mjs`

- [ ] **Step 1: Write the failing ingest/planning tests**

Add tests that verify:
- markdown input compiles into a `SourceBundle`
- `SourceBundle` compiles into a `VideoBrief`
- current markdown route still preserves `goal`, `audience`, `constraints`, and source sections

Expected failure: the new ingest and brief modules do not exist.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`  
Expected: FAIL on missing module imports or missing `SourceBundle` behavior.

- [ ] **Step 3: Implement markdown ingest**

Move raw markdown parsing into `src/ingest/markdown/index.ts` and emit:
- `sourceType: "markdown"`
- raw markdown reference
- collected section artifacts
- ingest metadata

- [ ] **Step 4: Implement brief compilation**

Move `VideoBrief` creation into `src/planning/brief/index.ts`.  
The brief compiler must:
- accept `SourceBundle`
- preserve existing style/theme/constraint defaults
- not know anything about HyperFrames runtime details

- [ ] **Step 5: Update the orchestration path**

Wire the compiler entrypoint so the current markdown route is:

`markdown -> SourceBundle -> VideoBrief`

- [ ] **Step 6: Run test to verify it passes**

Run: `npm test`  
Expected: PASS with markdown ingest and brief compilation covered.

- [ ] **Step 7: Commit**

```bash
git add src/ingest/markdown/index.ts src/planning/brief/index.ts src/compiler/index.ts scripts/run-tests.mjs
git commit -m "refactor: split markdown ingest from brief planning"
```

## Task 3: Add Script, Storyboard, and AssetPlan planning artifacts

**Files:**
- Create: `F:\hyperframes\src\planning\script\index.ts`
- Create: `F:\hyperframes\src\planning\storyboard\index.ts`
- Create: `F:\hyperframes\src\planning\assets\index.ts`
- Modify: `F:\hyperframes\src\planning\scenes\index.ts`
- Modify: `F:\hyperframes\src\compiler\index.ts`
- Modify: `F:\hyperframes\scripts\run-tests.mjs`

- [ ] **Step 1: Write the failing planning-artifact tests**

Add tests that verify a markdown case explainer route produces:
- `ScenePlan`
- `Script`
- `Storyboard`
- `AssetPlan`

Expected values:
- `Script` contains per-scene lines derived from the current scene plan
- `Storyboard` contains per-scene visual intent and transition notes
- `AssetPlan` contains empty or placeholder assets instead of being omitted

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`  
Expected: FAIL because the new planning artifact generators do not exist.

- [ ] **Step 3: Implement script generation**

Generate a minimal script object and Markdown representation:
- narration lines
- caption lines
- scene mapping

- [ ] **Step 4: Implement storyboard generation**

Generate a minimal storyboard object and Markdown representation:
- scene id
- visual intent
- motion note
- transition note

- [ ] **Step 5: Implement asset planning**

Generate an `AssetPlan` with:
- `availableAssets`
- `placeholderAssets`
- `missingAssets`

For Phase 1 markdown input, these may all be placeholders or empty arrays, but the file and structure must exist.

- [ ] **Step 6: Update compiler orchestration**

Extend the compiler pipeline so it now produces:

`SourceBundle -> VideoBrief -> ScenePlan -> Script -> Storyboard -> AssetPlan -> ValidationReport`

- [ ] **Step 7: Run test to verify it passes**

Run: `npm test`  
Expected: PASS with all new planning artifacts present in memory.

- [ ] **Step 8: Commit**

```bash
git add src/planning/script/index.ts src/planning/storyboard/index.ts src/planning/assets/index.ts src/planning/scenes/index.ts src/compiler/index.ts scripts/run-tests.mjs
git commit -m "feat: add script storyboard and asset planning artifacts"
```

## Task 4: Expand the package into a production-style engineering skeleton

**Files:**
- Create: `F:\hyperframes\src\packaging\documents.ts`
- Modify: `F:\hyperframes\src\packaging\project-package.ts`
- Modify: `F:\hyperframes\test\video\project-package.test.ts`
- Modify: `F:\hyperframes\scripts\run-tests.mjs`

- [ ] **Step 1: Write the failing package-skeleton tests**

Add tests that require `generate` to emit:
- `VIDEO_BRIEF.json`
- `SCENE_PLAN.json`
- `SCRIPT.md`
- `STORYBOARD.md`
- `ASSET_PLAN.json`
- `VALIDATION_REPORT.json`
- `VALIDATION_REPORT.md`
- `GUARDRAILS.md`
- `HANDOFF.md`
- `COMMANDS.md`
- `meta.json`
- `index.html`
- `compositions/`
- `assets/`

Expected failure: the current package output does not contain the expanded file set or directory skeleton.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`  
Expected: FAIL on missing files and missing directory structure.

- [ ] **Step 3: Implement document builders**

Add builders for:
- `SCRIPT.md`
- `STORYBOARD.md`
- `GUARDRAILS.md`
- `HANDOFF.md`

Dynamic content must reflect the actual package state and validation result.

- [ ] **Step 4: Implement package skeleton assembly**

Update package generation so it creates:
- root `index.html`
- `compositions/` with a minimum sub-composition placeholder file
- `assets/` as an empty or placeholder directory
- `meta.json` with package/runtime metadata

- [ ] **Step 5: Keep current validation and guardrail behavior**

Do not regress:
- failed validation blocks `generate`
- `validate` still writes only validation outputs

- [ ] **Step 6: Run test to verify it passes**

Run: `npm test`  
Expected: PASS with the expanded engineering skeleton verified.

- [ ] **Step 7: Commit**

```bash
git add src/packaging/documents.ts src/packaging/project-package.ts test/video/project-package.test.ts scripts/run-tests.mjs
git commit -m "feat: expand package into video engineering skeleton"
```

## Task 5: Add the HyperFrames runtime boundary

**Files:**
- Create: `F:\hyperframes\src\runtime\hyperframes\types.ts`
- Create: `F:\hyperframes\src\runtime\hyperframes\adapter.ts`
- Modify: `F:\hyperframes\src\packaging\project-package.ts`
- Modify: `F:\hyperframes\scripts\run-tests.mjs`

- [ ] **Step 1: Write the failing runtime-boundary tests**

Add tests that verify:
- `RuntimeCapabilities` exists with version/commands/features fields
- package metadata can describe root entry and sub-composition mapping
- planning and CLI code do not need to know raw HyperFrames command strings

Expected failure: runtime boundary contracts do not exist yet.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`  
Expected: FAIL due to missing runtime adapter modules.

- [ ] **Step 3: Implement runtime types and placeholder adapter**

Add a placeholder adapter that:
- defines capability shape
- defines runtime execution result shape
- maps package contract to runtime entry metadata
- does not yet execute HyperFrames

- [ ] **Step 4: Reflect the runtime contract in package metadata**

Update `meta.json` and `COMMANDS.md` so they point to the abstracted runtime entry contract rather than embedding ad hoc command decisions across the codebase.

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test`  
Expected: PASS with the runtime boundary covered.

- [ ] **Step 6: Commit**

```bash
git add src/runtime/hyperframes/types.ts src/runtime/hyperframes/adapter.ts src/packaging/project-package.ts scripts/run-tests.mjs
git commit -m "feat: add hyperframes runtime boundary"
```

## Task 6: Rewire the CLI and compiler entrypoints to the new architecture

**Files:**
- Create: `F:\hyperframes\src\interfaces\cli\index.ts`
- Modify: `F:\hyperframes\src\cli.ts`
- Modify: `F:\hyperframes\src\compiler\index.ts`
- Modify: `F:\hyperframes\README.md`

- [ ] **Step 1: Write the failing integration tests**

Add tests that verify:
- `init` creates the new engineering skeleton
- `generate` writes the new engineering package
- `validate` still writes only `VALIDATION_REPORT.*`

Expected failure: CLI still points at the old layout or old package semantics.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`  
Expected: FAIL on CLI output shape or missing files.

- [ ] **Step 3: Create the CLI interface layer**

Move command orchestration into `src/interfaces/cli/index.ts`.  
Keep `src/cli.ts` as a thin wrapper for executable entry only.

- [ ] **Step 4: Update the compiler entrypoint**

Ensure the compiler returns all planning artifacts and packaging state needed by:
- CLI
- future Studio UI
- future runtime execution layer

- [ ] **Step 5: Update README**

Document the new user flow using the Framepack positioning:

1. provide a source
2. generate a video engineering package
3. continue with CLI or agent-driven editing

- [ ] **Step 6: Run verification**

Run:
- `npm run typecheck`
- `npm test`
- `npm run build`

Expected:
- all commands pass
- no regressions in current markdown route

- [ ] **Step 7: Commit**

```bash
git add src/interfaces/cli/index.ts src/cli.ts src/compiler/index.ts README.md
git commit -m "refactor: route cli through compiler architecture"
```

## Self-Review Checklist

- Spec coverage:
  - five-layer architecture: covered by Tasks 1, 2, 4, 5, and 6
  - expanded data model: covered by Tasks 1, 2, and 3
  - production-style package skeleton: covered by Task 4
  - HyperFrames runtime boundary: covered by Task 5
  - stable CLI surface: covered by Task 6
- Placeholder scan:
  - no unfinished placeholders or deferred implementation markers remain in tasks
- Type consistency:
  - `SourceBundle`, `Script`, `Storyboard`, `AssetPlan`, `ValidationReport`, `RuntimeCapabilities`, and `RuntimeExecutionResult` are used consistently throughout the plan
