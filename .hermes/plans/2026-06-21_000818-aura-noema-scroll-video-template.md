# Aura NOEMA Scroll Site Video Template Implementation Plan

> **For Hermes:** Use execution skill / task-by-task implementation after user approval. This plan is planning only; do not implement until approved.

**Goal:** Build a 60-second HyperFrames video template that converts the provided NOEMA.ART GSAP ScrollTrigger landing page into a deterministic, editable, renderable linear video composition.

**Architecture:** First create a gold-sample “director’s cut” template, not a generic converter. The source website’s scroll sections become HyperFrames clips with fixed time windows; ScrollTrigger scrub progress becomes GSAP timeline time. Assets are frozen locally so renders are deterministic. The later “direction C / template engine” work is captured as follow-up tasks, not implemented in this first build.

**Tech Stack:** HyperFrames HTML composition, GSAP timeline without ScrollTrigger, local static CSS, local assets, `npx hyperframes lint/validate/render`, `ffprobe`.

---

## 0. Source design reference

Primary design doc:

- `F:\hyperframes\.hermes\designs\2026-06-20--aura-noema-scroll-site-to-video-template.md`

Provided source HTML describes:

- Brand: `NOEMA.ART`
- Tagline: `Where your practice lives`
- Fonts: Anton / Inter / Caveat
- Colors:
  - Indigo `#4F46E5`
  - Emerald `#10B981`
  - Rose `#F43F5E`
  - Black `#050505`
  - White `#ffffff`
  - Paper `#f4efe7`
- Sections:
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

Target template directory:

- `F:\hyperframes\aura-noema-scroll-video-template\`

---

## 1. Non-negotiable HyperFrames guardrails

Every implementation step must preserve these rules:

1. Root composition must explicitly set `data-duration="60"`.
2. Every scene container must use `class="clip"`, `data-start`, `data-duration`, `data-track-index`.
3. Do not animate clip root opacity / transform / filter. Animate `.scene-inner` or descendants.
4. Do not manually add non-media `data-hf-id`.
5. Avoid `<img>` for decorative/logo/avatar/gallery images where possible; use `div + background-image` to prevent HyperFrames media auto-management surprises.
6. Font family declarations must use literal names, not CSS variables.
7. Register `window.__timelines["main"] = tl` synchronously.
8. No `repeat: -1`; calculate finite repeat counts.
9. No `Math.random()`, `Date.now()`, runtime nondeterminism.
10. No external random image providers at render time.
11. No ScrollTrigger in final composition.
12. Run validation before claiming done.

---

## 2. Target time windows

Use these exact first-pass windows:

| Scene | Start | Duration | End |
|---|---:|---:|---:|
| loader | 0.00 | 3.20 | 3.20 |
| hero | 3.20 | 4.78 | 7.98 |
| interlude | 7.98 | 4.78 | 12.76 |
| product | 12.76 | 6.25 | 19.01 |
| manifesto | 19.01 | 6.25 | 25.26 |
| archive | 25.26 | 6.98 | 32.24 |
| builder | 32.24 | 6.62 | 38.86 |
| board | 38.86 | 6.25 | 45.11 |
| support | 45.11 | 6.25 | 51.36 |
| cta-build | 51.36 | 5.88 | 57.24 |
| join | 57.24 | 2.76 | 60.00 |

If the final CTA feels too short during visual review, adjust by stealing time from board/support, not loader/hero/archive.

---

## 3. Task list

### Task 1: Initialize project directory

**Objective:** Create a clean workspace for the NOEMA video template.

**Files:**
- Create directory: `F:\hyperframes\aura-noema-scroll-video-template\`
- Create directory: `F:\hyperframes\aura-noema-scroll-video-template\assets\`
- Create directory: `F:\hyperframes\aura-noema-scroll-video-template\assets\portraits\`
- Create directory: `F:\hyperframes\aura-noema-scroll-video-template\assets\archive\`
- Create directory: `F:\hyperframes\aura-noema-scroll-video-template\assets\artwork\`
- Create directory: `F:\hyperframes\aura-noema-scroll-video-template\assets\qr\`
- Create directory: `F:\hyperframes\aura-noema-scroll-video-template\.hyperframes\`

**Commands:**

```bash
cd /f/hyperframes
mkdir -p aura-noema-scroll-video-template/assets/{portraits,archive,artwork,qr,icons}
mkdir -p aura-noema-scroll-video-template/.hyperframes
```

**Verification:**

```bash
test -d aura-noema-scroll-video-template/.hyperframes && echo OK
```

Expected: `OK`

**Commit:** No commit yet; commit after initial template skeleton is created.

---

### Task 2: Create `frame.md`

**Objective:** Freeze the visual identity before writing HTML.

**Files:**
- Create: `F:\hyperframes\aura-noema-scroll-video-template\frame.md`

**Content:**

```markdown
# NOEMA.ART Visual Frame

