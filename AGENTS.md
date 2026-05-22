# Framepack Agent Guide

Framepack is an agent-native video project compiler and video production Agent Harness.

It turns content sources into executable video project packages. The package is an intermediate work surface for agents and HyperFrames, not usually the final human-facing video.

Framepack is the harness and compiler layer in a mixed workflow: asset library + orchestration + generative model + post-production composition. It defines asset requirements and execution contracts; it is not a game engine and does not directly generate images.

In the Agent Harness model, Codex or Claude Code is the general-purpose brain, Framepack is the video-production nervous system, and HyperFrames is the rendering body.

## Mental Model

- Framepack prepares the project package.
- Agents inspect, edit, materialize assets, run commands, and can use optional asset forge skills.
- HyperFrames previews and renders the final video.
- `agent-sprite-forge` is the first recommended 2D asset forge backend, but Framepack packages must remain backend-neutral.

## Harness Model

Framepack 0.4 uses a five-part harness structure:

- Sense filter: `CAPABILITY_GRAPH.json` tells agents what capabilities are present, missing, planned, or externally produced.
- Arsenal exposure: MCP `exposeArsenal`, `getCapabilityGraph`, `explainCapabilityGaps`, and the Animation Capability Atlas expose packs, capability state, gaps, technology routes, and common technology fit without making creative decisions for the agent.
- Motor pathways: MCP tools and CLI commands turn agent decisions into package generation, status checks, validation, repair, capture, runtime inspection, and rendering.
- Reflexes: validation, repair, runtime lint, runtime inspect, and capability scans catch obvious drift before the model spends reasoning budget on it.
- Memory encoding: package files persist every intermediate artifact needed for agent handoff and recovery.
- Feedback loop: validation reports, runtime inspect reports, snapshot manifests, and visual QA evidence decide readiness from evidence.

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
npx -y -p framepack@alpha framepack --version
npx -y -p framepack@alpha framepack --help
npm exec --yes --package=framepack@alpha -- framepack mcp --describe
npx framepack mcp --describe
npx framepack atlas --json
npx framepack atlas get library.animejs --json
npx framepack atlas recommend --workflow-pack game-ad-sprite-video --creative-direction-pack game-ad-retro-arcade --output-type game-ad --format 9:16 --json
npx framepack packs
npx framepack packs --json
npx framepack packs recommend --source-type game-ad --output-type game-ad --goal "Promote a course" --audience "Founders" --format 9:16 --json
npx framepack mcp
npx framepack release-smoke --output-dir out/release-smoke --json
npm run release:smoke:install
npm run release:scenarios
npm run release:gate
```

Prefer MCP tools for agent automation. `mcp --describe` lists the stable tool, resource, and prompt surface; `mcp` starts the stdio server. `packs` lists built-in workflow packs and creative direction packs. `atlas` lists the Animation Capability Atlas: programmatic animation, generative media, runtime, asset forge, skill, plugin, MCP, and verification capability nodes plus recommended stacks. MCP `exposeArsenal` is the broad pre-generation context tool: it exposes the raw user signal, all packs, capability graph summary when available, and common technology fit checks while leaving intent interpretation to Codex or Claude Code. `packs recommend` and MCP `recommendPacks` provide a conservative default route before generating a package. `atlas recommend` and MCP `recommendCapabilityStack` provide a conservative technology stack recommendation for a selected route.

Generate a package:

```bash
npx framepack generate --input examples/case-explainer-input.md --output-dir out --goal "Explain the case" --audience "Founders"
npx framepack generate --thread-file examples/thread.txt --output-dir out --goal "Explain the thread" --audience "Founders" --project-name thread-case
npx framepack generate --url https://example.com/product --output-dir out --goal "Explain the site" --audience "Founders" --project-name website-case
npx framepack generate --game-ad-description "A course that teaches founders to ship agent-native video systems." --output-dir out --goal "Promote the course" --audience "Founders" --project-name sprite-video-demo --format 9:16 --auto-pack
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

Run `release-smoke` before tagging or publishing a release candidate. It creates Codex and Claude Code agent workflow files, checks the MCP surface, verifies Arsenal Exposure, recommends packs, generates an auto-packed game-ad package, verifies `CAPABILITY_GRAPH.json` and `RUNTIME_MANIFEST.json`, and runs status plus validation. It does not install external forge skills, call image generation, or require HyperFrames rendering.

Run `npm run release:smoke:install` as the stricter RC gate. It builds the repo, packs the npm tarball, installs it into a temporary empty consumer project, then runs the installed binary through MCP discovery, `release-smoke`, `generate --auto-pack`, `validate`, and `status --json`.

Run `npm run release:scenarios` as the three-route product-readiness rehearsal. It generates markdown, thread, and game-ad sprite-video packages, then runs `validate` and `status --json` on each package. It does not install external forge skills, call image generation, or require HyperFrames rendering.

Run `npm run release:gate` as the final RC gate. It runs typecheck, the full test suite, npm pack dry-run, and the real install smoke gate in one structured pass.

