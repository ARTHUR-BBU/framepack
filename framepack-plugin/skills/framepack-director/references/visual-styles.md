# Visual Style Library — Complete frame.md Token Blocks

Named visual identities for HyperFrames videos. Each style is a complete
frame.md — copy the YAML into a project's frame.md and customize.

**Match by mood first, content second.** Ask: "What should the viewer FEEL?"

---

## Quick Reference

| Style | Mood | Best For | Transition Shader | Energy |
|-------|------|----------|-------------------|--------|
| Swiss Pulse | Clinical, precise | SaaS, data, dev tools, metrics | Cinematic Zoom / SDF Iris | high |
| Velvet Standard | Premium, timeless | Luxury, enterprise, keynotes | Cross-Warp Morph | calm |
| Deconstructed | Industrial, raw | Tech launches, security, punk | Glitch / Whip Pan | high |
| Maximalist Type | Loud, kinetic | Big announcements, launches | Ridged Burn | high |
| Data Drift | Futuristic, immersive | AI, ML, cutting-edge tech | Gravitational Lens / Domain Warp | moderate |
| Soft Signal | Intimate, warm | Wellness, personal stories, lifestyle | Thermal Distortion | calm |
| Folk Frequency | Cultural, vivid | Consumer apps, food, communities | Swirl Vortex / Ripple Waves | high |
| Shadow Cut | Dark, cinematic | Dramatic reveals, security, exposé | Domain Warp | moderate |

---

## 1. Swiss Pulse — Josef Müller-Brockmann

**Mood:** Clinical, precise | **Best for:** SaaS dashboards, developer tools, APIs, metrics

```yaml
name: Swiss Pulse
colors:
  primary: "#1a1a1a"
  on-primary: "#ffffff"
  accent: "#0066FF"
typography:
  headline:
    fontFamily: Helvetica Neue
    fontSize: 5rem
    fontWeight: 700
  label:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: 400
  stat:
    fontFamily: Helvetica Neue
    fontSize: 7rem
    fontWeight: 700
rounded:
  none: 0px
  sm: 2px
spacing:
  sm: 8px
  md: 16px
  lg: 32px
motion:
  energy: high
  easing:
    entry: "expo.out"
    exit: "power4.in"
    ambient: "none"
  duration:
    entrance: 0.4
    hold: 1.5
    transition: 0.6
  atmosphere:
    - grid-lines
    - registration-marks
  transition: cinematic-zoom
```

Grid-locked compositions. Every element snaps to an invisible 12-column grid.
Numbers dominate the frame at 80-120px. Animated counters count up from 0.
Hard cuts, no decorative transitions. Nothing floats.

---

## 2. Velvet Standard — Massimo Vignelli

**Mood:** Premium, timeless | **Best for:** Luxury products, enterprise software, keynotes, investor decks

```yaml
name: Velvet Standard
colors:
  primary: "#0a0a0a"
  on-primary: "#f5f0eb"
  accent: "#c9a96e"
typography:
  headline:
    fontFamily: Didot
    fontSize: 5.5rem
    fontWeight: 700
  label:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: 400
  stat:
    fontFamily: Didot
    fontSize: 8rem
    fontWeight: 700
rounded:
  none: 0px
  sm: 4px
spacing:
  sm: 12px
  md: 24px
  lg: 48px
motion:
  energy: calm
  easing:
    entry: "sine.out"
    exit: "sine.in"
    ambient: "sine.inOut"
  duration:
    entrance: 0.8
    hold: 2.0
    transition: 0.7
  atmosphere:
    - radial-glow
    - ghost-type
  transition: cross-warp-morph
```

Generous whitespace. Centered symmetry. Serif headlines float on dark canvases.
Gold accent for elegance markers — dividers, stat highlights, attribution.
Slow, graceful entrances. Cross-Warp Morph transitions feel like fabric unfolding.

---

## 3. Deconstructed — Industrial Design

**Mood:** Industrial, raw | **Best for:** Tech launches, security products, punk aesthetics

```yaml
name: Deconstructed
colors:
  primary: "#0d0d0d"
  on-primary: "#e8e8e8"
  accent: "#ff3333"
typography:
  headline:
    fontFamily: Space Mono
    fontSize: 4.5rem
    fontWeight: 700
  label:
    fontFamily: JetBrains Mono
    fontSize: 0.75rem
    fontWeight: 400
  stat:
    fontFamily: Space Mono
    fontSize: 6rem
    fontWeight: 700
rounded:
  none: 0px
  sm: 0px
spacing:
  sm: 4px
  md: 12px
  lg: 24px
motion:
  energy: high
  easing:
    entry: "back.out(2)"
    exit: "power4.in"
    ambient: "none"
  duration:
    entrance: 0.25
    hold: 1.0
    transition: 0.4
  atmosphere:
    - scan-lines
    - noise-overlay
    - hairline-rules
  transition: glitch
```

Brutalist grid breaks. Monospace everything. Red accent for danger/alert markers.
Glitch transitions and Whip Pans. Scan lines and noise overlays.
Elements SLAM into place. No softness, no breathing.

---

## 4. Maximalist Type — Editorial Bold

**Mood:** Loud, kinetic | **Best for:** Big announcements, product launches, hype videos

