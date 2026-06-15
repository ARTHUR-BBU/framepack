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
  hyperframes init --example blank
  → optionally pulls richer registry components when available
  → reads frame.md + expanded-prompt.md
  → writes HTML + GSAP timeline
  → hyperframes lint && render
  │
  ▼
Video 🎬
```

## Plugin Hooks (v0.10.6)

```text
pre_tool_call:
  ├── classify HyperFrames command intent (handoff vs discovery/registry/media/cloud)
  ├── handoff commands → Guardrail Hydrator + Arsenal preflight + Quality Audit summary + frame.md readiness warning
  └── discovery/version/help/catalog commands → no handoff warning

post_tool_call:
  ├── Framepack skill_view → Guardrail Hydrator sync + current-session injection
  ├── frame.md write → LLM quality check (palette/typography/motion complete?)
  └── expanded-prompt.md write → Arsenal reconcile + LLM quality check (beats/rhythm complete?)
```

v0.10.6 adds the **Production Hardening Patch**: external font dependency audit, local font asset checks, low-visibility risk audit, finite-number guards, project-local proof path checks, and a bumped test-team auto script. v0.10.5 added the **Production Quality Layer**: timeline manifest sync, scene specs, proof-frame/contact-sheet workflow, fail-on severity gates, and a test-team auto script for repeatable acceptance. v0.10.4 adds the Arsenal Binding Contract: auto-created `.framepack/arsenal.json`, canonical weapon function metadata, and inline GSAP hints when a declared weapon is not actually called.

**What Framepack does NOT do:**
- ❌ Write, fix, render, or structurally validate HTML — that's HyperFrames (`lint` / `validate` / `snapshot` / `render`)
- ✅ It may emit a non-blocking semantic Quality Audit report for issues lint cannot see
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
# You should see `framepack` with status **enabled** and version **0.10.6**.
```

Framepack v0.10.6 adds **Production Hardening Patch**: Google Fonts/runtime font dependency warnings, local `@font-face` asset checks, dark/low-visibility heuristics, NaN/Infinity rejection, project-local proof path checks, and the `scripts/test_team_v0106_auto_test.py` acceptance runner. v0.10.5 added **Production Quality Layer**: `.framepack/timeline-manifest.json`, scene-spec templates, proof frames/contact sheets, timeline/proof audit issues, `--sync-timeline`, and `--fail-on P0|P1|P2|P3`. v0.10.4 adds **Arsenal Binding Contract**: auto-created/synced `.framepack/arsenal.json`, canonical weapon function metadata, and clearer inline GSAP hints for manifest weapons that are declared but not called. v0.10.2 adds **Environment & Upgrade Manager**: report-only environment doctor, safe skill install manager, hardening overlay planner, three-way skill upgrade manager, and upgrade report generation. v0.10.1 includes **HyperFrames Compatibility Adapter**: Framepack now classifies HyperFrames commands by intent, stores `.framepack/hyperframes-capabilities.json`, treats official catalog/add as opportunistic rather than mandatory, falls back to the offline-safe `blank` baseline, and generates upstream skill-diff reports without blindly overwriting local hardening rules. v0.10.0 added Arsenal Registry runtime: `.framepack/arsenal.json` creation, Execution Manifest reconciliation, builtin weapon catalog, trusted-source whitelist, and non-blocking Arsenal preflight before handoff-consuming HyperFrames commands. v0.9.4 includes Replica Mode render-integrity hardening: root compositions must declare explicit `data-duration`, reverse-copy work requires `VIDEO_DNA.md`, `.hermes/content_decomposition.md`, and `TEMPLATE_BLUEPRINT.md` before HTML, and Replica handoff docs must remove ambiguous implementation language or mark explicit approved exceptions. Framepack automatically syncs the latest rules into each project's `AGENTS.md` managed block and injects the same rules into the current session.

**Tip:** Run `hermes status` to find your actual HERMES_HOME path.

## Test It

In a Hermes chat, from any project directory:

```
"帮我做一个 30 秒的科技品牌发布会视频"
```

Framepack will hydrate its managed guardrails block if needed, match a Visual Style (Swiss Pulse or Neon Grid),
generate frame.md, then walk through creative expansion.

## Updating

```bash
cd framepack && git pull
cp -r framepack-plugin <hermes-home>/plugins/framepack
# Restart Hermes
```

Project `AGENTS.md` files are repaired automatically on next Framepack invocation via Guardrail Hydrator. The hydrator only edits the `FRAMEPACK MANAGED BLOCK` and preserves user/project rules outside that block.

## License

MIT
