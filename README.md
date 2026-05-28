# Framepack

Framepack is a **programmatic video workbench** for coding agents (Codex, Claude Code) and the HyperFrames render runtime.

It translates fuzzy taste words, user assets, references, and rough ideas into executable creative direction: design system, visual tokens, HTML skeleton, template route, motion language, animation techniques, composition plan, polish rules, and iteration memory.

Chinese README: [docs/README.zh-CN.md](https://github.com/ARTHUR-BBU/framepack/blob/framepack-agent-platform/docs/README.zh-CN.md).

## 中文快速说明

Framepack 是一个**程式化视频创意工作台**，面向 coding agent（Codex、Claude Code）和 HyperFrames 渲染引擎。你可以用普通话描述想要的视频，比如”更商务一点””节奏更快””字大一点””动画多一点””像这个参考视频”。Framepack 会把这些模糊表达翻译成设计系统、视觉令牌、HTML 骨架、素材说明、用户摘要、风格方向、视频结构、模板路线、动效语言、composition 方案和迭代记录。

最短用法：

```bash
npm install framepack
npx framepack create --idea “一个高级、动感、商务感强的产品发布视频” --assets ./assets --output-dir ./out --project-name launch-video
npx framepack workbench brief --project-dir ./out/launch-video
```

生成后先读 `FRAMEPACK.md` 和 `HUMAN.md`。`HUMAN.md` 是给人看的小白摘要，说明当前进度、视频结构、下一步要用户决定什么，以及技术选择是什么意思。

## Programmatic Video vs Generative Video

There are two fundamentally different approaches to making video with AI:

**Generative video** (Runway, Sora, Kling, Project Luxo): AI “paints” pixels from noise. You write a text prompt, the model generates entirely new frames — characters, scenes, motion, everything. No assets, no HTML, no code orchestration. Prompt in, video out.

**Programmatic video** (Framepack + HyperFrames): code orchestrates existing assets (images, text, video clips, icons) with wrapped animations (transitions, subtitle effects, motion graphics) and renders to MP4. No pixels are generated — only composed.

| | Generative (Runway) | Programmatic (Framepack) |
|---|---|---|
| Input | Text prompt | Asset files + creative intent |
| Output | New imagery | Asset composition + packaging |
| Control | Coarse (overall style) | Pixel-perfect (every element, every frame) |
| Best for | Storytelling, creative ads | Brand videos, data visualization, template content |
| Imagery source | AI-generated | User-provided |
| Core tech | Diffusion model | GSAP + CSS animation engine |

Framepack sits firmly on the programmatic side. It does not generate imagery. It gives coding agents the creative context, design systems, code templates, and safety rules needed to orchestrate user assets into professional HyperFrames compositions.

## The Problem

Most users do not know which animation library, template, motion grammar, or render runtime they need. They say things like:

- make it cooler
- more business
- bigger text
- faster pacing
- more animation
- like this reference video

Framepack turns that outsider language into a professional video plan a coding agent can execute through HyperFrames.

## Three Layers

Framepack works through three layers:

1. **Agent instructions / skills** trigger Framepack inside coding agents like Codex and Claude Code.
2. **MCP / CLI** creates workbenches and exposes tool surfaces.
3. **Workbench files** persist context so agents can resume without relying on model memory.

When installed from npm, Framepack runs a small postinstall hook that creates project agent instructions:

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

Then ask your coding agent:

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

This creates a complete agent-ready workbench:

```text
launch-video/
  FRAMEPACK.md          agent workflow and mental model
  ASSETS.md             user-provided assets and their role
  HUMAN.md              plain-language status for the user
  STYLE.md              brand direction, visual tokens, motion tokens
  DIRECTION.md          fuzzy user language → professional creative direction
  COMPOSITION.md        production route, scene plan, code templates, safety rules
  ITERATIONS.md         render feedback and next changes
  DESIGN.md             matched design system spec (22 curated systems)
  DESIGN_TOKENS.md      extracted colors and typography from the design system
  ASSET_GAPS.md         blocking and optional asset gap analysis
  index.html            HyperFrames-passable HTML skeleton with scene structure
  .framepack/
    state.json          machine-readable project state
```

Start with `FRAMEPACK.md`.

Check the generated workbench before building the first composition:

```bash
framepack workbench check --project-dir ./out/launch-video
framepack workbench check --project-dir ./out/launch-video --json
framepack workbench brief --project-dir ./out/launch-video
```

## Workbench Arsenal

`framepack create` writes twelve workbench files, not a heavy legacy package tree:

- `FRAMEPACK.md`: agent workflow and three-layer mental model.
- `ASSETS.md`: user-provided assets and their role.
- `HUMAN.md`: plain-language status, structure, next decision, and technology explanation for the user.
- `STYLE.md`: brand direction, visual tokens, motion tokens, and tuning parameters.
- `DIRECTION.md`: fuzzy user language translated into professional creative direction.
- `COMPOSITION.md`: HyperFrames production route, scene plan, code templates, Catalog Pre-Flight, and safety rules.
- `ITERATIONS.md`: render feedback and next changes.
- `DESIGN.md`: auto-matched design system spec from 22 curated systems (Apple, Stripe, Nike, SpaceX, Tesla, etc.).
- `DESIGN_TOKENS.md`: extracted hex colors and typography from the matched design system.
- `ASSET_GAPS.md`: blocking and optional asset gap analysis with tool recommendations.
- `index.html`: HyperFrames-passable HTML skeleton with proper data attributes, scene structure, GSAP timeline, and CSS first-scene visibility.
- `.framepack/state.json`: machine-readable project state.

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
- HyperFrames implementation routes
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

`init-agent` installs Framepack as a skill pack for coding agents. The installed instructions include four playbooks:

- `framepack-director`: translate fuzzy user taste into professional structure, visual language, motion language, risks, and acceptance criteria. Includes 22 curated design system references.
- `framepack-template-fuser`: fuse user assets, user requirements, workflow templates, prompt templates, and Catalog candidates into a custom `COMPOSITION.md`.
- `framepack-hyperframes-builder`: turn the composition plan into HyperFrames code with first-frame, timeline, lint, inspect, and snapshot rules. Includes 15 compatibility rules and 8 code templates.
- `framepack-reference-miner`: turn a finished or reference video into `VIDEO_DNA.md` and `TEMPLATE_BLUEPRINT.md` so strong work can become a reusable template.

For Claude Code, skills follow the progressive disclosure pattern — `SKILL.md` is a concise index, detailed references load on demand:

```text
.claude/skills/framepack-director/SKILL.md
.claude/skills/framepack-director/references/designs/
.claude/skills/framepack-template-fuser/SKILL.md
.claude/skills/framepack-template-fuser/references/catalog-usage.md
.claude/skills/framepack-hyperframes-builder/SKILL.md
.claude/skills/framepack-hyperframes-builder/references/compatibility-rules.md
.claude/skills/framepack-hyperframes-builder/references/code-templates.md
.claude/skills/framepack-reference-miner/SKILL.md
```

For Codex-facing project workflows, matching skill files are installed under:

```text
.framepack/agent/codex/skills/
```

## Design System Matching

Framepack auto-matches user style keywords to one of 22 curated design systems and copies the full spec into the project as `DESIGN.md`. This gives the agent exact colors, typography, spacing, and motion rules instead of guessing.

Included design systems: SpaceX, Tesla, Nvidia, Apple, Stripe, Nike, Ferrari, Lamborghini, Bugatti, BMW M, Vercel, Linear, Spotify, Discord, Figma, PlayStation, Shopify, Meta, Uber, Raycast, OpenAI, Notion.

`DESIGN_TOKENS.md` extracts the hex colors and typography from the matched design system for immediate use in code.

## External Capabilities

`COMPOSITION.md` now recommends external tools based on the user's creative direction:

- `agent-sprite-forge` for game-ad routes (sprite sheets, character packs, FX)
- Three.js for 3D and WebGL scenes
- D3 / Chart.js for data visualization
- Web Audio API for audio-reactive animations

These are recommendations only. Framepack does not auto-install external tools.

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

Workbench `COMPOSITION.md` includes a Catalog Pre-Flight section that lists mandatory install-before-code steps. The agent must complete these steps before writing any scene code. Framepack recommends Catalog items; it does not auto-install them.

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
- `COMPOSITION.md` turns the approved direction into HyperFrames scene code, Catalog assembly, and animation guidance.
- `ITERATIONS.md` records decisions, preview feedback, and next changes.
- `.framepack/state.json` stores the same loop in machine-readable form.

Agents should ask the user to choose or modify the direction before locking the first composition when taste is still fuzzy.

For a quick user-facing recap at any point:

```bash
framepack workbench brief --project-dir ./out/launch-video
```

## HyperFrames Runtime

Framepack targets HyperFrames as its primary render runtime. It does not ask users to choose low-level tools:

- HyperFrames for programmed commercial video rendering.
- GSAP for HyperFrames-safe timeline motion.
- Anime.js, SVG, Canvas, PixiJS, and asset-forge tools when they fit the creative goal.

## HyperFrames Safety

Framepack workbenches remind agents to avoid common render traps:

- make the first scene visible in CSS
- switch scenes with `tl.set()`, not tiny-duration `.to()`
- do not mix animation engines on the same element
- register timelines on `window.__timelines`
- no `Math.random()` in animations
- no `repeat: -1` infinite loops
- no async timeline construction

The generated `index.html` skeleton already follows all these rules with proper data attributes, scene structure, entrance animations, and a paused GSAP timeline ready for the agent to extend.

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
