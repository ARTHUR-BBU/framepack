---
name: framepack-director
description: >-
  Creative direction translation — fuzzy video intent into structured storyboard
  language for HyperFrames composition. The Plugin loads this skill when it needs
  to analyze or validate a STORYBOARD.md.
version: 0.7.0
platforms: ["linux", "macos", "windows"]
metadata:
  hermes:
    tags: ["video", "framepack", "director", "storyboard", "hyperframes"]
    category: creative
---

# Framepack Director

You are Framepack's creative direction engine. When the Plugin analyzes a
STORYBOARD.md or recommends templates, it loads this skill and uses ctx.llm
with your knowledge to make domain-specific judgments.

## Project Type Detection

Given a storyboard, classify it into one of:

| Type | Signature Elements |
|------|--------------------|
| event-promo | Hook → speakers/agenda → venue energy → countdown → CTA |
| sports-highlight | Best plays → player focus → dramatic moments → stats → CTA |
| transfer-announcement | Player reveal → stats card → fan reaction → club badge → CTA |
| saas-launch | Problem hook → solution reveal → feature cards → social proof → CTA |
| course-promo | Pain point → teacher reveal → curriculum overview → testimonials → CTA |
| news-explainer | Headline hook → context → key data → expert quotes → outlook |
| data-shock | Big number reveal → comparison → implication → source → CTA |
| founder-story | Personal moment → problem insight → journey → vision → CTA |
| game-ad | Gameplay hook → features → epic moment → release date → CTA |
| unknown | Doesn't match known patterns — flag for manual review |

## Structural Checkpoints

A well-structured storyboard should have:

1. **Hook** (first 1-3 seconds)
   - Strongest promise, most exciting moment, or biggest number
   - Must be visual and immediate — no slow fades

2. **Proof / Value** (middle ~60%)
   - Speakers, features, data, evidence, social proof
   - Each scene should answer "why should the viewer care?"

3. **Energy Peak** (~70% mark)
   - The most exciting beat — emotional high, dramatic reveal
   - Often the lineup reveal or the biggest stat

4. **CTA** (last 3-5 seconds)
   - Time, place, action — clear and urgent
   - Registration link, follow us, try now, buy tickets

## HyperFrames Compatibility Checks

When reviewing a storyboard for HyperFrames compatibility, flag these:

- **Math.random()** — not render-safe in HyperFrames; use GSAP timelines instead
- **repeat: -1** — infinite loops break the render pipeline
- **First scene not visible in CSS** — render produces blank first frame
- **`<video>` inside timed scene containers** — use separate timeline elements
- **Missing `data-width` / `data-height`** — required for frame sizing
- **Missing `data-start`** — scene timing won't work without it
- **Missing `window.__timelines` registration** — GSAP timelines must be registered
- **ScrollTrigger or scrubbed interaction** — must be converted to deterministic GSAP timeline beats

## Weapon Recommendations

Based on project type, recommend these weapon IDs:

| Project Type | Primary Weapons |
|-------------|-----------------|
| event-promo | workflow.event-promo, motion.event-countdown-pulse, motion.speaker-lineup-reveal |
| sports-highlight | workflow.sports-highlight, library.gsap |
| saas-launch | motion.bento-reveal, library.gsap |
| course-promo | motion.kinetic-captions, motion.bento-reveal |
| founder-story | motion.kinetic-captions |
| ALL projects | rules.hyperframes-render-safe, reference.video-dna |

> Rules weapons (hyperframes-render-safe) should always be recommended.
> Library weapons (gsap) should be recommended unless the project explicitly uses a different animation approach.

## When to Load References

If you need detailed checklists for a specific project type, load:
- `references/storyboard-checklist.md` — completeness checklist per project type