## Brand

name: NOEMA.ART
tagline: Where your practice lives
concept: A bold artist portfolio OS presented as a scrolling poster-film.

## Colors

primary: "#4F46E5"      # Indigo
secondary: "#10B981"    # Emerald
accent: "#F43F5E"       # Rose
black: "#050505"
white: "#ffffff"
paper: "#f4efe7"

## Typography

heading: "Anton"
body: "Inter"
handwritten: "Caveat"

## Motion

energy: high
signature: pinned-scroll converted to linear editorial video pacing
easing:
  entrance: expo.out
  structural: none
  accent: power3.out

## Atmosphere

Brutalist grid, oversized poster typography, stark art-world contrast, profile cards, gallery archive, digital wallet pass, community board, support notification, final creation CTA.

## Avoid

- soft SaaS gradients
- generic blue startup UI
- slow corporate dissolve pacing
- random external image dependencies
- browser chrome or webpage-recording feel
```

**Verification:**

Read the file and confirm exact hex values and literal font names are present.

---

### Task 3: Create `variables.json`

**Objective:** Store editable template data separately from layout code.

**Files:**
- Create: `F:\hyperframes\aura-noema-scroll-video-template\variables.json`

**Content:**

```json
{
  "brand_name": "NOEMA.ART",
  "tagline": "Where your practice lives",
  "cta_label": "Create Card",
  "email": "hello@noema.art",
  "featured_artist": {
    "name": "Leigh Witherell",
    "role": "Painter",
    "location": "London"
  },
  "support": {
    "amount": "$25",
    "supporter": "Maya Chen",
    "message": "For your studio practice"
  },
  "board_cards": [
    { "type": "Exhibition", "title": "Open Call:\nNew Forms", "location": "Montréal", "date": "Aug 12" },
    { "type": "Community", "title": "Studio Visit\nNight", "location": "Toronto", "date": "Jul 04" },
    { "type": "Funding", "title": "Emerging\nArtist Grant", "location": "Online", "date": "Sep 18" },
    { "type": "Collab", "title": "Print\nExchange", "location": "Brooklyn", "date": "Jul 22" },
    { "type": "Residency", "title": "Quiet Room\nProgram", "location": "Copenhagen", "date": "Oct 08" },
    { "type": "Mentorship", "title": "Crit Circle\nOnline", "location": "Remote", "date": "Aug 01" },
    { "type": "Studio", "title": "Shared\nPress Wall", "location": "Paris", "date": "Jul 30" }
  ]
}
```

**Verification:**

```bash
python -m json.tool aura-noema-scroll-video-template/variables.json >/tmp/noema-vars.json && echo OK
```

Expected: `OK`

---

### Task 4: Freeze remote assets locally

**Objective:** Replace random/external render-time image dependencies with local files.

**Files:**
- Create: `assets/manifest.json`
- Create local image files under:
  - `assets/portraits/`
  - `assets/archive/`
  - `assets/artwork/`
  - `assets/qr/`

**Asset source list from source HTML:**

Portraits:

```text
https://i.pravatar.cc/300?img=12
https://i.pravatar.cc/300?img=47
https://i.pravatar.cc/300?img=15
https://i.pravatar.cc/300?img=32
https://i.pravatar.cc/300?img=5
https://i.pravatar.cc/300?img=58
https://i.pravatar.cc/300?img=23
https://i.pravatar.cc/300?img=68
```

Artwork / archive:

```text
https://picsum.photos/seed/glassroom/300/300
https://picsum.photos/seed/noema-hero-art/500/280
https://picsum.photos/seed/noema-a1/120/120
https://picsum.photos/seed/noema-a2/120/120
https://picsum.photos/seed/noema-a3/120/120
https://picsum.photos/seed/archive-01/480/600
...
https://picsum.photos/seed/archive-15/480/600
https://picsum.photos/seed/build-a/120/120
https://picsum.photos/seed/build-b/120/120
https://picsum.photos/seed/build-c/120/120
https://picsum.photos/seed/build-d/120/120
```

QR:

```text
https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/917d6f93-fb36-439a-8c48-884b67b35381_1600w.jpg
```

**Implementation guidance:**

Use a Python downloader with:

- timeout
- retry
- content-type check
- sha256 hash
- deterministic filenames
- manifest with `source_url`, `local_path`, `sha256`, `risk`

Risk labels:

- `random_provider` for pravatar
- `seeded_placeholder` for picsum seeded URLs
- `remote_static` for Supabase QR

**Verification:**

```bash
python - <<'PY'
import json, pathlib
m=json.loads(pathlib.Path('aura-noema-scroll-video-template/assets/manifest.json').read_text())
missing=[a for a in m['assets'] if not pathlib.Path('aura-noema-scroll-video-template', a['local_path']).exists()]
print('assets', len(m['assets']))
print('missing', len(missing))
assert not missing
PY
```

Expected:

```text
assets <non-zero>
missing 0
```

**Fallback if network fails:**

Use generated CSS placeholder blocks for first pass, but mark them explicitly in `assets/manifest.json` with `risk: "placeholder_due_to_network"`. Do not claim asset freeze is complete until real files exist.

---

### Task 5: Create `.hyperframes/expanded-prompt.md`

**Objective:** Convert the design into a scene-level production brief consumed by the HTML implementation.

**Files:**
- Create: `F:\hyperframes\aura-noema-scroll-video-template\.hyperframes\expanded-prompt.md`

**Required sections:**

1. Title and visual identity
2. Rhythm declaration
3. Time windows table
4. Per-scene beats
5. Recurring motifs
6. Negative prompt
7. Execution Manifest

**Rhythm declaration:**

```text
loader-REVEAL / hero-SPREAD / interlude-SWEEP / product-CONVERGE / manifesto-ORDER / archive-BLOOM / builder-ASSEMBLE / board-GATHER / support-CONFIRM / CTA-TRIPLE-HIT / final-HOLD
```

**Execution Manifest requirements:**

- Scenes may be HANDWRITE because source motion is already GSAP and no Framepack weapon has been selected yet.
- If using any Framepack weapon later, list it explicitly before implementation.
- Mention HyperFrames structural rules.

**Verification:**

Read the file and confirm all 11 scenes are present.

---

### Task 6: Create static `index.html` skeleton

**Objective:** Build the end-state layout before adding animation.

**Files:**
- Create: `F:\hyperframes\aura-noema-scroll-video-template\index.html`

**Skeleton requirements:**

- `<!doctype html>`
- `<html data-composition-variables='[...]'>`
- root composition with `data-composition-id="main"`, `data-width="1920"`, `data-height="1080"`, `data-duration="60"`
- 11 `section.clip` elements
- each scene has `.scene-inner`
- all CSS inline in `<style>` for first pass
- no ScrollTrigger
- no Tailwind CDN
- no lucide CDN
- no Google Fonts CDN in final render path unless HyperFrames supports it reliably; prefer built-in/local fonts

**Scene IDs:**

```text
scene-loader
scene-hero
scene-interlude
scene-product
scene-manifesto
scene-archive
scene-builder
scene-board
scene-support
scene-cta-build
scene-join
```

**Verification:**

Search checks:

```bash
grep -n 'data-composition-id="main"' index.html
grep -n 'data-duration="60"' index.html
grep -c 'class="clip"' index.html
```

Expected:

- main exists
- duration exists
- clip count is 11

---

### Task 7: Replace source icons with inline SVG / CSS marks

**Objective:** Avoid runtime dependency on `lucide`.

**Files:**
- Modify: `index.html`

**Icons needed:**

- arrow-up-right
- arrow-down
- wallet
- menu if nav retained
- scan-line
- scan-face
- sparkles
- instagram/linkedin/youtube/at-sign can be simplified to text/social dots in first pass

**Implementation guidance:**

Create small inline SVG snippets or simple CSS glyphs.

Example:

```html
<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
  <path d="M7 17L17 7"></path>
  <path d="M8 7h9v9"></path>
