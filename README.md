# Framepack

> HyperFrames programmatic commercial video ideation and composition advisor.
> **A Hermes Agent Plugin.**

Framepack is a Hermes Agent Plugin that hooks into the agent loop to provide
expert creative direction for HyperFrames video production. The agent is the
director. Framepack is the advisor, producer, arsenal manager, and HyperFrames
quality gate.

## The Idea

```
HyperFrames is a fully-equipped film studio.
Framepack is the director who knows when to turn on which light.
```

HyperFrames provides the machinery — 8 Visual Styles, Design Picker, 52+
Catalog components, HyperShader transitions, lint/validate/render pipeline.
Framepack provides the creative intelligence — translating fuzzy user intent
into precise HyperFrames parameters, managing reusable weapons, and ensuring
every composition passes render safety checks.

Users don't need to know about frame.md, Visual Styles, or HyperFrames
internals. They say "高端科技感", Framepack translates to Data Drift.
They say "换个颜色", Framepack updates the frame.md automatically.

## Quick Start

### Prerequisites

- [Hermes Agent](https://github.com/nousresearch/hermes-agent) installed
- Node.js 18+ (for HyperFrames CLI)
- Python 3.10+ (for Plugin hooks)

### Step 1: Install HyperFrames

```bash
npm install hyperframes
```

### Step 2: Install the Plugin

```bash
cd <your-hermes-home>/plugins
git clone -b framepack-agent-platform https://github.com/ARTHUR-BBU/framepack.git framepack
```

### Step 3: Enable the Plugin

```bash
hermes plugins enable framepack
```

### Step 4: Verify

```bash
hermes plugins list
```

You should see `framepack` with status **enabled** and version **0.7.12**.

### Step 5: Add AGENTS.md to your project

Copy `AGENTS.md` to the root directory of any project where you want Framepack
active:

```bash
cp <hermes-home>/plugins/framepack/AGENTS.md <your-project>/AGENTS.md
```

### Step 6: Test it

Start a Hermes conversation in your project directory and say:

> "帮我做一个高端科技感的 AI 产品发布会视频"

The agent (with Framepack's guidance) should:
1. Match the intent to **Data Drift** Visual Style
2. Generate a storyboard with proper scene structure
3. Write HyperFrames-compliant HTML
4. Pass all 11 render safety checks

## Architecture

```text
Hermes Agent Loop
  └── Plugin hooks (pre_tool_call + post_tool_call)
        ├── 🚨 pre_tool_call  → index.html (write scan)
        ├── 📋 post_tool_call → STORYBOARD.md (LLM)
        ├── 🎬 post_tool_call → COMPOSITION.md (LLM)
        ├── 🔍 post_tool_call → index.html (regex + structural)
        ├── 🔫 post_tool_call → arsenal.json
        └── 🧬 post_tool_call → VIDEO_DNA.md / TEMPLATE_BLUEPRINT.md
      └── Skills (domain knowledge injected into LLM calls)
        ├── framepack-director (intent → Visual Style + frame.md + storyboard)
        ├── framepack-design-picker (visual style selection via HyperFrames picker)
        ├── framepack-template-fuser (prompt expansion + template matching)
        ├── framepack-hyperframes-builder (composition rules + render safety)
        ├── framepack-arsenal (weapon catalog)
        ├── framepack-gsap (GSAP animation engine)
        ├── framepack-animation-library (GSAP + anime.js weapon catalog)
        └── framepack-reference-miner (reference video DNA)
```

The Plugin automatically fires when the agent writes any of the watched files.
No manual commands needed — the Plugin is always watching.

## What Framepack Knows

### 8 Visual Styles (from HyperFrames)

| Style | Mood | Best For |
|-------|------|----------|
| Swiss Pulse | Clinical, precise | SaaS, data, dev tools |
| Velvet Standard | Premium, timeless | Luxury, enterprise, keynotes |
| Deconstructed | Industrial, raw | Tech launches, security |
| Maximalist Type | Loud, kinetic | Big announcements, launches |
| Data Drift | Futuristic, immersive | AI, ML, cutting-edge tech |
| Soft Signal | Intimate, warm | Wellness, personal stories |
| Folk Frequency | Cultural, vivid | Consumer apps, communities |
| Shadow Cut | Dark, cinematic | Dramatic reveals, exposé |

### 11 Render Safety Checks

| Check | Severity |
|-------|----------|
| First scene visible in CSS | P0 |
| data-attributes on scenes | P0 |
| Root container attributes | P0 |
| Video in timed container | P0 |
| Imperative media control | P0 |
| meta.json exists | P1 |
| Timelines registered | P1 |
| No Math.random | P1 |
| No infinite repeat | P1 |
| No ScrollTrigger | P1 |
| No FLIP animations | P2 |

## Updating

When a new Framepack version is released, update **two locations**:

| What | Where | How |
|------|-------|-----|
| Plugin code | `<hermes-home>/plugins/framepack/` | `git pull` in the plugin directory |
| AGENTS.md | Each project root | Copy from plugin: `cp <hermes-home>/plugins/framepack/AGENTS.md <project>/AGENTS.md` |

Both must be on the same version. Check the version comment at the top of AGENTS.md:

```html
<!-- version: 0.7.12 — sync with plugin.yaml and README -->
```

## Documentation

- [AGENTS.md](AGENTS.md) — Full agent guide (loaded by Hermes at runtime)
- [CHANGELOG.md](CHANGELOG.md) — Release history
- [docs/README.zh-CN.md](docs/README.zh-CN.md) — 中文文档

## License

MIT
