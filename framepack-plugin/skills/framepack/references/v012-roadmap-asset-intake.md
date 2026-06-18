# Framepack v0.12 — Development Roadmap & Asset Intake Design

Use this reference when planning or implementing post-v0.11.0 Framepack features.
The full design doc lives at `.hermes/designs/2026-06-17--framepack-asset-intake.md`.

## Development roadmap (agreed 2026-06-17)

Five priorities, ordered by user importance:

1. **Asset Intake** ✅ — structured素材收集流程. Implemented and verified: 56 tests green (12 unit + 10 e2e + 34 degradation), source + deployment 296/296, design doc verified, committed on `framepack-agent-platform`. Deployed to Hermes plugins directory; functional even before v0.12.0 version bump.
2. **武器库扩充** — expand beyond GSAP-only. anime.js for SVG path / lightweight reveal; Sprite Sheet Forge for 2D game-style character animation / frame sequences. Arsenal registry schema needs to handle non-GSAP calling conventions.
3. **Taste Engine 广度验证** — only luxury pearl case validates taste audit so far. Need 2-3 cases in emerging / editorial styles to prove generalization.
4. **参数漂移根治** — root cause is "Agent writes HTML from memory, not from Manifest". v0.10.4 canonical function metadata + v0.10.3 parameter drift detection are reactive. Need source-level enforcement before HTML writing.
5. **gsap_studio_edit_blocked** — HyperFrames 0.6.99/0.6.104 lacks suppress mechanism for Studio editability warnings. Mark as known limitation, push upstream for a silence flag.

## Asset Intake — core design

### Problem

Current flow has a structural hole:

```
用户模糊意图 → Design Picker → Phase 1 → frame.md → Phase 2 → expanded-prompt.md
```

No step asks the user for logo, product images, brand colors, slogans, footage.
Agent guesses everything. For brand/product videos this is unacceptable.

### Solution: Director Phase 0

Asset Intake becomes a new Phase 0 in the Director skill, before Design Picker:

```
用户模糊意图
    ↓
Phase 0: Asset Intake (NEW)
    ├── 判定视频类型 (brand_product_launch / educational / social_teaser / kinetic_type)
    ├── 按品类收集 (条件深度)
    ├── 透明通道检测 + 处理建议
    └── 产出 .framepack/asset-intake.md
    ↓
Design Picker / Phase 1 (existing, now fed by Phase 0 data)
    ↓
Phase 2 (existing, now references asset-intake.md for scene planning)
```

Director becomes the complete entry point: 收料 → 视觉身份 → 场景分解.
The director's first job is to inventory props and cast, not pick camera angles.

### Six asset categories

1. **Brand Identity** — logo (SVG > PNG-transparent > JPG), brand colors (hex or VI manual), brand fonts, VI spec doc
2. **Product Assets** — cut-out product images, uncut photos (needs transparency detection), 3D renders, lifestyle shots
3. **Video Footage** — live-action clips, pre-made segments, screen recordings
4. **Text Content** — slogan/tagline, selling points, product description, CTA, brand story
5. **Audio** — licensed BGM, voiceover audio, voiceover script (for TTS), music preference ("like XXX")
6. **References** — reference video links, competitor videos, mood boards

### Conditional depth

Not all video types need full six-category intake:

| Video type | Categories to ask |
|---|---|
| brand_product_launch / promo / ad | All six |
| concept / educational / explainer | Text + Audio + References only |
| social_teaser / story | Brand identity + Text + Product (1 key image) + Audio |
| kinetic_type / text_only | Text + Audio (minimal) |

Agent auto-classifies from the user's first sentence. If ambiguous, ask directly.

### Transparency detection

```
image provided
    → SVG: vector, naturally transparent ✅
    → PNG/WebP: check alpha channel
        → has transparency: ready ✅
        → no transparency: flag needs_processing
    → JPG: no transparency: flag needs_processing

needs_processing → suggest `npx hyperframes remove-background`
Framepack only detects + suggests. Does not auto-run HyperFrames tools.
```

### Graceful degradation

- User has nothing → "No problem, give me one sentence of core copy." → degrade to kinetic_type
- User has partial → record what they have, mark missing, continue
- User gives URL not file → Agent downloads to assets/, detects format, registers in manifest

### Output: .framepack/asset-intake.md

YAML-structured manifest with per-category entries. Each asset records: path, format,
transparent (bool), status (ready / needs_processing), notes. Missing assets are listed
in a `missing:` section for reminder tracking.

### Integration with existing flow

- Brand colors → inject directly into frame.md, skip Design Picker color step
- Brand fonts → inject directly into frame.md typography
- Product images → Phase 2 scene planning allocates display scenes per image
- Footage → Phase 2 scene planning allocates composite scenes
- Slogan → text reveal scene core copy
- Reference video → rhythm/style calibration (feed to reference-miner if available)

### Scope boundaries

Framepack does NOT:
- Auto-run remove-background (only suggests)
- Verify asset copyright/licensing
- Auto-download cloud storage links (Agent handles manually)
- Score asset quality (resolution checks etc.)

## Arsenal expansion — design notes

Current arsenal schema binds GSAP function signatures. Non-GSAP weapons need different binding:

| Engine | Calling convention | Example |
|---|---|---|
| GSAP | `gsap.to(target, {...})` | timeline orchestration, text stagger |
| anime.js | `anime({targets, ...})` | SVG path animation, lightweight reveal |
| Sprite Sheet Forge | CSS `steps()` or canvas frame sequence | 2D character animation, product rotation |

Arsenal registry `weapons[].source` and `weapons[].engine` fields need to accommodate
multi-engine weapons. Execution Manifest entries need an optional `engine` field defaulting
to `gsap`. Quality audit parameter drift detection needs engine-aware comparison.

## Key product insight

老田 identified that素材收集 is not optional — for brand/product videos it is the
difference between a useful tool and a toy. "厨师不问食客带了什么食材就直接开炒"
(cook doesn't ask what ingredients the diner brought before firing up the stove).

This insight shapes the v0.12.0 direction: Framepack must be a director that knows
what props are available before choosing shots, not just a style-matching engine.
