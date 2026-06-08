---
name: framepack-gsap
description: >-
  GSAP animation knowledge base for Framepack — core API, HyperFrames-safe
  patterns, animation recipes by project type, and arsenal weapon mappings.
  GSAP is Framepack's preferred timeline animation library.
version: 0.7.0
platforms: ["linux", "macos", "windows"]
metadata:
  hermes:
    tags: ["video", "framepack", "gsap", "animation", "timeline", "hyperframes"]
    category: creative
---

# Framepack GSAP — Animation Engine

GSAP (GreenSock Animation Platform) is Framepack's preferred timeline
animation library. Every HyperFrames scene animation runs through GSAP
timelines. This skill is the definitive reference for GSAP usage within
Framepack workbenches.

**Golden rule:** GSAP inside HyperFrames MUST be deterministic. No
ScrollTrigger, no infinite loops, no random values. The render pipeline
executes each frame once; non-deterministic animations produce different
output every render.

---

## Core API Reference

### Timeline Creation

```js
// Standard timeline — ALWAYS finite repeat
const tl = gsap.timeline({
  repeat: 0,          // NEVER -1 in render context
  paused: false,
  defaults: {
    ease: "power2.out",
    duration: 0.8,
  },
});

// MUST register immediately after creation
window.__timelines.push(tl);
```

### Scene Switching

```js
// Switch scenes with tl.set() — instant, no animation
tl.set(scene1, { display: "none" });
tl.set(scene2, { display: "block" });
```

### Basic Tweens

```js
// Absolute positioning (use px, not % or vw/vh)
tl.to(element, { x: 200, y: 100, duration: 1.2 });

// Scale (from/to center)
tl.fromTo(element,
  { scale: 0, opacity: 0 },
  { scale: 1, opacity: 1, duration: 0.6 }
);

// Opacity fade
tl.to(element, { opacity: 0, duration: 0.4 });
tl.to(element, { opacity: 1, duration: 0.4 });
```

### Staggered Animations

```js
// Stagger cards/items — key technique for bento reveals
tl.fromTo(".card",
  { scale: 0.8, opacity: 0, y: 40 },
  { scale: 1, opacity: 1, y: 0, stagger: 0.12, duration: 0.6 }
);

// Stagger from edges
tl.fromTo(".card",
  { x: -80, opacity: 0 },
  { x: 0, opacity: 1, stagger: { each: 0.1, from: "edges" } }
);
```

### Text Animations

```js
// Kinetic captions — stagger by character or word
tl.fromTo(".caption .char",
  { y: 20, opacity: 0 },
  { y: 0, opacity: 1, stagger: 0.03, duration: 0.3 }
);

// Typewriter effect
tl.fromTo(".title .char",
  { opacity: 0 },
  { opacity: 1, stagger: 0.05, duration: 0.1 }
);
```

### Easing

```js
// Framepack preferred eases
"power2.out"     // Default — smooth deceleration
"power3.out"     // Sharper stop — good for data reveals
"power4.inOut"   // Dramatic — intro/outro transitions
"elastic.out(1, 0.5)"  // Bouncy — CTA buttons
"back.out(1.7)"  // Overshoot — logo reveals
"none"           // Linear — countdown tickers
```

---

## HyperFrames-Safe Patterns

### ✅ DO

```js
// Register every timeline
const tl = gsap.timeline({ repeat: 0 });
window.__timelines.push(tl);

// Switch scenes with tl.set()
tl.set(oldScene, { display: "none" });
tl.set(newScene, { display: "block" });

// Use deterministic values — precomputed, not random
const SEED_X = 200;  // NOT Math.random() * 200
tl.to(card, { x: SEED_X, duration: 0.8 });

// Finite repeats only
tl.to(el, { scale: 1.1, repeat: 3, yoyo: true });

// Use px values for positions
tl.to(el, { x: 540, y: 960 });  // NOT x: "50%"
```

### ❌ DON'T

```js
// NEVER use ScrollTrigger in render context
// ScrollTrigger.create({ ... })  ← REMOVE before render

// NEVER infinite repeat
// gsap.timeline({ repeat: -1 })  ← WILL BREAK

// NEVER Math.random()
// tl.to(el, { x: Math.random() * 500 })  ← NON-DETERMINISTIC

// NEVER viewport-relative values
// tl.to(el, { x: "50vw" })  ← varies by viewport in render

// NEVER unregistered timelines
// const tl = gsap.timeline(...);  // ← MISSING window.__timelines.push(tl)
```

---

## Animation Recipes

### Bento Grid Reveal
```
Weapon: motion.bento-reveal
Scene type: Multi-item layouts (speakers, features, data cards)
```
```js
const tl = gsap.timeline({ repeat: 0 });
window.__timelines.push(tl);

// Stagger cards from below with scale pop
tl.fromTo(".bento-card",
  { scale: 0.85, opacity: 0, y: 50 },
  { scale: 1, opacity: 1, y: 0,
    stagger: { each: 0.12, grid: "auto", from: "center" },
    duration: 0.65, ease: "power2.out" }
);
```

