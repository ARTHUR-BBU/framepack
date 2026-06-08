---
name: framepack-reference-miner
description: >
  Reference video reverse-engineering — extract reusable DNA (rhythm, scene roles,
  visual grammar, motion grammar, asset requirements, reusable slots, HyperFrames
  constraints) and produce VIDEO_DNA.md + TEMPLATE_BLUEPRINT.md. 参考视频反推：
  提取节奏、场景角色、视觉语法、运动语法、资产需求、可复用槽位、HyperFrames 约束，
  产出结构化 DNA 和模板蓝图。
triggers:
  - User mentions a reference video ("like this ad", "类似这个片子")
  - User pastes a video URL
  - Agent writes VIDEO_DNA.md or TEMPLATE_BLUEPRINT.md
---

# Reference Video Miner

Don't copy the reference — dissect it. Extract the skeleton, not the skin.

## Core Principle

A reference video is a **structural artifact**, not a creative template. Your job is to reverse-engineer it into two documents:

| Document | Purpose | Audience |
|---|---|---|
| `VIDEO_DNA.md` | Abstract structural analysis | Agent + future projects |
| `TEMPLATE_BLUEPRINT.md` | Concrete, copyable implementation plan | Agent + builder |

## The 7 Dimensions of Video DNA

Extract ALL of these. Missing any one produces incomplete DNA:

### 1. Rhythm

The heartbeat of the video. Time-based structure.

```
- Total duration (seconds)
- Scene count
- Scene duration range (min–max)
- Average scene duration
- Transition tempo: fast cut (<0.5s) / standard (0.5–1.5s) / slow dissolve (>1.5s)
- Pacing curve: linear / accelerating / decelerating / wave (speed up then slow down)
- Beat markers: any recurring time-signature pattern (e.g., "every 2nd beat = new text")
```

### 2. Scene Roles

Each scene has a JOB. Name it.

```
Scene N: [Role Name] — [duration]s
  Purpose: what this scene does for the narrative
  Content: what's on screen
  Transition in: cut / fade / slide / zoom / wipe
  Transition out: cut / fade / slide / zoom / wipe
  Emotional beat: tension / release / curiosity / urgency / calm
```

Common role names: Hook, Problem Statement, Build-up, Reveal, Feature Demo, Social Proof, Countdown, CTA, Logo Lockup.

### 3. Visual Grammar

The language of the frame.

```
- Aspect ratio: 16:9 / 9:16 / 1:1
- Color palette: dominant (2-3) + accent (1-2) with hex codes
- Typography: font family, weight hierarchy (headline/body/caption), sizes
- Composition rule: center-framed / rule-of-thirds / split-screen / Z-pattern
- Depth: flat 2D / layered parallax / 3D
- Lighting: bright & clean / moody & dark / high-contrast / natural
- Background style: solid / gradient / blurred photo / animated pattern / video
```

### 4. Motion Grammar

How things move. GSAP is our native tongue.

```
- Entrance patterns: fade-in / slide-from-left / scale-up / staggered reveal
- Exit patterns: fade-out / slide-out / scale-down
- Emphasis: pulse / glow / shake / color-flash / outline-draw
- Easing personality: power2.out (smooth decel) / elastic.out (bouncy) / expo.inOut (dramatic)
- Camera motion: static / slow zoom (Ken Burns) / pan / tracking
- Text animation: typewriter / char-by-char / word-by-word / line-slide / kinetic (per-word motion)
- Data/chart animation: draw-path / count-up / bar-grow
```

### 5. Asset Requirements

What raw materials the video needs.

```
- Video clips: count, resolution, source type (stock / screen-record / custom shoot)
- Images: count, subject type (product / people / abstract), minimum resolution
- Text assets: headline count, CTA text, subtitle needs
- Audio: BPM, genre keywords, duration required
- Logo/branding: logo variants needed, color specs
- Fonts: licensed or free, fallback
```

