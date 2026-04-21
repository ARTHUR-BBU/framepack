# Studio Video Project Compiler Architecture

## Summary

Upgrade the current repository from a HyperFrames-ready single-route pipeline into a Studio Video Project Compiler v1 skeleton.

The long-term architecture is:

- compiler-first
- video-project-package centered
- URL compiler route reserved as the next source type
- HyperFrames as the first runtime backend, not the whole system

Phase 1 focuses on aligning the project-engineering skeleton, not on deep runtime integration and not on website ingestion implementation.

## Key Changes

### 1. Reorganize the codebase into five layers

Restructure the current `src/video/*` layout into:

- `src/ingest/*`
  - compile external inputs into `SourceBundle`
  - v1 implements only the markdown route
  - reserve `website` interfaces and types without implementing fetching
- `src/planning/*`
  - own `VideoBrief`, `ScenePlan`, `Script`, `Storyboard`, `AssetPlan`, and `ValidationReport`
  - remain independent from HyperFrames CLI details
- `src/packaging/*`
  - write the video project package structure and documents
  - do not invoke runtime commands
- `src/runtime/hyperframes/*`
  - define the adapter boundary and runtime contracts
  - do not make full HyperFrames execution the Phase 1 goal
- `src/interfaces/cli/*`
  - keep the CLI as an interface layer, not a business logic layer

Keep the current CLI surface:

- `init`
- `generate`
- `validate`

But route them through the new layers.

### 2. Expand the core data model

Upgrade the current chain:

`VideoBrief -> ScenePlan -> ValidationReport -> ProjectPackage`

To:

`SourceBundle -> VideoBrief -> ScenePlan -> Script -> Storyboard -> AssetPlan -> ValidationReport -> ProjectPackage`

Phase 1 requires minimum viable versions of:

- `SourceBundle`
  - `sourceType`
  - `rawInputs`
  - `collectedArtifacts`
  - markdown is the only implemented source
- `Script`
  - minimal voiceover/caption blocks mapped to scenes
- `Storyboard`
  - minimal visual intent, shot notes, and transition notes per scene
- `AssetPlan`
  - existing assets, placeholder assets, and missing assets
- `ValidationReport`
  - retain passed/failed and issues list
- `ProjectPackage`
  - become a full engineering package descriptor, not just a small file map

Use shared core types. Do not introduce schema-version migration logic in Phase 1.

### 3. Align the package shape with production-style video projects

The generated package should move toward a production-grade project layout even if the initial content is minimal.

Required files and directories:

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
- `meta.json` or equivalent runtime manifest
- `index.html`
- `compositions/`
- `assets/`

Defaults:

- `index.html` is the root composition entry
- `compositions/` contains the first sub-composition skeletons
- `assets/` may be empty in Phase 1
- `HANDOFF.md` must at least include generation time, source summary, validation state, and asset gaps

### 4. Add a version-aware HyperFrames runtime boundary

Create the runtime adapter boundary but keep it lightweight in Phase 1.

Define:

- `RuntimeCapabilities`
  - `version`
  - `supportedCommands`
  - `supportedCatalogFeatures`
  - `supportedRenderOptions`
  - `fallbackNotes`
- `RuntimeExecutionResult`
  - `action`
  - `success`
  - `outputPaths`
  - `warnings`
  - `summary`

Phase 1 responsibilities:

- define the adapter interfaces and placeholder implementation
- define the mapping from our package contract to HyperFrames runtime entrypoints
- reflect that mapping in package docs and runtime manifest

Explicit non-goals for Phase 1:

- installing and executing official HyperFrames as a required path
- generating brief/scene/script/storyboard inside the adapter
- letting planning or CLI code build raw `npx hyperframes ...` strings

### 5. Keep the CLI stable while upgrading package semantics

Phase 1 CLI behavior:

- `init`
  - initialize a video engineering project template
  - create the new package skeleton and config
- `generate`
  - generate the full project package skeleton and content files
  - continue blocking on guardrail failures
- `validate`
  - generate only validation outputs
  - do not write the full package

Do not add `preview` or `render` subcommands in Phase 1.

## Test Plan

Required coverage:

- markdown input still generates a valid package
- `init` creates the expanded skeleton:
  - `compositions/`
  - `assets/`
  - `SCRIPT.md`
  - `STORYBOARD.md`
  - `ASSET_PLAN.json`
  - `HANDOFF.md`
- `generate` writes root entry, runtime manifest, and minimal sub-composition skeletons
- current guardrail behavior remains intact:
  - missing `requiredPoints` makes `validate` fail
  - matching `bannedTerms` makes `validate` fail
  - too-small `maxDurationSec` blocks `generate`
- `GUARDRAILS.md`, `HANDOFF.md`, and `COMMANDS.md` reflect the actual package state
- `ProjectPackage` writing logic supports the expanded file set
- `npm run typecheck`, `npm test`, and `npm run build` continue to pass

Acceptance checks:

- the package directory reads like a real video engineering project, not a single-file export
- Phase 1 does not require HyperFrames to be installed
- the runtime adapter interface exists and upper layers do not depend on HyperFrames command details

## Assumptions And Defaults

- Phase 1 target is engineering skeleton alignment
- markdown is the only fully implemented input source in Phase 1
- website ingestion is type-and-boundary only in Phase 1
- HyperFrames remains the first runtime backend, but only as an abstracted boundary
- the package shape is root `index.html` plus `compositions/`
- `SCRIPT.md`, `STORYBOARD.md`, and `HANDOFF.md` may contain minimum viable content in Phase 1
- `ASSET_PLAN.json` may mostly describe placeholders and missing assets in Phase 1
- the CLI surface remains `init / generate / validate`
