# NOEMA.ART Scroll Site → 60s HyperFrames Video Template

## Visual Identity

Use exact values from `frame.md`:

- Indigo: `#4F46E5`
- Emerald: `#10B981`
- Rose: `#F43F5E`
- Black: `#050505`
- White: `#ffffff`
- Paper: `#f4efe7`
- Heading: `Anton`
- Body: `Inter`
- Handwritten: `Caveat`

The film should feel like a sequence of brutalist digital posters: oversized type, grid lines, profile cards, archive images, wallet pass UI, opportunity cards, support notifications, and a final CREATE CTA.

## Rhythm Declaration

`loader-REVEAL / hero-SPREAD / interlude-SWEEP / product-CONVERGE / manifesto-ORDER / archive-BLOOM / builder-ASSEMBLE / board-GATHER / support-CONFIRM / CTA-TRIPLE-HIT / final-HOLD`

## HyperFrames Time Windows

| Scene | Start | Duration | Role |
|---|---:|---:|---|
| scene-loader | 0.00 | 3.20 | brand loading reveal |
| scene-hero | 3.20 | 4.78 | portfolio cards hero |
| scene-interlude | 7.98 | 4.78 | audience sweep |
| scene-product | 12.76 | 6.25 | wallet pass + phone product |
| scene-manifesto | 19.01 | 6.25 | scattered practice words gather |
| scene-archive | 25.26 | 6.98 | archive grid bloom |
| scene-builder | 32.24 | 6.62 | profile builder assembly |
| scene-board | 38.86 | 6.25 | community board gather |
| scene-support | 45.11 | 6.25 | support flow confirmation |
| scene-cta-build | 51.36 | 5.88 | SEEN / SAVED / SUPPORTED triple hit |
| scene-join | 57.24 | 2.76 | final create CTA hold |

## Per-scene Beats

### 0. Loader / REVEAL

Concept: NOEMA.ART appears as a gallery system booting up.

Layers:
- BG: black field + white grid
- MG: NOEMA.ART wordmark, infinity mark, loading meta
- FG: scanline + seven color strips

Animation:
- Infinity paths draw in.
- Letters rise from below with stagger.
- Meta text fades up.
- Color strips scale vertically and wipe the loader away.

### 1. Hero / SPREAD

Concept: Three artist cards float in a purple poster field.

Layers:
- BG: indigo grid + giant NOEMA.ART ghost word
- MG: three profile cards, center card dominant
- FG: bottom copy and arrow marker

Animation:
- Cards enter from below.
- During scene progress, side cards drift outward, center card lifts and scales.
- Hero word pushes slightly forward.
- Bottom copy leaves early to clear the frame.

### 2. Interlude / SWEEP

Concept: The platform names its people: ARTISTS & CURATORS.

Layers:
- BG: emerald grid
- MG: huge black horizontal wordmark
- FG: indigo brush oval + rose soft circle + bottom explanatory copy

Animation:
- Giant word sweeps horizontally.
- Brush oval expands and rotates.
- Rose circle floats upward.
- Copy rises in and holds.

### 3. Product / CONVERGE

Concept: THE LINK becomes both a wallet pass and a living phone profile.

Layers:
- BG: rose grid + THE LINK ghost word
- MG: wallet pass left, phone mock right
- FG: bottom scan/save/support caption

Animation:
- Wallet pass flies from left/bottom into place.
- Phone flies from right/bottom into place.
- Both settle into slight counter-rotated parallax.
- Background word slowly breathes upward.

### 4. Manifesto / ORDER

Concept: The chaos of creative practice gathers into one living portfolio.

Layers:
- BG: paper field + radial indigo/rose glow + faint word cloud
- MG: ten oversized manifesto words
- FG: hand-written `finally`

Animation:
- Each word starts scattered around the frame.
- Words gather to a centered line cluster.
- `finally` writes/pops in at the emotional settle.

### 5. Archive / BLOOM

Concept: One work becomes a complete archive.

Layers:
- BG: black grid + huge low-opacity ARCHIVE word
- MG: 15 local archive images
- FG: bottom caption and 3×5 gallery note

Animation:
- Images begin as center stack.
- Images bloom outward into grid from center.
- ARCHIVE ghost word shifts subtly.

### 6. Builder / ASSEMBLE

Concept: A profile OS assembles itself in real time.

Layers:
- BG: paper grid + huge BUILD word
- MG: black builder shell with bio/gallery/buttons/wallet modules
- FG: indigo 01 marker and small explanatory copy

Animation:
- Builder shell slides in from right.
- Modules fly in from alternating directions.
- BUILD word drifts behind.

### 7. Board / GATHER

Concept: A community board organizes scattered opportunities.

Layers:
- BG: emerald grid + large BOARD word + dashed paths
- MG: seven opportunity cards
- FG: highlighted rose studio card

Animation:
- Cards start scattered with rotation and opacity.
- They gather into a balanced board.
- Dashed paths remain as connective motif.

### 8. Support / CONFIRM

Concept: Attention becomes direct support.

Layers:
- BG: indigo grid + large SUPPORT word
- MG: three support panels
- FG: white support notification card

Animation:
- Visitor panel enters from left.
- Action panel scales up in center.
- Creator panel enters from right.
- Notification card pops in late as proof of value.

### 9. CTA Build-up / TRIPLE-HIT

Concept: The value proposition lands in three kinetic beats.

Layers:
- BG: black field
- MG: rose and emerald wipe panels
- FG: giant words SEEN, SAVED, SUPPORTED

Animation:
- SEEN sweeps left-to-right then exits.
- Rose wipe rises.
- SAVED rises from below then exits upward.
- Emerald wipe expands left-to-right.
- SUPPORTED rushes in from right and punches out.

### 10. Final / HOLD

Concept: The viewer is invited to create their card.

Layers:
- BG: indigo grid + huge CREATE word
- MG: floating member portraits
- FG: handwritten `your card`, hand arrow, footer links

Animation:
- CREATE rises into frame.
- Member portraits pop in around it.
- `your card` scales and rotates into place.
- Hand arrow draws toward the CTA.
- Final frame holds long enough to read.

## Recurring Motifs

- Brutalist grid overlays
- Giant cropped display words
- Small metadata labels
- Card-like UI panels
- Black/white hard contrast
- Indigo / emerald / rose scene color cycling
- Handwritten accent as human warmth

## Negative Prompt

Avoid:

- browser UI / cursor / scrollbar / webpage recording feeling
- random external images at render time
- subtle web-sized UI text
- slow corporate fades
- low-contrast gray UI
- generic SaaS blue gradients
- ScrollTrigger, `repeat: -1`, `Math.random()`, `Date.now()`

## Execution Manifest

Mode: HANDWRITE for all scenes in this first gold sample because source motion is already expressed as GSAP ScrollTrigger and must be translated into deterministic HyperFrames timeline code.

Mandatory structural rules:

1. Root composition has `data-duration="60"`.
2. Every scene is a `class="clip"` with exact `data-start`, `data-duration`, `data-track-index`.
3. Every scene has `.scene-inner`.
4. Do not animate clip roots.
5. Do not use ScrollTrigger.
6. Do not use non-media `data-hf-id`.
7. Prefer `div + background-image` for decorative images.
8. Register `window.__timelines["main"] = tl` synchronously.
9. Use finite repeats only.
10. Validate with `npx hyperframes lint`, `npx hyperframes validate`, render, and `ffprobe` before completion.
