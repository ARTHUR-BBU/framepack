# Framepack Agent Guide

Framepack is an agent-native video project compiler.

It turns content sources into executable video project packages. The package is an intermediate work surface for agents and HyperFrames, not usually the final human-facing video.

## Mental Model

- Framepack prepares the project package.
- Agents inspect, edit, materialize assets, and run commands.
- HyperFrames previews and renders the final video.

## Primary Commands

Build the repo:

```bash
npm install
npm run build
```

Generate a package:

```bash
node dist/cli.js generate --input examples/case-explainer-input.md --output-dir out --goal "Explain the case" --audience "Founders"
node dist/cli.js generate --thread-file examples/thread.txt --output-dir out --goal "Explain the thread" --audience "Founders" --project-name thread-case
node dist/cli.js generate --url https://example.com/product --output-dir out --goal "Explain the site" --audience "Founders" --project-name website-case
```

Materialize pending source assets:

```bash
node dist/cli.js capture --project-dir out/thread-case
node dist/cli.js sync-assets --project-dir out/thread-case
```

Render through HyperFrames when the runtime is available:

```bash
node dist/cli.js runtime doctor
node dist/cli.js preview --project-dir out/thread-case
node dist/cli.js render --project-dir out/thread-case
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

Then inspect these files as needed:

- `SOURCE_MANIFEST.json`
- `VIDEO_BRIEF.json`
- `SCENE_PLAN.json`
- `SOURCE_SCENE_MAP.json`
- `ASSET_PLAN.json`
- `ASSET_EXECUTION_PLAN.json`
- `HANDOFF.md`

## Editing Rules

- Keep `PACKAGE_MANIFEST.json` consistent with package files when changing package structure.
- Keep `SOURCE_SCENE_MAP.json` and `ASSET_EXECUTION_PLAN.json` aligned when changing source-to-scene mapping.
- Prefer adding new execution kinds to `ASSET_EXECUTION_PLAN.json` over creating source-specific plan files.
- Keep `CAPTURE_EXECUTION_PLAN.json` as compatibility output while older flows may still read it.
- Run `npm run typecheck`, `npm test`, and `npm run build` before claiming a change is complete.
