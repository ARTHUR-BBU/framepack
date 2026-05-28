# Framepack

Framepack lets non-expert users describe the video they want in natural language, then gives Codex, Claude Code, HyperFrames, and Remotion a professional production workbench.

It translates fuzzy taste words, user assets, references, and rough ideas into executable creative direction: template route, motion language, animation techniques, composition plan, polish rules, and iteration memory.

Chinese README: [docs/README.zh-CN.md](https://github.com/ARTHUR-BBU/framepack/blob/framepack-agent-platform/docs/README.zh-CN.md).

## 中文快速说明

Framepack 是给 Codex、Claude Code、HyperFrames 和 Remotion 使用的视频创意工作台。你可以用普通话描述想要的视频，比如“更商务一点”“节奏更快”“字大一点”“动画多一点”“像这个参考视频”。Framepack 会把这些模糊表达翻译成素材说明、用户摘要、风格方向、视频结构、模板路线、动效语言、composition 方案和迭代记录。

最短用法：

```bash
npm install framepack
npx framepack create --idea "一个高级、动感、商务感强的产品发布视频" --assets ./assets --output-dir ./out --project-name launch-video
npx framepack workbench brief --project-dir ./out/launch-video
```

生成后先读 `FRAMEPACK.md` 和 `HUMAN.md`。`HUMAN.md` 是给人看的小白摘要，说明当前进度、视频结构、下一步要用户决定什么，以及技术选择是什么意思。

## The Problem

Most users do not know which animation library, template, motion grammar, or render runtime they need. They say things like:

- make it cooler
- more business
- bigger text
- faster pacing
- more animation
- like this reference video

Framepack turns that outsider language into a professional video plan an agent can execute.

## Three Layers

Framepack works through three layers:

1. **Agent instructions / skills** trigger Framepack inside Codex and Claude Code.
2. **MCP / CLI** creates workbenches and exposes tool surfaces.
3. **Workbench files** persist context so agents can resume without relying on model memory.

When installed from npm, Framepack runs a small postinstall hook that creates project agent instructions for Codex and Claude Code:

```text
AGENTS.md
CLAUDE.md
.mcp.json
.framepack/agent/codex/SKILL.md
```

Set `FRAMEPACK_SKIP_AGENT_INSTALL=1` to skip that automatic project setup.

## Start

```bash
npm install framepack
```

Then ask Codex or Claude Code:

```text
Use Framepack to turn my assets folder into a polished HyperFrames video workbench. Make it premium, dynamic, business-ready, with strong motion and clear focal text.
```

Or call it directly:

```bash
npx framepack create \
  --idea "A 45 second founder-facing launch video for an agent-native workflow" \
  --assets ./assets \
  --output-dir ./out \
  --project-name launch-video \
  --style "premium SaaS launch with kinetic interface motion"
```

This creates:

```text
launch-video/
  FRAMEPACK.md
  ASSETS.md
  HUMAN.md
  STYLE.md
  DIRECTION.md
  COMPOSITION.md
  ITERATIONS.md
  .framepack/
    state.json
```

Start with `FRAMEPACK.md`.

Check the generated workbench before building the first composition:

```bash
framepack workbench check --project-dir ./out/launch-video
framepack workbench check --project-dir ./out/launch-video --json
framepack workbench brief --project-dir ./out/launch-video
```

## Workbench Arsenal

`framepack create` writes six core Markdown files, not a heavy legacy package tree:

- `FRAMEPACK.md`: agent workflow and three-layer mental model.
- `ASSETS.md`: user-provided assets and their role.
- `HUMAN.md`: plain-language status, structure, next decision, and technology explanation for the user.
- `STYLE.md`: brand direction, visual tokens, motion tokens, and tuning parameters.
- `DIRECTION.md`: fuzzy user language translated into professional creative language.
- `COMPOSITION.md`: HyperFrames / Remotion production route and acceptance criteria.
- `ITERATIONS.md`: render feedback and next changes.

The built-in template registry includes:

- `saas-launch`
- `news-explainer`
- `course-promo`
- `game-ad`
- `founder-story`
- `data-shock`

## Template Market

Framepack now includes the first local Template Market index. It is intentionally small and agent-readable: no remote download, no payment system, no account layer yet.

Each template carries the fields needed for a future ecosystem:

- market item kind, starting with `workflow-template`
- GitHub PR reviewed contribution model
- access and license
- price metadata
- tags and fuzzy-match words
- HyperFrames / Remotion implementation routes
- asset needs
- visual language
- motion language
- acceptance criteria

Use it from the CLI:

```bash
framepack templates
framepack templates --json
framepack templates recommend --idea "A course promo for founders" --style "premium dynamic" --format 9:16 --json
framepack templates prompt --json
framepack templates prompt recommend --idea "A TikTok founder video with karaoke captions" --style "big text fast social" --format 9:16 --json
```

Future paid templates can plug into this same shape. The current release only ships built-in free templates so user testing stays simple.

## HyperFrames Prompt Templates

Framepack also ships 11 built-in HyperFrames prompt-template blueprints adapted from the Open Design HyperFrames template pattern. These are not final videos and not remote downloads. They are director-ready production blueprints that help an agent fuse user assets, user taste, Catalog candidates, scene rhythm, and HyperFrames safety rules into `COMPOSITION.md`.

Included prompt templates:

- `hyperframes-saas-product-promo-30s`
- `hyperframes-app-showcase-three-phones`
- `hyperframes-product-reveal-minimal`
- `hyperframes-website-to-video-promo`
- `hyperframes-tiktok-karaoke-talking-head`
- `hyperframes-data-bar-chart-race`
- `hyperframes-brand-sizzle-reel`
- `hyperframes-logo-outro-cinematic`
- `hyperframes-social-overlay-stack`
- `hyperframes-money-counter-hype`
- `hyperframes-flight-map-route`

`COMPOSITION.md` now includes a Template Fusion Plan: the selected prompt template is treated as a reusable directing pattern, while the user's assets, offer, proof, audience, and CTA remain the source of truth.

## Skill Playbooks

`init-agent` installs Framepack as an agent-facing skill pack, not just a command list. The installed Codex and Claude Code instructions include four playbooks:

- `framepack-director`: translate fuzzy user taste into professional structure, visual language, motion language, risks, and acceptance criteria.
- `framepack-template-fuser`: fuse user assets, user requirements, workflow templates, prompt templates, and Catalog candidates into a custom `COMPOSITION.md`.
- `framepack-hyperframes-builder`: turn the composition plan into HyperFrames code with first-frame, timeline, lint, inspect, and snapshot rules.
- `framepack-reference-miner`: turn a finished or reference video into `VIDEO_DNA.md` and `TEMPLATE_BLUEPRINT.md` so strong work can become a reusable template.

For Claude Code, these are installed as project skills:

```text
.claude/skills/framepack-director/SKILL.md
.claude/skills/framepack-template-fuser/SKILL.md
.claude/skills/framepack-hyperframes-builder/SKILL.md
.claude/skills/framepack-reference-miner/SKILL.md
```

For Codex-facing project workflows, matching skill files are installed under:

```text
.framepack/agent/codex/skills/
```

## HyperFrames Catalog Bridge

HyperFrames Catalog is the official prefab supply layer. Framepack treats it as a source of runtime-usable video parts, not as a replacement for the Template Market.

- HyperFrames Catalog contributes `block` and `component` prefabs.
- Framepack Template Market contributes director workflows, creative engineering templates, and review systems for agents.

Use the bridge from the CLI:

```bash
framepack catalog
framepack catalog --json
framepack catalog recommend --template course-promo --idea "A premium course promo for founders" --style "business dynamic" --format 9:16 --json
```

Workbench `COMPOSITION.md` tells the agent to inspect the live official Catalog with `npx hyperframes catalog --json` before installing any candidate. Framepack recommends Catalog items; it does not auto-install them.

The Polish Arsenal recommender reads the idea, style, format, and duration, then recommends:

- template route
- HyperFrames Catalog blocks and components
- tuning parameters for pace, text density, motion intensity, Catalog usage, and business polish
- animation techniques
- motion language
- aesthetic direction
- avoid list
- acceptance criteria

## Agentic HITL Loop

Framepack workbenches include a human-in-the-loop production loop:

- `HUMAN.md` tells the user what is happening in plain language: current summary, video structure, progress, next decision, and technology choices.
- `DIRECTION.md` gives proposal options, director translation, and human checkpoints.
- `COMPOSITION.md` turns the approved direction into HyperFrames/Catalog/animation assembly guidance.
- `ITERATIONS.md` records decisions, preview feedback, and next changes.
- `.framepack/state.json` stores the same loop in machine-readable form.

Agents should ask the user to choose or modify the direction before locking the first composition when taste is still fuzzy.

For a quick user-facing recap at any point:

```bash
framepack workbench brief --project-dir ./out/launch-video
```

## HyperFrames And Remotion

Framepack does not ask users to choose low-level tools. It recommends the right route when the project needs it:

- HyperFrames for programmed commercial video.
- Remotion for reusable template and social-video workflows.
- GSAP for HyperFrames-safe timeline motion.
- Anime.js, SVG, Canvas, PixiJS, and asset-forge tools when they fit the creative goal.

## HyperFrames Safety

Framepack workbenches remind agents to avoid common render traps:

- make the first scene visible in CSS
- switch scenes with `tl.set()`, not tiny-duration `.to()`
- do not mix animation engines on the same element
- register timelines on `window.__timelines`

## Commands

```bash
framepack --version
framepack --help
framepack create --idea <idea> --assets <dir> --output-dir <dir>
framepack init-agent --target auto --scope project
framepack workbench check --project-dir <dir>
framepack workbench brief --project-dir <dir>
framepack mcp --describe
```

Older `generate`, `validate`, `status`, and runtime commands may remain during the transition, but the 0.5 public path is the workbench.
