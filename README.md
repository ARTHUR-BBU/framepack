# Framepack

[中文说明](./README.zh-CN.md)

Framepack is a video production Agent Harness for Codex, Claude Code, and other coding agents.

It gives a general-purpose coding agent a domain-specific nervous system for video work: what to see, which tools to call, what evidence to collect, and how to keep moving without guessing from a raw file tree.

Framepack turns content into executable video project packages.

In practice, that output is a production-ready intermediate, not usually the final human-facing video.

Framepack prepares the video engineering package: source structure, scene plans, asset requirements, execution tasks, capability graphs, runtime manifests, and runtime entrypoints. HyperFrames and an agent finish preview, asset materialization, and rendering.

It is the harness and compiler layer in a hybrid workflow: asset library + orchestration + generative model + post-production composition. Framepack does not become a game engine or image generator.

## Agent Harness Model

Framepack 0.4 is organized around a five-part Agent Harness model:

- **Sense filter:** `CAPABILITY_GRAPH.json` tells the agent what capabilities exist, what is missing, and which delivery modes are available.
- **Arsenal exposure:** MCP `exposeArsenal`, `getCapabilityGraph`, `explainCapabilityGaps`, and the Animation Capability Atlas expose workflow packs, creative direction packs, capability state, technology options, and common technology fit without making the creative decision for the agent.
- **Motor pathways:** MCP tools and CLI commands turn agent decisions into package generation, validation, repair, capture, runtime inspection, and render actions.
- **Reflexes:** validation, repair, runtime lint, runtime inspect, and future capability scans catch obvious drift before the model spends reasoning budget on it.
- **Memory encoding:** the package file system persists briefs, scene plans, asset maps, execution plans, capability graphs, `RUNTIME_MANIFEST.json`, and evidence.
- **Feedback loop:** runtime inspect reports, snapshot manifests, visual QA notes, and validation reports make readiness evidence-based instead of confidence-based.

In plain language: Codex or Claude Code is the brain; Framepack is the video-production nervous system; HyperFrames is the rendering body.

Agents should start with [AGENTS.md](./AGENTS.md).

## First Npm Check

For the published alpha package, the shortest first-run check is:

```bash
npx -y -p framepack@alpha framepack --version
npx -y -p framepack@alpha framepack --help
npm exec --yes --package=framepack@alpha -- framepack mcp --describe
```

In a project where Framepack is already installed, use `npx framepack ...` or `framepack ...`.

## Install with Codex

Framepack is meant to be installed and operated by coding agents, not memorized as a long command sequence.

In Codex, ask:

```text
Read https://github.com/ARTHUR-BBU/framepack and install Framepack into this project as an agent-native video project compiler. Configure its MCP server and verify generate/status/validate.
```

The agent should run `framepack init-agent --target codex --scope project`, connect the Framepack MCP server, then use MCP tools such as `generateProject`, `getStatus`, `validatePackage`, `captureAssets`, and `runtimeSnapshot`.

Claude Code preview support is available with `framepack init-agent --target claude-code --scope project`.

Agents can inspect the built-in workflow and creative direction packs before choosing a route:

```bash
npm exec --yes --package=framepack@alpha -- framepack mcp --describe
npx framepack packs
npx framepack packs --json
npx framepack atlas --json
npx framepack atlas get library.animejs --json
npx framepack atlas recommend --workflow-pack game-ad-sprite-video --creative-direction-pack game-ad-retro-arcade --output-type game-ad --format 9:16 --json
```

The same registry is exposed through MCP tools: `listWorkflowPacks`, `getWorkflowPack`, `listCreativeDirectionPacks`, `getCreativeDirectionPack`, `listCapabilityAtlas`, `getCapabilityAtlasNode`, and `recommendCapabilityStack`. For broad natural-language requests, agents can call MCP `exposeArsenal` first. It returns the raw user signal, all workflow packs, all creative direction packs, capability graph summary when a package exists, and common technology fit checks such as Three.js, GSAP, Anime.js, PixiJS, and agent-sprite-forge. Framepack exposes the information field; Codex or Claude Code still makes the creative judgment.

Agents can ask Framepack for a conservative recommendation:

```bash
npx framepack packs recommend --source-type game-ad --output-type game-ad --goal "Promote a course with game-style visuals" --audience "Founders" --format 9:16
npx framepack packs recommend --source-type game-ad --output-type game-ad --goal "Promote a course with game-style visuals" --audience "Founders" --format 9:16 --json
```

The same recommendation is available through MCP as `recommendPacks`.

