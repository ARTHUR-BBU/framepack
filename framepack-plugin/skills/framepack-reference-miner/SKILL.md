---
name: framepack-reference-miner
description: >-
  Reference video reverse-engineering v0.10 — Scripted/Adaptive scene detection + motion
  analysis + color extraction + audio beat sync + vision-based content decomposition.
  Produces quantified Creative DNA Report (VIDEO_DNA.md + TEMPLATE_BLUEPRINT.md).
  Replaces manual "watch and guess" with script-driven pipeline.
triggers:
  - User shares a reference video ("类似这个片子", "分析这个视频的风格")
  - User asks "can we clone this?" or "reverse-engineer this ad"
  - User provides a video file for creative DNA extraction
version: 0.19.0
---

# Reference Video Miner v0.19.0

Don't copy — dissect. Extract the skeleton, not the skin.

## Pipeline Overview

### Two operating modes

**Inspiration Mode** — use the reference video for style DNA. Output `VIDEO_DNA.md`, then feed Framepack's normal `frame.md` + `.hyperframes/expanded-prompt.md` creative path.

**Scripted Mode** — preferred when the packaged five-script pack is available. The scripts are standard measuring instruments: they produce reproducible JSON for benchmark runs, formal copy tasks, and multi-agent handoff. Load them via linked files, e.g. `skill_view(name='framepack:framepack-reference-miner', file_path='scripts/scene-detect.py')`; do not search `$HOME/.hermes` or hard-code profile paths.

**Adaptive Mode** — allowed when scripts are missing or unavailable. Missing scripts are not a hard blocker. A strong model may build an inline `ffmpeg + Python` pipeline, but it MUST write a reproducibility block into `reference-analysis.md` / `VIDEO_DNA.md` with:

- ffmpeg commands used
- Python snippets or generated script paths
- scene threshold
- frame sampling rate
- audio analysis method
- assumptions and known weak spots

**Replica Mode** — reverse-engineer the reference as a code-replication target. Before writing HTML, produce all three deliverables:

1. `VIDEO_DNA.md` — overall rhythm, motion, color, layout, audio, and transition DNA.
2. `.hermes/content_decomposition.md` — per-scene visual decomposition with BG/MG/FG, zones, text, UI, and layout notes.
3. `TEMPLATE_BLUEPRINT.md` — the source of truth for HyperFrames code replication: scene count, exact timing, root `data-duration`, DOM structure, visual layers, animation targets, and known exceptions.

In Replica Mode, HTML must be implemented from `TEMPLATE_BLUEPRINT.md`, not from freeform imagination. Treat the blueprint like a construction drawing, not a mood board.

**Replica ambiguity ban:** do not leave conditional implementation language in handoff docs. Banned unless rewritten as an explicit decision or approved exception:

- `if strict`
- `maybe`
- `optionally`
- `merge if needed`
- `no outgoing transition`

Allowed forms:

- `Density approved exception: intentional two-frame percussion insert, not a normal 8–10 element scene.`
- `Transition: final black hold to end, 0.000s, power2.in; end state pure #000000.`
- `Locked elements: total 10.`

**Replica visual QA loop (mandatory before final render):**

1. Create a snapshot contact sheet across all scenes.
2. Write a visual issue list with scene IDs and exact layout/contrast/overlap problems.
3. Apply targeted CSS/layout fixes only.
4. Capture a second snapshot for risky scenes before render.
5. After any snapshot workflow, clean source `index.html` and verify `data-hf-id count = 0`.
6. Treat `timeline_track_too_dense`, `overlapping_gsap_tweens`, and `gsap_studio_edit_blocked` as P2 engineering warnings: non-blocking for draft render, but required cleanup before Studio-editable/final distribution work.
7. Treat contrast warnings as P3 polish unless readability is visibly broken.

```
Phase 0: Automated Extraction (scripts, no agent LLM)
  scene-detect.py    → scene boundaries + transition types
  motion-analyze.py  → per-scene motion energy + direction
  color-extract.py   → per-scene dominant palette + shifts
  audio-analyze.py   → BPM + beat timestamps + energy envelope
  content-decompose.py → key frame extraction + analysis guide
    ↓
Phase 1: Vision Analysis (agent + vision_analyze)
  Per-scene content layout decomposition
  Recurring element identification
  Layout pattern classification
    ↓
Phase 2: DNA Report (agent synthesizes)
  VIDEO_DNA.md       → quantitative + qualitative creative DNA
  TEMPLATE_BLUEPRINT.md → actionable build plan
```

## Phase 0: Automated Extraction

### Step 0.1: Scene Detection

```bash
python scripts/scene-detect.py <video_path> [threshold]
```

