# Framepack Weapon Library Truthfulness Audit — 2026-07-04

## Verdict

This was not just a one-off logic patch. The weapon library now has a runtime audit layer that checks HANDWRITE excuses against the executable weapon catalog.

Kitchen analogy:
- MOC = menu board
- builtin_weapons.py = warehouse inventory
- references/*.js = actual prepared dishes in the kitchen
- quality_audit.py = health inspector

Before this pass, the inspector only checked whether a named dish was served. It did not check whether the chef falsely claimed “no prepared dish exists.”

## Inventory reconciliation

Observed source surfaces:

| Surface | Count | Meaning |
|---|---:|---|
| MOC wikilinks | 38 | includes templates, planned weapons, library adapter, deprecated transitions-pack |
| Runtime builtin executable weapons | 21 | actual non-deprecated weapons registered in `core/builtin_weapons.py` |
| Reference JS files | 22 | 21 executable weapons + deprecated `transitions-pack`; excludes `hf-utils.js` helper |

Important boundary:
- `transitions-pack` exists as JS but is deprecated. It should not be forced by HANDWRITE truthfulness audit.
- Planned MOC entries such as `bento-stagger-reveal`, `kinetic-caption-burst`, `cta-impact-card`, etc. are not runtime weapons until registered in `builtin_weapons.py`.

## Runtime audit scope

The new `handwrite_weapon_mismatch` audit covers all 21 non-deprecated builtin executable weapons:

### Text / typography
- `text-split-enter`
- `splittext-stagger-chars`
- `caption-clip-wipe`
- `typewriter-cursor`
- `anime-text-split`

### Data / diagram / UI
- `number-count-up`
- `data-chart-editorial`
- `sticky-flowchart`
- `macos-notification`

### Card / device / grid showcase
- `card-cascade-reveal`
- `hero-3d-device-spin`
- `stagger-grid-reveal`
- `float-3d-card`

### Environment / background / FX
- `bg-blur-mask`
- `gradient-shift`
- `particle-blob-bg`
- `light-leak-cinema`
- `glitch-flicker`
- `elastic-scale-enter`

### Media / SVG / sprite
- `sprite-animation`
- `svg-morph-transition`

## What triggers a finding

A finding is raised only when all are true:

1. Execution Manifest declares `weapon: HANDWRITE`.
2. The reason is generic, e.g. `no exact builtin weapon`, `没有现成`, `无匹配`, `not matched`.
3. The scene text contains strong signals for a registered builtin weapon.

The finding code:

```text
handwrite_weapon_mismatch
```

Example output:

```text
HANDWRITE reason says 'no exact builtin weapon', but the scene text clearly matches MOC weapon 'number-count-up'; HANDWRITE is a last resort, not a shortcut around the arsenal.
```

## False-positive guardrails added during full-library pass

The full pass caught overly-greedy patterns and tightened them:

- `text-split-enter` no longer grabs any scene merely containing `title` / `reveal`; it needs split/enter style evidence.
- `splittext-stagger-chars` uses word boundaries for `char` / `letter`, so it does not match `chart` or `letterbox`.
- `card-cascade-reveal` no longer grabs `candidate`, `floating card`, or generic `bento grid` without cascade/fan/card evidence.
- `data-chart-editorial` uses `\bchart\b`, so it does not steal `flowchart` from `sticky-flowchart`.
- `transitions-pack` is deliberately excluded because it is deprecated; HyperFrames-native transitions or explicit HANDWRITE remain valid.

## Tests

Added `tests/test_handwrite_weapon_truthfulness_audit.py`:

- 21 parameterized positive cases: every registered non-deprecated builtin weapon has at least one obvious generic-HANDWRITE repro.
- 1 numeric regression case for `120+` → `number-count-up`.
- 1 custom shader negative case: specific bespoke WebGL waiver is not flagged.
- 1 deprecated transition negative case: blur crossfade / HyperFrames-native transition is not forced to use `transitions-pack`.

Focused test evidence at implementation time:

```text
24 passed
```

## Remaining product debt

MOC still mixes four things in one menu:

1. executable builtin weapons
2. deprecated reference code (`transitions-pack`)
3. planned weapons
4. templates / library adapters

This is okay for human browsing but risky for runtime automation. Future cleanup should split MOC metadata into explicit statuses:

```yaml
status: executable | deprecated | planned | template | library
runtime_registered: true | false
forceable_by_audit: true | false
```

Do not use planned weapons in runtime audit until they exist in `builtin_weapons.py` and have reference JS.