When a route is selected, pass it into generation so the package records the decision:

```bash
npx framepack generate --game-ad-description "A course that teaches founders to ship agent-native video systems." --output-dir out --goal "Promote the course" --audience "Founders" --project-name sprite-video-demo --workflow-pack game-ad-sprite-video --creative-direction-pack game-ad-retro-arcade
```

Or let Framepack apply the conservative recommendation during generation:

```bash
npx framepack generate --game-ad-description "A course that teaches founders to ship agent-native video systems." --output-dir out --goal "Promote the course" --audience "Founders" --project-name sprite-video-demo --format 9:16 --auto-pack
```

## Product Shape

Framepack is evolving into an agent-installable video workflow system:

- Framepack Core: CLI, package protocol, validation, and the HyperFrames bridge.
- Framepack MCP: tools, resources, and prompts that agents can call directly.
- Framepack Skills: reusable video production playbooks for Codex, Claude Code, and future agent platforms.
- Framepack Workflow Packs: installable workflows such as product explainers, thread videos, website videos, game ads, course promos, launch reviews, and investor updates.
- Framepack Creative Direction Layer: design taste, animation taste, motion language, pacing, template selection, and visual acceptance criteria.
- Framepack Animation Capability Atlas: a structured map of programmatic animation, generative media, runtime, asset forge, skill, plugin, MCP, and verification capabilities.
- Framepack Connectors: content sources, asset forge backends, render systems, publishing systems, and future community integrations.

The long-term goal is not only to make video project packages valid. It is to help agents produce packages with clear narrative, strong design direction, reusable motion patterns, and enough creative structure for humans, designers, and community contributors to improve the result.

## Workflow Packs

Framepack ships a first built-in registry of workflow packs and creative direction packs.

Workflow packs tell an agent what kind of video job it is doing: product explainer, thread-to-video, website-to-video, game-ad sprite video, course promo, launch review, or investor update. Some packs are available today through the existing compiler routes; others are marked as planned so agents know the direction without pretending a finished pipeline exists.

Creative direction packs describe visual language, motion language, template guidance, and acceptance criteria. They are the first structured step toward design taste and animation taste being part of the agent workflow, not a vague afterthought.

## Animation Capability Atlas

The Animation Capability Atlas is Framepack's read-only capability map. It separates **programmatic animation material** such as Anime.js, SVG, Canvas, PixiJS, and runtime-controlled motion from **generative media material** such as Seedance 2.0, Gemini Omni, and Kling AI 3.0.

Use `framepack atlas --json` or MCP `listCapabilityAtlas` to inspect known capabilities. Use `framepack atlas recommend ... --json` or MCP `recommendCapabilityStack` to get a conservative capability stack for a workflow and creative direction. The atlas is not an executor: it classifies, scores, and recommends capabilities so agents can choose a route without pretending every external model, library, skill, or plugin is already installed.

When generation uses a workflow or creative direction pack, Framepack persists the matched capability stack into `VIDEO_BRIEF.json` as `capabilityStackSelection` and repeats it in `HANDOFF.md`. Custom/manual packages without pack selection are left neutral so Framepack does not silently force an external backend.

## Quickstart

```bash
npm install
npm run build
npx framepack packs
npx framepack atlas --json
npx framepack generate --input examples/case-explainer-input.md --output-dir out --goal "Explain the case" --audience "Founders"
npx framepack release-smoke --output-dir out/release-smoke --json
npm run release:smoke:install
npm run release:scenarios
npm run release:gate
```

Agent-first examples:

```bash
npx framepack generate --thread-file examples/thread.txt --output-dir out --goal "Explain the thread" --audience "Founders" --project-name thread-case
npx framepack generate --url https://example.com/product --output-dir out --goal "Explain the site" --audience "Founders" --project-name website-case
npx framepack generate --game-ad-description "A course that teaches founders to ship agent-native video systems." --output-dir out --goal "Promote the course" --audience "Founders" --project-name sprite-video-demo --format 9:16 --auto-pack
npx framepack capture --project-dir out/thread-case
npx framepack preview --project-dir out/thread-case
```

## Demo Workflow

Run the thread demo:

```bash
npx framepack generate --thread-file examples/thread.txt --output-dir out --goal "Explain the thread" --audience "Founders" --project-name thread-case
npx framepack capture --project-dir out/thread-case
npx framepack sync-assets --project-dir out/thread-case
```

Run the website demo with any static server that serves `examples/website.html`, then pass that local URL:

