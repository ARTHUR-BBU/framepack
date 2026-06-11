# Framepack

> **Prompt Factory for HyperFrames.**
> Turns fuzzy video ideas into precise creative briefs HyperFrames can render.

Framepack is a Hermes Agent Plugin that hooks into the agent loop. It does two
things, and does them well:

1. **frame.md** — visual identity (colors, fonts, motion tokens, atmosphere)
2. **expanded-prompt.md** — scene-level creative breakdown (beats, rhythm, transitions)

Once these two files are written, **HyperFrames takes over.** Framepack stops
where HyperFrames starts. Clean boundary, zero overlap.

## The Metaphor

HyperFrames is a fully-equipped film studio. Framepack is the director who
knows which lights to turn on, which mood board to show — not the electrician
who wires the studio.

## How It Works

```text
User: "帮我做个珍珠品牌 30 秒视频"
  │
  ▼
Framepack Phase 1: Intent → frame.md
  "珍珠品牌" → Velvet Standard style → frame.md
  Colors: deep navy + pearl gold + silk black
  Motion: calm, power2.out, 0.8-1.5s
  User confirms visual direction ✓
  │
  ▼
Framepack Phase 2: Creative → expanded-prompt.md
  Rhythm: hook → PUNCH → breathe → CTA
  4 scenes with full beats, transitions, animation verbs
  User confirms creative direction ✓
  │
  ▼
HyperFrames takes over:
  hyperframes init --example product-promo
  → reads frame.md + expanded-prompt.md
  → writes HTML + GSAP timeline
  → hyperframes lint && render
  │
  ▼
Video 🎬
```

## Plugin Hooks (v0.8+)

```text
post_tool_call:
  ├── frame.md write → LLM quality check (palette/typography/motion complete?)
  └── expanded-prompt.md write → LLM quality check (beats/rhythm complete?)

pre_tool_call:
  └── hyperframes command → check frame.md exists (handoff readiness)
```

**What Framepack does NOT do:**
- ❌ Write or audit HTML — that's `hyperframes lint`
- ❌ Manage 13 intermediate files — gone
- ❌ Check data-width, data-height, window.__timelines — gone

## Skills (5)

| Skill | What |
|---|---|
| framepack-director | Intent → frame.md + expanded-prompt (the core engine) |
| framepack-animation-library | 27 GSAP/anime.js weapons (dictionary for HTML phase) |
| framepack-gsap | GSAP animation patterns (dictionary for HTML phase) |
| framepack-arsenal | Weapon catalog management |
| framepack-reference-miner | Reference video → DNA extraction |

## Install

```bash
# 1. Clone
git clone https://github.com/ARTHUR-BBU/framepack --branch framepack-agent-platform --depth 1

# 2. Copy to Hermes plugins
# Linux/macOS:
cp -r framepack/framepack-plugin ~/.hermes/plugins/framepack
# Windows:
xcopy /E /I framepack\framepack-plugin %HERMES_HOME%\plugins\framepack

# 3. Enable
hermes plugins enable framepack

# 4. Verify
hermes plugins list
# You should see `framepack` with status **enabled** and version **0.9.1**.

# 5. Add AGENTS.md to your project root (required!)
cp framepack/AGENTS.md /path/to/your/project/AGENTS.md
```

**Tip:** Run `hermes status` to find your actual HERMES_HOME path.

## Test It

In a Hermes chat, in a project directory with the AGENTS.md:

```
"帮我做一个 30 秒的科技品牌发布会视频"
```

Framepack will kick in, match a Visual Style (Swiss Pulse or Neon Grid),
generate frame.md, then walk through creative expansion.

## Updating

```bash
cd framepack && git pull
cp -r framepack-plugin <hermes-home>/plugins/framepack
cp AGENTS.md /path/to/your/project/AGENTS.md
# Restart Hermes
```

## License

MIT
