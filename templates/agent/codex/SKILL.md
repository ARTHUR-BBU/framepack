---
name: framepack
description: Use Framepack when a user wants an agent-led HyperFrames video, event promo, asset-to-video workflow, reference-video mining, reusable video template, or fuzzy video polish direction.
---

# Framepack Codex Skill

Framepack serves HyperFrames programmatic commercial video ideation and composition.

It is a commercial video arsenal for HyperFrames agents.

The agent is the director. Framepack is the director's advisor, producer, arsenal manager, and HyperFrames quality gate.

Use it for event promos, product launches, SaaS videos, course promos, data/news explainers, sports highlights, transfer announcements, player tributes, reference mining, and requests like more premium, faster, more dynamic, bigger text, more animation, or like this reference.

## Principle

Framepack should not replace agent creativity. It should expose reusable weapons, preserve project memory, help mine references, and enforce render safety.

## Start

```bash
framepack create --idea "<idea>" --assets <dir> --output-dir <dir>
framepack arsenal recommend --idea "<idea>" --format <16:9|9:16> --type event-promo
```

If MCP is unavailable, inspect:

```bash
framepack mcp --describe
```

## Read Before Code

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

## Arsenal Lifecycle

```bash
framepack arsenal list
framepack arsenal recommend --idea "<idea>" --format 9:16 --type event-promo
framepack arsenal add --from <path> --kind <template|motion|library|reference> --project-dir <dir> --name <name>
framepack arsenal save --project-dir <dir> --name <name>
framepack arsenal cache --project-dir <dir> --json
```

Use `.framepack/arsenal.json` as the project memory for weapons, downloads, candidates, and remixes.

## Reference Mining

```bash
framepack reference mine --project-dir <dir> --video <file>
```

Use it to produce `VIDEO_DNA.md`, `STORYBOARD.md`, and `TEMPLATE_BLUEPRINT.md`. Extract reusable rhythm and structure; do not blindly copy.

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
- convert ScrollTrigger, FLIP, and scrubbed ideas into deterministic timeline beats

## Project Skills

- `framepack-director`: fuzzy intent into storyboard and direction
- `framepack-template-fuser`: assets + templates + arsenal into `COMPOSITION.md`
- `framepack-hyperframes-builder`: HyperFrames-safe code
- `framepack-reference-miner`: reference video into reusable DNA and blueprint