Output: `scenes.json` with:
- `video`: path, duration, resolution, fps
- `scenes[]`: index, start, end, duration, transition_in, transition_out
- Detected cuts and fades

Adjust threshold: 0.25 for subtle cuts, 0.40 for confident-only, 0.35 default.

Save the output to `.hermes/scenes.json` for subsequent steps.

### Step 0.2: Motion Analysis

```bash
python scripts/motion-analyze.py <video_path> .hermes/scenes.json
```

Output: per-scene motion profile with:
- `energy_score` (0-100): how much visual change
- `motion_type`: static / subtle_drift / moderate / active / intense / chaotic
- `direction`: steady / accelerating / decelerating / pulsing
- `peak_energy` + `energy_variance`

Save to `.hermes/motion.json`.

### Step 0.3: Color Extraction

```bash
python scripts/color-extract.py <video_path> .hermes/scenes.json
```

Output: per-scene palette with:
- Dominant colors (hex + percentage + role: background/accent/secondary/detail)
- Palette shifts between consecutive scenes

Save to `.hermes/colors.json`.

### Step 0.4: Audio Analysis

```bash
python scripts/audio-analyze.py <video_path> .hermes/scenes.json
```

Output:
- BPM detected
- Beat timestamps (first 20)
- Energy envelope over time
- Per-scene beat density + energy curve (rising/falling/peaked/flat)

If the video has no audio stream, the script reports `has_audio: false`.

Save to `.hermes/audio.json`.

### Step 0.5: Content Frame Extraction

```bash
python scripts/content-decompose.py <video_path> .hermes/scenes.json .hermes/miner_frames/
```

Output:
- Per-scene key frames (start/middle/end)
- Scene strips (3-frame horizontal composites)
- Overview contact sheet (first frame of each scene)
- `analysis_prompt` — structured questions for vision analysis

## Phase 1: Vision Analysis

### Step 1.1: Overview Analysis

Load the overview contact sheet with `vision_analyze`:

> "This is a contact sheet showing the first frame of each of N scenes from a reference video.
> For each frame, describe in ONE sentence: what's the dominant visual content and mood?
> Identify the overall structure: what pattern do you see across these frames?
> Does it follow a classic arc (hook→build→climax→CTA) or something else?"

### Step 1.2: Per-Scene Content Decomposition

For each scene (or for the 3-5 most important scenes), load the scene strip and analyze:

> "This is a 3-frame strip from Scene N (start→middle→end). Decompose the LAYOUT:
>
> **Zone analysis:**
> - UPPER THIRD: what occupies this zone? (headline text / logo / empty / image / navigation)
> - MIDDLE: what's the primary content? (product / person / chart / text body / video)
> - LOWER THIRD: what's here? (CTA button / caption / timestamp / logo / social proof / empty)
>
> **Layer stack:**
> - BACKGROUND: solid color / gradient / blurred photo / video / pattern / dark / light
> - MIDGROUND: main content elements
> - FOREGROUND: overlays (scan lines, grain, light leaks, border, vignette, UI chrome)
>
> **Animation at this scene?**
> - Is anything visibly mid-animation in these frames? (text entering, element scaling, colors shifting)
> - What's the lighting/mood: bright & clean / dark & moody / natural / high-contrast?"

Save findings to `.hermes/content_decomposition.md`.

### Step 1.3: Recurring Element Analysis

After analyzing all scenes, identify:

- **Same position elements**: text always in upper third? CTA always lower right?
- **Persistent elements**: logo present in every scene? same background color family?
- **Progressive elements**: does text build up? do stats accumulate?
- **Contrast elements**: what deliberately CHANGES between scenes?

## Phase 2: DNA Report Synthesis

Synthesize all data (Phase 0 scripts + Phase 1 vision) into two documents.

### VIDEO_DNA.md

