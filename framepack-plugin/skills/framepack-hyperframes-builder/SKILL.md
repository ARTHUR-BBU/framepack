---
name: framepack-hyperframes-builder
description: >-
  HyperFrames HTML/JS build rules, composition structure, and render safety
  checks. Hard constraints that WILL cause broken renders if violated.
  Includes video-composition rules, motion principles, HyperShader usage,
  and frame.md token injection. Validates index.html against the HyperFrames
  runtime contract.
version: 0.7.12
platforms: ["linux", "macos", "windows"]
metadata:
  hermes:
    tags: ["video", "framepack", "hyperframes", "html", "render", "frame-md", "composition"]
    category: creative
---

# Framepack HyperFrames Builder

You are the HyperFrames build validator and composition architect. When the
agent writes an index.html for a Framepack workbench, you:

1. **Enforce the HyperFrames runtime contract** — violations WILL break renders
2. **Apply video-composition rules** — video is not web, different physics
3. **Inject frame.md tokens** — brand consistency from design spec to pixels
4. **Validate motion principles** — choreography, not random animation

---

## Part 1: Hard Constraints (FAIL if violated)

### Scene Visibility
- **First scene MUST be visible in CSS** — no `display: none`, no hidden parent
- Blank first frame = blank render

### Data Attributes
- Every scene container: `data-width`, `data-height`, `data-start`
- Root container: `data-composition-id`, `class="clip"`, `data-start="0"`
- Missing attributes = invisible or unscheduled scenes

### meta.json
- MUST exist alongside `index.html`
- Defines scene durations and project metadata

### Timeline Contract
- ALL GSAP/anime.js timelines registered on `window.__timelines`
- Pattern: `window.__timelines.push(tl)` or `window.__timelines["name"] = tl`
- Unregistered = invisible to scheduler

### Render-Safe Timelines (MUST NOT exist)
- `Math.random()` — non-deterministic
- `Date.now()` — non-deterministic
- `repeat: -1` — infinite loops
- `ScrollTrigger` — no scrollbar in render
- `FLIP` animations — viewport-dependent
- `currentTime =` / `.play()` / `.pause()` — imperative media control breaks seeking
- Need pseudo-random? Use seeded PRNG (mulberry32)

### Element Placement
- `<video>` elements at ROOT level, not inside timed scene containers
- Animation targets inside their scene container

---

## Part 2: Video Is Not Web — Composition Rules

### Scale Table

Everything scales up from web sizes. Web sizes are invisible on video.

| Element | Web | Video |
|---------|-----|-------|
| Headlines | 32-48px | **64-120px** |
| Body text | 14-16px | **28-42px** |
| Labels | 12px | **18-24px** |
| Decorative opacity | 3-8% | **12-25%** |
| Borders | 1px | **2-4px** |
| Padding | 16-32px | **60-140px** |

If font-size < 24px in a video, justify it. If decorative opacity < 10%, it's invisible.

### Density Law

Every scene needs **8-10 visual elements** across three layers:

- **BG (Background):** 2-5 decoratives with ambient motion. Never solid flat color.
  Radial glows, ghost type, grid lines, grain, thematic patterns.
  All decoratives MUST have slow ambient GSAP animation — static = dead.

- **MG (Midground):** The actual content. Cards, stats, code, images, headlines.

- **FG (Foreground):** Accents, dividers, labels, data bars, registration marks,
  monospace metadata. The details that make it feel produced.

### Color Presence

- Muted is fine. Flat is not. Every scene needs at least one color that pulls the eye.
- Accent at 15-25% for atmospheric, full saturation for focal elements.
- Light canvases need texture (grain, patterns) to avoid "blank slide" feel.
- Tint neutrals toward brand hue. Dead gray = undesigned.

### Frame Composition

- **Two focal points minimum.** The eye needs somewhere to travel.
- **Fill the frame.** Hero text: 60-80% of frame width.
- **Anchor to edges.** Pin content to left/top or right/bottom. Centered-floating is web.
- **Split frames.** Data panel left, content right. Zone-based > centered stacks.
- **Structural elements.** Rules, dividers, border panels. Animate well (`scaleX: 0→1`).

---

## Part 3: Motion Principles

### Easing Is Emotion

The motion is the verb. The easing is the adverb.

- `.out` for entrances — starts fast, decelerates. Responsive.
- `.in` for exits — starts slow, accelerates away. Momentum.
- `.inOut` for positional moves — neither entering nor leaving.

Ease-in on entrance = sluggish. Ease-out on exit = reluctant. Check your work.

### Speed = Weight

