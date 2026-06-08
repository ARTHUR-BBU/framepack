# Framepack Agent Guide

Framepack serves **HyperFrames programmatic commercial video ideation and composition**.

It is a **Hermes Agent Plugin** — a parasitic organ that lives inside the agent loop, hooks into tool calls, and proactively injects advice.

The agent is the director. Framepack is the director's advisor, producer, arsenal manager, and HyperFrames quality gate.

Do not treat Framepack as a one-click creative director. Treat it as a focused production system that helps the agent avoid starting from zero, manage reusable weapons, mine references, preserve useful remixes, and pass strict render checks.

## Product Spine

```text
idea / assets / reference
  -> agent-led creative direction and storyboard
  -> Framepack Plugin hooks detect workbench file writes
  -> hooks inject real-time feedback (LLM analysis + regex audits)
  -> agent composes HyperFrames-safe video
  -> Framepack validates render safety, arsenal completeness, and DNA structure
  -> save reusable weapons, remixes, and templates
```

If a capability does not serve this spine, keep it out of the primary onboarding path. Legacy CLI commands can remain for compatibility, but the Plugin is the primary product.

## Trigger Framepack When

Use Framepack for:

- activity/event promos, conference promos, summit videos, launch-event trailers, webinars, salons, livestream previews
- polished product videos, SaaS launches, course promos, founder promos, data/news explainers
- sports highlights, transfer announcements, player tributes
- turning assets into a programmed video
- HyperFrames composition planning or render-safety checks
- reference-video mining, storyboard extraction, reusable template creation
- requests such as "more premium", "more dynamic", "more business", "bigger text", "faster pacing", "more animation", or "like this reference"
- motion direction such as Apple keynote, ScrollTrigger, FLIP, scrubbed walkthrough, bento reveal, kinetic captions, countdown, lineup reveal

## Plugin Architecture

Framepack v0.7 is a Hermes Plugin with 6 hooks and 6 skills:

```text
Hermes Agent Loop
  └── Plugin hooks (pre_tool_call + post_tool_call)
        ├── 🚨 pre_tool_call  → index.html (write scan)
        ├── 📋 post_tool_call → STORYBOARD.md (LLM)
        ├── 🎬 post_tool_call → COMPOSITION.md (LLM)
        ├── 🔍 post_tool_call → index.html (regex)
        ├── 🔫 post_tool_call → arsenal.json
        └── 🧬 post_tool_call → VIDEO_DNA.md / TEMPLATE_BLUEPRINT.md
      └── Skills (knowledge injected into LLM hooks)
        ├── framepack-director
        ├── framepack-template-fuser
        ├── framepack-hyperframes-builder
        ├── framepack-arsenal
        ├── framepack-gsap
        └── framepack-reference-miner
```

The Plugin automatically fires when the agent writes any of the watched files. No manual `framepack` commands needed — the Plugin is always watching.

## Required Reading In A Workbench

After `framepack create`, read:

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
13. `.framepack/state.json` when machine-readable state is needed

Use `HUMAN.md` for non-technical user updates. Use `STORYBOARD.md` and `.framepack/arsenal.json` before writing code.

## Workbench Files

```text
FRAMEPACK.md
HUMAN.md
ASSETS.md
ASSET_GAPS.md
STORYBOARD.md
STYLE.md
DESIGN.md
DESIGN_TOKENS.md
DIRECTION.md
COMPOSITION.md
ITERATIONS.md
index.html
meta.json
VIDEO_DNA.md
TEMPLATE_BLUEPRINT.md
.framepack/arsenal.json
.framepack/content-graph.json
.framepack/state.json
```

## Legacy CLI Commands (v0.6)

The CLI is preserved for backward compatibility. The Plugin is the primary interface.

Create and inspect:

```bash
npx framepack create --idea "Premium founder summit event promo" --assets ./assets --output-dir ./out --project-name summit --format 9:16
npx framepack workbench brief --project-dir ./out/summit
npx framepack workbench graph --project-dir ./out/summit
```

Manage the arsenal:

```bash
npx framepack arsenal list
npx framepack arsenal recommend --idea "Premium summit event promo" --format 9:16 --type event-promo
npx framepack arsenal add --from ./snippets/impact-pop.txt --kind motion --project-dir ./out/summit --name impact-pop
npx framepack arsenal save --project-dir ./out/summit --name summit-remix
npx framepack arsenal cache --project-dir ./out/summit --json
```

Mine references:

```bash
npx framepack reference mine --project-dir ./out/summit --video ./reference.mp4
```

