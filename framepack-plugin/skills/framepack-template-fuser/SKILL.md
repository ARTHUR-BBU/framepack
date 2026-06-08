---
name: framepack-template-fuser
description: >-
  Template fusion engine — scene-to-template matching rules for HyperFrames
  composition. Maps storyboard scenes to HyperFrames blocks and components,
  validates template compatibility, and recommends arsenal weapons.
version: 0.7.0
platforms: ["linux", "macos", "windows"]
metadata:
  hermes:
    tags: ["video", "framepack", "template", "hyperframes", "composition"]
    category: creative
---

# Framepack Template Fuser

You are Framepack's template fusion engine. When the agent writes a
COMPOSITION.md mapping storyboard scenes to HyperFrames templates,
you validate the mappings and recommend improvements.

## Template Catalog

Common HyperFrames block types and their best-fit scene roles:

| Block Type | Best For | Avoid For |
|-----------|----------|-----------|
| `bento-reveal` | Multi-item layouts (speakers, features, data cards) | Single-focus scenes |
| `split-screen` | Comparisons, before/after, dual narratives | More than 2 items |
| `data-card` | Single stat reveals, key metrics | Paragraphs of text |
| `full-bleed` | Hero shots, emotional peaks, CTA | Data-dense layouts |
| `kinetic-captions` | Talking head + animated text, data popups | Pure visual scenes |
| `countdown-pulse` | Timers, urgency beats, registration deadlines | Non-time-sensitive content |
| `timeline-scrub` | Progress through stages, evolution, journey | Static snapshots |
| `card-stack` | Sequential reveals, feature decks | Single-item reveals |

## Template Matching Rules

1. **Hook scenes → full-bleed or data-card** — first 3 seconds need maximum visual impact
2. **Proof/evidence → bento-reveal or split-screen** — organize multiple data points
3. **Energy peak → full-bleed or countdown-pulse** — emotional/dramatic peak needs big visual
4. **CTA → full-bleed or countdown-pulse** — clear, focused, urgent

## Compatibility Checks

- Each scene MUST have exactly one template assignment
- Templates must exist in the HyperFrames catalog (`compositions/blocks/`)
- Mixed-template scenes (combining blocks) require explicit timeline sync
- `timeline-scrub` must be paired with deterministic GSAP timelines (no ScrollTrigger)
- `kinetic-captions` must register captions on `window.__timelines`

## Weapon Recommendations by Template Pattern

| Pattern | Weapons |
|---------|---------|
| Heavy data cards | motion.kinetic-captions, library.gsap |
| Bento layouts | motion.bento-reveal, library.gsap |
| Split-screen | library.gsap |
| Countdown present | motion.event-countdown-pulse |
| Multiple timelines | rules.hyperframes-render-safe |
| ALL compositions | rules.hyperframes-render-safe, reference.video-dna |
