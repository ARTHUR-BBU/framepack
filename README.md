# Framepack

Framepack turns content into executable video projects.

Today this repository provides the Phase 1 compiler path for markdown-driven case explainer videos. It produces a video engineering package with planning artifacts, validation artifacts, and HyperFrames-ready runtime structure.

HyperFrames is required for runtime execution, but not for package generation. Framepack can generate, inspect, and validate project packages before HyperFrames is installed.

## User Flow

1. Provide a source
   - Markdown today
   - websites, PRDs, and case packages later
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

### `validate`

Validate the input and planning path and write a structured report without generating the full package.

```bash
node dist/cli.js validate --input examples/case-explainer-input.md --output-dir out --goal "Explain the case" --audience "Founders"
```

`validate` writes:

- `VALIDATION_REPORT.json`
- `VALIDATION_REPORT.md`

You can also use a project config produced by `init`:

```bash
node dist/cli.js generate --config out/starter/hyperframes-studio.json --output-dir out
node dist/cli.js validate --config out/starter/hyperframes-studio.json --output-dir out
```

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
- `case-explainer` output type
- `16:9` and `9:16` formats
- engineering package generation
- guardrail validation

## Output Package

The generated package includes:

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
- `assets/`
- `compositions/`