## Package Protocol

Start with `PACKAGE_MANIFEST.json`.

For release-candidate context, read `docs/agent-platform/release-candidate-v0.4.0-alpha.4.md`, `docs/agent-platform/beta-readiness-v0.4.md`, `docs/agent-platform/real-user-trial-v0.4.0-alpha.3.md`, `docs/agent-platform/release-candidate-v0.4.0-alpha.3.md`, `docs/agent-platform/release-candidate-v0.4.0-alpha.2.md`, `docs/agent-platform/release-candidate-v0.4.0-alpha.1.md`, and `docs/agent-platform/real-scenario-test-report-v0.4.0-alpha.1.md`. The previous `v0.3.0-rc.1` notes remain in `docs/agent-platform/release-candidate-v0.3.0-rc.1.md`. For the next architecture learning and uplift agenda, read `docs/architecture/next-architecture-uplift.md`, then read the concrete 0.4 proposal in `docs/architecture/framepack-0.4-capability-runtime-architecture.md`.

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
- `RUNTIME_MANIFEST.json`
- `FORGE_TASKS.md`
- `HANDOFF.md`

## Agent Workflow

0. For broad requests, run `npx framepack packs recommend --json` or use MCP `recommendPacks` to choose a workflow pack and creative direction pack before generating or continuing a package. For one-step generation, use CLI `--auto-pack` or MCP `autoRecommendPacks: true`; explicit `--workflow-pack` / `--creative-direction-pack` and MCP `workflowPackId` / `creativeDirectionPackId` still take priority.
   For fuzzy creative requests or technology preferences, prefer MCP `exposeArsenal` first. It is an information-field tool, not an intent resolver: the agent should inspect the exposed packs, capability graph, and common technology status, then decide what to ask the user or which route to execute.
   For animation or media technology choices, use `npx framepack atlas --json`, `npx framepack atlas get <capability-id> --json`, `npx framepack atlas recommend ... --json`, or MCP `listCapabilityAtlas` / `getCapabilityAtlasNode` / `recommendCapabilityStack`. Treat the atlas as a recommendation map, not proof that an external model, library, skill, or plugin is installed.
   When a generated package has `VIDEO_BRIEF.json.capabilityStackSelection`, treat it as the selected technology route for this package. If the field is absent, do not infer that agent-sprite-forge, Anime.js, or any external model is required.
1. Read `PACKAGE_MANIFEST.json` to discover the package protocol, artifacts, and runtime entrypoints.
2. Read `HANDOFF.md` to understand the current package state and pending work.
3. Inspect `SCENE_ASSET_MAP.json`, `SOURCE_SCENE_MAP.json`, and `ASSET_EXECUTION_PLAN.json` before changing assets or scene mappings.
4. Run `npx framepack status --project-dir <package>` to summarize protocol health, asset state, forge progress, runtime availability, readiness, and next actions. Use `--json` when another agent or tool needs structured status; prefer `readiness` and `nextActionItems` for automation. Each `nextActionItems` entry has a stable `id` for action dispatch. Treat `readiness` as the first phase decision: `blocked`, `needs-assets`, `needs-runtime`, or `ready`. For forge work, inspect `forgeBreakdown.byExecutionKind`, `forgeBreakdown.byBackend`, and `forgeBreakdown.byRequiredSkill` before assigning asset production.
   For capability work, inspect `capabilityGraph.nodeIds`, `capabilityGraph.gapNodeIds`, `capabilityGraph.byStatus`, and `capabilityGraph.byDelivery`, or use MCP `getCapabilityGraph` / `explainCapabilityGaps`.
5. Run `npx framepack capture --project-dir <package>` to materialize pending website screenshots or thread cards.
6. Run `npx framepack sync-assets --project-dir <package>` after manual or automated asset work.
7. Run `npx framepack repair --project-dir <package>` only when derived protocol files are stale or inconsistent but the source JSON is present.
8. Run `npx framepack validate --project-dir <package>` to verify package protocol alignment, including `CAPABILITY_GRAPH.json` structure when present.
9. Run `npx framepack runtime doctor --project-dir <package>` before previewing or rendering with HyperFrames.
10. Run `npx framepack runtime lint --project-dir <package>`, `npx framepack runtime inspect --project-dir <package>`, or `npx framepack runtime snapshot --project-dir <package>` when you need HyperFrames-side composition checks.
11. Run `npx framepack runtime upgrade-check` only when explicitly checking HyperFrames updates; do not run update checks as part of ordinary package status.

`repair` is for derived protocol drift only. It rebuilds `SCENE_ASSET_MAP.json`, `SOURCE_SCENE_MAP.json`, `PACKAGE_MANIFEST.json`, `CAPABILITY_GRAPH.json`, and `RUNTIME_MANIFEST.json`, then validates. It does not capture assets, execute forge tasks, install skills, or mark pending assets available. If capability graph JSON is invalid or missing derivable nodes such as `video-runtime.hyperframes`, use `repair` before continuing package work.

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
