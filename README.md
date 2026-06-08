# Framepack

Framepack serves **HyperFrames programmatic commercial video ideation and composition** — as a Hermes Agent Plugin.

In Chinese: Framepack 服务的是 **面向 HyperFrames 程式化商业视频创意与编排**。

中文说明: [docs/README.zh-CN.md](docs/README.zh-CN.md)

## The Shift (v0.7)

Framepack v0.7 is a **Hermes Agent Plugin** — a parasitic organ that lives inside the agent loop, watches the agent's tool calls, and whispers advice at the right moment.

```text
v0.6 (legacy): CLI + MCP — the agent calls Framepack like a tool
v0.7 (current): Hermes Plugin — Framepack calls the agent like a director's advisor
```

The agent is the director. Framepack is the director's advisor, producer, arsenal manager, and HyperFrames quality gate. It hooks into the agent loop and proactively injects feedback when the agent writes workbench files.

## Architecture

```
Hermes Agent Loop
  └── Plugin hooks (pre_tool_call + post_tool_call)
        ├── 🚨 pre_tool_call  → index.html write scan (before write)
        ├── 📋 post_tool_call → STORYBOARD.md analysis (LLM)
        ├── 🎬 post_tool_call → COMPOSITION.md review (LLM)
        ├── 🔍 post_tool_call → index.html regex audit (zero token)
        ├── 🔫 post_tool_call → arsenal.json validation
        └── 🧬 post_tool_call → VIDEO_DNA.md / TEMPLATE_BLUEPRINT.md check
      └── Skills (domain knowledge injected into LLM calls)
        ├── framepack-director (storyboard structure)
        ├── framepack-template-fuser (template matching)
        ├── framepack-hyperframes-builder (render safety rules)
        ├── framepack-arsenal (weapon catalog)
        ├── framepack-gsap (GSAP animation engine)
        └── framepack-reference-miner (reference video DNA)
```

## Install

### v0.7 — Hermes Plugin

```bash
# Copy the plugin into your Hermes plugins directory
cp -r framepack-plugin ~/.hermes/plugins/framepack

# Enable and restart
hermes plugins enable framepack
# Restart Hermes
```

### v0.6 — CLI (legacy)

```bash
npm install framepack
```

## What Framepack Manages

- **Workflow blueprints**: event promos, SaaS launches, course promos, data/news explainers, game ads, sports highlights, transfer announcements, player tributes.
- **Storyboards**: `STORYBOARD.md` keeps the agent-led creative spine visible before code.
- **Arsenal manifests**: `.framepack/arsenal.json` records weapons, candidates, cached downloads, and remixes used by a project.
- **Reference mining**: `VIDEO_DNA.md` and `TEMPLATE_BLUEPRINT.md` turn a reference or finished video into reusable structure.
- **Design references**: curated visual systems that give agents concrete color, type, spacing, and rhythm language.
- **Motion recipes**: GSAP-safe patterns that can be remixed, not blindly pasted.
- **Trusted resources**: registered sources may be cached; search results remain candidates until trusted.
- **HyperFrames quality gates**: first frame visible, scene switches with `tl.set()`, no render-random timelines, `window.__timelines` registered.

## Workbench Files

```text
FRAMEPACK.md              agent entrypoint
HUMAN.md                  plain-language human summary
ASSETS.md                 user assets
ASSET_GAPS.md             missing or optional assets
STORYBOARD.md             agent-led creative spine
STYLE.md                  visual and motion style
DESIGN.md                 matched design reference
DESIGN_TOKENS.md          executable colors and typography
DIRECTION.md              creative direction and options
COMPOSITION.md            HyperFrames composition plan
ITERATIONS.md             feedback and remix history
index.html                HyperFrames-safe scaffold
meta.json                 runtime metadata
VIDEO_DNA.md              reference video structural analysis
TEMPLATE_BLUEPRINT.md     reusable template derived from DNA
.framepack/arsenal.json   project arsenal manifest
.framepack/content-graph.json
.framepack/state.json
```

## Development

```bash
# Plugin tests (Python)
cd framepack-plugin
python -m pytest tests/ -q

# Legacy CLI tests (TypeScript)
npm test
npm run build
```

## License

MIT