```markdown
# Video DNA: [Reference Name]

> Source: [path]
> Mined: [date]
> Duration: Xs | Scenes: N | Format: W×H @ Ffps
> Audio: yes/no | BPM: N | Beats: N

## Scene Map

| # | Start | End | Dur | Motion | Energy | Palette | Audio Beat | Transition |
|---|-------|-----|-----|--------|--------|---------|------------|------------|
| 1 | 0.0 | 2.3 | 2.3 | subtle | 12 | bg:#1a1a2e | 3 beats | → cut |
| 2 | 2.3 | 5.1 | 2.8 | active | 45 | bg:#0d0d1a | 5 beats | → fade |

## Motion DNA

- Overall energy curve: [description from motion.json]
- Peak energy scene: Scene N (energy: XX)
- Motion patterns: [static open → accelerating build → chaotic climax → decelerating close]

## Color DNA

- Global palette: [dominant colors across all scenes]
- Palette shifts: [major/minor between which scenes]
- Color role mapping: bg=always dark, accent=gold appears in scenes 1,3,5

## Layout DNA (from content decomposition)

- Zone convention: upper=text, middle=product, lower=CTA
- Layer strategy: solid bg + centered content + border vignette
- Recurring elements: [list]
- Layout pattern: [minimal / split-screen / magazine / terminal / phone-frame]

## Audio DNA

- BPM: N | Beat count: N
- Beat-to-visual sync: [are scene transitions on beats? are visual pulses on beats?]
- Energy curve: [description]

## Animation DNA (from motion analysis + vision)

- Entrance patterns: [fade-in stagger / slide-from-left / scale-up / etc.]
- Emphasis patterns: [pulse on beat / glow on climax / shake on shock stat]
- Easing personality: [smooth decel / bouncy elastic / dramatic expo]
- Camera behavior: [static / slow zoom / pan / mixed]

## Asset Requirements

- Video clips: [count, resolution, type]
- Text assets: [headlines, CTA, captions]
- Audio: [BPM range, genre keywords]
- Branding: [logo, colors, fonts]

## Reusable Slots

At least 3 reusable patterns extracted:

| Slot | Type | Description | Parameters |
|------|------|-------------|------------|
| [name] | scene-template / animation-snippet / layout-pattern | what it does | what changes |

## HyperFrames Constraints

- P0 (WILL BREAK): [any patterns violating deterministic rules]
- P1 (WARNING): [problematic but renderable]
- P2 (STYLE): [visual inconsistency risks]
```

### TEMPLATE_BLUEPRINT.md

```markdown
# Template Blueprint: [Name]

> Derived from VIDEO_DNA: [link]
> Target format: W×H
> Weapon dependencies: [arsenal weapon IDs]

## Scene Sequence

| # | Role | Dur | Key Visual | Animation |
|---|------|-----|------------|-----------|
| 1 | Hook | 2.3s | Logo + tagline | fade-in stagger |
| ... | ... | ... | ... | ... |

## GSAP Recipe Map

| Scene | Weapon ID | Technique | Config |
|-------|-----------|-----------|--------|
| 1 | motion.bento-reveal | stagger.from | stagger:0.12, ease:power2.out |

## Asset Checklist

Per-scene: images, text strings, colors, fonts needed.

## Render Checklist

- [ ] data-width/data-height/data-start on all clips
- [ ] window.__timelines registered with composition-id as key
- [ ] No Math.random(), repeat:-1, ScrollTrigger
- [ ] First scene visible, transitions handle all scene changes
```

## Script Reference

All scripts are in `scripts/` relative to this skill:

| Script | Input | Output | Time (60s video) |
|--------|-------|--------|------------------|
| `scene-detect.py` | video_path, threshold | scenes.json | ~10s |
| `motion-analyze.py` | video_path, scenes.json | motion.json | ~30s |
| `color-extract.py` | video_path, scenes.json | colors.json | ~15s |
| `audio-analyze.py` | video_path, scenes.json | audio.json | ~20s |
| `content-decompose.py` | video_path, scenes.json, out_dir | key frames + strips | ~15s |

Total Phase 0: ~1.5 min for a 60s video.

## Pitfalls

- **No audio track**: audio-analyze.py reports `has_audio: false` — skip audio DNA section
- **Single scene video**: scene-detect.py returns 1 scene — still run other scripts, they'll analyze the whole video as one scene
- **Very short video (<3s)**: skip motion analysis (not enough samples), reduce color samples to 1
- **Dark/low-contrast video**: scene-detect threshold may need lowering to 0.25
- **HEVC/H.265**: ffmpeg may need additional flags; the scripts use `-v quiet` to suppress noise
- **Vision API 503**: if vision_analyze fails on individual scene strips, fall back to overview contact sheet only

## Comparison: Before vs After

| Dimension | v0.8 (manual) | v0.9 (automated) |
|-----------|--------------|-------------------|
| Scene detection | "Watch it, time-mark it" | ffmpeg scene filter → precise timestamps |
| Motion analysis | "Describe how things move" | Frame-differencing → energy score + direction |
| Color palette | "What colors?" (vision guess) | Per-frame k-means → hex values with roles |
| Audio | Not analyzed | BPM + beats + energy envelope |
| Content layout | Agent guesses from memory | Structured zone-by-zone decomposition |
| Fade detection | Human eye | Brightness sampling → fade-to/from-black |
| Transition classification | "It's a cut I think" | Auto-classified: cut / fade-to-black / fade-from-black |
