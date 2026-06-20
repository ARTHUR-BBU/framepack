# NOEMA.ART Scroll Video Template

A 60-second HyperFrames video template converted from a GSAP ScrollTrigger landing page into a deterministic linear video composition.

This is not a webpage recording. It is a director's-cut video template: scroll progress has been mapped to fixed timeline windows, remote assets have been frozen locally, and the final output is editable HTML + GSAP under HyperFrames.

## Render

```bash
cd /f/hyperframes/aura-noema-scroll-video-template
npx hyperframes lint
npx hyperframes validate
npx hyperframes inspect --samples 15
npx hyperframes render --output dist/noema-scroll-template.mp4
ffprobe -v error -show_entries format=duration,size -show_streams dist/noema-scroll-template.mp4
```

Expected output:

- 60.000000 seconds
- 1920x1080
- 30fps
- 1800 frames

## Project files

```text
frame.md                                  visual identity
variables.json                            editable template data
.hyperframes/expanded-prompt.md           production brief + scene beats
.hyperframes/direction-c-template-engine-notes.md  follow-up engine notes
index.html                                HyperFrames composition
assets/manifest.json                      frozen image asset registry
assets/fonts/manifest.json                local font registry
assets/vendor/gsap-3.14.2.min.js          vendored GSAP runtime
assets/vendor/manifest.json               vendored JS dependency registry
dist/noema-scroll-template.mp4            rendered video output, generated locally and not committed
qa/contact-sheet.jpg                      committed key-frame QA contact sheet
```

Note: `qa/contact-sheet.jpg` is kept as lightweight visual evidence. Individual `qa/frame-*.jpg` files and `dist/*.mp4` renders are generated artifacts and are intentionally not committed.

## Scene map

| Scene | Time | Intent |
|---|---:|---|
| loader | 0.00-3.20 | NOEMA.ART boot reveal |
| hero | 3.20-7.98 | artist cards spread |
| interlude | 7.98-12.76 | ARTISTS & CURATORS sweep |
| product | 12.76-19.01 | wallet pass + phone profile |
| manifesto | 19.01-25.26 | scattered practice words gather |
| archive | 25.26-32.24 | 15-image archive bloom |
| builder | 32.24-38.86 | profile modules assemble |
| board | 38.86-45.11 | opportunity cards gather |
| support | 45.11-51.36 | support flow confirmation |
| cta-build | 51.36-57.24 | SEEN / SAVED / SUPPORTED triple hit |
| join | 57.24-60.00 | final CREATE call to action |

## Editing text and content

Start with `variables.json` for the stable editable data model.

For this gold sample, the HTML is still static-first, so changing variables currently means updating matching text in `index.html`. The next abstraction step is Direction C: generate `expanded-prompt.md`, a scene ledger, and eventually a skeleton HTML file from a parsed website intake.

## Editing colors and typography

Use `frame.md` as the source of truth.

Current palette:

- Indigo: `#4F46E5`
- Emerald: `#10B981`
- Rose: `#F43F5E`
- Black: `#050505`
- White: `#ffffff`
- Paper: `#f4efe7`

Fonts are local, not CDN-dependent:

- `assets/fonts/anton.woff2`
- `assets/fonts/inter.woff2`
- `assets/fonts/caveat.woff2`

## Assets

All image assets are frozen locally under `assets/` and registered in `assets/manifest.json` with source URL, sha256, byte size, content type, and risk label.

Risk labels:

- `random_provider`: originally from pravatar, now frozen locally
- `seeded_placeholder`: originally from picsum seeded URLs, now frozen locally
- `remote_static`: originally from Supabase, now frozen locally

Do not reintroduce random external image providers at render time.

## HyperFrames guardrails used

- Root has `data-duration="60"`.
- Every scene is `class="clip"` with `data-start`, `data-duration`, `data-track-index`.
- Every scene has `.scene-inner`.
- Clip roots are not animated.
- No ScrollTrigger in final composition.
- No `repeat: -1`.
- No `Math.random()` or `Date.now()`.
- Decorative images are `div + background-image`, not media clips.
- Giant poster text that intentionally crosses the canvas is marked with `data-layout-allow-overflow`.
- Timeline is registered synchronously as `window.__timelines["main"] = tl`.

## Known constraints

- This is a gold-sample director's cut, not a generic website converter.
- The template is landscape 1920x1080 only.
- Contrast warnings from `validate` may appear for intentional low-opacity ghost text and because the validator samples hidden/off-timeline clip content; lint and inspect should remain clean.
- `variables.json` is a data model seed; index.html is not yet generated from it.
- No audio is included in this first pass.

## Direction C follow-up

The follow-up engine path is documented in:

```text
.hyperframes/direction-c-template-engine-notes.md
```

The intended next product layer is a template engine that can intake GSAP ScrollTrigger sites, parse scroll sections and triggers, create a scene ledger, freeze assets, and generate HyperFrames seed files. This build intentionally stops before that generic parser so the first win remains a beautiful verified gold sample.