```yaml
name: Maximalist Type
colors:
  primary: "#000000"
  on-primary: "#ffffff"
  accent: "#ff6600"
typography:
  headline:
    fontFamily: Archivo Black
    fontSize: 7rem
    fontWeight: 900
  label:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: 600
  stat:
    fontFamily: Archivo Black
    fontSize: 9rem
    fontWeight: 900
rounded:
  none: 0px
  sm: 0px
spacing:
  sm: 8px
  md: 16px
  lg: 32px
motion:
  energy: high
  easing:
    entry: "expo.out"
    exit: "power3.in"
    ambient: "none"
  duration:
    entrance: 0.3
    hold: 1.2
    transition: 0.5
  atmosphere:
    - oversized-type
    - accent-rule
  transition: ridged-burn
```

Type IS the design. Headlines fill 80%+ of the frame. Every word has weight.
Orange accent for punctuation marks. Ridged Burn transitions feel like the
frame is tearing open. Fast, percussive, unapologetic.

---

## 5. Data Drift — Futuristic Immersion

**Mood:** Futuristic, immersive | **Best for:** AI, ML, cutting-edge tech, data products

```yaml
name: Data Drift
colors:
  primary: "#0a0e27"
  on-primary: "#e0e6ff"
  accent: "#00d4ff"
typography:
  headline:
    fontFamily: Space Grotesk
    fontSize: 5rem
    fontWeight: 700
  label:
    fontFamily: Space Mono
    fontSize: 0.75rem
    fontWeight: 400
  stat:
    fontFamily: Space Grotesk
    fontSize: 7rem
    fontWeight: 700
rounded:
  none: 0px
  sm: 6px
spacing:
  sm: 8px
  md: 20px
  lg: 40px
motion:
  energy: moderate
  easing:
    entry: "power2.out"
    exit: "power2.in"
    ambient: "sine.inOut"
  duration:
    entrance: 0.6
    hold: 1.8
    transition: 0.8
  atmosphere:
    - particle-field
    - grid-lines
    - data-stream
  transition: gravitational-lens
```

Deep navy canvas. Cyan accent glows like bioluminescence. Particles drift
slowly in the background. Gravitational Lens transitions bend the frame
like spacetime. Moderate energy — confident, not frantic.

---

## 6. Soft Signal — Intimate Warmth

**Mood:** Intimate, warm | **Best for:** Wellness, personal stories, lifestyle brands

```yaml
name: Soft Signal
colors:
  primary: "#faf6f0"
  on-primary: "#2d2a26"
  accent: "#e07a5f"
typography:
  headline:
    fontFamily: Fraunces
    fontSize: 4.5rem
    fontWeight: 700
  label:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: 400
  stat:
    fontFamily: Fraunces
    fontSize: 6rem
    fontWeight: 700
rounded:
  none: 4px
  sm: 12px
  md: 20px
spacing:
  sm: 12px
  md: 24px
  lg: 48px
motion:
  energy: calm
  easing:
    entry: "sine.out"
    exit: "sine.in"
    ambient: "sine.inOut"
  duration:
    entrance: 0.7
    hold: 2.2
    transition: 0.6
  atmosphere:
    - radial-glow
    - soft-grain
  transition: thermal-distortion
```

Light canvas, warm tones. Rounded corners. Serif headlines with personality.
Terracotta accent. Thermal Distortion transitions feel like heat shimmer.
Everything breathes slowly. Generous padding. Nothing sharp.

---

## 7. Folk Frequency — Cultural Vibrancy

**Mood:** Cultural, vivid | **Best for:** Consumer apps, food, communities, cultural events

```yaml
name: Folk Frequency
colors:
  primary: "#1a1a2e"
  on-primary: "#f0e6d3"
  accent: "#e63946"
typography:
  headline:
    fontFamily: Bricolage Grotesque
    fontSize: 5rem
    fontWeight: 800
  label:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: 500
  stat:
    fontFamily: Bricolage Grotesque
    fontSize: 7rem
    fontWeight: 800
rounded:
  none: 0px
  sm: 8px
spacing:
  sm: 10px
  md: 20px
  lg: 40px
motion:
  energy: high
  easing:
    entry: "back.out(1.5)"
    exit: "power3.in"
    ambient: "sine.inOut"
  duration:
    entrance: 0.4
    hold: 1.5
    transition: 0.6
  atmosphere:
    - pattern-overlay
    - color-blocks
    - organic-shapes
  transition: swirl-vortex
```

Rich, saturated palette. Playful type with personality. Red accent pops against
deep indigo. Swirl Vortex transitions feel like a kaleidoscope turning.
Organic shapes and patterns in the background. High energy, joyful.

---

## 8. Shadow Cut — Cinematic Darkness

**Mood:** Dark, cinematic | **Best for:** Dramatic reveals, security, exposés, film trailers

```yaml
name: Shadow Cut
colors:
  primary: "#050505"
  on-primary: "#d4d4d4"
  accent: "#8b5cf6"
typography:
  headline:
    fontFamily: Instrument Serif
    fontSize: 5.5rem
    fontWeight: 700
  label:
    fontFamily: JetBrains Mono
    fontSize: 0.75rem
    fontWeight: 400
  stat:
    fontFamily: Instrument Serif
    fontSize: 7rem
    fontWeight: 700
rounded:
  none: 0px
  sm: 2px
spacing:
  sm: 6px
  md: 16px
  lg: 32px
motion:
  energy: moderate
  easing:
    entry: "power3.out"
    exit: "power4.in"
    ambient: "sine.inOut"
  duration:
    entrance: 0.6
    hold: 1.8
    transition: 0.7
  atmosphere:
    - smoke-wisps
    - light-leak
    - vignette
  transition: domain-warp
```

Near-black canvas. Purple accent glows like neon in fog. Domain Warp transitions
distort reality. Smoke wisps and light leaks create depth. Serif headlines
feel like movie titles. Everything has shadows. Slow, deliberate reveals.