```bash
npx http-server . -p 8080
npx framepack generate --url http://127.0.0.1:8080/examples/website.html --output-dir out --goal "Explain the site" --audience "Founders" --project-name website-case
npx framepack capture --project-dir out/website-case
npx framepack sync-assets --project-dir out/website-case
```

Run the sprite video demo:

```bash
npx framepack generate --game-ad-description "A platform that turns product stories into agent-native video packages." --output-dir out --goal "Promote the platform" --audience "Founders" --project-name sprite-video-demo
```

This produces a game-ad package with character, map/background, and FX forge tasks. It recommends `agent-sprite-forge` as the first 2D backend for those tasks, but it does not install `agent-sprite-forge` or call an image model automatically.

After generation, start with `PACKAGE_MANIFEST.json`. It is the package protocol index for humans and agents.

## Agent Workflow

When an agent receives a generated package:

1. Read `PACKAGE_MANIFEST.json`.
2. Read `HANDOFF.md` for current state and next actions.
3. Inspect `SCENE_ASSET_MAP.json`, `SOURCE_SCENE_MAP.json`, and `ASSET_EXECUTION_PLAN.json`.
4. Run `npx framepack capture --project-dir <package>` to materialize pending source assets.
5. Run `npx framepack sync-assets --project-dir <package>` after manual or automated asset work.
6. Run `npx framepack validate --project-dir <package>` to verify protocol alignment.
7. Run `npx framepack repair --project-dir <package>` only when derived protocol files drift and can be rebuilt from the package.
8. Run `npx framepack runtime doctor --project-dir <package>` to check both the runtime and package protocol.
9. Run `npx framepack runtime lint --project-dir <package>`, `npx framepack runtime inspect --project-dir <package>`, or `npx framepack runtime snapshot --project-dir <package>` for HyperFrames-side composition checks.
10. Run `preview` or `render` when HyperFrames is available.

Today this repository provides compiler paths for:

- markdown-driven case explainer videos
- local thread/post text files
- first-version public website URL to case-explainer packages
- lightweight game-ad / sprite-video demo packages with asset forge tasks

It produces a video engineering package with planning artifacts, validation artifacts, and HyperFrames-ready runtime structure.

HyperFrames is required for runtime execution, but not for package generation. Framepack can generate, inspect, and validate project packages before HyperFrames is installed.

You can think about the stack like this:

- raw ingredients: websites, threads, Markdown, PRDs
- prep and dish plan: Framepack
- kitchen equipment: HyperFrames
- cook: the agent
- finished dish: the rendered video

## User Flow

1. Provide a source
   - Markdown today
   - thread/post text files today
   - public website URLs today
   - PRDs and case packages later
2. Generate a video engineering package
   - brief
   - scene plan
   - script
   - storyboard
   - asset plan
   - guardrails
   - validation report
   - runtime entry files
3. Continue work
   - inspect and edit the package directly
   - hand the package to Codex or Claude Code
   - use runtime and capture commands to preview, render, and fill assets

## Commands

- `npm install`
- `npm run typecheck`
- `npm test`
- `npm run build`
- `npm run release:smoke:install`
- `npm run release:scenarios`
- `npm run release:gate`

`npm test` includes golden package protocol summaries for markdown, thread, and game-ad packages. These summaries intentionally avoid timestamps and absolute paths while checking the package manifest, scene asset map, execution kinds, forge task count, and handoff guidance.

Package protocol versioning is documented in [`docs/architecture/package-protocol-v1.md`](docs/architecture/package-protocol-v1.md).

Release-candidate notes live in [`docs/agent-platform/release-candidate-v0.4.0-alpha.3.md`](docs/agent-platform/release-candidate-v0.4.0-alpha.3.md). The alpha3 real user trial report lives in [`docs/agent-platform/real-user-trial-v0.4.0-alpha.3.md`](docs/agent-platform/real-user-trial-v0.4.0-alpha.3.md). The previous `v0.4.0-alpha.2` and `v0.4.0-alpha.1` notes remain in [`docs/agent-platform/release-candidate-v0.4.0-alpha.2.md`](docs/agent-platform/release-candidate-v0.4.0-alpha.2.md) and [`docs/agent-platform/release-candidate-v0.4.0-alpha.1.md`](docs/agent-platform/release-candidate-v0.4.0-alpha.1.md). The real scenario test report lives in [`docs/agent-platform/real-scenario-test-report-v0.4.0-alpha.1.md`](docs/agent-platform/real-scenario-test-report-v0.4.0-alpha.1.md). The previous `v0.3.0-rc.1` notes remain in [`docs/agent-platform/release-candidate-v0.3.0-rc.1.md`](docs/agent-platform/release-candidate-v0.3.0-rc.1.md). The next architecture learning and uplift agenda lives in [`docs/architecture/next-architecture-uplift.md`](docs/architecture/next-architecture-uplift.md).

