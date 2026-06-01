---
name: framepack
description: Use Framepack when a user wants a polished HyperFrames or Remotion video from vague creative intent, assets, references, or prompt/composition work.
---

# Framepack Codex Skill

Use Framepack when the user asks for video creative work, asset-to-video planning, HyperFrames or Remotion composition, more polish, more motion, a business-looking video, a game-style ad, or a result inspired by a reference.

Project skills are also installed under `.framepack/agent/codex/skills` for director work, template fusion, HyperFrames building, and reference mining.

## Workflow

1. Inspect `framepack mcp --describe` when MCP is not connected.
2. Create a workbench with `framepack create --idea "<idea>" --assets <dir> --output-dir <dir>`.
3. Read `FRAMEPACK.md`, `HUMAN.md`, `ASSETS.md`, `ASSET_GAPS.md`, `STYLE.md`, `DESIGN.md`, `DESIGN_TOKENS.md`, `DIRECTION.md`, `COMPOSITION.md`, and `ITERATIONS.md`.
4. Run `framepack workbench audit --phase preflight --project-dir <dir>` before implementation work.
5. Translate fuzzy user language into concrete visual language, motion language, template route, tuning parameters, and HyperFrames/Remotion implementation choices.
6. Use `framepack workbench brief --project-dir <dir>` whenever the user needs a plain-language progress recap.
7. Use the HITL loop in `HUMAN.md`, `DIRECTION.md`, and `ITERATIONS.md`: ask the user to choose or modify the proposal before locking the first composition when taste is fuzzy.
8. Run `framepack workbench audit --phase design --project-dir <dir>` after design/token work.
9. Run `framepack workbench audit --phase composition --project-dir <dir>` before `framepack build`.
10. Build with `framepack build --project-dir <dir>`.
11. Preview with `framepack preview --project-dir <dir> --open`, then run `framepack workbench audit --phase preview --project-dir <dir>`.
12. Render only after P0/P1 blockers are clear, then run `framepack workbench audit --phase render --project-dir <dir>`.
13. Keep state in workbench files, not model memory.
14. Use HyperFrames-safe rules: CSS first frame visible, scene switches with `tl.set()`, no timed video inside timed scene containers, one animation engine per element, and timeline registration on `window.__timelines`.

Stop on P0/P1 audit blockers. Fix them or ask the user before continuing.

## Playbooks

### framepack-director

Use when the user gives fuzzy taste words, a rough idea, or a reference. Translate the request into audience, story structure, visual language, motion language, template route, risks, and acceptance criteria. Explain the current choice in `HUMAN.md` before locking a direction.

### framepack-template-fuser

Use when a template, user assets, and user requirements must become a custom video plan. Treat templates as director blueprints, not finished videos. Keep user assets and intent as source of truth, then write the adapted scene rhythm, Catalog candidates, copy roles, and acceptance criteria into `COMPOSITION.md`.

### framepack-hyperframes-builder

Use when turning `COMPOSITION.md` into HyperFrames code. Keep the first frame visible, switch scenes with `tl.set()`, register timelines on `window.__timelines`, avoid multiple animation engines on one element, then run lint, inspect, and snapshot checks before final render.

### framepack-reference-miner

Use when the user provides a finished video, reference video, or wants to turn a result into a reusable template. Extract the structure into `VIDEO_DNA.md`, convert reusable production rules into `TEMPLATE_BLUEPRINT.md`, then update `DIRECTION.md` and `COMPOSITION.md` from that blueprint.
