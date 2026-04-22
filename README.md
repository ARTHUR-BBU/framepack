# Framepack

Framepack turns content into executable video projects.

Today this repository provides compiler paths for:

- markdown-driven case explainer videos
- first-version public website URL to case-explainer packages

It produces a video engineering package with planning artifacts, validation artifacts, and HyperFrames-ready runtime structure.

HyperFrames is required for runtime execution, but not for package generation. Framepack can generate, inspect, and validate project packages before HyperFrames is installed.

## User Flow

1. Provide a source
   - Markdown today
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
   - use runtime commands once the runtime layer is integrated

## Commands

- `npm install`
- `npm run typecheck`
- `npm test`
- `npm run build`

## CLI

After `npm run build`, Framepack exposes three commands:

### `init`

Create a starter project directory with a config file and Markdown input template.

```bash
node dist/cli.js init --output-dir out --project-name starter --format 9:16
```

### `generate`

Generate a video engineering package from a Markdown source file.

```bash
node dist/cli.js generate --input examples/case-explainer-input.md --output-dir out --goal "Explain the case" --audience "Founders"
```

Generate a video engineering package from a public single-page URL.

```bash
node dist/cli.js generate --url https://example.com/product --output-dir out --goal "Explain the site" --audience "Founders" --project-name website-case
```

### `validate`

Validate the input and planning path and write a structured report without generating the full package.

```bash
node dist/cli.js validate --input examples/case-explainer-input.md --output-dir out --goal "Explain the case" --audience "Founders"
node dist/cli.js validate --url https://example.com/product --output-dir out --goal "Explain the site" --audience "Founders" --project-name website-case
```

`validate` writes:

- `VALIDATION_REPORT.json`
- `VALIDATION_REPORT.md`

You can also use a project config produced by `init`:

```bash
node dist/cli.js generate --config out/starter/hyperframes-studio.json --output-dir out
node dist/cli.js validate --config out/starter/hyperframes-studio.json --output-dir out
```

For the first version, `--config`, `--input`, and `--url` are mutually exclusive. Use exactly one source input per command.

### Runtime workflow

Check runtime availability:

```bash
node dist/cli.js runtime doctor
```

Run a generated package:

```bash
node dist/cli.js preview --project-dir out/starter
node dist/cli.js preview --project-dir out/starter --port 3010
node dist/cli.js render --project-dir out/starter
node dist/cli.js render --project-dir out/starter --output renders/custom.mp4
```

If HyperFrames is not installed, Framepack reports that state and keeps package generation available.

## Current Scope

The current implementation supports:

- Markdown input
- public single-page website URLs
- `case-explainer` output type
- `16:9` and `9:16` formats
- engineering package generation
- guardrail validation

Current website-route limits:

- public pages only
- single page only
- HTML fetch plus lightweight `title` / `meta description` / `h1/h2 + p` extraction
- no login flows
- no multi-page crawling
- no screenshots or browser capture

## Output Package

The generated package includes:

- `VIDEO_BRIEF.json`
- `SOURCE_MANIFEST.json` for website-generated packages
- `SCENE_PLAN.json`
- `SCRIPT.md`
- `STORYBOARD.md`
- `ASSET_PLAN.json`
- website `ASSET_PLAN.json` entries now include `captureTargets` so follow-on agents know which sections to capture or rebuild
- `VALIDATION_REPORT.json`
- `VALIDATION_REPORT.md`
- `GUARDRAILS.md`
- `HANDOFF.md`
- `COMMANDS.md`
- `meta.json`
- `index.html`
- `assets/`
- `compositions/`
