# Direction C: Scroll Site → Video Template Engine Notes

Status: follow-up notes only. Do not implement the generic engine in the NOEMA gold-sample task.

## 1. What was manually extracted from the NOEMA source

The gold sample required these manual extraction steps:

1. Identify product story sections:
   - loader
   - hero
   - interlude
   - product
   - manifesto
   - archive
   - builder
   - board
   - support
   - cta-build
   - join

2. Extract visual identity:
   - brand name `NOEMA.ART`
   - tagline `Where your practice lives`
   - palette `#4F46E5`, `#10B981`, `#F43F5E`, `#050505`, `#ffffff`, `#f4efe7`
   - type roles Anton / Inter / Caveat

3. Convert ScrollTrigger progress into fixed scene time windows:
   - scroll weights from section end lengths became proportional durations
   - loader remained a fixed 3.2s intro
   - total runtime set to 60s

4. Separate story motion from webpage interaction:
   - scroll scrub became timeline progress
   - pinning became clip time windows
   - hover/click/login/nav behavior was dropped or visualized
   - final CTA became a video hold, not an interactive button

5. Freeze runtime assets:
   - pravatar portraits
   - picsum seeded placeholders
   - Supabase QR image
   - Google fonts as local woff2 files

6. Rebuild structural HTML for HyperFrames:
   - root composition
   - 11 clip scenes
   - `.scene-inner` wrappers
   - div background images instead of img media elements
   - no ScrollTrigger
   - no runtime random providers

7. Recreate motion as deterministic GSAP:
   - one paused timeline
   - fixed absolute timestamps
   - no infinite repeat
   - no runtime nondeterminism

## 2. Which extraction steps were mechanical

These can become engine modules:

### 2.1 Section inventory

Detect DOM sections by:

- `section` tags
- major `id` attributes
- ScrollTrigger `trigger` selectors
- pinned element boundaries
- high-level React component blocks when source maps or bundle snippets are available

Output candidate:

```json
{
  "sections": [
    { "id": "hero", "selector": "#hero", "order": 1 },
    { "id": "product", "selector": "#product", "order": 3 }
  ]
}
```

### 2.2 ScrollTrigger parser

Parse object literals containing:

- `trigger`
- `start`
- `end`
- `scrub`
- `pin`
- timeline tween targets
- tween vars

First parser target should be GSAP ScrollTrigger object-literal configs, not arbitrary JS execution.

Output candidate:

```json
{
  "trigger": "#hero",
  "start": "top top",
  "end": "+=130%",
  "scrub": 1,
  "pin": true,
  "scroll_weight": 130
}
```

### 2.3 Time window generation

Convert scroll weights to runtime:

```text
scene_duration = available_video_duration * scroll_weight / total_scroll_weight
```

Inputs:

- target duration
- fixed intro duration
- section weights

Outputs:

- start
- duration
- end
- scene role

### 2.4 Asset registry

Mechanical pipeline:

1. collect URLs from HTML/CSS/JS
2. classify source risk
3. download with timeout/retry
4. content-type check
5. sha256 hash
6. write manifest
7. rewrite references to local paths

Risk labels from NOEMA sample:

- `random_provider`
- `seeded_placeholder`
- `remote_static`
- `font_remote_css`
- `font_remote_file`

### 2.5 HyperFrames seed generation

Mechanical outputs:

- `frame.md`
- `.hyperframes/expanded-prompt.md`
- `scene-ledger.json`
- `assets/manifest.json`
- possibly an initial static `index.html` skeleton

## 3. Which steps required director judgment

These should not be automated too early:

1. Choosing the final runtime.
   - 45s, 60s, 75s, and 90s all imply different editorial priorities.
   - NOEMA chose 60s as a balanced gold sample.

2. Deciding which web interactions matter.
   - Login/nav/hover are not meaningful in a linear video.
   - CTA is meaningful but must become visual narrative.

3. Compressing dense webpage copy.
   - Web copy can be paused and read.
   - Video copy must become big readable beats.

4. Rebalancing scenes.
   - Archive and final CTA need more breathing room than raw scroll math may suggest.

5. Translating webpage UI into video-safe composition.
   - A literal DOM copy often feels like a browser recording.
   - A director's cut must use poster composition and cinematic beat structure.

6. Deciding what is intentional overflow.
   - Giant cropped type is a visual style, not a layout bug.
   - The engine can detect it, but a human/director should classify it.