The concrete 0.4 architecture proposal lives in [`docs/architecture/framepack-0.4-capability-runtime-architecture.md`](docs/architecture/framepack-0.4-capability-runtime-architecture.md).

## CLI

After `npm run build`, Framepack exposes package, runtime, and capture commands:

### `init`

Create a starter project directory with a config file and Markdown input template.

`npx framepack init --output-dir out --project-name starter --format 9:16`

### `generate`

Generate a video engineering package from a Markdown source file.

`npx framepack generate --input examples/case-explainer-input.md --output-dir out --goal "Explain the case" --audience "Founders"`

Generate a video engineering package from a public single-page URL.

`npx framepack generate --url https://example.com/product --output-dir out --goal "Explain the site" --audience "Founders" --project-name website-case`

Generate a video engineering package from a local thread/post text file.

`npx framepack generate --thread-file examples/thread.txt --output-dir out --goal "Explain the thread" --audience "Founders" --project-name thread-case`

Generate a sprite-video game-ad package from a short product, course, or brand description.

`npx framepack generate --game-ad-description "A course that teaches founders to ship agent-native video systems." --output-dir out --goal "Promote the course" --audience "Founders" --project-name sprite-video-demo`

### `release-smoke`

Run the agent-platform RC smoke harness. This creates Codex and Claude Code agent workflow files, checks the MCP surface, verifies Arsenal Exposure, recommends packs, generates a sprite-video package with `--auto-pack` behavior, verifies `CAPABILITY_GRAPH.json` and `RUNTIME_MANIFEST.json`, then runs package status and validation.

```bash
npx framepack release-smoke --output-dir out/release-smoke
npx framepack release-smoke --output-dir out/release-smoke --json
```

Agents should use this before publishing or tagging a release candidate. It is intentionally package/protocol focused: it does not install external forge skills, does not call image generation, and does not require HyperFrames rendering to be available.

For a stricter release-candidate gate, run:

```bash
npm run release:smoke:install
```

This builds the repo, packs the npm tarball, installs that tarball into a temporary empty consumer project, then runs the installed `framepack` binary through MCP discovery, `release-smoke`, `generate --auto-pack`, `validate`, and `status --json`.

The final release-candidate gate is:

```bash
npm run release:gate
```

It runs typecheck, the full test suite, npm pack dry-run, and the real install smoke gate in one structured pass.

For product-readiness rehearsal across the three main user routes, run:

```bash
npm run release:scenarios
```

This generates real markdown, thread, and game-ad sprite-video packages, then runs `validate` and `status --json` on each package. It is intentionally separate from `release:gate` so agents can run a clear scenario-focused check before tagging.

### `validate`

Validate the input and planning path and write a structured report without generating the full package.

```bash
npx framepack validate --input examples/case-explainer-input.md --output-dir out --goal "Explain the case" --audience "Founders"
npx framepack validate --thread-file examples/thread.txt --output-dir out --goal "Explain the thread" --audience "Founders" --project-name thread-case
npx framepack validate --url https://example.com/product --output-dir out --goal "Explain the site" --audience "Founders" --project-name website-case
```

Validate an already generated project package protocol in place:

```bash
npx framepack validate --project-dir out/sprite-video-demo
```

Inspect a generated project package status without changing package files:

```bash
npx framepack status --project-dir out/sprite-video-demo
npx framepack status --project-dir out/sprite-video-demo --json
```

`status` summarizes protocol health, asset execution state, forge task progress, runtime availability, readiness, and recommended next actions. Use `--json` when an agent, UI, or automation needs the same state as structured data; structured consumers should prefer `readiness` and `nextActionItems` over parsing `nextActions` text. Each structured next action includes a stable `id`, `category`, `command`, and `reason`.

Readiness values are intentionally coarse: `blocked` means protocol validation failed, `needs-assets` means source or forge assets are still pending, `needs-runtime` means the package is otherwise clear but HyperFrames is unavailable, and `ready` means the package can move to preview or render.

