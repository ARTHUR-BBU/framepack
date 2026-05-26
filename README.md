# Framepack

Framepack lets non-expert users describe the video they want in natural language, then gives Codex, Claude Code, HyperFrames, and Remotion a professional production workbench.

It translates fuzzy taste words, user assets, references, and rough ideas into executable creative direction: template route, motion language, animation techniques, composition plan, polish rules, and iteration memory.

Chinese README: [README.zh-CN.md](README.zh-CN.md).

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
  DIRECTION.md
  COMPOSITION.md
  ITERATIONS.md
  .framepack/
    state.json
```

Start with `FRAMEPACK.md`.

## Workbench Arsenal

`framepack create` writes five core Markdown files, not a heavy legacy package tree:

- `FRAMEPACK.md`: agent workflow and three-layer mental model.
- `ASSETS.md`: user-provided assets and their role.
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

The Polish Arsenal recommender reads the idea, style, format, and duration, then recommends:

- template route
- animation techniques
- motion language
- aesthetic direction
- avoid list
- acceptance criteria

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
framepack mcp --describe
```

Older `generate`, `validate`, `status`, and runtime commands may remain during the transition, but the 0.5 public path is the workbench.
