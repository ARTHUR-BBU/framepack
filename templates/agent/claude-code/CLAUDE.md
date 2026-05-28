# Framepack Claude Code Instructions

Use Framepack when the user asks for a polished video, HyperFrames or Remotion composition, asset-to-video planning, template selection, or vague creative improvements such as cooler, more business, more dynamic, bigger text, faster pacing, or like this reference.

Project skills are installed under `.claude/skills`:

- `framepack-director`
- `framepack-template-fuser`
- `framepack-hyperframes-builder`
- `framepack-reference-miner`

Suggested flow:

1. Create a workbench with `framepack create --idea "<idea>" --assets <dir> --output-dir <dir>`.
2. Read `FRAMEPACK.md`, then `HUMAN.md`, `ASSETS.md`, `STYLE.md`, `DIRECTION.md`, `COMPOSITION.md`, and `ITERATIONS.md`.
3. Translate fuzzy user intent into concrete visual language, motion language, template route, tuning parameters, and implementation plan.
4. Use `framepack workbench brief --project-dir <dir>` whenever the user needs a plain-language progress recap.
5. Use the HITL loop in `HUMAN.md`, `DIRECTION.md`, and `ITERATIONS.md`: ask the user to choose or modify the proposal before locking the first composition when taste is fuzzy.
6. Run `framepack workbench check --project-dir <dir>` before claiming the workbench is ready.
7. Use HyperFrames-safe rules: CSS first frame visible, scene switches with `tl.set()`, one animation engine per element, and timeline registration on `window.__timelines`.
8. Record render feedback and next actions in `ITERATIONS.md`.

## Framepack Playbooks

### framepack-director

Use when the user gives fuzzy taste words, a rough idea, or a reference. Translate the request into audience, story structure, visual language, motion language, template route, risks, and acceptance criteria. Explain the current choice in `HUMAN.md` before locking a direction.

### framepack-template-fuser

Use when a template, user assets, and user requirements must become a custom video plan. Treat templates as director blueprints, not finished videos. Keep user assets and intent as source of truth, then write the adapted scene rhythm, Catalog candidates, copy roles, and acceptance criteria into `COMPOSITION.md`.

### framepack-hyperframes-builder

Use when turning `COMPOSITION.md` into HyperFrames code. Keep the first frame visible, switch scenes with `tl.set()`, register timelines on `window.__timelines`, avoid multiple animation engines on one element, then run lint, inspect, and snapshot checks before final render.

### framepack-reference-miner

Use when the user provides a finished video, reference video, or wants to turn a result into a reusable template. Extract the structure into `VIDEO_DNA.md`, convert reusable production rules into `TEMPLATE_BLUEPRINT.md`, then update `DIRECTION.md` and `COMPOSITION.md` from that blueprint.
