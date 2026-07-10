# Framepack

> **HyperFrames Director Workbench — v0.19.0**
>
> Framepack turns fuzzy video intent into a commercially usable HyperFrames production brief: it routes the job, asks for assets, defines the creative direction, chooses the right workflow/weapons, hands off cleanly, then taste-audits before render.

Framepack is a Hermes Agent Plugin for HyperFrames. Its job is not to be another renderer. Its job is to be the **director layer** between a human's messy creative intent and HyperFrames' production machinery.

Kitchen analogy: **HyperFrames is the professional kitchen. Framepack is the chef.** The kitchen has the ovens, knives, stations, and service line. The chef decides the menu, inspects ingredients, chooses recipes, checks plating, and tells the kitchen when the dish is ready to serve.

## Product positioning

Framepack exists to make AI-generated commercial videos feel **focused, clear, and premium** instead of becoming animated slide decks.

It optimizes for:

- **Creative direction before production** — decide the film before touching the camera.
- **Real assets over generic decoration** — product visuals, screenshots, logos, proof points, reference DNA, and brand texture should lead.
- **Weapon-first execution** — use proven animation weapons/presets before hand-written GSAP.
- **Taste as a production gate** — report weak taste, stale assets, template smell, drift, and missing proof before render.
- **User decision checkpoints** — Framepack advises; the user decides whether to revise, add assets, or render anyway.

## Design philosophy

Framepack is built around five product rules:

1. **Director, not camera operator** — Framepack owns intent, story, asset awareness, creative constraints, weapon guidance, and taste audit. HyperFrames owns HTML, Studio, lint, render, publish, catalog, media, and cloud execution.
2. **Co-create where taste matters** — visual style, assets, voice, aspect ratio, pacing, and render decisions deserve human checkpoints.
3. **No AI debt** — do not let agents fake sophistication with raw GSAP, generic motion, missing assets, or undocumented shortcuts.
4. **Receipts over vibes** — every handoff should leave a trail: `frame.md`, `expanded-prompt.md`, weapon load plans, arsenal registry, scorecards, lint/audit findings.
5. **Productize what works** — reusable templates, presets, weapons, scorecards, and audits should become stable production assets, not one-off tricks.

## Architecture at a glance

```text
User idea / URL / reference / product brief
  ↓
Framepack Intent Router
  ├── product-launch-video
  ├── website-to-video
  ├── faceless-explainer
  ├── pr-to-video
  ├── embedded-captions
  ├── motion-graphics / graphic-overlays
  ├── template reuse
  └── reference/template extraction
  ↓
Asset intake + co-creation checkpoint
  ↓
frame.md
  └── visual identity + control profile
  ↓
.hyperframes/expanded-prompt.md
  └── Director Story Bible: scenes, rhythm, time windows, motifs, negative prompt
  ↓
Weapon Matching Pass
  ├── source search: official catalog → Framepack arsenal → specialist skills → project-local weapons
  ├── weapon-load-plan.json / .md
  ├── preset metadata: preset_id, params_hint, score_class, studio_editable
  └── HANDWRITE waivers only when no useful weapon exists
  ↓
Handoff Manifest
  └── workflow, assets, constraints, QA red lines, weapon obligations
  ↓
HyperFrames official workflow + Studio preview
  ↓
Framepack Pre-render Taste Audit
  ├── quality issues: stale props, asset gaps, template smell, timeline/proof drift
  ├── upstream limits: known HyperFrames constraints reported separately
  └── advisory output: revise / add assets / render anyway
  ↓
HyperFrames render / publish / cloud
```

## Department architecture

Framepack is organized as a set of cooperating product departments, not a pile of hooks and detectors. Each department owns one job, one boundary, and one kind of receipt.