## 4. Candidate engine modules

### Module A: Site Intake

Responsibilities:

- fetch URL or accept pasted HTML/source bundle
- save raw source snapshot
- detect framework/animation stack
- collect asset URLs
- identify external runtime dependencies

Potential files:

```text
.hyperframes/site-intake/source.html
.hyperframes/site-intake/source-bundle.js
.hyperframes/site-intake/tech-stack.json
.hyperframes/site-intake/raw-assets.json
```

### Module B: Scroll Story Parser

Responsibilities:

- parse ScrollTrigger configs
- map triggers to DOM sections
- extract scroll weights
- list animated targets and properties
- detect pinned/scrubbed sections

Output:

```text
.hyperframes/scroll-story.json
```

### Module C: Scene Ledger Generator

Responsibilities:

- convert scroll weights to time windows
- assign scene IDs
- classify scene role
- write exact HyperFrames time windows

Output:

```text
.hyperframes/scene-ledger.json
```

Candidate schema:

```json
{
  "duration": 60,
  "scenes": [
    {
      "id": "scene-hero",
      "source_section": "#hero",
      "start": 3.2,
      "duration": 4.78,
      "end": 7.98,
      "role": "hero-card-spread",
      "scroll_weight": 130
    }
  ]
}
```

### Module D: Asset Registry

Responsibilities:

- download assets
- hash and dedupe
- classify risk
- rewrite to local references
- report missing assets
- preserve source URL provenance

Output:

```text
assets/manifest.json
assets/fonts/manifest.json
```

### Module E: HyperFrames Seed Generator

Responsibilities:

- create `frame.md`
- create `.hyperframes/expanded-prompt.md`
- create an initial `index.html` skeleton
- insert clip windows
- optionally insert placeholder cards/images/text

Important: this module should generate seeds, not pretend to fully solve creative direction.

### Module F: Director Audit

Responsibilities:

- flag scenes that are likely too dense
- flag text too small for video
- flag interactions that do not translate linearly
- flag intentional giant text overflow requiring human approval
- suggest runtime variants: 45s / 60s / 75s / 90s

## 5. What not to automate yet

Do not automate these in the first engine iteration:

1. Arbitrary JS execution and semantic animation understanding.
2. Full React/Vue/Svelte component reconstruction.
3. Perfect GSAP timeline migration from all possible code styles.
4. Visual taste decisions like “make it more cinematic”.
5. Automatic brand strategy from arbitrary marketing copy.
6. Dynamic form/product/dashboard behavior.
7. Audio/music selection.

The first valuable engine should be a “scroll story compiler assistant,” not a magic website-to-video machine.

## 6. First parser target

Start with the constrained case:

```text
GSAP + ScrollTrigger + section-based landing page + pinned scrubbed timelines
```

Why:

- NOEMA fits this pattern.
- Many high-end interactive sites fit this pattern.
- ScrollTrigger configs expose exactly the data needed for scene ledgers.
- It avoids over-generalizing into all websites.

Initial parser should detect:

```js
gsap.timeline({
  scrollTrigger: {
    trigger: '#hero',
    start: 'top top',
    end: '+=130%',
    scrub: 1,
    pin: true
  }
})
```

And output:

```json
{
  "source": "ScrollTrigger",
  "trigger": "#hero",
  "weight": 130,
  "pinned": true,
  "scrubbed": true
}
```

## 7. Product principle

Direction C should not replace the director.

It should do the boring extraction work:

- find sections
- parse scroll weights
- freeze assets
- generate ledgers
- produce seed files

The director still decides:

- which story matters
- what to cut
- how fast it should feel
- what should become a video beat
- what should be dropped as web-only interaction

This is the same principle as Framepack itself:

```text
Website source = raw material
Template engine = assistant director / continuity clerk
HyperFrames = studio
Human/agent director = final cut
```

## 8. Recommended next milestone after NOEMA

After this gold sample is accepted:

1. Pick two more GSAP ScrollTrigger sites.
2. Manually build scene ledgers for them.
3. Compare repeated extraction steps.
4. Only then implement Module A/B/C.
5. Keep asset registry as the first hard requirement because deterministic render is non-negotiable.

The win condition for Direction C v0 is not full auto-generation.

The win condition is:

```text
Given a ScrollTrigger landing page, produce a trustworthy scene ledger + frozen asset manifest + HyperFrames seed brief in minutes instead of hours.
```