</svg>
```

**Verification:**

```bash
grep -n 'data-lucide\|lucide\|unpkg' index.html || true
```

Expected: no matches.

---

### Task 8: Add deterministic GSAP timeline

**Objective:** Recreate the website’s motion as a fixed 60-second video timeline.

**Files:**
- Modify: `index.html`

**Implementation guidance:**

At the bottom, use the vendored local GSAP runtime. Do not introduce a render-time CDN dependency:

```html
<script src="assets/vendor/gsap-3.14.2.min.js"></script>
<script>
window.__timelines = window.__timelines || {};
const tl = gsap.timeline({ paused: true });

// timeline helpers and scene constants

window.__timelines["main"] = tl;
</script>
```

Also register the vendored runtime in `assets/vendor/manifest.json` with version, source URL, sha256, byte size, and usage.

Scene constants:

```js
const S = {
  loader: { start: 0.00, dur: 3.20 },
  hero: { start: 3.20, dur: 4.78 },
  interlude: { start: 7.98, dur: 4.78 },
  product: { start: 12.76, dur: 6.25 },
  manifesto: { start: 19.01, dur: 6.25 },
  archive: { start: 25.26, dur: 6.98 },
  builder: { start: 32.24, dur: 6.62 },
  board: { start: 38.86, dur: 6.25 },
  support: { start: 45.11, dur: 6.25 },
  cta: { start: 51.36, dur: 5.88 },
  join: { start: 57.24, dur: 2.76 }
};
```

Do not use `ScrollTrigger`.

**Motion mapping:**

- loader: copy on-load intro structure with duration scaled to 3.2s
- hero: card spread + hero word scale/y + hero copy fade
- interlude: artists word horizontal sweep + brush motion
- product: wallet/phone converge
- manifesto: words from messy starts to clean line + finally reveal
- archive: center stack to grid bloom
- builder: builder card slides in + modules assemble
- board: op cards gather
- support: three panels + notification card
- cta-build: SEEN/SAVED/SUPPORTED sweep with wipes
- join: CREATE hold + member pop + your card reveal + hand arrow draw

**Verification:**

Search checks:

```bash
grep -n 'ScrollTrigger\|repeat: -1\|Math.random\|Date.now' index.html || true
grep -n 'window.__timelines\["main"\]' index.html
```

Expected:

- no ScrollTrigger/repeat -1/random/Date.now
- timeline registration present

---

### Task 9: Run first HyperFrames lint / validate

**Objective:** Catch structural errors before rendering.

**Files:**
- No file edits unless lint/validate reveals issues.

**Commands:**

```bash
cd /f/hyperframes/aura-noema-scroll-video-template
npx hyperframes lint
npx hyperframes validate
```

**Expected:**

- `lint` exits 0
- `validate` exits 0 or only emits justified warnings

If warnings appear:

- font mapping warnings: fix literal font names or local fonts
- contrast warnings: adjust colors within palette
- data-hf-id issues: strip accidental non-media IDs
- nondeterministic code: replace with constants

---

### Task 10: Render first MP4 and verify with ffprobe

**Objective:** Produce a real video artifact and verify duration/resolution.

**Files:**
- Create: `F:\hyperframes\aura-noema-scroll-video-template\dist\noema-scroll-template.mp4`

**Commands:**

```bash
cd /f/hyperframes/aura-noema-scroll-video-template
mkdir -p dist
npx hyperframes render --output dist/noema-scroll-template.mp4
ffprobe -v error -show_entries format=duration,size -show_streams dist/noema-scroll-template.mp4
```

**Expected:**

- render exits 0
- duration around 60 seconds
- size > 0
- resolution 1920x1080 unless intentionally changed

---

### Task 11: Visual QA screenshots / inspect

**Objective:** Confirm the video is not black, not missing major elements, and has readable scenes.

**Commands:**

```bash
cd /f/hyperframes/aura-noema-scroll-video-template
npx hyperframes inspect --samples 15
```

If available, also use screenshot/snapshot tooling at key timestamps:

```text
1.0 loader
5.5 hero
10.0 interlude
16.0 product
22.0 manifesto
29.0 archive
35.0 builder
42.0 board
48.0 support
54.0 cta
58.5 final
```

**Acceptance checks:**

- Loader text visible
- Hero cards visible
- ARTISTS & CURATORS sweep visible
- Wallet and phone visible
- Manifesto words readable at settle moment
- Archive grid has 15 cells visible
- Builder card readable
- Board cards not overlapping badly
- Support notification visible
- SEEN/SAVED/SUPPORTED readable during sweep
- Final CREATE / your card readable

---

### Task 12: Fix visual/layout issues

**Objective:** Resolve QA findings without expanding scope.

**Likely fixes:**

- Increase font sizes if video readability is weak
- Add padding to avoid edge clipping
- Slow down archive bloom if unreadable
- Extend final CTA by 0.5-1s if too short
- Use background-image divs if `<img>` visibility issues appear
- Adjust z-index if cards disappear behind backgrounds

**Verification:**

Re-run:

```bash
npx hyperframes lint
npx hyperframes validate
npx hyperframes render --output dist/noema-scroll-template.mp4
ffprobe -v error -show_entries format=duration,size -show_streams dist/noema-scroll-template.mp4
```

Expected: clean structural validation and real MP4 output.

---

### Task 13: Document template usage

**Objective:** Make the template reusable by future agents/users.

**Files:**
- Create: `F:\hyperframes\aura-noema-scroll-video-template\README.md`

**Required sections:**

- What this template is
- How to render
- How to edit text/colors
- Where assets live
- Known constraints
- Direction C follow-up note

**Render command in README:**

```bash
cd /f/hyperframes/aura-noema-scroll-video-template
npx hyperframes render --output dist/noema-scroll-template.mp4
```

---

### Task 14: Direction C follow-up notes

**Objective:** Preserve the engine-track learnings without implementing them prematurely.

**Files:**
- Create: `F:\hyperframes\aura-noema-scroll-video-template\.hyperframes\direction-c-template-engine-notes.md`

**Content outline:**

1. What was manually extracted from NOEMA source
2. Which extraction steps were mechanical
3. Which steps required director judgment
4. Candidate modules:
   - site intake
   - scroll story parser
   - scene ledger generator
   - asset registry
   - HyperFrames seed generator
5. What not to automate yet
6. First parser target: GSAP ScrollTrigger object-literal configs

**Important:** This file is notes only. Do not build the engine in this task.

---

### Task 15: Final verification and commit

**Objective:** Commit only after real verification evidence exists.

**Required skill before claiming completion:**

- Load `verification-before-completion`

**Commands:**

```bash
cd /f/hyperframes/aura-noema-scroll-video-template
npx hyperframes lint
npx hyperframes validate
npx hyperframes render --output dist/noema-scroll-template.mp4
ffprobe -v error -show_entries format=duration,size -show_streams dist/noema-scroll-template.mp4
```

Then from repo root:

```bash
cd /f/hyperframes
git status -s
git add aura-noema-scroll-video-template .hermes/designs/2026-06-20--aura-noema-scroll-site-to-video-template.md .hermes/plans/2026-06-21_000818-aura-noema-scroll-video-template.md
git commit -m "feat(video-template): convert NOEMA scroll site into HyperFrames template"
```

**Final report must include:**

- Files created
- Render output path
- lint result
- validate result
- ffprobe duration/size/resolution
- Known limitations
- Direction C notes path

---

## 4. Risks and mitigations

### Risk: HyperFrames CLI unavailable or command differs

Mitigation:

- Run `npx hyperframes --help` or `npx hyperframes doctor` before implementation if commands fail.
- If `init --example blank` is needed, use it in the project directory and preserve planned files.

### Risk: Google fonts are unavailable in render

Mitigation:

- Prefer HyperFrames built-in supported fonts if available.
- If Anton/Caveat unavailable, download local `.woff2` files or choose closest built-in fallback, but document the substitution.

### Risk: Remote asset download fails

Mitigation:

- Retry.
- Check local proxy environment if needed.
- If still blocked, create placeholders and mark manifest risk clearly; do not claim final asset freeze.

### Risk: Original page depends on Tailwind utility classes

Mitigation:

- Do not carry Tailwind CDN.
- Port only the used styles into static CSS.

### Risk: First render is visually too dense

Mitigation:

- Keep scene count but simplify internal content density.
- Prioritize readability over exact source fidelity.

---

## 5. Open questions for user review

These do not block first implementation, but should be reviewed after first render:

1. Keep target as 1920×1080 landscape, or also create 1080×1920 portrait variant later?
2. Should the final video preserve English copy only, or make a bilingual/Chinese-localized variant?
3. Should NOEMA remain a fictional sample brand, or should variables be generalized immediately for a different real brand?
4. Should direction C become a Framepack plugin feature after this gold sample, or remain a local experimental pipeline first?

---

## 6. Recommended execution mode

Execute in this order:

1. Build local deterministic template.
2. Render and visually QA.
3. Fix layout/motion issues.
4. Document usage.
5. Write direction C notes.
6. Commit.

Do not start the generic parser/engine in this implementation pass.

The win condition is a beautiful, verified gold sample that later justifies direction C.
