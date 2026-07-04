# Weapon Matching Pass Before HTML — Design Draft

## Verdict

Add a mandatory **Weapon Matching Pass** after the script/story bible is produced and before any HTML is written.

Analogy: this is the kitchen's “备菜台”. The director has written the menu, but before the chef touches the wok, the sous-chef lays out every usable ingredient: official HyperFrames catalog components, Framepack arsenal weapons, GSAP skill recipes, anime/SVG/media skills, and any project-local reusable assets.

The output is not advice. It is a **Weapon Load Plan**: what to load, why, where to use it, and what counts as a valid waiver.

## Problem

Current failure mode:

1. expanded-prompt.md / STORYBOARD.md describes scenes.
2. Agent jumps straight into index.html.
3. Agent uses the comfort path: `tl.from(...opacity/y...)`.
4. Weapon library was loaded or mentioned, but not actually used.

Existing audit catches some lies after the fact (`handwrite_weapon_mismatch`), but the better place to fix the behavior is before HTML writing begins.

## Proposed Pipeline

```text
User intent / URL / assets
  ↓
Framepack director + HyperFrames workflow
  ↓
frame.md
  ↓
expanded-prompt.md / STORYBOARD.md / script
  ↓
NEW: Weapon Matching Pass
  ├── HyperFrames official catalog / templates
  ├── Framepack executable arsenal
  ├── GSAP official skill + techniques
  ├── anime/SVG/media/caption/audio skills
  ├── project-local components / templates / prior cases
  └── explicit HANDWRITE waivers
  ↓
.framepack/weapon-load-plan.json
.framepack/weapon-load-plan.md
  ↓
HTML authoring loads listed skills/files first
  ↓
index.html
  ↓
quality_audit validates plan vs HTML
```

## Source Layers

### Layer 0 — HyperFrames official capability/catalog

Use first when it is an official component, workflow, template, transition, media command, or registry item.

Network rule: if official catalog/registry/remote weapon lookup hits timeout, registry skip, or wall-like failure, probe the current device proxy (`HTTP_PROXY`/`HTTPS_PROXY`/`ALL_PROXY`, npm proxy, git proxy, Windows proxy; local default often `127.0.0.1:59527`) and retry through proxy before falling back. A blocked request is not proof that no official weapon exists.

Examples:
- `npx hyperframes catalog --json`
- official scene/caption/transition references from the `hyperframes` skill
- official workflow skills: `product-launch-video`, `website-to-video`, etc.
- media commands: `tts`, `transcribe`, `remove-background`

Rule: official camera equipment before custom props.

### Layer 1 — Framepack executable arsenal

Use registered runtime weapons from `core/builtin_weapons.py` and project `.framepack/arsenal.json`.

Examples:
- `number-count-up`
- `data-chart-editorial`
- `text-split-enter`
- `card-cascade-reveal`
- `hero-3d-device-spin`
- `sprite-animation`

Rule: only executable, non-deprecated weapons are forceable. `transitions-pack` remains deprecated and should not be forced.

### Layer 2 — Specialist skills as weapons

Some “weapons” are not JS snippets; they are procedural skills.

Examples:
- `gsap` official skill for timeline patterns and easing APIs
- `hyperframes` references: captions, audio-reactive, transitions, CSS patterns
- `framepack-reference-miner` for reference-video DNA
- `media-use` / `youtube-content` / `ocr-and-documents` when assets need extraction
- `sprite-to-hyperframes` when sprite assets drive the motion grammar

Rule: a skill can be a weapon if it materially changes implementation choices and must be loaded before HTML.

### Layer 3 — Project-local weapons

Anything already in the current project:
- `.framepack/arsenal.json`
- `.framepack/weapons/*`
- project templates/components
- previous verified case folders
- user-provided snippets/assets

Rule: local, verified assets beat generic handwrite.

### Layer 4 — HANDWRITE waiver

Allowed only when no source layer provides a useful full, partial, structural, or stylistic match.

A valid waiver must include:
- checked sources
- rejected candidates
- reason each candidate cannot be reused
- what exact code will be hand-written
- whether quality_audit should expect inline GSAP/anime/SVG

## Weapon Load Plan Format

Write both machine and human versions:

```text
.framepack/weapon-load-plan.json
.framepack/weapon-load-plan.md
```

