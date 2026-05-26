# Framepack

Framepack is a lightweight HyperFrames creative workbench for agents.

It helps Codex, Claude Code, and other coding agents turn an immature idea plus user-provided assets into a clean HyperFrames production package: asset library, creative brief, composition prompt, composition plan, and iteration log.

Framepack does not replace HyperFrames. It helps agents use HyperFrames better.

Chinese README: [README.zh-CN.md](README.zh-CN.md).

## Core Idea

The practical workflow is:

```text
idea + assets
-> Framepack workbench
-> creative brief
-> HyperFrames prompt
-> composition plan
-> preview / render / feedback
-> next iteration
```

Framepack is not a video model, game engine, or closed creative pipeline. Users and agents can brainstorm freely. Framepack only turns the decisions into a useful production surface.

## Start

```bash
npx -y -p framepack@alpha framepack create \
  --idea "A 45 second founder-facing launch video for an agent-native workflow" \
  --assets ./assets \
  --output-dir ./out \
  --project-name launch-video \
  --style "premium SaaS launch with kinetic interface motion"
```

This creates:

```text
launch-video/
  framepack.json
  ASSET_LIBRARY.md
  prompts/
    creative-brief.md
    hyperframes-prompt.md
  hyperframes/
    composition-plan.md
  iterations/
    v001.md
```

Open `prompts/hyperframes-prompt.md` with your agent and ask it to create or refine the HyperFrames composition.

## What Framepack Manages

- User assets: images, video, audio, text, screenshots, logos, references.
- Creative direction: goal, style, pacing, tension, payoff, scene logic.
- HyperFrames prompt engineering: composition structure, animation language, asset references, render checks.
- Iteration memory: what changed, what failed, what to improve next.

Framepack does not judge user-provided assets by default. If the user chose them, they are treated as intentional. Framepack may suggest improvements during the review loop when an asset blocks clarity, pacing, or render quality.

## Agent-First Usage

Ask Codex or Claude Code:

> Read my asset folder, use Framepack to create a HyperFrames workbench, discuss three creative directions with me, then generate a strong HyperFrames prompt and composition plan.

The CLI is a tool surface. The primary interface is natural language through your agent.

## HyperFrames Fit

Framepack focuses on helping agents use HyperFrames features well:

- composition structure
- asset references
- timeline and programmed motion
- preview, lint, inspect, snapshot, render
- feedback-driven iteration

## Legacy

Framepack `0.4.x` explored a heavier Agent Harness and package protocol. That work remains useful as internal learning, but the public product direction from `0.5` is simpler: assets, prompts, composition, iteration, HyperFrames.

## Commands

```bash
framepack --version
framepack --help
framepack create --idea <idea> --assets <dir> --output-dir <dir>
framepack mcp --describe
```

Older compatibility commands such as `generate`, `validate`, `status`, and `runtime doctor` remain available while the new workbench path matures.