| readiness | Typical action ids | Preview/render |
| --- | --- | --- |
| `blocked` | `repair-protocol`, `validate-protocol`, `inspect-failed-assets`, `inspect-failed-forge-assets` | No |
| `needs-assets` | `sync-assets`, `produce-forge-assets` | No |
| `needs-runtime` | `runtime-doctor` | No |
| `ready` | `preview` | Yes |

For forge packages, `status --json` also includes `forgeBreakdown` so agents can dispatch asset work without scanning `ASSET_EXECUTION_PLAN.json` first. It groups forge task counts by `executionKind`, `forgeBackend`, and `requiredSkill`; missing backend or skill values are reported as `unspecified`.

`status --json` also includes `capabilityGraph`, a compact summary of `CAPABILITY_GRAPH.json`: whether it is present, node IDs, missing or blocked capability node IDs, counts by status, and counts by delivery mode. MCP exposes the same layer through `getCapabilityGraph`, `explainCapabilityGaps`, and the `framepack://project/{projectName}/capability-graph` resource. Package validation checks capability graph structure, required runtime/MCP nodes, edge references, forge backend nodes, and required skill nodes.

Package validation checks that `PACKAGE_MANIFEST.json`, `SCENE_PLAN.json`, `SCENE_ASSET_MAP.json`, `SOURCE_SCENE_MAP.json`, and `ASSET_EXECUTION_PLAN.json` stay aligned. It also fails if an item marked `available` or `external` points at a missing output file.

`PACKAGE_MANIFEST.json` also exposes `capabilities.packageCommands` so agents and tools can discover package-level operations such as `status`, `validate`, `repair`, `sync-assets`, `capture`, `runtime-doctor`, `runtime-lint`, `runtime-inspect`, `runtime-snapshot`, `runtime-upgrade-check`, `preview`, and `render` without parsing `COMMANDS.md`.

`RUNTIME_MANIFEST.json` is the agent-readable runtime contract. It records the HyperFrames backend, root entry, runtime config/meta files, composition and asset directories, detected runtime capabilities, supported command specs, and evidence paths for validation reports, guardrails, snapshots, and runtime inspect reports.

`validate` writes:

- `VALIDATION_REPORT.json`
- `VALIDATION_REPORT.md`

### `repair`

Repair known, deterministic package protocol drift in place:

```bash
npx framepack repair --project-dir out/sprite-video-demo
```

`repair` rebuilds derived protocol files from the existing package: `SCENE_ASSET_MAP.json`, `SOURCE_SCENE_MAP.json`, `PACKAGE_MANIFEST.json`, `CAPABILITY_GRAPH.json`, and `RUNTIME_MANIFEST.json`. It then reruns package validation and writes `VALIDATION_REPORT.json` / `VALIDATION_REPORT.md`. It does not invent missing source content, install forge skills, or materialize image assets.

You can also use a project config produced by `init`:

```bash
npx framepack generate --config out/starter/hyperframes-studio.json --output-dir out
npx framepack validate --config out/starter/hyperframes-studio.json --output-dir out
```

For the first version, `--config`, `--input`, `--thread-file`, `--url`, and `--game-ad-description` are mutually exclusive. Use exactly one source input per command.

### Asset forge layer

`ASSET_EXECUTION_PLAN.json` is the stable task contract for materializing assets. Existing execution kinds remain:

- `capture-screenshot`
- `compose-text-card`

Framepack also supports forge execution kinds for 2D asset production:

- `forge-sprite-sheet`
- `forge-map-pack`
- `forge-fx-pack`
- `forge-prop-pack`
- `forge-character-pack`

Forge tasks can include `forgeBackend`, `requiredSkill`, `expectedOutputs`, `prompt`, `recommendedSceneIds`, `styleNotes`, and `acceptanceCriteria`.

Execution item status values are `pending`, `available`, `failed`, `skipped`, and `external`. Forge producers can write metadata JSON next to their output path to report status back into `sync-assets`. For `available` or `external` forge metadata, include an `outputs` array of package-relative file paths; `sync-assets` keeps the task pending until those declared outputs exist.

`agent-sprite-forge` is the first recommended 2D asset forge backend. Users who want Codex to produce the generated 2D asset tasks should install or enable the `agent-sprite-forge` skills before handing off the package. If the relevant skills are installed, an agent can continue from the generated package with `$generate2dsprite` for sprites, character packs, prop packs, and FX packs, and `$generate2dmap` for maps/backgrounds.

The recommendation is optional. Framepack only emits the backend-neutral task and acceptance contract; users may also produce assets manually, use a custom forge backend, or reuse existing assets as long as the declared outputs and metadata match the package contract.

### `capture`

