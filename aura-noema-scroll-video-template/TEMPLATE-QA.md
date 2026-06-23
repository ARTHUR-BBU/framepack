# NOEMA Template QA Checklist

Use this file before saying a NOEMA-based render is ready.

## Rule zero: pin the CLI

Do not use bare `npx hyperframes` for acceptance checks. It can resolve to the latest version and drift away from the template support window.

Use:

```bash
npx hyperframes@0.6.121 <command>
```

## Static checks

Run from the template or copied project root:

```bash
npx hyperframes@0.6.121 lint
npx hyperframes@0.6.121 validate
npx hyperframes@0.6.121 inspect --samples 15
```

Interpretation:

- `lint`: must have 0 errors. Known non-blocking GSAP Studio warnings should be recorded, not hidden.
- `validate`: runtime errors must be 0. Contrast warnings may be intentional in this poster style, but record the count.
- `inspect`: real layout errors must be fixed. Intentional poster overlap/occlusion must be marked explicitly with `data-layout-allow-*` on the specific poster word, card stack, decorative layer, or known overlapping element. Do not place layout allow attributes on every `.scene-inner`; that hides future real regressions.

## Render and media proof

```bash
mkdir -p dist
npx hyperframes@0.6.121 render --output dist/noema-scroll-template.mp4
ffprobe -v error -select_streams v:0 \
  -show_entries stream=width,height,r_frame_rate,avg_frame_rate,nb_frames,duration \
  -show_entries format=duration,size \
  -of json dist/noema-scroll-template.mp4
```

Expected:

```text
duration = 60.000000
width = 1920
height = 1080
r_frame_rate = 30/1
avg_frame_rate = 30/1
nb_frames = 1800
size > 0
```

## Stale source-domain asset audit

For repurposed outputs, check that old visual props are gone or justified:

```bash
rg "assets/(portraits|archive|artwork|qr).*\.(jpg|jpeg|png)" index.html
```

For the original NOEMA gold sample, matches are expected.

For a reused engineering/product/methodology video, matches should usually be zero. If matches remain, document why they are semantically justified.

## Snapshot / contact sheet check

Minimum visual proof for a 60s reuse:

- 1 frame from loader / opening
- 1 frame from hero
- 1 frame from product / core pair
- 1 frame from archive / grid
- 1 frame from board/support
- 1 frame from final CTA

If `vision_analyze` is unavailable or unstable, use a contact sheet and local file checks. Do not invent visual results.

## Repurposing acceptance checklist

- [ ] New topic is visible in loader/hero/final CTA.
- [ ] Every scene has a new-story role in the mapping table.
- [ ] Copy changed beyond surface labels.
- [ ] Props changed where old-domain visuals would dominate.
- [ ] `frame.md` matches the new visual direction.
- [ ] `variables.json` records the new content contract.
- [ ] `index.html` actually reflects the variables / content choices.
- [ ] No runtime CDN fonts or scripts were introduced.
- [ ] No random remote image providers were introduced.
- [ ] Root composition still has `data-duration="60"`.
- [ ] All 11 scenes remain `class="clip"` with timing attributes.
- [ ] `window.__timelines["main"] = tl` still exists.

## Report template

```text
NOEMA Template QA Report

Project:
HyperFrames CLI:
Output file:

Static checks:
- lint:
- validate:
- inspect:

Media proof:
- duration:
- resolution:
- fps:
- frame count:
- size:

Prop audit:
- stale NOEMA asset refs:
- remaining refs justified?:

Visual QA:
- contact sheet / frames:
- theme readability:
- main issues:

Verdict:
- PASS / WARN / FAIL
```

## Severity guide

- P0: render fails, wrong duration/fps/resolution/frame count, missing timeline registration, black screen, stale random remote assets.
- P1: inspect real text occlusion, old-domain props dominate a new-domain reuse, variable contract contradicts HTML.
- P2: contrast warnings in intentional poster layers, small text readability issues, missing contact sheet.
- P3: docs wording drift, optional asset manifest metadata gaps.
