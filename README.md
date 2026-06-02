# Framepack

Framepack is a **programmatic video workbench** for coding agents such as Codex and Claude Code, built for the HyperFrames render runtime.

It turns rough ideas, user assets, references, and fuzzy taste words into a professional video workbench: design direction, visual tokens, asset gaps, HyperFrames composition guidance, reusable templates, build output, audit gates, and iteration memory.

Chinese README: [docs/README.zh-CN.md](https://github.com/ARTHUR-BBU/framepack/blob/framepack-agent-platform/docs/README.zh-CN.md).

## Plain Explanation

Most users do not know which animation library, template, visual style, or HyperFrames rule they need. They say things like "make it more premium", "faster", "more business", "bigger text", "more motion", or "like this reference video".

Framepack translates that language into a workbench that an agent can execute. It does not generate pixels. It organizes assets, recommends templates and animation routes, writes production guidance, builds HyperFrames-safe HTML, and forces quality checks before preview and render.

In short: Framepack turns outsider language into a professional video plan.

## Programmatic Video vs Generative Video

**Generative video** tools create new imagery from a prompt.

**Programmatic video** with Framepack + HyperFrames composes existing assets, text, clips, UI captures, SVG, HTML, CSS, and GSAP timelines into a controllable rendered video.

| Area | Generative video | Framepack + HyperFrames |
| --- | --- | --- |
| Input | Prompt | Assets + intent + references |
| Output | New frames | Composed video project |
| Control | Broad style control | Element, timing, layout, and copy control |
| Best for | Open-ended visual generation | Brand videos, explainers, product promos, data motion, template-led content |
| Framepack role | Not the generator | Workbench, harness, template router, audit layer |

## Install

```bash
npm install framepack
```

The npm postinstall hook installs project-facing agent guidance unless disabled:

```text
AGENTS.md
CLAUDE.md
.mcp.json
.framepack/agent/codex/SKILL.md
.framepack/agent/codex/skills/
.claude/skills/
```

Disable the automatic project setup when needed:

```bash
FRAMEPACK_SKIP_AGENT_INSTALL=1 npm install framepack
```

## Recommended Agent Prompt

Ask Codex or Claude Code:

```text
Use Framepack to turn this idea and assets folder into a polished HyperFrames video workbench. Keep the structure clear, make the style premium and dynamic, explain the plan in plain language, run the Framepack audit gates, then build and preview.
```

## Quick Workflow

Minimal direct command:

```bash
npx framepack create --idea "A premium launch video" --assets ./assets --output-dir ./out --project-name launch-video
```

```bash
# Step 1: Create the workbench
npx framepack create \
  --idea "A premium 30 second launch video for an agent-native workflow" \
  --assets ./assets \
  --output-dir ./out \
  --project-name launch-video \
  --format 9:16 \
  --style "premium SaaS, strong motion, large focal text"

# Step 2: Explain it to the user
npx framepack workbench brief --project-dir ./out/launch-video

# Step 3: Audit before implementation
npx framepack workbench audit --phase preflight --project-dir ./out/launch-video
npx framepack workbench audit --phase design --project-dir ./out/launch-video
npx framepack workbench audit --phase composition --project-dir ./out/launch-video

# Step 4: Build HyperFrames HTML
npx framepack build --project-dir ./out/launch-video

# Step 5: Preview and render
npx framepack preview --project-dir ./out/launch-video --open
npx framepack workbench audit --phase preview --project-dir ./out/launch-video
npx framepack render --project-dir ./out/launch-video --audio bgm.mp3
npx framepack workbench audit --phase render --project-dir ./out/launch-video
```

## Workbench Files

`framepack create` writes a compact workbench, not the old heavy package tree:

```text
launch-video/
  FRAMEPACK.md          agent workflow and required reading order
  HUMAN.md              plain-language summary for non-technical users
  ASSETS.md             user assets and expected roles
  ASSET_GAPS.md         blocking and optional asset gaps
  STYLE.md              brand direction and tuning parameters
  DESIGN.md             matched design-system reference
  DESIGN_TOKENS.md      executable colors and typography
  DIRECTION.md          professional creative direction
  COMPOSITION.md        HyperFrames production plan and template route
  ITERATIONS.md         feedback and decision history
  index.html            initial HyperFrames-safe composition skeleton
  meta.json             runtime metadata for preview/render
  .framepack/state.json machine-readable workbench state
```

The human-facing file is `HUMAN.md`. The agent-facing starting point is `FRAMEPACK.md`.

## Audit Gates

Framepack now treats quality control as part of the product, not a final afterthought.

```bash
npx framepack workbench audit --phase preflight --project-dir ./out/launch-video
npx framepack workbench audit --phase design --project-dir ./out/launch-video
npx framepack workbench audit --phase composition --project-dir ./out/launch-video
npx framepack workbench audit --phase preview --project-dir ./out/launch-video
npx framepack workbench audit --phase render --project-dir ./out/launch-video
npx framepack workbench audit --phase all --project-dir ./out/launch-video --json
```

Agents should stop on P0/P1 audit blockers before moving to build, preview, or render. The audit checks include user-readable summary, design tokens, asset gaps, HITL checkpoints, technology plan, skill exposure, HyperFrames runtime files, and preview/render readiness.

Lifecycle commands now carry an active intervention context in JSON output. Agents can read `interventionContext` from `create`, `workbench brief/check/audit`, `build`, `preview`, `render`, `templates recommend`, `templates prompt recommend`, and `catalog recommend` to know the current phase, required reads, blockers, skill hints, and the next safest command.

`build`, `preview`, and `render` also run lightweight lifecycle gates for 0.6 workbench projects. P0 blockers stop the command by default; `--force` is explicit, recorded in `.framepack/interventions.jsonl`, and summarized in `ITERATIONS.md`.

For supervision and test review:

```bash
npx framepack workbench preferences --project-dir ./out/launch-video
npx framepack workbench friction --project-dir ./out/launch-video
npx framepack workbench learnings --project-dir ./out/launch-video
```

Preferences are stored in `.framepack/preferences.json`. Intervention events are stored in `.framepack/interventions.jsonl`. Friction summaries help testers see where the agent drifted, got blocked, or used `--force`.

## Built-In Arsenal

Framepack includes a local arsenal that helps agents choose a strong route without guessing:

- 6 workflow templates: `saas-launch`, `news-explainer`, `course-promo`, `game-ad`, `founder-story`, `data-shock`
- 11 HyperFrames prompt-template blueprints adapted from the Open Design template pattern
- 20 scene templates across opening, name-reveal, stats, footage, CTA, and transition categories
- 22 curated design-system references such as Apple, Stripe, SpaceX, Tesla, Nike, Nvidia, Linear, OpenAI, and Notion
- HyperFrames Catalog bridge for components and blocks
- Polish Arsenal recommendations for style, motion language, template route, avoid list, and acceptance criteria

Useful commands:

```bash
npx framepack templates
npx framepack templates recommend --idea "A course promo for founders" --style "premium dynamic" --format 9:16 --json
npx framepack templates prompt
npx framepack templates prompt recommend --idea "A TikTok founder video with karaoke captions" --style "big text fast social" --format 9:16 --json
npx framepack scene-templates list
npx framepack scene-templates recommend --category name-reveal
npx framepack catalog recommend --template course-promo --idea "premium founder course promo" --style "business dynamic" --format 9:16 --json
```

## Agent Skills

Framepack installs a skill pack for agent platforms:

- `framepack-director`: translates fuzzy user taste into structure, visual language, motion language, risks, and acceptance criteria.
- `framepack-template-fuser`: fuses user assets, requirements, workflow templates, prompt templates, and Catalog candidates into `COMPOSITION.md`.
- `framepack-hyperframes-builder`: turns `COMPOSITION.md` into HyperFrames-safe code and runs checks.
- `framepack-reference-miner`: extracts `VIDEO_DNA.md` and `TEMPLATE_BLUEPRINT.md` from reference or finished videos.

For Claude Code the skills are installed under `.claude/skills/`. For Codex project workflows they are installed under `.framepack/agent/codex/skills/`.

## MCP Surface

Framepack MCP is a knowledge and automation surface for agents. Describe it with:

```bash
npx framepack mcp --describe
```

Current knowledge tools include:

- `querySceneTemplate`
- `recommendAnimation`
- `getComponentCode`

The wider MCP surface still exposes package-era tools such as `generateProject`, `getStatus`, `validatePackage`, `runtimeLint`, and `runtimeInspect` for compatibility and agent automation. The public user path is now `create -> audit -> build -> preview -> render`.

## Build Contract

`framepack build` compiles workbench planning files into a previewable HyperFrames composition:

```bash
npx framepack build --project-dir ./out/launch-video
```

It reads `COMPOSITION.md`, `DESIGN_TOKENS.md`, `ASSETS.md`, and `.framepack/state.json`, then writes `index.html` and `meta.json`. The generated HTML preserves `data-width`, `data-height`, `data-start`, scene timing, first-frame visibility, and `window.__timelines` registration.

## HyperFrames Safety Rules

Framepack reminds agents to avoid common render traps:

- keep the first scene visible in CSS
- use `tl.set()` for scene switches
- do not nest timed video inside timed scene containers
- register timelines on `window.__timelines`
- avoid `Math.random()` and infinite loops in render timelines
- keep one animation engine in control of a given element
- run audit/lint/preview before render

## Validation

For development and release candidates:

```bash
npm run typecheck
npm test
npm run build
npm run sandbox:benchmark
npm pack --dry-run --json
```

The product sandbox benchmark exercises create, check, brief, build, phase audits, templates, Catalog, MCP SDK, and HyperFrames lint.

## Legacy Surface

Older `generate`, `validate`, `status`, `capture`, `repair`, `packs`, `atlas`, and runtime commands remain available for the 0.4 package protocol and compatibility tests. New user-facing documentation should prefer the 0.6 workbench path unless it is specifically describing legacy package workflows.
