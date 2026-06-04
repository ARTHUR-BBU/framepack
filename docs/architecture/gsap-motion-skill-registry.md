# GSAP Motion Skill Registry

Framepack uses GSAP Motion Skills as an internal motion registry, not as separate Codex or Claude Code skills.

## Role

The registry gives the workbench a professional motion layer:

```text
user taste words
  -> template / catalog recommendation
  -> GSAP Motion Skill recommendation
  -> COMPOSITION.md motion plan
  -> HyperFrames-safe GSAP timeline code
  -> audit / preview / render
```

The agent skills still define jobs such as director, template fuser, and HyperFrames builder. GSAP Motion Skills define reusable animation recipes those jobs can use.

## First Batch

The first batch is intentionally capped at 12 skills:

- Hero: Apple Keynote Hero
- Text: Kinetic Headline Reveal, Word Stagger Reveal
- Product: Luxury Product Reveal, SaaS Feature Spotlight
- Data: Counter Metric Impact, Chart Reveal Sequence
- Layout: Bento Grid Reveal, Card Expand Focus
- Heavy interaction: Render-Safe Scroll Story, Render-Safe FLIP Morph, Scrubbed Product Walkthrough

This keeps 0.6.x useful without turning the workbench into a large animation framework.

## Render-Safe Rule

Heavy interaction terms are treated as creative intent for video render:

- ScrollTrigger intent becomes pinned-scroll-feeling timeline beats.
- FLIP intent becomes fixed start/end transform choreography.
- Scrubbed walkthrough intent becomes progress-driven timeline beats.

Framepack must not emit real scroll, hover, drag, randomness, or infinite animation dependencies for final HyperFrames render unless the user explicitly asks for an interactive web page instead of a rendered video.

## Agent Contract

Agents should:

- read selected motion skills from `COMPOSITION.md`, recommendation JSON, and `.framepack/state.json`
- treat skills as template-attached recipes, not standalone tools
- let `framepack build` generate the first HyperFrames-safe GSAP timeline
- run composition, preview, and render audit gates before handoff

Small-user explanation: this is Framepack's motion director library. It does not stuff all GSAP knowledge into the agent's memory; it exposes the right animation recipes at the right project stage.
