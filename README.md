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
- `COMMANDS.md`
- `GUARDRAILS.md`
- `RETRO_LOG.md`
- `composition.html`