### 6. Reusable Slots

Patterns that can be extracted and reused across projects.

```
Slot Name: [descriptive name]
  Type: scene-template / animation-snippet / layout-pattern / timing-rule
  Description: what this slot does, in one sentence
  Parameters: what changes per project (text, colors, images, timing)
  GSAP Recipe: which animation pattern from framepack-gsap Skill applies
```

The goal: next time someone says "make it feel like that Nike ad," you pull the Slots, not the whole video.

### 7. HyperFrames Constraints

Pre-render safety check. Every DNA must declare constraints.

```
- P0 (WILL BREAK render): list any patterns that violate HyperFrames deterministic rules
  → NO ScrollTrigger, NO Math.random(), NO repeat: -1, NO unregistered timelines
- P1 (SEVERE warning): problematic but renderable
  → unregistered window.__timelines, missing meta.json, unmanaged <video> in timed containers
- P2 (style concern): visual inconsistency risks
  → mixed aspect ratios, color bleeding across scenes
```

## VIDEO_DNA.md Template

```markdown
# Video DNA: [Reference Name]

> Source: [URL or file path]
> Mined: [date]
> Duration: [total seconds]
> Scene count: [N]
> Format: [aspect ratio]

## Rhythm

[Copy the 7 rhythm fields from the dimension guide above]

## Scene Roles

[One subsection per scene, using the Role template]

## Visual Grammar

[Copy the visual grammar fields]

## Motion Grammar

[Copy the motion grammar fields]

## Asset Requirements

[Copy the asset requirements fields]

## Reusable Slots

[At least 3 slots. More is better.]

## HyperFrames Constraints

[P0 / P1 / P2 declarations]
```

## TEMPLATE_BLUEPRINT.md Template

```markdown
# Template Blueprint: [Name]

> Derived from VIDEO_DNA: [link]
> Target format: [aspect ratio]
> Weapon dependencies: [arsenal weapon IDs]

## Scene Sequence

| # | Role | Duration | Template File | Key Animation |
|---|------|----------|---------------|---------------|
| 1 | Hook | 2s | blocks/scene-01.html | fade-in stagger |
| ... | ... | ... | ... | ... |

## GSAP Recipe Map

| Scene | Weapon ID | GSAP Technique | Key Config |
|-------|-----------|----------------|------------|
| 1 | motion.bento-reveal | `tl.from(items, {opacity:0, y:30, stagger:0.12})` | stagger=0.12, ease:power2.out |

## Asset Checklist (per scene)

[What each scene needs: images, text, colors, data]

## Render Checklist

- [ ] All scenes have data-width, data-height, data-start
- [ ] All timelines registered on window.__timelines
- [ ] meta.json matches scene count and format
- [ ] No Math.random(), repeat: -1, or ScrollTrigger
- [ ] First scene visible in CSS
```

## Mining Process (for the Agent)

When the user provides a reference video:

1. **Watch it** (or analyze frame descriptions if video isn't directly viewable)
2. **Time-mark it**: note timestamps for every scene transition
3. **Label scenes**: give each scene a Role name
4. **Extract dimensions**: fill in all 7 dimensions
5. **Write VIDEO_DNA.md**: use the template above
6. **Derive TEMPLATE_BLUEPRINT.md**: translate DNA into actionable build plan
7. **Save to arsenal** (optional): `framepack arsenal save --name <ref-name>-dna`

## Common Pitfalls

- **Copying aesthetics instead of structure** — don't reproduce colors/fonts, reproduce the WHY behind them
- **Skipping rhythm** — pacing is 50% of the feel. Always time-mark.
- **Vague slot names** — "Cool transition" is useless. "Scale-up-reveal-with-blur-bg" is a recipe.
- **No HyperFrames translation** — a DNA without constraint declarations is a render time-bomb
- **Too few slots** — if you can't find at least 3 reusable patterns, watch again