Materialize pending source assets and sync the project package:

- website packages capture screenshots into `assets/captures/`
- thread packages render text cards into `assets/generated/`
- game-ad packages write forge task outputs under `assets/forge/` after an agent or manual asset producer creates them

```bash
npx framepack capture --project-dir out/website-case
npx framepack capture --project-dir out/thread-case
```

Playwright is required for automated asset materialization:

```bash
npm install playwright
npx playwright install chromium
```

### Runtime workflow

Check runtime availability:

`npx framepack runtime doctor`

Check runtime availability and package protocol alignment together:

`npx framepack runtime doctor --project-dir out/website-case`

Run HyperFrames-side composition checks:

```bash
npx framepack runtime lint --project-dir out/website-case
npx framepack runtime inspect --project-dir out/website-case --json --samples 9
npx framepack runtime snapshot --project-dir out/website-case --frames 5
npx framepack runtime upgrade-check
```

`runtime lint` checks composition mistakes, `runtime inspect` checks visual layout and text overflow across the timeline, `runtime snapshot` captures PNG key frames, and `runtime upgrade-check` performs an explicit HyperFrames update check. Framepack 0.2 intentionally does not expose HyperFrames `publish`, because it uploads externally and returns a public URL.

Repair derived package protocol files after manual edits or older package drift:

`npx framepack repair --project-dir out/website-case`

Sync asset execution state after screenshot or asset generation work:

`npx framepack sync-assets --project-dir out/website-case`

`sync-captures` remains available as a compatibility alias.

Run a generated package:

```bash
npx framepack preview --project-dir out/starter
npx framepack preview --project-dir out/starter --port 3010
npx framepack render --project-dir out/starter
npx framepack render --project-dir out/starter --output renders/custom.mp4
npx framepack render --project-dir out/starter --format webm --fps 60 --quality high --strict
```

If HyperFrames is not installed, Framepack reports that state and keeps package generation available.

## Current Scope

The current implementation supports:

- Markdown input
- local thread/post text files
- public single-page website URLs
- `case-explainer` output type
- `game-ad` output type for sprite-video demo packages
- `16:9` and `9:16` formats
- engineering package generation
- guardrail validation

Current website-route limits:

- public pages only
- single page only
- HTML fetch plus lightweight `title` / `meta description` / `h1/h2 + p` extraction
- automated capture targets the first matching heading and falls back to full-page screenshots
- no login flows
- no multi-page crawling
- no section-perfect DOM segmentation yet

## Output Package

The generated package includes:

- `VIDEO_BRIEF.json`
- `PACKAGE_MANIFEST.json` as the machine-readable package protocol index
- `SOURCE_MANIFEST.json` for website-generated and thread-generated packages
- `SCENE_PLAN.json`
- website `SCENE_PLAN.json` now carries scene-level asset hints derived from structured website sections
- `SCENE_ASSET_MAP.json` with scene-first `recommendedAssets`, top-level `assets`, and compatibility `recommendedCaptures` / `captures`
- `SOURCE_SCENE_MAP.json` with scene-first and source-first lookup across website sections, thread posts, and game-ad forge sources
- `SCENE_ASSET_MAP.json`, `SOURCE_SCENE_MAP.json`, and `PACKAGE_MANIFEST.json` can be rebuilt by `repair` when those derived files drift from the source package JSON
- `SCRIPT.md`
- `STORYBOARD.md`
- `ASSET_PLAN.json`
- website `ASSET_PLAN.json` entries now include `captureTargets` so follow-on agents know which sections to capture or rebuild
- thread packages now populate `ASSET_PLAN.json` with `compose:post-N-card` missing assets for text-card production
- game-ad packages populate `ASSET_PLAN.json` with `forgeTargets` for character, map/background, and FX production
- website `captureTargets` also include `recommendedSceneIds` so follow-on agents know which scenes each capture best supports
- website `captureTargets` now also include `purposeTag` and `assetForm`, so downstream agents know both the storytelling role and the likely visual treatment
- `ASSET_EXECUTION_PLAN.json` with expected output paths, execution kinds, and pending/available sync state
- `FORGE_TASKS.md` with agent-facing instructions for forge tasks
- `VALIDATION_REPORT.json`
- `VALIDATION_REPORT.md`
- `GUARDRAILS.md`
- `HANDOFF.md`
- `COMMANDS.md`
- `meta.json`
- `index.html`
- `assets/`
- `assets/generated/` for thread/post card materialization
- `assets/forge/` for generated or manually produced forge assets
- `compositions/`