Suggested JSON shape:

```json
{
  "version": "0.1",
  "source_prompt": ".hyperframes/expanded-prompt.md",
  "scenes": [
    {
      "scene": "scene_3",
      "need": "120+ numeric impact reveal",
      "matches": [
        {
          "source": "framepack_builtin",
          "id": "number-count-up",
          "confidence": "high",
          "reuse_mode": "full",
          "load": {
            "skill": "framepack-animation-library",
            "file_path": "parts/references/number-count-up.js"
          },
          "params_hint": {
            "targetValue": 120,
            "suffix": "+",
            "duration": 1.1
          }
        }
      ],
      "selected": "number-count-up",
      "handwrite": false
    }
  ],
  "required_skill_loads": [
    {"name": "hyperframes", "reason": "composition contract"},
    {"name": "gsap", "reason": "GSAP timeline API"},
    {"name": "framepack-animation-library", "file_path": "parts/references/number-count-up.js", "reason": "scene_3 numeric reveal"}
  ],
  "handwrite_waivers": []
}
```

## Matching Semantics

Do not require exact match. Score by reuse mode:

| Mode | Meaning | Example |
|---|---|---|
| full | use weapon as-is | `number-count-up` for `120+` |
| partial | use key function/HTML pattern | `text-split-enter` title structure + custom style |
| structural | use layout/choreography but custom content | `card-cascade-reveal` for feature cards |
| stylistic | use motion grammar / quality threshold | `light-leak-cinema` for luxury opening atmosphere |
| specialist-skill | load a skill/reference, not a JS weapon | `hyperframes/references/captions.md` for word-synced captions |
| waiver | HANDWRITE with checked rejection list | bespoke WebGL shader |

## Enforcement Points

### 1. Post-expanded-prompt hook

When `.hyperframes/expanded-prompt.md` is written, run or recommend Weapon Matching Pass and write `.framepack/weapon-load-plan.*`.

This is the ideal point: script exists, HTML not started.

### 2. Pre-HTML write soft gate

Before `write_file` / `patch` touches `index.html`, if no weapon-load-plan exists, inject a warning or block depending on mode.

Recommended first version: warning + audit, not hard block.

### 3. Quality Audit follow-through

After HTML exists:
- selected builtin weapon must have canonical function call, unless `reference_only` / `specialist-skill`.
- selected skill/reference must appear in `weapon-load-plan.md` and have a stated implementation pattern.
- HANDWRITE must include a waiver.

Existing `manifest_weapon_not_called` and `handwrite_weapon_mismatch` become downstream validators for this plan.

## UX for Agent

The plan should be injected as a short instruction, not a giant library dump:

```text
Before writing HTML, load these exact resources:
1. hyperframes/references/multi-scene-structure.md — composition skeleton
2. framepack-animation-library parts/references/number-count-up.js — scene_3
3. framepack-animation-library blocks/references/data-chart-editorial.js — scene_4
4. gsap skill — timeline API/easing only

Do not load the entire weapon library.
```

## Implementation Shape

Suggested modules:

```text
core/weapon_sources.py       # list source layers and executable catalogs
core/weapon_matcher.py       # match scene needs → candidate weapons/skills
core/weapon_load_plan.py     # schema + markdown/json writer
scripts/framepack_match_weapons.py
hooks/on_post_tool_call.py   # after expanded-prompt write
hooks/on_pre_tool_call.py    # before index.html writes, optional soft gate
```

## Testing

Minimum test matrix:

1. Product-launch script with numeric stat → selects `number-count-up`.
2. Chart/data scene → selects `data-chart-editorial`.
3. Title/caption scene → selects text weapon.
4. Official HyperFrames caption/transition need → selects HyperFrames reference, not deprecated `transitions-pack`.
5. GSAP generic animation need → loads `gsap` skill but does not call it a Framepack weapon.
6. Bespoke shader → emits HANDWRITE waiver with rejected candidates.
7. No plan + index.html write → soft gate injects warning.
8. Plan selected builtin + HTML lacks function call → quality_audit reports.

## Recommendation

Build this as a new pass, not as another paragraph in a skill.

Skills are cookbooks. The Weapon Matching Pass is the prep cook that puts the exact ingredients on the counter before the chef starts. That is the mechanism that prevents “I know GSAP, I’ll just handwrite it.”
