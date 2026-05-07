# Framepack Agent Guide

Framepack is an agent-native video project compiler.

It turns content sources into executable video project packages. The package is an intermediate work surface for agents and HyperFrames, not usually the final human-facing video.

Framepack is the compiler layer in a mixed workflow: asset library + orchestration + generative model + post-production composition. It defines asset requirements and execution contracts; it is not a game engine and does not directly generate images.

## Mental Model

- Framepack prepares the project package.
- Agents inspect, edit, materialize assets, run commands, and can use optional asset forge skills.
- HyperFrames previews and renders the final video.
- `agent-sprite-forge` is the first recommended 2D asset forge backend, but Framepack packages must remain backend-neutral.

## Primary Commands

Build the repo:

```bash
npm install
npm run build
```

Generate a package:

```bash
npx framepack generate --input examples/case-explainer-input.md --output-dir out --goal "Explain the case" --audience "Founders"
npx framepack generate --thread-file examples/thread.txt --output-dir out --goal "Explain the thread" --audience "Founders" --project-name thread-case
npx framepack generate --url https://example.com/product --output-dir out --goal "Explain the site" --audience "Founders" --project-name website-case
npx framepack generate --game-ad-description "A course that teaches founders to ship agent-native video systems." --output-dir out --goal "Promote the course" --audience "Founders" --project-name sprite-video-demo
```

Materialize pending source assets:

```bash
npx framepack capture --project-dir out/thread-case
npx framepack sync-assets --project-dir out/thread-case
npx framepack validate --project-dir out/thread-case
```

Repair derived protocol drift when needed:

```bash
npx framepack repair --project-dir out/thread-case
```

Render through HyperFrames when the runtime is available:

```bash
npx framepack runtime doctor --project-dir out/thread-case
npx framepack preview --project-dir out/thread-case
npx framepack render --project-dir out/thread-case
```

## Package Protocol

Start with `PACKAGE_MANIFEST.json`.

It indexes:

- source files
- planning artifacts
- asset plans
- execution plans
- validation artifacts
- runtime entrypoints
- compatibility files
- supported execution kinds, including optional forge kinds

Then inspect these files as needed:

- `SOURCE_MANIFEST.json`
- `VIDEO_BRIEF.json`
- `SCENE_PLAN.json`
- `SCENE_ASSET_MAP.json`
- `SOURCE_SCENE_MAP.json`
- `ASSET_PLAN.json`
- `ASSET_EXECUTION_PLAN.json`
- `FORGE_TASKS.md`
- `HANDOFF.md`

## Agent Workflow

1. Read `PACKAGE_MANIFEST.json` to discover the package protocol, artifacts, and runtime entrypoints.
2. Read `HANDOFF.md` to understand the current package state and pending work.
3. Inspect `SCENE_ASSET_MAP.json`, `SOURCE_SCENE_MAP.json`, and `ASSET_EXECUTION_PLAN.json` before changing assets or scene mappings.
4. Run `npx framepack capture --project-dir <package>` to materialize pending website screenshots or thread cards.
5. Run `npx framepack sync-assets --project-dir <package>` after manual or automated asset work.
6. Run `npx framepack repair --project-dir <package>` only when derived protocol files are stale or inconsistent but the source JSON is present.
7. Run `npx framepack validate --project-dir <package>` to verify package protocol alignment.
8. Run `npx framepack runtime doctor --project-dir <package>` before previewing or rendering with HyperFrames.

`repair` is for derived protocol drift only. It rebuilds `SCENE_ASSET_MAP.json`, `SOURCE_SCENE_MAP.json`, and `PACKAGE_MANIFEST.json`, then validates. It does not capture assets, execute forge tasks, install skills, or mark pending assets available.

## Asset Forge Layer

`ASSET_EXECUTION_PLAN.json` can include source capture tasks and forge tasks.

`SCENE_ASSET_MAP.json` is the scene-first asset lookup. Use `recommendedAssets` and top-level `assets` for the unified asset contract across website captures, thread cards, and forge-produced assets. `recommendedCaptures` and `captures` remain as compatibility fields for older website capture flows.

Existing source materialization kinds:

- `capture-screenshot`
- `compose-text-card`

Forge execution kinds:

- `forge-sprite-sheet`
- `forge-map-pack`
- `forge-fx-pack`
- `forge-prop-pack`
- `forge-character-pack`

Forge items may include `forgeBackend`, `requiredSkill`, `expectedOutputs`, `prompt`, `recommendedSceneIds`, `styleNotes`, and `acceptanceCriteria`.

Execution item statuses are `pending`, `available`, `failed`, `skipped`, and `external`. If a forge backend writes metadata JSON next to the expected output path, run `npx framepack sync-assets --project-dir <package>` to sync that status into the package. For `available` or `external`, metadata must include `outputs` with package-relative file paths that exist.

For `forgeBackend: "agent-sprite-forge"`, use `$generate2dsprite` for sprites, character packs, prop packs, and FX packs, and `$generate2dmap` for maps/backgrounds if those skills are installed. Do not install external skills automatically. If the skills are not available, leave the task contract intact for manual or custom asset production.

## Editing Rules

- Keep `PACKAGE_MANIFEST.json` consistent with package files when changing package structure.
- Keep `src/packaging/package-protocol.ts` and `docs/architecture/package-protocol-v1.md` aligned when changing protocol v1.
- Keep `src/packaging/package-repair.ts` aligned with protocol-derived files when changing package repair semantics.
- Keep `SCENE_ASSET_MAP.json`, `SOURCE_SCENE_MAP.json`, and `ASSET_EXECUTION_PLAN.json` aligned when changing source-to-scene mapping.
- Prefer adding new execution kinds to `ASSET_EXECUTION_PLAN.json` over creating source-specific plan files.
- Keep forge tasks backend-neutral; `agent-sprite-forge` is a reference backend, not a hard dependency.
- Keep `CAPTURE_EXECUTION_PLAN.json` as compatibility output while older flows may still read it.
- Treat the golden package protocol summaries in `npm test` as the regression guard for package shape changes.
- Run `npm run typecheck`, `npm test`, and `npm run build` before claiming a change is complete.
