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

Install Framepack into a project as an agent-facing workflow:

```bash
npx framepack init-agent --target codex --scope project
npx framepack init-agent --target claude-code --scope project
npx framepack mcp --describe
npx framepack packs
npx framepack packs --json
npx framepack packs recommend --source-type game-ad --output-type game-ad --goal "Promote a course" --audience "Founders" --format 9:16 --json
npx framepack mcp
```

Prefer MCP tools for agent automation. `mcp --describe` lists the stable tool, resource, and prompt surface; `mcp` starts the stdio server. `packs` lists built-in workflow packs and creative direction packs. `packs recommend` and MCP `recommendPacks` provide a conservative default route before generating a package.

Generate a package:

```bash
npx framepack generate --input examples/case-explainer-input.md --output-dir out --goal "Explain the case" --audience "Founders"
npx framepack generate --thread-file examples/thread.txt --output-dir out --goal "Explain the thread" --audience "Founders" --project-name thread-case
npx framepack generate --url https://example.com/product --output-dir out --goal "Explain the site" --audience "Founders" --project-name website-case
npx framepack generate --game-ad-description "A course that teaches founders to ship agent-native video systems." --output-dir out --goal "Promote the course" --audience "Founders" --project-name sprite-video-demo --workflow-pack game-ad-sprite-video --creative-direction-pack game-ad-retro-arcade
```

Materialize pending source assets:

```bash
npx framepack status --project-dir out/thread-case
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
npx framepack runtime lint --project-dir out/thread-case
npx framepack runtime inspect --project-dir out/thread-case --json --samples 9
npx framepack runtime snapshot --project-dir out/thread-case --frames 5
npx framepack runtime upgrade-check
npx framepack preview --project-dir out/thread-case
npx framepack render --project-dir out/thread-case
```

`runtime lint` checks HyperFrames composition mistakes. `runtime inspect` checks visual layout and text overflow across the timeline. `runtime snapshot` captures PNG key frames for visual verification. `runtime upgrade-check` explicitly checks for HyperFrames updates. Framepack 0.2 does not expose HyperFrames `publish` because it uploads externally and returns a public URL.

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
- supported package lifecycle commands in `capabilities.packageCommands`

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

0. For broad requests, run `npx framepack packs recommend --json` or use MCP `recommendPacks` to choose a workflow pack and creative direction pack before generating or continuing a package. Pass the selected route with `--workflow-pack <id>` and `--creative-direction-pack <id>`, or MCP `workflowPackId` and `creativeDirectionPackId`, so `VIDEO_BRIEF.json` and `HANDOFF.md` preserve the decision.
1. Read `PACKAGE_MANIFEST.json` to discover the package protocol, artifacts, and runtime entrypoints.
2. Read `HANDOFF.md` to understand the current package state and pending work.
3. Inspect `SCENE_ASSET_MAP.json`, `SOURCE_SCENE_MAP.json`, and `ASSET_EXECUTION_PLAN.json` before changing assets or scene mappings.
4. Run `npx framepack status --project-dir <package>` to summarize protocol health, asset state, forge progress, runtime availability, readiness, and next actions. Use `--json` when another agent or tool needs structured status; prefer `readiness` and `nextActionItems` for automation. Each `nextActionItems` entry has a stable `id` for action dispatch. Treat `readiness` as the first phase decision: `blocked`, `needs-assets`, `needs-runtime`, or `ready`. For forge work, inspect `forgeBreakdown.byExecutionKind`, `forgeBreakdown.byBackend`, and `forgeBreakdown.byRequiredSkill` before assigning asset production.
5. Run `npx framepack capture --project-dir <package>` to materialize pending website screenshots or thread cards.
6. Run `npx framepack sync-assets --project-dir <package>` after manual or automated asset work.
7. Run `npx framepack repair --project-dir <package>` only when derived protocol files are stale or inconsistent but the source JSON is present.
8. Run `npx framepack validate --project-dir <package>` to verify package protocol alignment.
9. Run `npx framepack runtime doctor --project-dir <package>` before previewing or rendering with HyperFrames.
10. Run `npx framepack runtime lint --project-dir <package>`, `npx framepack runtime inspect --project-dir <package>`, or `npx framepack runtime snapshot --project-dir <package>` when you need HyperFrames-side composition checks.
11. Run `npx framepack runtime upgrade-check` only when explicitly checking HyperFrames updates; do not run update checks as part of ordinary package status.

`repair` is for derived protocol drift only. It rebuilds `SCENE_ASSET_MAP.json`, `SOURCE_SCENE_MAP.json`, and `PACKAGE_MANIFEST.json`, then validates. It does not capture assets, execute forge tasks, install skills, or mark pending assets available.

## Workflow And Creative Direction Packs

Workflow packs are agent-facing production routes. They describe source types, output type, expected execution kinds, recommended forge backend, instructions, and acceptance criteria.

Creative direction packs are agent-facing taste guides. They describe visual language, motion language, template guidance, and acceptance criteria.

Current built-in workflow packs:

- `product-explainer`
- `thread-to-video`
- `website-to-video`
- `game-ad-sprite-video`
- `course-promo`
- `launch-review`
- `investor-update`

Current built-in creative direction packs:

- `clean-saas-explainer`
- `editorial-proof-story`
- `game-ad-retro-arcade`

Use `game-ad-sprite-video` with `game-ad-retro-arcade` when generating sprite/video promo packages. It recommends `agent-sprite-forge` but remains backend-neutral.

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

For `forgeBackend: "agent-sprite-forge"`, recommend installing or enabling the `agent-sprite-forge` skills before asset production if the user wants Codex to generate 2D assets directly. Use `$generate2dsprite` for sprites, character packs, prop packs, and FX packs, and `$generate2dmap` for maps/backgrounds if those skills are installed. Do not install external skills automatically. If the skills are not available, leave the task contract intact for manual production, custom forge production, or reuse of existing assets.

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
