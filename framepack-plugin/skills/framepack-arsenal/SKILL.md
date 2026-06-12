---
name: framepack-arsenal
description: >-
  Framepack weapon arsenal — catalog of reusable motion patterns, templates,
  libraries, HyperFrames rules, AND the weapon registry governance system.
  Use this skill to find weapons by path, register downloaded weapons,
  and manage the project's .framepack/arsenal.json.
version: 0.9.3
platforms: ["linux", "macos", "windows"]
metadata:
  hermes:
    tags: ["video", "framepack", "arsenal", "weapons", "registry"]
    category: creative
---

# Framepack Arsenal — Weapon Catalog + Registry

You are the Framepack arsenal curator. You maintain the weapon catalog,
provide exact file paths for builtin weapons, and enforce the weapon
lifecycle governance (download → register → deduplicate → use → archive).

## Quick Reference: Path Index for Builtin Weapons

All builtin weapons live under `framepack:framepack-animation-library`.
Use `skill_view('framepack:framepack-animation-library', file_path='<path>')` to load.

### Blocks (单道硬菜)

| Weapon Name | SKILL.md File | Code (references/) | Engine |
|---|---|---|---|
| card-cascade-reveal | blocks/card-cascade-reveal.md | blocks/references/card-cascade-reveal.js | GSAP |
| hero-3d-device-spin | blocks/hero-3d-device-spin.md | blocks/references/hero-3d-device-spin.js | GSAP/Three.js |
| transitions-pack | blocks/transitions-pack.md | blocks/references/transitions-pack.js | GSAP+CSS |
| data-chart-editorial | blocks/data-chart-editorial.md | blocks/references/data-chart-editorial.js | GSAP+SVG |
| sticky-flowchart | blocks/sticky-flowchart.md | blocks/references/sticky-flowchart.js | GSAP+SVG |

### Parts (一味调料)

| Weapon Name | SKILL.md File | Code (references/) | Engine |
|---|---|---|---|
| elastic-scale-enter | parts/elastic-scale-enter.md | parts/references/elastic-scale-enter.js | GSAP |
| text-split-enter | parts/text-split-enter.md | parts/references/text-split-enter.js | GSAP+CSS |
| bg-blur-mask | parts/bg-blur-mask.md | parts/references/bg-blur-mask.js | GSAP+CSS |
| number-count-up | parts/number-count-up.md | parts/references/number-count-up.js | GSAP |
| glitch-flicker | parts/glitch-flicker.md | parts/references/glitch-flicker.js | GSAP |
| caption-clip-wipe | parts/caption-clip-wipe.md | parts/references/caption-clip-wipe.js | GSAP |
| splittext-stagger-chars | parts/splittext-stagger-chars.md | parts/references/splittext-stagger-chars.js | GSAP |
| stagger-grid-reveal | parts/stagger-grid-reveal.md | parts/references/stagger-grid-reveal.js | GSAP |
| gradient-shift | parts/gradient-shift.md | parts/references/gradient-shift.js | GSAP |
| float-3d-card | parts/float-3d-card.md | parts/references/float-3d-card.js | GSAP |
| typewriter-cursor | parts/typewriter-cursor.md | parts/references/typewriter-cursor.js | GSAP |
| light-leak-cinema | parts/light-leak-cinema.md | parts/references/light-leak-cinema.js | GSAP+CSS |
| sprite-animation | parts/sprite-animation.md | parts/references/sprite-animation.js | GSAP |
| macos-notification | parts/macos-notification.md | parts/references/macos-notification.js | GSAP |
| svg-morph-transition | parts/svg-morph-transition.md | parts/references/svg-morph-transition.js | anime.js |
| particle-blob-bg | parts/particle-blob-bg.md | parts/references/particle-blob-bg.js | anime.js |
| anime-text-split | parts/anime-text-split.md | parts/references/anime-text-split.js | anime.js |

### Templates (全桌菜谱)

| Weapon Name | SKILL.md File | Code (references/) | Engine |
|---|---|---|---|
| saas-product-launch | templates/saas-product-launch.md | templates/references/saas-product-launch.js | GSAP |

### Libraries (引擎适配层)

| Weapon Name | SKILL.md File | Code (references/) |
|---|---|---|
| anime-hyperframes-adapter | libraries/anime-hyperframes-adapter.md | libraries/references/anime-hyperframes-adapter.js |

### By animation need (quick lookup)

```
Text effects: text-split-enter, typewriter-cursor, anime-text-split, splittext-stagger-chars, caption-clip-wipe
Card/Grid: card-cascade-reveal, stagger-grid-reveal, float-3d-card, elastic-scale-enter
Numbers: number-count-up
Glitch: glitch-flicker
Background: bg-blur-mask, gradient-shift, particle-blob-bg
Transitions: light-leak-cinema, transitions-pack
3D/Device: hero-3d-device-spin
Data: data-chart-editorial, sticky-flowchart
Full template: saas-product-launch
```

---

## Weapon Lifecycle Governance

### The Registry: `.framepack/arsenal.json`

Every Framepack project has a `.framepack/arsenal.json` that is the single
source of truth for all weapons used in the project. The HTML-writing Agent
MUST read this file before writing any animation code.

**arsenal.json schema:**

