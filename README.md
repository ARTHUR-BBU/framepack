# Framepack

Framepack turns content into executable video projects.

In practice, that output is a production-ready intermediate, not usually the final human-facing video.

Framepack prepares the video engineering package. HyperFrames and an agent finish preview, asset materialization, and rendering.

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
npx framepack capture --project-dir out/thread-case
npx framepack preview --project-dir out/thread-case
```

Today this repository provides compiler paths for:

- markdown-driven case explainer videos
- local thread/post text files
- first-version public website URL to case-explainer packages

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

### `validate`

Validate the input and planning path and write a structured report without generating the full package.

```bash
npx framepack validate --input examples/case-explainer-input.md --output-dir out --goal "Explain the case" --audience "Founders"
npx framepack validate --thread-file examples/thread.txt --output-dir out --goal "Explain the thread" --audience "Founders" --project-name thread-case
npx framepack validate --url https://example.com/product --output-dir out --goal "Explain the site" --audience "Founders" --project-name website-case
```

`validate` writes:

- `VALIDATION_REPORT.json`
- `VALIDATION_REPORT.md`

You can also use a project config produced by `init`:

```bash
npx framepack generate --config out/starter/hyperframes-studio.json --output-dir out
npx framepack validate --config out/starter/hyperframes-studio.json --output-dir out
```

For the first version, `--config`, `--input`, `--thread-file`, and `--url` are mutually exclusive. Use exactly one source input per command.

### `capture`

Materialize pending source assets and sync the project package:

- website packages capture screenshots into `assets/captures/`
- thread packages render text cards into `assets/generated/`

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
- `SCENE_ASSET_MAP.json` with scene-first and capture-first lookup for website-derived asset recommendations
- `SOURCE_SCENE_MAP.json` with scene-first and source-first lookup across website sections and thread posts
- `SCRIPT.md`
- `STORYBOARD.md`
- `ASSET_PLAN.json`
- website `ASSET_PLAN.json` entries now include `captureTargets` so follow-on agents know which sections to capture or rebuild
- thread packages now populate `ASSET_PLAN.json` with `compose:post-N-card` missing assets for text-card production
- website `captureTargets` also include `recommendedSceneIds` so follow-on agents know which scenes each capture best supports
- website `captureTargets` now also include `purposeTag` and `assetForm`, so downstream agents know both the storytelling role and the likely visual treatment
- `ASSET_EXECUTION_PLAN.json` with expected output paths, execution kinds, and pending/available sync state
- `VALIDATION_REPORT.json`
- `VALIDATION_REPORT.md`
- `GUARDRAILS.md`
- `HANDOFF.md`
- `COMMANDS.md`
- `meta.json`
- `index.html`
- `assets/`
- `assets/generated/` for thread/post card materialization
- `compositions/`
