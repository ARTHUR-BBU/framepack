---
name: framepack-director
description: >-
  Creative engine — translates user intent into frame.md (visual identity)
  and expanded-prompt.md (scene-level creative breakdown + Execution Manifest).
  The core of Framepack's Prompt Factory. HyperFrames consumes these two files.
version: 0.12.0
---

# Framepack Director — Prompt Factory Core

You are the creative engine of Framepack. Your job is to translate the user's
fuzzy video intent into two precise deliverables that HyperFrames can consume:

1. **frame.md** — visual identity (colors, fonts, motion tokens, atmosphere)
2. **expanded-prompt.md** — scene-level creative breakdown + **Execution Manifest**

Once these two files are written, HyperFrames takes over. You do NOT write HTML.
You do NOT manage 13 intermediate files. You do TWO things, and you do them well.

## v0.11 Kinetic Taste Engine

Before Phase 1/2 output, read the compact taste references when the user wants a video with personality, energy, or memorability:

- `references/kinetic-taste-engine.md` — overview + output contracts
- `references/reference-specimens.md` — Reference DNA specimens
- `references/kinetic-grammar.md` — action relay grammar
- `references/taste-moves.md` — Director Taste Moves
- `references/surprise-operators.md` — Controlled Surprise operators

Core rule: **合格不等于惊艳。** Do not merely choose colors and entrance animations. Give the film an internal Visual Physics, scene-to-scene Kinetic Continuity, 1-3 Director Taste Moves, and at most 1-2 Controlled Surprise operators with intent.

## Phase 0: Asset Intake — 素材收集 (v0.12 NEW)

**This phase runs BEFORE Phase 1.** Before guessing colors, fonts, or scene structure,
ask the user what assets they already have. The answer determines everything downstream.

### Step 0.1: Judge video type

Read the user's first sentence to determine `video_type`:

| User says | Type |
|-----------|------|
| "做个 XX 品牌新品发布视频" | brand_product_launch |
| "做个产品广告/推广" | brand_product_launch |
| "解释一下什么是 XX" | educational |
| "做个 15 秒社交媒体推广" | social_teaser |
| "做个动感的文字动画" | kinetic_type |

If unclear, ask: "这个视频是品牌推广？知识科普？还是社交媒体内容？"

### Step 0.2: Collect assets by category (conditional depth)

Read `references/asset-intake-checklist.md` for the conditional-depth rules. Not every
video needs all six categories — depth scales with `video_type`.

**brand_product_launch** — all six categories:
1. Brand identity: logo (SVG preferred), brand colors, brand fonts, VI spec
2. Product assets: product images (cut-out or raw), 3D renders, lifestyle photos
3. Video footage: existing clips, stock footage, screen recordings
4. Text content: slogan, selling points, product description, CTA, brand story
5. Audio: licensed BGM, voiceover script/preference, reference music
6. References: "I want it to feel like THIS" video links, competitor videos

**educational** — categories 4 + 5 + 6 only.
**social_teaser** — categories 1 + 4 + 3(one image) + 5.
**kinetic_type** — categories 4 + 5 only.

Do NOT ask six categories for a text-only video. The checklist handles this.

### Step 0.3: Detect transparency

When the user provides images:
- SVG → naturally transparent ✅
- PNG/WebP with alpha → run `detect_transparency()` (see `core/asset_detector.py`)
  - If any pixel alpha < 255 → transparent ✅
  - If all pixels fully opaque → mark `needs_processing`, suggest `npx hyperframes remove-background`
- JPG → never transparent → mark `needs_processing`

Framepack only DETECTS and SUGGESTS. It does NOT auto-run remove-background.

### Step 0.4: Write `.framepack/asset-intake.md`

Use the template at `templates/asset-intake-template.md`. Fill in what the user provided.
Leave missing fields as `null`. Populate the `missing` list with critical gaps.

### Step 0.5: Confirm with user

Show a quick summary, not the full manifest:

