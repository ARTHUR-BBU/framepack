# NOEMA Template Usage Guide

Use this guide when an Agent is asked to repurpose the NOEMA scroll video template for a new topic.

## Activation prompts

Users can say:

- "Use the NOEMA scroll video template for this product launch."
- "Repurpose NOEMA for this tweet / article / framework."
- "Keep the 60s choreography, but replace the topic and props."
- "Use NOEMA as the stage, but make it about my brand."

Treat this as **template reuse**, not a blank creative brief.

## Copy procedure

From the source repo:

```bash
SRC=/f/hyperframes/aura-noema-scroll-video-template
DST=/f/hyperframes/cases/my-new-video
mkdir -p "$DST"
cp -R "$SRC"/. "$DST"/
rm -rf "$DST/dist"
mkdir -p "$DST/dist"
```

The `cp -R "$SRC"/. "$DST"/` form matters: it copies hidden directories like `.hyperframes/`.

## Editing order

1. Read these files in the copied project:
   - `frame.md`
   - `variables.json`
   - `.hyperframes/expanded-prompt.md`
   - `index.html`
   - `assets/manifest.json`
2. Build a scene mapping table for the new story.
3. Update `frame.md` for visual identity.
4. Update `variables.json` as the content contract.
5. Replace text and props in `index.html`.
6. Run `TEMPLATE-QA.md`.

## Scene mapping table

| Scene | Original | New-story question | Typical replacement |
|---|---|---|---|
| loader | NOEMA boot | What name/topic must land first? | brand name, method name, product name |
| hero | three artist cards | What are the 3 anchor concepts? | feature cards, pillars, personas, proof cards |
| interlude | artists + curators | Who is this for? | audience, market, movement, category |
| product | wallet + phone | What is the core product pair? | app + dashboard, model + workflow, before + after |
| manifesto | practice thesis | What sentence explains the whole thing? | thesis, belief, promise |
| archive | 15 artwork images | What proves breadth? | capabilities, cases, modules, lessons, assets |
| builder | profile builder | What assembles in real time? | system, pipeline, stack, package, offer |
| board | opportunity cards | What are the 7 pillars/cards? | workflow pillars, modules, use cases, offers |
| support | support flow | What proves trust or result? | validation, pass/fail, metrics, outcome |
| cta-build | SEEN/SAVED/SUPPORTED | What are the 3 payoff verbs? | BUILD/TEST/SHIP, TRY/LEARN/LAUNCH, etc. |
| join | CREATE CTA | What action should viewer take? | join, download, ship, book, follow |

## Prop replacement map

The core productization lesson: copy and props are a pair.

| Original NOEMA prop | Replace with |
|---|---|
| artist portraits | avatars, personas, terminal panes, product cards |
| gallery photos | capability tiles, screenshots, diagrams, proof cards |
| QR image | QR-like matrix, real QR, pass graphic, dashboard widget |
| phone artwork | product screen, architecture diagram, workflow panel |
| builder thumbnails | code diffs, process cards, feature screenshots |
| final avatar bubbles | geometric icons, customer logos, team marks, agent orbs |

## Programmatic prop recipes

For technical or abstract topics, deterministic CSS/HTML props are often stronger than stock photos:

- terminal split pane: black card + colored status rows + command prompt lines
- memory graph: nodes + connecting SVG paths
- skill matrix: grid of labeled tiles
- capability card: label, status strip, small chart blocks
- code diff: green/red lines with short snippets
- dashboard: bars, counters, queue status, progress rings
- geometric avatar: conic-gradient orb + short label
- QR-like matrix: CSS grid of deterministic black/white squares

Keep them readable at 1920x1080. Big labels matter more than tiny detail.

## Keep these unchanged unless there is a strong reason

- 60s duration and all scene time windows.
- `class="clip"`, `data-start`, `data-duration`, `data-track-index` structure.
- `.scene-inner` wrappers.
- Local fonts and vendored GSAP.
- No ScrollTrigger.
- No infinite repeats.
- No runtime random image providers.
- `window.__timelines["main"] = tl`.

## Change these for every serious reuse

- `frame.md` visual identity.
- `variables.json` content contract.
- visible text in `index.html`.
- visual props in every scene where the old domain would still be visible.
- CTA and attribution/footer.

## Stale prop audit

For a repurposed video, run:

```bash
rg "assets/(portraits|archive|artwork|qr).*\.(jpg|jpeg|png)" index.html
```

If it returns old NOEMA assets, either replace them or document why they remain semantically justified. For the original NOEMA gold sample, those references are expected.

## Common failure modes

### Failure: only text changed

Symptom: the video technically says the new topic but still feels like NOEMA.

Fix: redo the prop map. Replace visual evidence.

### Failure: variables changed but render did not change

Symptom: `variables.json` updated, but video still shows old copy.

Fix: current template is static-first. Edit `index.html` too. `variables.json` is the prep sheet, not automatic binding.

### Failure: inspect flood

Symptom: `inspect` reports many overlaps in giant poster typography.

Fix: classify each finding. Intentional poster overlap can be marked with `data-layout-allow-occlusion` or `data-layout-allow-overlap`; real unreadable copy should be redesigned.

### Failure: version drift

Symptom: bare `npx hyperframes` uses a newer version than the project was validated against.

Fix: use `npx hyperframes@0.6.121` or add a local package pin in the copied project.
