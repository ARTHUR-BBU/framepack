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

## Plugin Hooks (v0.14.1)

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
# You should see `framepack` with status **enabled** and version **0.14.1**.
```

**Framepack v0.14.1** is a production-hardening release. Multi-angle E2E testing surfaced 9 defects; this release fixes all of them: weight-injection guardrails (LLM quality-check decoupled from weight insertion so weight directives cannot silently drop when the LLM check skips), restraint-audit regex hardening (handwrite-ratio matcher no longer collapses across newlines or false-matches word prefixes like `obscene1:`), caution_motion rendering & audit coverage, Sprite Forge QC report emission & non-square cell scaling, cross-block-name migration guard for YAML blocks, five-element Weights docstring clarified so the 相生相克 metaphor is understood as creative-direction guidance (not a mathematical constraint), and +20 regression tests locking the fixes (511→531).

Framepack v0.14.0 adds **Five-Element Weight Control System**: ControlProfile (creative_autonomy/restraint_force/atmosphere_density/motion_dynamism/weapon_reliance), Phase 0.5 试菜 flow, Hook nerve-pathway penetration (weight directives injected at frame.md and expanded-prompt.md checkpoints), weight consistency audit at P2 with explanation requirement, caution_motion weighted motion system (forbidden_motion backward compat). Also adds **Sprite Forge** workshop: process_sprite.py (chroma-key cutting), make_layout_guide.py (layout reference), prompt rules knowledge base. Framepack v0.12.0 adds Arsenal expansion (anime.js + sprite sheet forge), Taste audit broadening (kinetic/fade/surprise/motif fixes), Parameter drift guard (param_guard.py + canonical snippets), Upstream Warning Bridge (lint --json classification into quality_audit). Framepack v0.11.1 adds Asset Intake (Phase 0): asset detector (PNG/JPG/SVG transparency), six-category asset checklist, asset-intake.md manifest generation, degradation branches by video type. v0.11.0 adds **Kinetic Taste Engine**: semantic taste audit (fade-stack monotony, surprise density, kinetic grammar coherence), curated taste specimens, Director taste references, HyperFrames 0.6.104 compatibility, and environment doctor cwd fix. v0.10.6 added **Production Hardening Patch**: Google Fonts/runtime font dependency warnings, local `@font-face` asset checks, dark/low-visibility heuristics, NaN/Infinity rejection, project-local proof path checks, and the `scripts/test_team_v0106_auto_test.py` acceptance runner. v0.10.5 added **Production Quality Layer**: `.framepack/timeline-manifest.json`, scene-spec templates, proof frames/contact sheets, timeline/proof audit issues, `--sync-timeline`, and `--fail-on P0|P1|P2|P3`. v0.10.4 adds **Arsenal Binding Contract**: auto-created/synced `.framepack/arsenal.json`, canonical weapon function metadata, and clearer inline GSAP hints for manifest weapons that are declared but not called. v0.10.2 adds **Environment & Upgrade Manager**: report-only environment doctor, safe skill install manager, hardening overlay planner, three-way skill upgrade manager, and upgrade report generation. v0.10.1 includes **HyperFrames Compatibility Adapter**: Framepack now classifies HyperFrames commands by intent, stores `.framepack/hyperframes-capabilities.json`, treats official catalog/add as opportunistic rather than mandatory, falls back to the offline-safe `blank` baseline, and generates upstream skill-diff reports without blindly overwriting local hardening rules. v0.10.0 added Arsenal Registry runtime: `.framepack/arsenal.json` creation, Execution Manifest reconciliation, builtin weapon catalog, trusted-source whitelist, and non-blocking Arsenal preflight before handoff-consuming HyperFrames commands. v0.9.4 includes Replica Mode render-integrity hardening: root compositions must declare explicit `data-duration`, reverse-copy work requires `VIDEO_DNA.md`, `.hermes/content_decomposition.md`, and `TEMPLATE_BLUEPRINT.md` before HTML, and Replica handoff docs must remove ambiguous implementation language or mark explicit approved exceptions. Framepack automatically syncs the latest rules into each project's `AGENTS.md` managed block and injects the same rules into the current session.

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