| Department | Plain-language role | Owns | Does not own |
|---|---|---|---|
| Intent & Intake | Front desk: understand the job before the kitchen starts cooking | routing, asset questions, user decision gates | scene choreography, taste judgment, weapon choice |
| Director Bible | Director room: turn intent into a shootable story bible | `frame.md`, `.hyperframes/expanded-prompt.md`, time windows, motifs, execution manifest | HTML, render, final quality proof |
| Taste Intelligence | Chef's palate: decide whether the idea is commercially strong | `taste_read`, `taste_dials`, taste rules, prompt/pixel taste debt, action cards | concrete weapon selection, implementation enforcement |
| Weapon Production | Kitchen equipment + recipes: choose the mature way to build | weapon matching, arsenal, presets, scorecards, load plans | whole-film taste judgment |
| Production Audit | Pass inspection: verify promises against artifacts | quality audit, proof/timeline drift, stale props, upstream warning classification | rewriting the creative direction |
| Intervention & Railguard | Floor manager: pull the Agent back on track when it drifts | gates, corrective injections, required next actions, waivers, receipts | business-specific taste/weapon/audit logic |
| Knowledge Assets | Recipe archive: turn useful cases into reusable assets | templates, reference DNA, visual styles, research PRDs, case learnings | unverified one-off magic |
| Platform Integration | Runtime and release ops: keep Hermes/HyperFrames/Framepack aligned | hooks, compatibility, guardrails, deployment sync, release docs | creative taste or weapon semantics |

The most important production-governance chain is:

```text
Taste → Weapon → Audit → Intervention
```

- **Taste** says whether the direction is commercially strong.
- **Weapon** says which proven production method should be used.
- **Audit** checks whether the promise was actually fulfilled.
- **Intervention** is the reusable hard stop / railguard layer that pulls the Agent back when it skips steps, fakes a call, ignores proof, or needs a waiver.

This boundary keeps the system complementary: Taste does not become a code checker, Weapon does not become an art critic, Audit does not become a director, and gates do not stay scattered across every module.

## Core modules

| Module | Purpose | Output / contract |
|---|---|---|
| Intent Router | Classifies fuzzy requests into the right video workflow | product launch, website tour, explainer, PR video, captions, overlays, templates, reference mining |
| Asset Intake | Asks for useful real-world inputs before creative expansion | logo, screenshots, product pages, source video, BGM, proof points, brand palette, references |
| `frame.md` | Locks visual identity and control profile | colors, typography, atmosphere, motion energy, creative autonomy/restraint/weapon reliance |
| Director Story Bible | Expands the idea into production-ready scenes | `.hyperframes/expanded-prompt.md` with beats, layers, choreography, time windows, execution manifest |
| Weapon Matching Pass | Converts scene intent into mandatory animation resources | `.framepack/weapon-load-plan.json` and `.md` |
| Arsenal Registry | Tracks builtin/downloaded/project-local weapons | `.framepack/arsenal.json`, paths, hashes, source provenance, unused warnings |
| Preset Registry | Turns a weapon into named recipes, not just raw code | `weapon-presets/*.json` with safe use cases, avoids, params, duration/ease |
| Weapon Scorecards | Rates production usefulness and risk | `weapon-scorecards/*.json`, score class, rationale, editability notes |
| Post-write Weapon Gate | Catches fake weapon usage after HTML is written | rejects empty calls, fake shims, comment-only calls, missing preset-quality params |
| Guardrail Hydrator | Keeps project `AGENTS.md` aligned with Framepack rules | managed block sync without overwriting user rules |
| Pre-render Taste Audit | Reviews taste before render without blocking user agency | report-first findings and revise/add-assets/render-anyway advice |

## v0.19.0: Taste Layer 2.0 — commercial taste intelligence

v0.19.0 is the release where Framepack's Taste Layer grew from "a critic reading the script" into a **full commercial taste nervous system**.

The Taste Layer 2.0 initiative delivered 8 phases + 2 real-render dogfood stops:

```text
Phase 1: Rule registry + data-driven severity mapping
Phase 2: Prompt-level taste detectors (frame.md + expanded-prompt.md)
Phase 3: HTML-level implementation slop detectors
Phase 4: Full slop coverage — gradient text, bounce/elastic, over-rounded cards, ghost shadows
Phase 5: Proof-frame evidence system (ProofEvidence metadata)
Phase 6: Action cards grouped by Revise / Proof / Waiver
Phase 7: LF-normalized deploy sync script (eliminates CRLF MD5 drift)
Phase 8: Full verification + real-render dogfood

Dogfood stop 1: code-level slop/clean comparison — slop caught 6+ codes, clean 0 false positives
Dogfood stop 2: real MP4 render + ffprobe + frame extraction + Taste Audit on actual pixels
```

What this means for production:

