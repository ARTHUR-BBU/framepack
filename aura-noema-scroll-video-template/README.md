# NOEMA Scroll Video Template

A 60-second HyperFrames video template for turning a brand, product, method, or community story into a brutalist poster-style motion piece.

This project started as the NOEMA.ART gold sample: a GSAP ScrollTrigger landing page converted into a deterministic linear HyperFrames video. It is now an **agent-managed template**: copy it, remap the scenes, replace the copy and props, then run the fixed validation recipe.

It is **not yet** a one-click CLI template engine. `variables.json` is the content contract / prep sheet; the current HTML is still static-first and must be edited by an Agent or developer.

## What this template is good for

Use it for:

- Product or tool launch videos.
- Founder / creator / community intro videos.
- Methodology explainers with strong visual beats.
- Social clips where big typography and fast scene rhythm matter.
- Cross-domain reuse where the choreography stays, but the story changes.

Avoid it for:

- Step-by-step tutorials with dense narration.
- Long subtitle-heavy lectures.
- Vertical short-form output; this template is landscape only.
- Cases where every UI detail must be readable for several seconds.

## Template facts

| Property | Value |
|---|---:|
| Duration | 60.000s |
| Resolution | 1920x1080 |
| FPS | 30 |
| Frame count | 1800 |
| Scenes | 11 |
| HyperFrames version target | 0.6.121 |
| Runtime | local vendored GSAP at `assets/vendor/gsap-3.14.2.min.js` |
| Fonts | local `Anton`, `Inter`, `Caveat` woff2 files |

## Maturity level

Current level: **Agent-managed template**.

Think of it as a restaurant recipe card, not a vending machine. The kitchen is ready, the timing is proven, and the prep checklist is written. An Agent still needs to cook: copy the directory, map the new story, replace props, edit `index.html`, then verify the render.

Future level: a productized CLI entry such as `framepack template use noema`. That is intentionally out of scope for this version.

## Three reuse modes

### Mode A — Copy-only text swap

Fastest path: keep the original visuals, replace text.

Use when you only need a smoke test or internal proof. Risk: the video still feels like the original domain because the props did not change.

### Mode B — Copy + programmatic props (recommended default)

Replace both copy and visual evidence with deterministic CSS/HTML props:

- terminal panes
- node graphs
- capability cards
- code diffs
- dashboards
- geometric avatars
- QR-like matrices

Use this for technical products, methods, frameworks, or abstract business concepts.

### Mode C — Copy + real assets / SVG polish

Use real screenshots, brand assets, SVG diagrams, or hand-crafted visuals.

Use this when the result must feel like a polished product demo, not a prototype.

## Main files

```text
README.md                               this entrypoint
TEMPLATE-USAGE.md                       scene mapping + reuse workflow
TEMPLATE-QA.md                          validation and report checklist
frame.md                                visual identity source of truth
variables.json                          content contract / schema seed
.hyperframes/expanded-prompt.md         production brief + scene beats
.hyperframes/direction-c-template-engine-notes.md  future engine notes
index.html                              HyperFrames composition
assets/manifest.json                    frozen original image asset registry
assets/fonts/manifest.json              local font registry
assets/vendor/manifest.json             vendored JS dependency registry
qa/contact-sheet.jpg                    lightweight visual evidence
```

## Scene map

| Scene | Time | Original role | Reuse role |
|---|---:|---|---|
| loader | 0.00-3.20 | NOEMA boot reveal | Brand / topic boot reveal |
| hero | 3.20-7.98 | three artist cards | three anchor concepts / features |
| interlude | 7.98-12.76 | audience statement | world / audience statement |
| product | 12.76-19.01 | wallet pass + phone profile | core product pair / before-after pair |
| manifesto | 19.01-25.26 | creative practice thesis | one-sentence thesis |
| archive | 25.26-32.24 | 15-image archive | 15-slot capability / proof grid |
| builder | 32.24-38.86 | profile modules assemble | system / workflow assembly |
| board | 38.86-45.11 | opportunity cards | pillars / modules / opportunities |
| support | 45.11-51.36 | support flow | validation / result / trust flow |
| cta-build | 51.36-57.24 | SEEN / SAVED / SUPPORTED | three payoff verbs |
| join | 57.24-60.00 | final CREATE CTA | final CTA + attribution |

## How to use

1. Copy this directory to a new project path. Include hidden `.hyperframes/`.
2. Delete stale `dist/*.mp4` outputs in the copy before rendering.
3. Read `TEMPLATE-USAGE.md`.
4. Update `frame.md` for the new visual identity.
5. Update `variables.json` as the content contract.
6. Replace both text and props in `index.html`.
7. Run the QA recipe in `TEMPLATE-QA.md`.

## Fixed validation commands

Use the pinned version. Do not rely on bare `npx hyperframes`, because it may resolve to a newer untested CLI.

```bash
cd /f/hyperframes/aura-noema-scroll-video-template
npx hyperframes@0.6.121 lint
npx hyperframes@0.6.121 validate
npx hyperframes@0.6.121 inspect --samples 15
npx hyperframes@0.6.121 render --output dist/noema-scroll-template.mp4
ffprobe -v error -select_streams v:0 \
  -show_entries stream=width,height,r_frame_rate,avg_frame_rate,nb_frames,duration \
  -show_entries format=duration,size \
  -of json dist/noema-scroll-template.mp4
```

Expected media proof:

- duration: `60.000000`
- width/height: `1920x1080`
- fps: `30/1`
- frames: `1800`
- non-zero file size

## Props rule

Do not only replace the lines. Replace the stage props.

If the story changes from art-world to engineering, portraits and gallery photos should become terminal panes, workflow diagrams, dashboards, capability tiles, screenshots, or SVGs. If the story changes from NOEMA to a food brand, they should become product shots, menu cards, ingredient grids, and store/community proof.

The viewer believes the domain through visual evidence, not just copy.

## Known constraints

- Landscape 1920x1080 only.
- No audio included.
- `variables.json` is a contract, not automatic HTML binding yet.
- The style intentionally uses giant cropped typography and card overlap. Inspect findings should be classified as intentional or real, not blindly suppressed.
- Original NOEMA gold sample legitimately references NOEMA image assets. Repurposed outputs should audit stale source-domain asset references.
