# Framepack Agent Guide

Framepack is an agent-native **programmatic video workbench** for Codex, Claude Code, and the HyperFrames render runtime.

The current public workflow is:

```text
rough idea + assets + references
  -> Framepack workbench
  -> human-readable brief
  -> design tokens + asset gaps + composition plan
  -> audit gates
  -> HyperFrames HTML build
  -> preview / render / iteration
```

Framepack is not a generative video model and does not create pixels by itself. It gives agents a disciplined production surface for organizing assets, choosing templates, writing HyperFrames-safe composition plans, building HTML, and auditing quality before preview and render.

## Current Version Shape

The repository version is `0.6.0-alpha.2`.

The 0.6 public path is the workbench path:

```bash
npx framepack create --idea "Premium 30s launch video" --assets ./assets --output-dir ./out --project-name launch-video --format 9:16
npx framepack workbench brief --project-dir ./out/launch-video
npx framepack workbench audit --phase preflight --project-dir ./out/launch-video
npx framepack workbench audit --phase design --project-dir ./out/launch-video
npx framepack workbench audit --phase composition --project-dir ./out/launch-video
npx framepack build --project-dir ./out/launch-video
npx framepack preview --project-dir ./out/launch-video --open
npx framepack workbench audit --phase preview --project-dir ./out/launch-video
npx framepack render --project-dir ./out/launch-video --audio bgm.mp3
npx framepack workbench audit --phase render --project-dir ./out/launch-video
```

Older package-protocol commands (`generate`, `status`, `validate`, `capture`, `repair`, `packs`, `atlas`, `runtime *`) remain in the codebase for compatibility and regression coverage. Do not make them the primary onboarding path unless the task explicitly concerns legacy 0.4 package workflows.

Legacy package projects start from `PACKAGE_MANIFEST.json` and `HANDOFF.md`. For those historical package routes, agents may still use commands such as `npx framepack generate --thread-file examples/thread.txt --output-dir out --project-name thread-case`, `npx framepack generate --game-ad-description "A sprite-style course promo" --output-dir out --project-name game-ad-case`, `npx framepack capture --project-dir out/thread-case`, and `npx framepack sync-assets --project-dir out/thread-case`. Forge compatibility still includes backend-neutral task kinds such as `forge-character-pack`, `forge-map-pack`, and `forge-fx-pack`; `agent-sprite-forge` remains a recommended reference backend, not a hard dependency.

## Agent Trigger Conditions

Use Framepack when the user asks for:

- a polished video, commercial video, launch video, explainer, course promo, game-style ad, data video, or social promo
- HyperFrames or Remotion composition planning
- turning assets into a video
- "more premium", "more dynamic", "more business", "bigger text", "faster pacing", "more animation"
- matching or mining a reference video
- selecting templates, animation libraries, Catalog components, or video style systems

## Required Reading Order In A Workbench

After `framepack create`, read:

1. `FRAMEPACK.md`
2. `HUMAN.md`
3. `ASSETS.md`
4. `ASSET_GAPS.md`
5. `STYLE.md`
6. `DESIGN.md`
7. `DESIGN_TOKENS.md`
8. `DIRECTION.md`
9. `COMPOSITION.md`
10. `ITERATIONS.md`
11. `.framepack/state.json` when machine-readable state is needed

Use `HUMAN.md` whenever you need to explain progress to a non-technical user.

## Workbench Files

Current workbenches are compact:

```text
FRAMEPACK.md
HUMAN.md
ASSETS.md
ASSET_GAPS.md
STYLE.md
DESIGN.md
DESIGN_TOKENS.md
DIRECTION.md
COMPOSITION.md
ITERATIONS.md
index.html
meta.json
.framepack/state.json
```

`index.html` and `meta.json` are part of the runtime contract. `build` must preserve composition root dimensions and timing attributes for HyperFrames.

## Audit Gates

Framepack has a built-in quality-control role. Run phase audits before moving between major production stages:

```bash
npx framepack workbench audit --phase preflight --project-dir <dir>
npx framepack workbench audit --phase design --project-dir <dir>
npx framepack workbench audit --phase composition --project-dir <dir>
npx framepack workbench audit --phase preview --project-dir <dir>
npx framepack workbench audit --phase render --project-dir <dir>
```

Use `--phase all --json` for automation:

```bash
npx framepack workbench audit --phase all --project-dir <dir> --json
```

If the audit returns P0/P1 blockers, stop and fix them or ask the user. Do not continue to build, preview, or render with unresolved P0/P1 blockers.

The audit currently checks:

- user-readable `HUMAN.md`
- design-system and design-token presence
- asset gaps and blocking assets
- HITL checkpoints
- technology/template plan
- skill exposure and agent guidance
- HyperFrames runtime files
- preview/render readiness

Lifecycle commands expose active guidance in JSON output. When using `--json`, always read `interventionContext` from `create`, `workbench brief/check/audit`, `build`, `preview`, `render`, `templates recommend`, `templates prompt recommend`, and `catalog recommend`. It tells you the current phase, required files, blockers, skill hints, plain-language shortcut, and next command.

For 0.6 workbench projects, `build`, `preview`, and `render` run lifecycle cost gates. P0 blockers stop the command by default. Use `--force` only when the user explicitly accepts the risk; forced bypasses are recorded in `.framepack/interventions.jsonl` and summarized in `ITERATIONS.md`.

Use these supervision commands during testing and feedback:

```bash
npx framepack workbench preferences --project-dir <dir>
npx framepack workbench friction --project-dir <dir>
npx framepack workbench learnings --project-dir <dir>
```

