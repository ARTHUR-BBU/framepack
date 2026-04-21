# HyperFrames Studio Pipeline

This repository contains the first-version Studio pipeline that turns case materials into a reusable video project package for HyperFrames.

## What it does

- normalizes Markdown input into a `VideoBrief`
- plans a fixed first-version `ScenePlan`
- validates review-stage issues before render
- compiles the plan into a `CompositionSpec`
- emits HyperFrames-ready HTML
- generates a reusable package with flywheel files

## Commands

- `npm install`
- `npm run typecheck`
- `npm test`
- `npm run build`

## CLI

After `npm run build`, the product exposes three CLI commands:

### `init`

Create a starter project directory with a config file and Markdown input template.

```bash
node dist/cli.js init --output-dir out --project-name starter --format 9:16
```

### `generate`

Generate a reusable package from a Markdown source file.

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

Optional flags for `generate` and `validate`:

- `--project-name <name>`
- `--format 16:9|9:16`
- `--brand-name <name>`
- `--tone <tone>`
- `--pacing slow|medium|fast`
- `--palette <palette>`

You can also use a project config produced by `init`:

```bash
node dist/cli.js generate --config out/starter/hyperframes-studio.json --output-dir out
node dist/cli.js validate --config out/starter/hyperframes-studio.json --output-dir out
```

The config file can carry brand and theme settings through generation, including:

- `style.brandName`
- `style.tone`
- `style.pacing`
- `theme.palette`
- `constraints.maxDurationSec`
- `constraints.requiredPoints`
- `constraints.bannedTerms`

Example guardrails in `hyperframes-studio.json`:

```json
{
  "constraints": {
    "maxDurationSec": 60,
    "requiredPoints": ["repeatable", "renderable"],
    "bannedTerms": ["cheap"]
  }
}
```

Behavior:

- `validate` writes a passed or failed validation report based on these constraints
- `generate` fails fast when validation issues are present and does not write the full package

## Current scope

The current implementation supports:

- Markdown input
- `case-explainer` output type
- `16:9` and `9:16` formats

## Output package

The generated package contains:

- `FLYWHEEL.md`
- `VIDEO_BRIEF.json`
- `SCENE_PLAN.json`
- `VALIDATION_REPORT.json`
- `VALIDATION_REPORT.md`
- `COMMANDS.md`
- `GUARDRAILS.md`
- `RETRO_LOG.md`
- `composition.html`