Audit and render:

```bash
npx framepack workbench audit --phase preflight --project-dir ./out/summit
npx framepack workbench audit --phase composition --project-dir ./out/summit
npx framepack build --project-dir ./out/summit
npx framepack preview --project-dir ./out/summit --open
npx framepack workbench audit --phase preview --project-dir ./out/summit
npx framepack render --project-dir ./out/summit --audio bgm.mp3
npx framepack workbench audit --phase render --project-dir ./out/summit
```

Stop on unresolved P0/P1 blockers. Use `--force` only when the user explicitly accepts the risk; forced bypasses are recorded.

## Arsenal Rules

- Built-in weapons are references, not final creative decisions.
- Project-local weapons belong in `.framepack/arsenal.json`.
- Trusted downloaded resources belong in `.framepack/arsenal-cache/manifest.json`.
- Search results are candidates first, not automatic downloads.
- Useful new combinations should be saved with `framepack arsenal save`.
- Finished or reference videos should become `VIDEO_DNA.md` and `TEMPLATE_BLUEPRINT.md` when they can teach future projects.

## Reference Mining Rules

`framepack reference mine` should produce reusable knowledge:

- rhythm
- scene roles
- visual grammar
- motion grammar
- asset requirements
- reusable slots
- HyperFrames constraints

Do not copy references blindly. Extract reusable structure.

## HyperFrames Rules

When building or editing HTML:

- keep the first scene visible in CSS
- preserve `data-width`, `data-height`, and `data-start`
- write `meta.json`
- register timelines on `window.__timelines`
- switch scenes with `tl.set()`
- do not put timed `<video>` elements inside timed scene containers
- avoid `Math.random()` and `repeat: -1` in render timelines
- convert ScrollTrigger, FLIP, and scrubbed interaction intent into deterministic timeline beats
- avoid missing `compositions/blocks/*.html` references unless the block files exist

## Skills

Framepack installs these project-facing skills:

- `framepack-director`: fuzzy intent into creative direction and storyboard language
- `framepack-template-fuser`: assets + templates + arsenal into `COMPOSITION.md`
- `framepack-hyperframes-builder`: HyperFrames-safe code and render checks
- `framepack-reference-miner`: reference or finished video into DNA and blueprint

## Development Verification

Before claiming a product change is complete:

```bash
# Plugin
cd framepack-plugin && python -m pytest tests/ -q

# Legacy CLI
npm run typecheck
npm test
npm run build
npm run sandbox:benchmark
npm pack --dry-run --json
```

Keep `CHANGELOG.md` aligned with the current test count and release evidence.

## Editing Rules

- Keep README, `docs/README.zh-CN.md`, AGENTS, agent templates, and package metadata aligned when changing public workflow.
- Prefer focused, reusable arsenal structures over broad legacy workflow expansion.
- Cut or downgrade capabilities that conflict with the agent-as-director positioning.
- Use `apply_patch` for manual edits.
- Do not revert user changes.
- Keep code and docs lean in structure, even when the arsenal grows.

<!-- FRAMEPACK MANAGED BLOCK START -->
## Framepack Agent Workflow

Framepack is installed as an agent-native video creative workbench for this project.

- Trigger Framepack for vague video requests, asset-to-video work, HyperFrames composition, template selection, or polish direction.
- Prefer MCP tools over memorized shell commands; check `npx -y framepack mcp --describe` if MCP is not connected.
- Create workbenches with `npx -y framepack create --idea "<idea>" --assets <dir> --output-dir <dir>`.
- Start every Framepack project by reading `FRAMEPACK.md`.
- Use `HUMAN.md`, `ASSETS.md`, `ASSET_GAPS.md`, `DESIGN.md`, `DESIGN_TOKENS.md`, `STYLE.md`, `DIRECTION.md`, `COMPOSITION.md`, and `ITERATIONS.md` as durable context. Do not rely on model memory.
- Run `npx -y framepack workbench audit --phase preflight --project-dir <dir>` before starting, then `npx -y framepack workbench audit --phase design|composition|preview|render --project-dir <dir>` at each lifecycle gate. Stop on P0/P1 blockers.
- Recommend animation libraries, templates, game-asset tools, HyperFrames, or Remotion only when the current project needs them.
- Project skills are installed under `.framepack/agent/codex/skills`; each skill contains detailed references. Use the matching Framepack skill for: director work, template fusion, HyperFrames building, or reference mining.
<!-- FRAMEPACK MANAGED BLOCK END -->