| Duration | Feeling |
|----------|---------|
| 0.15-0.3s | Quick, percussive, kinetic |
| 0.3-0.5s | Comfortable, professional |
| 0.5-0.8s | Deliberate, weighty |
| 0.8s+ | Atmospheric, part of the scene |

Mix them within a scene. Uniform speed = monoculture.

### Scene Structure: Build → Breathe → Resolve

- **Build (0-30%):** Elements enter, staggered. Not all at once.
- **Breathe (30-70%):** Content visible, alive with ambient motion. Viewer settles.
- **Resolve (70-100%):** Exit or decisive end. Exits faster than entrances.

All-build = slideshow. No-breathe = content doesn't land.

### Anti-Monoculture Defaults

These LLM defaults produce identical-looking scenes — vary them deliberately:

- Same ease on every tween → vary eases like font weights
- Same speed (0.4-0.5s) → slowest should be ~3x slower than fastest
- Same entrance direction (y:30, opacity:0) → use left/right/scale/blur/letter-spacing
- Same stagger across scenes → each scene needs its own rhythm
- Ambient zoom on every scene → try pan, rotation, color shift, or stillness
- First animation at t=0 → offset 0.1-0.3s for "composed" feel

### Asymmetry

Entrances take longer than exits. 0.4s in, 0.25s out. Build presence vs remove it.

---

## Part 4: HyperShader — Scene Transitions

HyperShader manages scene visibility and transitions. Let it create the timeline.

```js
var tl = HyperShader.init({
  bgColor: "#0a0a0f",
  scenes: ["s1", "s2", "s3", "s4"],
  transitions: [
    { time: 4.0, shader: "sdf-iris", duration: 0.7 },       // WebGL shader
    { time: 8.5, duration: 0.8 },                             // no shader → CSS crossfade
    { time: 13.0, shader: "domain-warp", duration: 0.6 },     // WebGL shader
  ],
});
// Add beat animations AFTER init()
tl.fromTo("#hero", { opacity: 0 }, { opacity: 1, duration: 0.6 }, 0.2);
window.__timelines["main"] = tl;
```

### When to Use Which Transition

| Type | When |
|------|------|
| **Shader** | Reveals, hero moments, energy shifts, "wow" beats, music punctuates |
| **CSS crossfade** | Connective tissue, continuous camera-motion, editorial pacing |
| **Hard cut** | Rapid-fire lists, percussive edits, comedic timing |

Rule: 5-7 scene composition wants 1-2 shader transitions (hero + CTA).
Too many shaders flatten impact.

### Available Shaders

cinematic-zoom, sdf-iris, cross-warp-morph, glitch, whip-pan,
ridged-burn, gravitational-lens, domain-warp, thermal-distortion,
swirl-vortex, ripple-waves

---

## Part 5: frame.md Token Injection

When a frame.md or design.md exists, inject its tokens into the HTML:

```
frame.md token              → HTML/CSS/GSAP injection point
─────────────────────────────────────────────────────────────
colors.primary              → CSS var --color-primary
colors.accent               → CSS var --color-accent
typography.headline         → font-family / font-size / font-weight
motion.easing.entry         → gsap.from(..., { ease: "expo.out" })
motion.duration.entrance    → gsap.from(..., { duration: 0.4 })
motion.atmosphere           → decorative element selection
motion.transition           → HyperShader transition type
motion.energy               → global animation intensity multiplier
```

**Never hardcode frame.md values.** They're pipeline variables. Swap one
frame.md and the entire visual changes, code untouched.

---

## Part 6: Severity Levels

| Level | Meaning | Action |
|-------|---------|--------|
| P0 | Render WILL fail (blank output) | MUST fix before build |
| P1 | Render MAY fail (unpredictable) | Fix before build |
| P2 | Best practice violation | Fix when convenient |

## Check Catalog

| Check | Pattern | Severity |
|-------|---------|----------|
| first-scene-visible | Scene 1 CSS check | P0 |
| data-attributes | data-width/height/start on scenes | P0 |
| root-container-attrs | data-composition-id / class="clip" on root | P0 |
| video-in-timed-container | `<video>` inside data-start containers | P0 |
| no-imperative-media | currentTime / .play() / .pause() | P0 |
| meta-json | meta.json file exists | P1 |
| timelines-registered | window.__timelines in JS | P1 |
| no-math-random | Math.random() in script | P1 |
| no-repeat-infinite | repeat: -1 in script | P1 |
| no-scrolltrigger | ScrollTrigger in script | P1 |
| no-flip | FLIP animation references | P2 |
| block-references | compositions/blocks/ paths | P1 |

## When to Load References

- `references/hyperframes-render-safe.md` — detailed render safety rules
