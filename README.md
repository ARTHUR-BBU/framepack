# Framepack

[中文说明](./README.zh-CN.md)

Framepack turns content into executable video project packages.

In practice, that output is a production-ready intermediate, not usually the final human-facing video.

Framepack prepares the video engineering package: source structure, scene plans, asset requirements, execution tasks, and runtime entrypoints. HyperFrames and an agent finish preview, asset materialization, and rendering.

It is the compiler layer in a hybrid workflow: asset library + orchestration + generative model + post-production composition. Framepack does not become a game engine or image generator.

Agents should start with [AGENTS.md](./AGENTS.md).

## Quickstart

```bash
npm install
npm run build
npx framepack generate --input examples/case-explainer-input.md --output-dir out --goal "Explain the case" --audience "Founders"
```

Agent-first examples:

```bash
npx framepack generate --thread-file examples/thread.txt --output-dir out --goal "Explain the thread" --audience "Founders" --project-name thread-case
npx framepack generate --url https://example.com/product --output-dir out --goal "Explain the site" --audience "Founders" --project-name website-case
npx framepack generate --game-ad-description "A course that teaches founders to ship agent-native video systems." --output-dir out --goal "Promote the course" --audience "Founders" --project-name sprite-video-demo
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

This produces a game-ad package with character, map/background, and FX forge tasks. It does not install `agent-sprite-forge` or call an image model automatically.

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
9. Run `preview` or `render` when HyperFrames is available.

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

`npm test` includes golden package protocol summaries for markdown, thread, and game-ad packages. These summaries intentionally avoid timestamps and absolute paths while checking the package manifest, scene asset map, execution kinds, forge task count, and handoff guidance.

Package protocol versioning is documented in [`docs/architecture/package-protocol-v1.md`](docs/architecture/package-protocol-v1.md).

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

`status` summarizes protocol health, asset execution state, forge task progress, runtime availability, readiness, and recommended next actions. Use `--json` when an agent, UI, or automation needs the same state as structured data; structured consumers should prefer `readiness` and `nextActionItems` over parsing `nextActions` text.

Package validation checks that `PACKAGE_MANIFEST.json`, `SCENE_PLAN.json`, `SCENE_ASSET_MAP.json`, `SOURCE_SCENE_MAP.json`, and `ASSET_EXECUTION_PLAN.json` stay aligned. It also fails if an item marked `available` or `external` points at a missing output file.

`PACKAGE_MANIFEST.json` also exposes `capabilities.packageCommands` so agents and tools can discover package-level operations such as `status`, `validate`, `repair`, `sync-assets`, `capture`, `runtime-doctor`, `preview`, and `render` without parsing `COMMANDS.md`.

`validate` writes:

- `VALIDATION_REPORT.json`
- `VALIDATION_REPORT.md`

### `repair`

Repair known, deterministic package protocol drift in place:

```bash
npx framepack repair --project-dir out/sprite-video-demo
```

`repair` rebuilds derived protocol files from the existing package: `SCENE_ASSET_MAP.json`, `SOURCE_SCENE_MAP.json`, and `PACKAGE_MANIFEST.json`. It then reruns package validation and writes `VALIDATION_REPORT.json` / `VALIDATION_REPORT.md`. It does not invent missing source content, install forge skills, or materialize image assets.

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

`agent-sprite-forge` is the first recommended 2D asset forge backend. If the relevant skills are installed, an agent can continue from the generated package with `$generate2dsprite` for sprites, character packs, prop packs, and FX packs, and `$generate2dmap` for maps/backgrounds. Framepack only emits the backend-neutral task and acceptance contract.

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