```json
{
  "version": "0.1.0",
  "project": "claude-fable-5",
  "created": "2026-06-11T10:00:00Z",
  "updated": "2026-06-11T12:00:00Z",
  "weapons": {
    "text-split-enter": {
      "source": "builtin",
      "kind": "part",
      "skill": "framepack:framepack-animation-library",
      "file": "parts/text-split-enter.md",
      "code": "parts/references/text-split-enter.js",
      "hash": null,
      "used_by": ["scene_1", "scene_5"],
      "status": "active"
    },
    "nexu-marble-intro": {
      "source": "web",
      "kind": "block",
      "url": "https://nexu.io/snippets/marble-intro.js",
      "local_path": ".framepack/weapons/nexu-marble-intro.js",
      "hash": "sha256:abc123def456",
      "downloaded_at": "2026-06-11T11:00:00Z",
      "used_by": ["scene_2"],
      "status": "active"
    },
    "my-custom-timeline": {
      "source": "user-created",
      "kind": "block",
      "local_path": ".framepack/weapons/my-custom-timeline.js",
      "hash": "sha256:789012abc345",
      "created_at": "2026-06-11T11:30:00Z",
      "used_by": ["scene_4"],
      "status": "active"
    }
  },
  "download_rules": {
    "allowed_sources": [
      "nexu.io",
      "codepen.io/@gsap",
      "github.com/hyperframes"
    ],
    "max_file_size_kb": 100,
    "require_hash": true
  }
}
```

### Lifecycle Rules

**1. FIND — Always check registry first**
```
arsenal.json → MOC (builtin index) → web download (white-list only)
```
Never skip to "I know GSAP, I'll just write it." That's the old behavior.

**2. REGISTER — Every weapon gets an entry**
- Builtin weapons: add `source: "builtin"` entry when Execution Manifest references them
- Downloaded weapons: add immediately after saving to `.framepack/weapons/`, with hash
- User-created weapons: add with `source: "user-created"`, no URL required

**3. DEDUPLICATE — Hash-based**
Before downloading, check arsenal.json for any weapon with the same hash.
Same hash → same file → don't re-download. Reference the existing entry.

**4. USE — Manifest must match registry**
Execution Manifest entries must resolve to weapons in arsenal.json.
If a weapon is in the Manifest but not in arsenal.json → register it first.

**5. AUDIT — Idle weapons are waste**
After HTML is written, compare:
- Manifest weapons vs arsenal.json weapons
- Weapons in arsenal.json but NOT in Manifest → mark `status: "unused"`
- Hook should warn about unused weapons

**6. ARCHIVE — Project close**
When project is complete, review arsenal.json for:
- User-created weapons worth keeping → propose to merge into main weapon library
- Downloaded weapons still useful → keep in `.framepack/weapons/` for next project
- Never-used weapons → delete to avoid cruft

### Download Procedure

When director's Weapon Resolution Step determines no builtin weapon matches:

1. **Search white-listed sources** (nexu.io, codepen.io/@gsap, github.com/hyperframes)
2. **If found:** `curl` or `web_extract` → save to `.framepack/weapons/<name>.js`
3. **Compute hash:** `sha256sum .framepack/weapons/<name>.js`
4. **Register immediately:** add entry to `.framepack/arsenal.json` with url, hash, downloaded_at
5. **Reference in Manifest:** `weapon: <name>`, `code: ".framepack/weapons/<name>.js"`

**If not found in white-listed sources:** mark as HANDWRITE in Manifest with reason.

---

## By Project Type (High-Level Recommendations)

| Project Type | Core Weapons | Optional |
|-------------|-------------|----------|
| event-promo | workflow.event-promo, motion.event-countdown-pulse, motion.speaker-lineup-reveal | motion.bento-reveal |
| sports-highlight | workflow.sports-highlight | motion.kinetic-captions |
| saas-launch | motion.bento-reveal, saas-product-launch (template) | motion.kinetic-captions |
| course-promo | motion.bento-reveal, motion.kinetic-captions | motion.event-countdown-pulse |
| founder-story | motion.kinetic-captions | — |
| news-explainer | motion.kinetic-captions, data-chart-editorial | sticky-flowchart |
| launch | motion.event-countdown-pulse | motion.bento-reveal |
| ALL | library.gsap, rules.hyperframes-render-safe, reference.video-dna | — |

### Stacking Rules
- Every project MUST include `rules.hyperframes-render-safe`
- Max 1 template weapon per project (pick best fit)
- Max 4 motion/part weapons per project
- Prefer builtin over download over HANDWRITE — always in that order

### HyperFrames Rules

**rules.hyperframes-render-safe** (MANDATORY for ALL projects):
- First scene visible in CSS
- data-width, data-height, data-start on every scene container
- All timelines on `window.__timelines`
- No `Math.random()` in render timelines
- No `repeat: -1` in render timelines
- No `ScrollTrigger` in render context
- No `<video>` inside timed scene containers

### Trusted Sources
- `framepack://` (builtin) — always trusted, zero-download
- `nexu.io` — html-video snippets, 21 templates, 12 combinable
- `codepen.io/@gsap` — GSAP community pens (review before use)
- `github.com/hyperframes` — HyperFrames official extensions
- `https://cdnjs.cloudflare.com/` — CDN for runtime scripts (GSAP, etc.)

Everything else is a CANDIDATE until explicitly added to the project arsenal.
