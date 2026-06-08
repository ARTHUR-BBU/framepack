# Framepack Claude Code Instructions

Framepack serves HyperFrames programmatic commercial video ideation and composition.

It is a commercial video arsenal for HyperFrames agents.

The agent is the director. Framepack is the director's advisor, producer, arsenal manager, and HyperFrames quality gate.

Use Framepack when a user asks for a polished video, an event promo, a product or course promo, a sports/transfer/tribute video, HyperFrames composition work, reference-video mining, or fuzzy improvements such as more premium, faster, more dynamic, bigger text, more business, more animation, or like this reference.

## First Move

Do not ask the user to name templates or libraries. Use Framepack to expose the available weapons.

```bash
framepack create --idea "<idea>" --assets <dir> --output-dir <dir>
framepack arsenal recommend --idea "<idea>" --format <16:9|9:16> --type event-promo
```

## Read Before Code

Read these before writing or editing HTML:

1. `FRAMEPACK.md`
2. `HUMAN.md`
3. `ASSETS.md`
4. `ASSET_GAPS.md`
5. `STORYBOARD.md`
6. `.framepack/arsenal.json`
7. `STYLE.md`
8. `DESIGN.md`
9. `DESIGN_TOKENS.md`
10. `DIRECTION.md`
11. `COMPOSITION.md`
12. `ITERATIONS.md`

`STORYBOARD.md` is the creative spine. `.framepack/arsenal.json` is the weapon memory.

## Arsenal Lifecycle

Use:

```bash
framepack arsenal list
framepack arsenal recommend --idea "<idea>" --format 9:16 --type event-promo
framepack arsenal add --from <path> --kind <template|motion|library|reference> --project-dir <dir> --name <name>
framepack arsenal save --project-dir <dir> --name <name>
framepack arsenal cache --project-dir <dir> --json
```

Rules:

- Built-in weapons are references, not final creative decisions.
- Project weapons live in `.framepack/arsenal.json`.
- Trusted cached resources live in `.framepack/arsenal-cache/manifest.json`.
- Search results stay candidates until trusted.
- Save useful new combinations so the next project can reuse them.

## Reference Mining

When the user provides a reference or wants to reuse a finished render:

```bash
framepack reference mine --project-dir <dir> --video <file>
```

Use the generated `VIDEO_DNA.md`, `STORYBOARD.md`, and `TEMPLATE_BLUEPRINT.md` to extract rhythm, scene roles, visual grammar, motion grammar, reusable slots, and HyperFrames constraints.

## Build And Audit

```bash
framepack workbench audit --phase preflight --project-dir <dir>
framepack workbench audit --phase composition --project-dir <dir>
framepack build --project-dir <dir>
framepack workbench graph --project-dir <dir>
framepack preview --project-dir <dir> --open
framepack workbench audit --phase preview --project-dir <dir>
framepack render --project-dir <dir>
framepack workbench audit --phase render --project-dir <dir>
```

Stop on P0/P1 blockers unless the user explicitly accepts the risk.

## HyperFrames Rules

- first scene visible in CSS
- scene switches with `tl.set()`
- timeline registered on `window.__timelines`
- no timed video inside timed scene containers
- no `Math.random()` or `repeat: -1` in render timelines
- convert ScrollTrigger, FLIP, and scrubbed ideas into deterministic video beats

## Project Skills

Use the installed skills under `.claude/skills` only when they fit:

- `framepack-director`: creative direction and storyboard thinking
- `framepack-template-fuser`: assets + templates + arsenal into `COMPOSITION.md`
- `framepack-hyperframes-builder`: HyperFrames-safe code
- `framepack-reference-miner`: reference video into reusable DNA and blueprint