### Countdown Pulse
```
Weapon: motion.event-countdown-pulse
Scene type: Timers, urgency beats, registration deadlines
```
```js
const tl = gsap.timeline({ repeat: 3 });  // finite!
window.__timelines.push(tl);

tl.to(".countdown-number", {
  scale: 1.4,
  duration: 0.3, ease: "power2.out",
}).to(".countdown-number", {
  scale: 1,
  duration: 0.5, ease: "elastic.out(1, 0.4)",
}).to(".cta-button", {
  scale: 1.05, opacity: 1,
  duration: 0.4, ease: "back.out(1.7)",
}, "-=0.2");
```

### Kinetic Captions
```
Weapon: motion.kinetic-captions
Scene type: Talking head + animated text, data popups
```
```js
const tl = gsap.timeline({ repeat: 0 });
window.__timelines.push(tl);

// Split text into chars beforehand (server-side or JS)
tl.fromTo(".caption .char",
  { y: 30, opacity: 0, rotateX: -40 },
  { y: 0, opacity: 1, rotateX: 0,
    stagger: 0.03, duration: 0.35, ease: "power2.out" }
);
```

### Speaker Lineup Reveal
```
Weapon: motion.speaker-lineup-reveal
Scene type: Speaker announcements, panel reveals
```
```js
const tl = gsap.timeline({ repeat: 0 });
window.__timelines.push(tl);

// Reveal speakers one at a time
const speakers = document.querySelectorAll(".speaker-card");
speakers.forEach((card, i) => {
  tl.fromTo(card,
    { x: -100, opacity: 0, scale: 0.9 },
    { x: 0, opacity: 1, scale: 1,
      duration: 0.6, ease: "power3.out" },
    i * 0.5  // position on timeline
  );
});
```

### Data Shock (Big Number)
```
Scene type: Key metric reveal, stat card
```
```js
const tl = gsap.timeline({ repeat: 0 });
window.__timelines.push(tl);

// Scale in a big number with elastic settle
tl.fromTo(".big-number",
  { scale: 3, opacity: 0 },
  { scale: 1, opacity: 1,
    duration: 0.8, ease: "elastic.out(1, 0.6)" }
).fromTo(".metric-label",
  { y: 20, opacity: 0 },
  { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" },
  "-=0.3"
);
```

### Hero CTA (Full Bleed)
```
Scene type: Hero shots, emotional peaks, closing CTA
```
```js
const tl = gsap.timeline({ repeat: 0 });
window.__timelines.push(tl);

// Dramatic zoom-in on hero image
tl.fromTo(".hero-bg",
  { scale: 1.2, opacity: 0.6 },
  { scale: 1, opacity: 1, duration: 2, ease: "power2.out" }
).fromTo(".cta-text",
  { y: 40, opacity: 0 },
  { y: 0, opacity: 1, duration: 0.7, ease: "power3.out" },
  "-=1.2"
).to(".cta-button",
  { scale: 1.08, duration: 0.4, ease: "back.out(1.7)" }
);
```

---

## Arsenal Weapon → GSAP Technique Map

| Arsenal Weapon | Core GSAP Technique | Key API |
|---------------|-------------------|---------|
| motion.bento-reveal | Staggered fromTo with grid | `stagger: { grid: "auto", from: "center" }` |
| motion.event-countdown-pulse | Repeated scale pulse + elastic | `repeat: 3`, `elastic.out` |
| motion.speaker-lineup-reveal | Positioned timeline stages | `tl.fromTo(card, ..., i * delay)` |
| motion.kinetic-captions | Character-level stagger | `stagger: 0.03`, `rotateX` |
| library.gsap | Timeline registration | `window.__timelines.push(tl)` |
| rules.hyperframes-render-safe | All MUST patterns | See HyperFrames-Safe above |

---

## Common Pitfalls

1. **Forgetting `window.__timelines.push(tl)`** — Silent failure. Timeline runs but
   HyperFrames scheduler cannot control it. Scene switches WILL be out of sync.

2. **Using `ScrollTrigger` in render** — Works in preview browser, produces
   blank output in render. Always remove before final build.

3. **Infinite repeat** — `repeat: -1` works in interactive mode, breaks render.
   Use finite `repeat: N` for pulses, or precompute loop length.

4. **Viewport-relative values** — `vw`, `vh`, `%` positions shift in render
   because the viewport IS the canvas. Always use `px` based on `data-width`
   and `data-height`.

5. **Timeline ordering** — `tl.set()` for scene switches MUST come before
   animations on the new scene. Otherwise elements animate while invisible.

6. **CDN version** — Pin GSAP version in the CDN URL. Floating `@latest`
   can break when GreenSock releases breaking changes.
   Use: `gsap@3.12.5`

---

## Quick Reference Card

```
Timeline:   gsap.timeline({ repeat: 0, defaults: { ease: "power2.out" } })
Register:   window.__timelines.push(tl)
Switch:     tl.set(oldScene, { display: "none" }); tl.set(newScene, { display: "block" })
Fade:       tl.to(el, { opacity: 0 })
Scale:      tl.fromTo(el, { scale: 0 }, { scale: 1 })
Stagger:    tl.fromTo(".cards", from, to, { stagger: 0.12 })
Data start: data-width="1080" data-height="1920" data-start="0"
CDN:        https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js
```