`.framepack/preferences.json` stores project-level style field forces such as premium polish, business clarity, fast kinetic pacing, and large focal text.

## Skills

Framepack installs project-facing skills:

- `framepack-director`
- `framepack-template-fuser`
- `framepack-hyperframes-builder`
- `framepack-reference-miner`

Claude Code target:

```text
.claude/skills/
```

Codex target:

```text
.framepack/agent/codex/SKILL.md
.framepack/agent/codex/skills/
```

Use the director skill for fuzzy creative intent. Use the template-fuser skill when templates, Catalog candidates, and user assets need to become a custom `COMPOSITION.md`. Use the HyperFrames builder skill when editing code. Use the reference-miner skill when a finished/reference video should become `VIDEO_DNA.md` or `TEMPLATE_BLUEPRINT.md`.

## Built-In Arsenal

Framepack includes:

- 6 workflow templates: `saas-launch`, `news-explainer`, `course-promo`, `game-ad`, `founder-story`, `data-shock`
- 11 HyperFrames prompt-template blueprints
- 20 built-in scene templates across 6 categories
- 22 design-system references
- HyperFrames Catalog bridge
- Polish Arsenal recommendations
- external capability recommendations such as `agent-sprite-forge`, Three.js, D3/Chart.js, Web Audio API

Useful commands:

```bash
npx framepack templates
npx framepack templates recommend --idea "A course promo for founders" --style "premium dynamic" --format 9:16 --json
npx framepack templates prompt
npx framepack templates prompt recommend --idea "A TikTok founder video with karaoke captions" --style "big text fast social" --format 9:16 --json
npx framepack scene-templates list
npx framepack scene-templates recommend --category name-reveal
npx framepack scene-templates registries
npx framepack scene-templates search --registry hyperframes-blocks
npx framepack catalog
npx framepack catalog recommend --template course-promo --idea "premium founder course promo" --style "business dynamic" --format 9:16 --json
```

External tools are recommendations. Framepack should not silently install third-party forge tools or animation libraries unless a future command explicitly implements that behavior.

## MCP

Describe the MCP surface:

```bash
npx framepack mcp --describe
```

Current knowledge tools:

- `querySceneTemplate`
- `recommendAnimation`
- `getComponentCode`

The MCP surface still exposes legacy package automation tools for compatibility. Treat MCP as an agent-facing knowledge and automation surface, not a replacement for the user-facing workbench workflow.

## Agent Harness Model

Framepack is a video production Agent Harness layered on top of Codex or Claude Code. In the current 0.6 workbench shape:

- Sense filter: `FRAMEPACK.md`, `HUMAN.md`, `ASSETS.md`, `ASSET_GAPS.md`, `STYLE.md`, `DESIGN.md`, and `DESIGN_TOKENS.md` expose what the user wants, what assets exist, and what constraints matter.
- Motor pathways: CLI, MCP tools, generated skills, templates, Catalog bridge, build, preview, render, and audit commands turn agent decisions into production actions.
- Reflexes: workbench checks, phase audits, HyperFrames lint rules, runtime file checks, and sandbox benchmarks catch drift before it reaches the user.
- Memory encoding: durable Markdown files and `.framepack/state.json` preserve creative intent, decisions, assets, gaps, iterations, and runtime evidence.
- Feedback loop: `HUMAN.md`, `ITERATIONS.md`, phase audit output, preview evidence, and user corrections keep each round grounded in visible progress.

## HyperFrames Rules

When building or editing generated HTML:

- keep the first scene visible in CSS
- preserve `data-width`, `data-height`, and `data-start`
- write `meta.json`
- register timelines on `window.__timelines`
- switch scenes with `tl.set()`
- do not put timed `<video>` elements inside timed scene containers
- avoid `Math.random()` and `repeat: -1` in render timelines
- avoid missing `compositions/blocks/*.html` references unless the block files exist

## Development Verification

Before claiming a product change is complete:

```bash
npm run typecheck
npm test
npm run build
npm run sandbox:benchmark
npm pack --dry-run --json
```

`sandbox:benchmark` is the product-level internal test. It checks create, workbench check, brief, build, five phase audits, template/Catalog recommendations, MCP SDK, and HyperFrames lint.

## Historical References

Older 0.4 package-protocol evidence remains useful for archaeology and regression context, but it is not the current onboarding path. Examples include `docs/agent-platform/real-user-trial-v0.4.0-alpha.3.md`, `docs/agent-platform/real-user-trial-v0.4.0-beta.1.md`, `docs/agent-platform/beta-readiness-v0.4.md`, `docs/agent-platform/beta-feedback-loop-v0.4.md`, `docs/agent-platform/v0.4-beta-product-state-cutoff.md`, `docs/agent-platform/beta-patch-radar-v0.4.md`, `docs/agent-platform/manual-beta-test-guide-v0.4.zh-CN.md`, `docs/agent-platform/beta-onboarding-trials-v0.4.md`, `docs/agent-platform/hyperframes-compat-v0.4.md`, `docs/agent-platform/release-candidate-v0.4.0-beta.1.md`, `docs/agent-platform/release-candidate-v0.4.0-beta.2.md`, `framepack@beta`, and `docs/architecture/package-protocol-v1.md`.

## Editing Rules

- Keep README, `docs/README.zh-CN.md`, AGENTS, agent templates, and package metadata aligned when changing public workflow.
- Keep `CHANGELOG.md` aligned with the current test count and release evidence.
- Use `apply_patch` for manual edits.
- Do not revert user changes.
- Keep code and docs lean; avoid reintroducing the heavy legacy package mental model into new onboarding docs.