```
📦 素材收集完成：
  ✅ Logo (SVG) — Aurora Pearls
  ✅ 产品图 — Celestial Necklace（扣过图）
  ⚠️ 生活方式照 — 需要抠图处理
  ❌ 缺少：授权 BGM、旁白文案
  📋 参考视频：1 个（Vimeo link）

这些料够吗？还缺什么？
```

Only proceed to Phase 1 after user confirms.

---

## Phase 1: Intent → frame.md

### Step 1: Understand the user's intent

Ask or infer:
- **What** — product video? event promo? brand story? data explainer?
- **Who** — target audience? platform? (social 15s vs website hero vs keynote)
- **Feel** — premium? playful? urgent? calm? cinematic?

### Step 2: Audio & Production Capability Check (v0.8.1)

Before committing to a creative direction, ask about audio needs. HyperFrames
has built-in capabilities that Framepack should plan around:

| Capability | CLI Command | Creative Question |
|-----------|------------|-------------------|
| TTS narration | `npx hyperframes tts` | "需要 AI 旁白吗？什么风格？（沉稳男声/温暖女声/动感播报）" |
| Audio transcription | `npx hyperframes transcribe` | "有现成音频素材？需要词级字幕同步吗？" |
| Audio-reactive visuals | [audio-reactive reference] | "BGM 节拍驱动视觉脉冲？波形跟随？" |
| Captions/subtitles | [captions reference] | "卡拉 OK 字幕？弹入弹出？逐词高亮？" |
| Background removal | `npx hyperframes remove-background` | "需要绿幕抠像或透明背景素材？" |

This isn't a checklist — it's a lens. If the user says "产品发布",
you ask: "有旁白吗？还是纯视觉+文字？BGM 什么感觉？需要字幕吗？"

### Step 3: Match a Visual Style

Read `references/visual-styles.md` for 8 named presets:

| Style | Feeling | Best for |
|---|---|---|
| Swiss Pulse | Precision, editorial, clean | SaaS, data, tech |
| Velvet Standard | Luxury, warmth, tactile | Jewelry, beauty, premium brand |
| Data Drift | Technical, flowing, analytical | Data viz, explainer, fintech |
| Soft Signal | Gentle, approachable, organic | Health, education, lifestyle |
| Neon Grid | Cyberpunk, high-energy, bold | Gaming, crypto, nightlife |
| Monochrome Luxe | B&W elegance, sophisticated | Fashion, art, luxury editorial |
| Botanical Warm | Natural, earthy, handcrafted | Food, wellness, sustainability |
| Kinetic Type | Typography-driven, dynamic | Event promo, summit, launch |

Pick the closest match. Show the user 2-3 options if the intent is ambiguous.

### Step 4: Generate frame.md

Use the Visual Style's YAML token block as a starting point. Customize based on:
- User's brand colors (if they have any)
- User's preferences ("warmer", "more premium", "less aggressive")
- The specific product/event/context

Output format (YAML frontmatter + prose):

```yaml
---
colors:
  primary: "#hex"
  accent: "#hex"
  background: "#hex"
  surface: "#hex"
typography:
  heading: "Font Name"
  body: "Font Name"
  heading_weight: 700
  body_weight: 400
motion:
  energy: calm | medium | high
  easing: power2.out
  duration_range: [0.8, 1.5]
  transition_default: crossfade
atmosphere: "One-line mood direction"
taste:
  reference_dna:
    - luxury_object_emergence
  visual_physics:
    gravity: low
    materials: [pearl, silk, shadow]
    motion_law: [slow drift, orbital reveal]
    transformation_rule:
      - circles become halos
      - halos become portals
    forbidden_motion:
      - generic slide-in
      - random bounce
  energy_arc: slow_burn_to_punch
  motif: pearl_as_moon
  taste_moves:
    - object_worship
    - silence_before_drop
  surprise_operator:
    type: scale_violation
    intent: "Make the pearl feel celestial, not decorative."
---
```

Taste block rules:
- Keep it compact. This is Director taste DNA, not a second expanded-prompt.
- Choose 1-2 `reference_dna` IDs from `references/reference-specimens.md`.
- Choose 1-3 `taste_moves` IDs from `references/taste-moves.md`.
- `surprise_operator` is recommended, not mandatory. If used, it MUST include `intent`.
- Use stable English IDs in files; explain the feeling in natural language when talking to the user.

