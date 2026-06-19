---
name: framepack-gsap
description: >-
  Framepack animation weapon recipes — HyperFrames-safe GSAP patterns.
  NOT a GSAP API reference. For GSAP API basics (to/from/timeline/easing),
  load the `gsap` skill (HyperFrames official). For the full HyperFrames
  production workflow and non-negotiable rules, load the `hyperframes` skill.
  This skill provides ONLY Framepack-specific weapon recipes that comply
  with HyperFrames' contract.
version: 0.14.1
platforms: ["linux", "macos", "windows"]
metadata:
  hermes:
    tags: ["video", "framepack", "gsap", "animation", "hyperframes"]
    category: creative
    related_skills: ["gsap", "hyperframes"]
---

# Framepack GSAP — Weapon Recipes

**This is NOT a GSAP tutorial.** For GSAP API basics (`gsap.to()`,
`gsap.from()`, `gsap.fromTo()`, `gsap.timeline()`, easing functions,
position parameters, stagger, etc.), load the HyperFrames `gsap` skill.
For the full production workflow, non-negotiable rules, data attributes,
composition structure, and scene transition rules, load the `hyperframes`
skill.

This skill provides ONLY weapon recipes — specific animation patterns
that Framepack recommends for common video scenarios. Every recipe is
verified against HyperFrames' contract.

## HyperFrames Contract (reminder — source of truth: `hyperframes` skill)

These are the rules every weapon recipe MUST follow. When in doubt,
the `hyperframes` skill and `gsap` skill are authoritative.

```
Timeline:  gsap.timeline({ paused: true })
Register:  window.__timelines["main"] = tl   // KEY must match data-composition-id
GDAP URL:  Download to assets/ FIRST, then <script src="assets/gsap.min.js">
           (CDN scripts time out in HyperFrames render sandbox)

NEVER:
  - paused: false
  - window.__timelines.push(tl)
  - display:none in CSS on .clip elements
  - Exit animations before transitions (HyperFrames rule: transition IS the exit)
  - gsap.to(el, { opacity: 0 }) on non-final scenes
  - ScrollTrigger, Math.random(), repeat: -1, async timeline construction
  - Animate visibility/display properties
```

---

## Weapon Recipes

Each recipe is a concrete GSAP pattern for a specific video moment.
Adapt parameters (duration, ease, deltas) to your scene timing.

### Bento Grid Reveal
```
Weapon: motion.bento-reveal
Scene type: Multi-item layouts (speakers, features, data cards)
```
```js
tl.fromTo(".bento-card",
  { scale: 0.85, opacity: 0, y: 50 },
  { scale: 1, opacity: 1, y: 0,
    stagger: { each: 0.12, grid: "auto", from: "center" },
    duration: 0.65, ease: "power2.out" },
  SCENE_START + 0.2
);
```

### Countdown Pulse
```
Weapon: motion.event-countdown-pulse
Scene type: Timers, urgency beats, registration deadlines
```
```js
const numPulses = Math.floor(sceneDuration / 0.8);
for (let i = 0; i < numPulses; i++) {
  tl.to(".countdown-number", {
    scale: 1.4, duration: 0.3, ease: "power2.out"
  }, SCENE_START + i * 0.8);
  tl.to(".countdown-number", {
    scale: 1, duration: 0.5, ease: "elastic.out(1, 0.4)"
  }, SCENE_START + i * 0.8 + 0.3);
}
```

### Kinetic Captions
```
Weapon: motion.kinetic-captions
Scene type: Talking head + animated text, data popups
```
```js
// Split text into chars beforehand in HTML setup
tl.from(".caption .char", {
  y: 30, opacity: 0, rotateX: -40,
  stagger: 0.03, duration: 0.35, ease: "power2.out"
}, SCENE_START + 0.15);
```

### Speaker Lineup Reveal
```
Weapon: motion.speaker-lineup-reveal
Scene type: Speaker announcements, panel reveals
```
```js
const speakers = document.querySelectorAll(".speaker-card");
speakers.forEach((card, i) => {
  tl.from(card, {
    x: -100, opacity: 0, scale: 0.9,
    duration: 0.6, ease: "power3.out"
  }, SCENE_START + i * 0.5);
});
```

### Data Shock (Big Number)
```
Scene type: Key metric reveal, stat card
```
```js
tl.fromTo(".big-number",
  { scale: 3, opacity: 0 },
  { scale: 1, opacity: 1,
    duration: 0.8, ease: "elastic.out(1, 0.6)" },
  SCENE_START + 0.1
);
tl.from(".metric-label", {
  y: 20, opacity: 0,
  duration: 0.5, ease: "power2.out"
}, SCENE_START + 0.5);
```

### Hero CTA (Full Bleed)
```
Scene type: Hero shots, emotional peaks, closing CTA
```
```js
tl.fromTo(".hero-bg",
  { scale: 1.2, opacity: 0.6 },
  { scale: 1, opacity: 1, duration: 2, ease: "power2.out" },
  SCENE_START
);
tl.from(".cta-text", {
  y: 40, opacity: 0,
  duration: 0.7, ease: "power3.out"
}, SCENE_START + 0.8);
tl.to(".cta-button", {
  scale: 1.08, duration: 0.4, ease: "back.out(1.7)"
}, SCENE_START + 2.2);
```

---

## Arsenal Weapon → GSAP Technique Map

| Arsenal Weapon | Core GSAP Technique | Key API |
|---------------|-------------------|---------|
| motion.bento-reveal | Staggered fromTo with grid | `stagger: { grid: "auto", from: "center" }` |
| motion.event-countdown-pulse | Finite loop with elastic settle | `elastic.out` |
| motion.speaker-lineup-reveal | Positioned timeline stages | `tl.from(card, ..., i * delay)` |
| motion.kinetic-captions | Character-level stagger | `stagger: 0.03`, `rotateX` |
| library.gsap | Timeline registration | `window.__timelines["main"] = tl` |

---

## When to load what

| You need... | Load this skill |
|-------------|----------------|
| GSPS API: `gsap.to()`, easing, stagger syntax | `gsap` (HyperFrames official) |
| Full HyperFrames workflow, data-attributes, rules | `hyperframes` |
| CLI commands: init, lint, render, preview | `hyperframes-cli` |
| Specific weapon patterns for common video moments | `framepack-gsap` (this skill) |
| Creative planning: frame.md, expanded-prompt.md | `framepack` + `framepack-director` |