- **Before**: the Agent could write technically valid HTML that felt like an animated slide deck — gradient text, bounce easing, fake dashboards, missing proof frames — and nothing caught it until a human watched the video.
- **Now**: Framepack catches these symptoms as concrete action cards before render, with severity tuned by film register (luxury ≠ SaaS ≠ event teaser). The user still decides: revise, prove, waive, or render anyway.

This release also carries the v0.18.0 weapon quality engine forward: post-write weapon gate, arsenal registry, preset/scorecard contracts, and the Intervention & Railguard layer that pulls the Agent back when it fakes a weapon call.

## Taste Layer: commercial taste nervous system

The Taste Layer is Framepack's answer to a simple product question: **how do we stop AI from making something technically valid but commercially weak?**

It is not a prettier linter. A linter checks whether the plate is clean. The Taste Layer asks whether this dish should leave the kitchen at all: is there a real product on screen, does the opening have a visual hook, is the motion earning its keep, are we seeing proof frames or just flattering prose?

In plain language, the Taste Layer is Framepack's **chef's palate + kitchen ticket system**:

- **Palate** — reads the brief and decides what kind of film this is: brand film, product launch, website-to-video, explainer, product UI demo, event teaser.
- **Dials** — converts creative judgment into controllable settings: design variance, motion intensity, visual density, plus the existing five-element control profile.
- **Anti-slop scanner** — catches generated-video tells: text carrying the film, missing product visuals, static mockups, generic fades, fake precision, AI-copy punctuation, fake UI, decorative grids/glows, and other “animated PPT” symptoms.
- **Receipts** — writes `taste-audit.json` and `taste-debt.md`, so quality problems become action cards instead of vibes.
- **Decision loop** — before preview/render, the user gets clear choices: revise, attach proof, waive intentionally, or render anyway.

### What it does today

Current Taste Layer 2.0 capabilities:

| Capability | Why it matters | Current artifact |
|---|---|---|
| Taste read | The Agent must name the film type before judging it | `taste_read` in `frame.md` |
| Taste dials | Taste becomes controllable instead of mystical | `taste_dials` + `control_profile` |
| Rule registry | Taste rules are data-backed, not scattered hardcoded strings | `core/taste_rules.py` |
| Register-aware severity | Luxury object film ≠ SaaS launch ≠ event teaser — same symptom, different weight | `taste_rules.py` register mapping |
| Prompt checks | Catch weak direction before HTML exists | `opening_visual_absence`, `scene_layout_repetition`, `product_presence_weak`, `copy_overcrowding`, `copy_punctuation_slop`, `fake_precision`, `ui_debris_copy`, `missing_taste_read`, `invalid_taste_dial` |
| HTML slop checks | Catch implementation-level AI tells in rendered code | `gradient_text_slop`, `bounce_or_elastic_easing`, `over_rounded_codex_cards`, `ghost_card_shadow_border`, `fake_product_ui_divs`, `raw_scroll_listener`, `missing_reduced_motion`, `decorative_generated_surface` |
| Proof-frame evidence | Motion claims must be backed by actual proof frames, not prose | `core/taste_proof_detectors.py` + `ProofEvidence` metadata |
| Action cards | Open taste debt becomes concrete next actions, grouped by category | `.framepack/taste-audit.json` — Revise / Proof / Waiver cards |
| Decision loop | Before render, user gets clear choices | revise, attach proof, waive intentionally, or render anyway |

### Where this release stands

The Taste Layer 2.0 system is **shipped and verified**:

```text
brief/register/dials
  → rule registry with register-aware severity
  → prompt detectors (frame.md + expanded-prompt.md)
  → HTML implementation slop detectors
  → proof-frame evidence system
  → action cards grouped by Revise / Proof / Waiver
  → pre-render decision loop
```

All 8 implementation phases are complete. Two real-render dogfood stops exercised the full pipeline against actual MP4 output with frame extraction and ffprobe verification. The slop sample triggered 6 taste codes; the clean sample produced 0 false positives.

### Roadmap

The foundation is poured. Future growth directions:

1. **Expanded commercial case library** — each real case feeds back into rule registry, presets, scorecards, and templates.
2. **Decimal-precision detector coverage** — currently handles integer px radii; extend to decimal CSS values.
3. **Rule-pack lifecycle automation** — every useful commercial case should auto-suggest new rules or rule refinements.
4. **Visual AI scoring integration** — connect taste detectors to pixel-level analysis for deeper slop detection.