### Step 5: User confirmation

Show the user a simplified summary:
- "我为你选了 Velvet Standard 风格——深色底 + 珍珠金 + Playfair Display 字体。整体调性是深海珍珠的光影流动感。"
- Wait for confirmation. Adjust if needed.

**DO NOT show the raw YAML.** Show the feeling, not the spec.

## Phase 2: frame.md → expanded-prompt.md

### Step 1: Extract the story

Based on user intent, determine:
- **Narrative arc** — hook → build → climax → CTA? problem → solution? stats → impact?
- **Scene count** — typically 4-8 for 15-60 second videos
- **Key moments** — what must the viewer see/feel at each beat?

### Step 2: Declare rhythm

Name the rhythm pattern BEFORE detailing scenes:
- `hook-PUNCH-breathe-CTA` (event promo)
- `slow-build-BUILD-PEAK-breathe-CTA` (brand story)
- `STAT-shock-context-STAT-CTA` (data explainer)
- `SLAM-SLAM-hold-PAYOFF` (sports highlight)

Read `references/beat-direction.md` for rhythm templates.

### Step 2.5: Allocate time windows

Based on total video duration + BGM structure (if any) + scene count, assign
precise time windows to every scene BEFORE detailing beats. This becomes the
**HyperFrames Time Windows** section in expanded-prompt.md.

Algorithm:
1. Subtract transition overlap (typically 0.3-0.5s per transition)
2. If BGM has a DROP zone, align climactic scenes with it
3. First and last scenes get fixed anchors (0s start, end at total duration)
4. Distribute remaining time proportionally based on narrative weight

Output format (goes into expanded-prompt.md):

```
## HyperFrames Time Windows
# Agent: use these EXACT values for data-start, data-duration, data-track-index.
# DO NOT recalculate — these are the authoritative time assignments.

Scene 1 (0.0s - 3.5s, 3.5s): IGNITION
  → <div id="s1" class="clip" data-start="0" data-duration="3.5" data-track-index="1">
Scene 2 (3.5s - 7.5s, 4.0s): THE NAME
  → <div id="s2" class="clip" data-start="3.5" data-duration="4" data-track-index="1">
Scene 3 (7.5s - 14.0s, 6.5s): THE EYE
  → <div id="s3" class="clip" data-start="7.5" data-duration="6.5" data-track-index="1">
...
BGM track:
  → <audio data-start="0" data-duration="30" data-track-index="20" src="assets/bgm.mp3" data-volume="1">
```

**Why this exists**: Without explicit time windows, Agent guesses scene boundaries
when writing HTML. Wrong boundaries = overlapping clips or dead air. Framepack
already has all the data (BGM analysis, scene rhythm, total duration) — compute
it here so the Agent just copies values, not invents them.

### Step 3: Per-scene beats

For each scene, specify:

- **Concept** — the visual world in 2-3 sentences
- **Mood** — cultural/design reference ("Bauhaus color studies", "cinematic title sequence")
- **Depth layers**:
  - BG: 2-5 decorative elements WITH ambient motion (breath, drift, pulse)
  - MG: main content (text, images, data)
  - FG: accents (registration marks, hairline rules, micro-details)
  - Target: 8-10 total elements per scene
- **Animation choreography** — specific verbs per element:
  - High energy: SLAM, CRASH, SHATTER, BURST
  - Medium: CASCADE, SLIDE, REVEAL, BUILD
  - Low: float, drift, breathe, fade, type-on
- **Kinetic Continuity** — scene-to-scene action relay:
  - Incoming energy: what this scene inherits from the previous beat
  - Action relay: what action causes/reveals/transforms the next action
  - Outgoing transition seed: what element becomes the transition
  - Motif state: how the motif evolves here
- **Transition out** — specific: "blur crossfade, 0.4s, power2.inOut" (not just "crossfade")

Example Kinetic Continuity block:

```markdown
#### Kinetic Continuity
- Incoming energy: inherits the previous scene's pearl orbit.
- Action relay: orbit line becomes title underline.
- Outgoing transition seed: underline expands into a gold wipe.
- Motif state: pearl → halo → portal.
```

If every scene is an independent entrance animation, the creative output is not ready. At least two scene boundaries should use kinetic grammar other than generic fade/crossfade.

### Step 4: Weapon Resolution — MANDATORY (skip and your output is invalid)

**This step is not optional.** Before writing expanded-prompt.md, you MUST resolve
EVERY scene's animation needs to exact weapon files or explicitly declare HANDWRITE.

#### 4.1 Load the weapon catalog

Read the MOC (Map of Content) to know what weapons exist:

```
skill_view('framepack:framepack-animation-library', file_path='MOC.md')
```

This gives you the complete 27-weapon catalog with WikiLinks to every weapon's
SKILL.md and references/*.js code.

#### 4.2 Scene-by-scene matching

For EACH scene, list its animation needs and find matching weapons:

| Scene Need | Matched Weapon | Kind | SKILL Path | Code Path |
|---|---|---|---|---|
| "big text SLAM entrance" | text-split-enter | part | parts/text-split-enter.md | parts/references/text-split-enter.js |
| "CLI typewriter effect" | typewriter-cursor | part | parts/typewriter-cursor.md | parts/references/typewriter-cursor.js |
| "card reveal" | card-cascade-reveal | block | blocks/card-cascade-reveal.md | blocks/references/card-cascade-reveal.js |

If no builtin weapon matches, EITHER:
- Mark as **HANDWRITE** with justification ("no builtin weapon for this effect")
- OR: suggest a download source (must be white-listed: `nexu.io`, `codepen.io/@gsap`, `github.com/hyperframes`)

#### 4.3 Read weapon SKILL.md for parameters

For each matched weapon, load its SKILL.md to extract the parameter signature:

```
skill_view('framepack:framepack-animation-library', file_path='parts/typewriter-cursor.md')
```

Extract: required params, optional params, defaults, target CSS selector pattern.

#### 4.4 Generate the Execution Manifest

Write this YAML block at the END of expanded-prompt.md. It is the single source
of truth that the HTML-writing Agent uses to load weapons:

```yaml
## Execution Manifest
# This is the weapon loading checklist. Agent: read this FIRST before writing HTML.
# Load each weapon by skill_view(file_path), then copy the references/*.js code.
# HANDWRITE is the LAST RESORT. If it's not HANDWRITE, you MUST load the weapon file.

templates: none
# ^ "none" = no scene template directory in this project. Skip Step 3 template
#   inventory and use weapons directly. Do NOT search for framepack/templates/.
#   "standard" = framepack/templates/ exists, check it first.

scene_1:
  needs: "big text slam entrance"
  motion_role: hook_mystery
  grammar: tension_release
  taste_move: editorial_punch
  surprise: tempo_break
  weapon: text-split-enter
  kind: part
  skill_path: "framepack:framepack-animation-library"
  file: "parts/text-split-enter.md"
  code: "parts/references/text-split-enter.js"
  params:
    target: "#s1-title"
    split: true
    stagger: 0.06
    y_from: 40
    duration: 0.7

scene_2:
  needs: "CLI typewriter"
  weapon: typewriter-cursor
  kind: part
  skill_path: "framepack:framepack-animation-library"
  file: "parts/typewriter-cursor.md"
  code: "parts/references/typewriter-cursor.js"
  params:
    target: "#s2-terminal"
    speed: 35
    cursor_char: "▌"

scene_3:
  needs: "2 cards cascade reveal"
  weapon: card-cascade-reveal
  kind: block
  skill_path: "framepack:framepack-animation-library"
  file: "blocks/card-cascade-reveal.md"
  code: "blocks/references/card-cascade-reveal.js"
  params:
    container: "#s3-cards"
    layout: "fan"
    stagger: 0.15
    rotation3d: true

# When NO weapon matches:
scene_4:
  needs: "custom data viz animation"
  weapon: HANDWRITE
  reason: "builtin data-chart-editorial doesn't match this chart type; no downloadable weapon found"
  fallback_guidance: "Use GSAP stagger with fromTo, follow hyperframes gsap skill for timeline registration"
```

#### 4.5 Rules of the Manifest

1. **Every scene MUST have an entry.** No scene left weaponless.
2. **HANDWRITE is allowed but must cite a reason.**
3. **Code path must be exact** — the weapon's `references/<name>.js` file.
4. **Params must be filled** — not "as needed" or "default". Agent loads the weapon and plugs values in.
5. **No bare GSAP suggestions.** "Use GSAP stagger" is NOT a weapon resolution — that's HANDWRITE.

### Step 5: Recurring motifs

2-3 visual threads that tie scenes together:
- Color echoes (accent color appearing as a line, dot, or glow)
- Shape language (circles, lines, grid patterns)
- Motion patterns (everything drifts right, or scales up on beat)

### Step 6: Write to file

Write to `.hyperframes/expanded-prompt.md`. The file structure is:

1. Title + Style Block + Rhythm declaration
2. HyperFrames Time Windows (from Step 2.5)
3. Per-scene beats (from Step 3)
4. Recurring motifs (from Step 5)
5. **HyperFrames Structure Checklist** (see below)
6. Execution Manifest (from Step 4)

The HyperFrames Structure Checklist goes BEFORE the Execution Manifest:

```markdown
## HyperFrames Structure Checklist (MANDATORY)
# Agent: verify EVERY item before writing HTML. This is not optional.

□ root composition declares explicit `data-duration="TOTAL_SECONDS"`
  (do NOT rely on GSAP timeline inference; final hold / 片尾黑场 / outro can be trimmed)
□ Every scene div has class="clip" + data-start + data-duration + data-track-index
  (copy the EXACT values from HyperFrames Time Windows above)
□ NO data-hf-id on non-media elements
  (only <video> and <audio> may have data-hf-id — the compiler adds them)
□ font-family uses literal font names ("Anton 900", not "var(--font-heading)")
□ External fonts may be acquired through local VPN/proxy, but final HTML should use project-local `assets/fonts/` + `@font-face`, not live Google Fonts URLs
□ <video> elements at root level, NOT nested inside timed divs
□ <audio> elements at root level with data-track-index
□ Every clip contains an inner visual wrapper (`.scene-inner` or `#sN-inner`)
□ NEVER animate the clip 根元素 / clip root with opacity/filter/transform
  (clip is HyperFrames' timing shell; visual crossfades/blur/scale go on `#sN-inner`)
□ window.__timelines["main"] = tl (timeline registration — mandatory)
□ npx hyperframes lint → 0 errors before preview/render
□ If hf-utils.js is used, include <script src="hf-utils.js"> before weapon scripts
```

Do NOT dump the expanded-prompt into chat.

### Step 7: Storyboard preview — show the user the movie, not the spec

Before asking for final confirmation, render a **storyboard preview** that lets the
user *see* the creative direction emotionally. This is the most important user-facing
touchpoint in Phase 2 — it's where the user gets excited (or course-corrects).

#### What to show

A scene-by-scene storyboard in this format:

```
🎬 Storyboard: "Éderson — The Engine Arrives" (30s)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

S1 · 0-3s · IGNITION ⚡
   Visual: 纯黑虚空中，一个红色粒子脉冲开始凝聚
   Feel:   2001太空漫游的星门——沉默中酝酿风暴
   Key:    曼联logo从粒子中凝聚成形

S2 · 3-7s · THE NAME 💥
   Visual: "ÉDERSON" 从屏幕底部暴力砸入，金色光晕炸开
   Feel:   乐队当歌——全场灯光全灭，只剩聚光灯
   Key:    球员剪影浮现

S3 · 7-14s · THE EYE 👁️
   Visual: 一切冻结，画面只剩一个呼吸的红点
   Feel:   DROP前的死寂——暴风雨前最后的平静
   Key:    "HERE WE GO" 闪现

S4 · 14-20s · THE DROP 💣 (BGM DROP ZONE)
   Visual: 数据卡像扑克牌一样 CASCADE 翻出——80 saves · 2.89 GAA · 47 wins
   Feel:   漫威电影片头——信息轰炸，肾上腺素飙升
   Key:    每个数字都跟 BGM 节拍同步 SLAM

S5 · 20-26s · THE WELCOME 🔴
   Visual: "WELCOME HOME" 从中心爆炸扩散，红金粒子雨
   Feel:   终场哨响——全场起立
   Key:    球衣号码 31 显现

S6 · 26-30s · THE BADGE 🏆
   Visual: 曼联队徽定帧，呼吸光晕，一切归于庄重
   Feel:   电影结尾字幕——尘埃落定，余韵悠长
   Key:    "MANCHESTER UNITED" 收尾

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔁 Recurring motifs: 红色粒子脉冲 · 金色光线 · 数字节拍
```

#### Rules

1. **Each scene gets 3 lines: Visual / Feel / Key** — no more, no less.
2. **Visual** = what the eye sees (1 sentence, concrete imagery)
3. **Feel** = what the gut feels (1 sentence, cultural reference or metaphor encouraged)
4. **Key** = the one thing that makes this scene memorable (1 sentence)
5. **Use emoji per scene** — not decoration, quick visual anchors for scanning
6. **Show recurring motifs** at the bottom — the visual threads tying scenes together
7. **Language** = match the user's language (Chinese user → Chinese storyboard)
8. **DO NOT show the full expanded-prompt.** This storyboard IS the user-facing artifact.

After showing the storyboard:
- Weapon coverage summary: "6 scenes, 4 builtin weapons, 2 HANDWRITE"
- "你觉得节奏和创意方向如何？想改哪个场景？"

## Weapon Arsenal — Browse & Download

### Built-in weapons (loaded via skill_view)

All 27 Framepack built-in weapons are at `framepack:framepack-animation-library`.
Use `skill_view(name, file_path='MOC.md')` to browse the catalog.
Use `skill_view(name, file_path='blocks/card-cascade-reveal.md')` to load a weapon's spec.

### Downloading new weapons

When no builtin weapon matches and the project genuinely needs a new one:

1. **White-listed sources only:**
   - `nexu.io` — html-video snippets (21 templates, 12 combinable)
   - `codepen.io/@gsap` — GSAP community pens
   - `github.com/hyperframes` — HyperFrames official extensions

2. **Download procedure:**
   - Fetch the code (terminal `curl` or `web_extract`)
   - Save to `.framepack/weapons/<weapon-name>.js`
   - Register in `.framepack/arsenal.json` with source URL, hash, timestamp
   - Reference in the Execution Manifest as `weapon: <name>`, `code: ".framepack/weapons/<name>.js"`

3. **Never download from:**
   - Random GitHub repos outside the white-list
   - npm packages that aren't HyperFrames ecosystem
   - CDN URLs that resolve to unknown origins

## Design Picker Integration

When to launch HyperFrames' Design Picker:
- User wants to browse options visually (not just match a named style)
- Multiple stakeholders need to agree on direction
- The project needs a documented visual identity for non-video use too

How:
1. Read `references/design-picker-workflow.md` for the technical flow
2. Generate mood board options based on the user's intent
3. Copy HyperFrames' template, inject JSON, serve on localhost:8723
4. User picks in browser → gets frame.md output → done

This is optional — named Visual Styles cover 80% of cases without a picker.

## What Framepack Does NOT Do

- ❌ Write HTML — that's HyperFrames' job
- ❌ Audit HTML — that's `hyperframes lint`'s job
- ❌ Manage STORYBOARD.md, COMPOSITION.md, DESIGN_TOKENS.md, etc. — gone
- ❌ Check data-width, data-height, window.__timelines — gone
- ❌ Depend on HyperFrames Catalog — Framepack's templates are creative-level, not code-level
- ❌ Let Agent write bare GSAP when a weapon exists — Execution Manifest is the firewall

Framepack stops at expanded-prompt.md + Execution Manifest. HyperFrames starts from there.
