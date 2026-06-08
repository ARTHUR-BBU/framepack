---
name: framepack-arsenal
description: >-
  Framepack weapon arsenal — catalog of reusable motion patterns, templates,
  libraries, and HyperFrames rules. Use this skill to find the right weapon
  for any video project type, or to learn what each weapon does.
version: 0.7.0
platforms: ["linux", "macos", "windows"]
metadata:
  hermes:
    tags: ["video", "framepack", "arsenal", "weapons", "recommendations"]
    category: creative
---

# Framepack Arsenal — Weapon Catalog

You are the Framepack arsenal curator. The agent is the director. You provide
the weapon catalog and recommendation rules; the agent makes the final
creative decision.

## How to Use This Catalog

When the agent needs a weapon:
1. Match project type → find applicable weapons
2. Check weapon `kind` for capability fit
3. Always include `rules.hyperframes-render-safe` and `library.gsap`
4. Trusted sources only — no unvetted external URLs

---

## Weapon Catalog

### Templates (kind: template)

#### workflow.event-promo
- **Applies to:** event-promo
- **Rhythm:** hook → event value → speakers/agenda → venue energy → countdown → CTA
- **Good for:** summits, conferences, webinars, launch events, salons, livestream previews

#### workflow.sports-highlight
- **Applies to:** sports-highlight
- **Rhythm:** opening impact → player focus → dramatic beats → stats card → CTA
- **Good for:** basketball, football, esports highlights, transfer announcements, player tributes

### Motion (kind: motion)

#### motion.event-countdown-pulse
- **Applies to:** event-promo, course-promo, launch
- **What it does:** Countdown timer + registration CTA pulse animation
- **Best for:** Pre-stream warm-up, ticket deadlines, limited-time offers
- **HyperFrames note:** Must register on `window.__timelines`; use tl.set() for scene switches

#### motion.speaker-lineup-reveal
- **Applies to:** event-promo
- **What it does:** Speakers revealed one by one in sequence
- **Best for:** Summit speaker announcements, panel reveals, guest lineups
- **Combos well with:** motion.bento-reveal for post-reveal speaker cards

#### motion.bento-reveal
- **Applies to:** saas-launch, course-promo
- **What it does:** Bento-style staggered card reveal (Apple keynote aesthetic)
- **Best for:** Feature decks, product showcases, multi-item reveals
- **HyperFrames note:** Each card needs its own timeline; push all to `window.__timelines`

#### motion.kinetic-captions
- **Applies to:** founder-story, course-promo, news-explainer
- **What it does:** Dynamic text captions that animate with speech rhythm
- **Best for:** Talking-head videos, data popups, founder promos
- **HyperFrames note:** Captions MUST register on `window.__timelines`; no ScrollTrigger

### Libraries (kind: library)

#### library.gsap
- **Applies to:** ALL project types
- **What it is:** Framepack's preferred timeline animation library
- **Why:** Deterministic, HyperFrames-safe timeline orchestration
- **Source:** npm registry (trusted, external — verify license before redistribution)

### HyperFrames Rules (kind: hyperframes-rule)

#### rules.hyperframes-render-safe
- **Applies to:** ALL project types (MANDATORY)
- **Checks:**
  - First scene visible in CSS (P0)
  - data-width, data-height, data-start on every scene container (P0)
  - All timelines on `window.__timelines` (P1)
  - No `Math.random()` in render timelines (P1)
  - No `repeat: -1` in render timelines (P1)
  - No `ScrollTrigger` in render context (P1)
  - No `<video>` inside timed scene containers (P0)

### References (kind: reference)

#### reference.video-dna
- **Applies to:** ALL project types
- **What it does:** Reverse-engineer a reference video into reusable structure
- **Outputs:** VIDEO_DNA.md + STORYBOARD.md + TEMPLATE_BLUEPRINT.md
- **Rule:** Extract structure, never copy blindly

---

## Recommendation Rules

### By Project Type

| Project Type | Core Weapons | Optional |
|-------------|-------------|----------|
| event-promo | workflow.event-promo, motion.event-countdown-pulse, motion.speaker-lineup-reveal | motion.bento-reveal |
| sports-highlight | workflow.sports-highlight | motion.kinetic-captions |
| saas-launch | motion.bento-reveal | motion.kinetic-captions |
| course-promo | motion.bento-reveal, motion.kinetic-captions | motion.event-countdown-pulse |
| founder-story | motion.kinetic-captions | — |
| news-explainer | motion.kinetic-captions | — |
| launch | motion.event-countdown-pulse | motion.bento-reveal |
| ALL | library.gsap, rules.hyperframes-render-safe, reference.video-dna | — |

### Weapon Stacking Rules

- Every project MUST include `rules.hyperframes-render-safe`
- Every project SHOULD include `library.gsap`
- Max 2 template weapons per project (pick the best fit)
- Max 3 motion weapons per project (avoid overload)
- `reference.video-dna` is free — always include when referencing

### Trusted Sources

Weapons from these sources are pre-vetted:
- `framepack://` (built-in) — always trusted
- `https://registry.npmjs.org/` (npm registry) — trusted for libraries
- `https://cdnjs.cloudflare.com/` (CDN) — trusted for runtime scripts

Everything else is a CANDIDATE until explicitly added to the project arsenal.