Long-term, the Taste Layer will become Framepack's **commercial video intelligence layer**: the part that helps an Agent not merely finish a video, but make something useful, usable, good, and occasionally surprising enough that a user says, "I did not expect AI to make that."

## What Framepack does

- Routes the request before writing anything.
- Asks for useful assets and reference material instead of inventing generic filler.
- Produces `frame.md` and `.hyperframes/expanded-prompt.md` as the creative source of truth.
- Produces a weapon load plan so the HTML-writing agent knows exactly what to load before coding.
- Manages arsenal lifecycle: find → obtain → register → dedupe → use audit → cleanup → archive.
- Classifies HyperFrames warnings into fixable quality issues vs known upstream limits.
- Runs report-first taste checks that normal lint cannot see.

## What Framepack does not do

- It does not write, fix, or own HyperFrames HTML.
- It does not replace `hyperframes lint`, Studio preview, render, publish, media, catalog, or cloud workflows.
- It does not treat taste audit as a hard render blocker. Framepack advises; the user decides.
- It does not reward raw hand-written GSAP when a weapon/preset exists.

## Plugin hooks

```text
pre_tool_call:
  ├── classify HyperFrames command intent
  ├── handoff/production commands → Guardrail Hydrator + Arsenal preflight + Quality Audit context
  ├── post-write / pre-render surfaces → weapon/taste advisory checks
  └── discovery/catalog/media/scaffold commands → no false handoff warning

post_tool_call:
  ├── Framepack skill_view → Guardrail Hydrator sync + current-session injection
  ├── frame.md write → visual/control-profile quality check
  ├── expanded-prompt.md write → Arsenal reconcile + Director Story Bible quality check
  ├── weapon matching output → load-plan / preset / scorecard receipts
  └── lint JSON output → upstream warning classification cache
```

## Skills

| Skill | What |
|---|---|
| `framepack` | Main Director Workbench guide |
| `framepack-director` | Intent → `frame.md` + Director Story Bible |
| `framepack-animation-library` | Animation weapon catalog and reference snippets |
| `framepack-gsap` | HyperFrames-safe GSAP recipes |
| `framepack-arsenal` | Weapon registry lifecycle |
| `framepack-reference-miner` | Reference video/webpage → motion DNA/template extraction |
| `framepack-production-quality` | Timeline/proof/semantic quality checks |
| `framepack-sprite-forge` | Sprite-sheet and chroma-key workshop |

## Install

```bash
# 1. Clone
git clone https://github.com/ARTHUR-BBU/framepack --depth 1

# 2. Copy to Hermes plugins
# Linux/macOS:
cp -r framepack/framepack-plugin ~/.hermes/plugins/framepack
# Windows:
xcopy /E /I framepack\framepack-plugin %HERMES_HOME%\plugins\framepack

# 3. Enable
hermes plugins enable framepack

# 4. Verify
hermes plugins list
# You should see `framepack` enabled with version **0.19.0**.
```

## Compatibility

Framepack v0.19.0 targets the HyperFrames 0.7 production line.

- baseline production target: `HyperFrames 0.7.3+`
- current workbench target: `HyperFrames 0.7.21` as declared by the plugin manifest
- supported band: `0.7.x` with probe-before-trust for newer versions
- versions below `0.7.3` should upgrade before Framepack handoff

## Test it

In a Hermes chat, from any project directory:

```text
帮我做一个 30 秒的科技品牌发布视频。你自己判断路线，但先问我要不要提供素材。
```

Expected behavior: Framepack routes the request, asks for assets, builds the creative direction, creates the story bible and handoff receipts, guides weapon/preset usage, hands off to HyperFrames, then gives a Pre-render Taste Audit before final render.

## Updating

```bash
cd framepack
git pull
cp -r framepack-plugin <hermes-home>/plugins/framepack
# Restart Hermes
```

Project `AGENTS.md` files are repaired automatically on next Framepack invocation via Guardrail Hydrator. The hydrator only edits the `FRAMEPACK MANAGED BLOCK` and preserves user/project rules outside that block.

## License

MIT
