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
```

## Workbench Arsenal

`framepack create` writes five core Markdown files, not a heavy legacy package tree:

- `FRAMEPACK.md`: agent workflow and three-layer mental model.
- `ASSETS.md`: user-provided assets and their role.
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
```

Future paid templates can plug into this same shape. The current release only ships built-in free templates so user testing stays simple.

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

- `DIRECTION.md` gives proposal options, director translation, and human checkpoints.
- `COMPOSITION.md` turns the approved direction into HyperFrames/Catalog/animation assembly guidance.
- `ITERATIONS.md` records decisions, preview feedback, and next changes.
- `.framepack/state.json` stores the same loop in machine-readable form.

Agents should ask the user to choose or modify the direction before locking the first composition when taste is still fuzzy.

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
framepack mcp --describe
```

Older `generate`, `validate`, `status`, and runtime commands may remain during the transition, but the 0.5 public path is the workbench.
