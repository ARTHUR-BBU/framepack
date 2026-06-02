# Framepack Claude Code Instructions

Use Framepack when the user asks for a polished video, HyperFrames or Remotion composition, asset-to-video planning, template selection, or vague creative improvements such as cooler, more business, more dynamic, bigger text, faster pacing, or like this reference.

Project skills are installed under `.claude/skills`:

- `framepack-director`
- `framepack-template-fuser`
- `framepack-hyperframes-builder`
- `framepack-reference-miner`

Required flow:

1. Create a workbench with `framepack create --idea "<idea>" --assets <dir> --output-dir <dir>`.
2. Read `FRAMEPACK.md`, then `HUMAN.md`, `ASSETS.md`, `ASSET_GAPS.md`, `STYLE.md`, `DESIGN.md`, `DESIGN_TOKENS.md`, `DIRECTION.md`, `COMPOSITION.md`, and `ITERATIONS.md`.
3. Run `framepack workbench audit --phase preflight --project-dir <dir>` before implementation work.
4. Translate fuzzy user intent into concrete visual language, motion language, template route, tuning parameters, and implementation plan.
5. Use `framepack workbench brief --project-dir <dir>` whenever the user needs a plain-language progress recap.
6. Use the HITL loop in `HUMAN.md`, `DIRECTION.md`, and `ITERATIONS.md`: ask the user to choose or modify the proposal before locking the first composition when taste is fuzzy.
7. Run `framepack workbench audit --phase design --project-dir <dir>` after design/token work.
8. Run `framepack workbench audit --phase composition --project-dir <dir>` before `framepack build`.
9. Build with `framepack build --project-dir <dir>`.
10. Preview with `framepack preview --project-dir <dir> --open`, then run `framepack workbench audit --phase preview --project-dir <dir>`.
11. Render only after P0/P1 blockers are clear, then run `framepack workbench audit --phase render --project-dir <dir>`.
12. When a Framepack command supports `--json`, read `interventionContext` before deciding the next action.
13. Use `framepack workbench preferences/friction/learnings --project-dir <dir>` to explain stored taste signals, blockers, force bypasses, and test learnings.
14. Use HyperFrames-safe rules: CSS first frame visible, scene switches with `tl.set()`, no timed video inside timed scene containers, one animation engine per element, and timeline registration on `window.__timelines`.
15. Record render feedback and next actions in `ITERATIONS.md`.

Stop on P0/P1 audit blockers. `build`, `preview`, and `render` can block on P0 issues; use `--force` only when the user explicitly accepts the risk, because Framepack records that bypass in `.framepack/interventions.jsonl` and `ITERATIONS.md`.

## Framepack Playbooks

### framepack-director

Use when the user gives fuzzy taste words, a rough idea, or a reference. Translate the request into audience, story structure, visual language, motion language, template route, risks, and acceptance criteria. Explain the current choice in `HUMAN.md` before locking a direction.

### framepack-template-fuser

Use when a template, user assets, and user requirements must become a custom video plan. Treat templates as director blueprints, not finished videos. Keep user assets and intent as source of truth, then write the adapted scene rhythm, Catalog candidates, copy roles, and acceptance criteria into `COMPOSITION.md`.

### framepack-hyperframes-builder

Use when turning `COMPOSITION.md` into HyperFrames code. Keep the first frame visible, switch scenes with `tl.set()`, register timelines on `window.__timelines`, avoid multiple animation engines on one element, then run lint, inspect, and snapshot checks before final render.

### framepack-reference-miner

Use when the user provides a finished video, reference video, or wants to turn a result into a reusable template. Extract the structure into `VIDEO_DNA.md`, convert reusable production rules into `TEMPLATE_BLUEPRINT.md`, then update `DIRECTION.md` and `COMPOSITION.md` from that blueprint.
