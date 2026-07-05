# Weapon Gate Effectiveness Report

**Date:** 2026-07-05
**Scope:** Phase 0 of Commercial Video Quality Engine
**Verdict:** materially stronger, with two confirmed pre-fix bypasses closed.

## Why this matters

The previous gate proved only one thing: `index.html` contained a canonical function-call shaped string. That was not enough for product quality. An Agent could still appear to obey the Weapon Load Plan while shipping fake or low-quality animation.

This pass turns the gate from a name check into an evidence check:

1. canonical function call exists outside comments/strings
2. canonical weapon script/reference is loaded
3. local fake shim does not shadow the canonical function
4. call contains non-empty / preset-quality params
5. render/preview requires a fresh receipt bound to current `index.html` SHA

## Baseline misses found before fix

| Case | Expected | Actual before fix | Status before fix |
|---|---:|---:|---|
| function in comment only | block | block | pass |
| function string only | block | block | pass |
| function referenced not called | block | block | pass |
| wrong function casing | block | block | pass |
| fake local shim | block | allow | **fail** |
| empty/default params | block | allow | **fail** |
| real script load + preset-quality call | allow | allow | pass |

## Current effectiveness matrix

| Case | Expected | Actual now | Status |
|---|---:|---:|---|
| function in comment only | block | block | pass |
| function string only | block | block | pass |
| function referenced not called | block | block | pass |
| wrong function casing | block | block | pass |
| fake local shim | block | block | pass |
| empty/default params | block | block | pass |
| real script load + preset-quality call | allow | allow | pass |
| write_file bypass | block | block | pass |
| patch bypass | block | block | pass |
| terminal redirect stale receipt | block render/preview | block | pass |
| HANDWRITE vague waiver | block | block | pass via selected-weapon path; dedicated waiver-strength audit remains future work |

## New implementation pieces

### `core.weapon_enforcement.WeaponUsageEvidence`

Tracks:

- `function_called`
- `script_loaded`
- `local_shim_detected`
- `preset_or_params_present`
- `passes_gate`

### `core.weapon_enforcement.analyze_weapon_usage()`

Conservative HTML/JS scanner. It is not a full JavaScript AST parser, but it now masks comments/strings and rejects common fake-good patterns.

### `.framepack/weapon-enforcement-receipt.json`

Post-write gate writes a zero-violation receipt with:

- current `index.html` sha256
- checked timestamp
- violations list

### Pre-render receipt gate

`npx hyperframes preview/render/publish/present/snapshot` now hard-stops if `index.html` changed after the last clean weapon enforcement receipt.

## Known limits

1. Parser is regex/scanner based, not a JS AST. This is intentional for now: KISS, fast, and enough to block realistic Agent cheats.
2. HANDWRITE vague waiver is covered indirectly when a selected weapon exists, but waiver-specific quality scoring still needs a dedicated phase.
3. Terminal writes that mutate `index.html` are not inspected post-command; they are caught before render/preview by stale receipt SHA.

## Verification command

```bash
python -m pytest framepack-plugin/tests/test_weapon_gate_effectiveness_matrix.py framepack-plugin/tests/test_weapon_enforcement_gate.py -q -o "addopts="
```

Observed:

```text
12 passed
```
