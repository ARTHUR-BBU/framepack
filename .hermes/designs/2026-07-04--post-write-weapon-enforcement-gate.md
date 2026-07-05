# Post-Write Weapon Enforcement Gate — Design

## Problem

Agent generates weapon-load-plan (via hook), then writes index.html with 45 bare
GSAP calls and zero weapon functions. The pre-write gate only checks "does plan
exist?" — it does NOT check "did the HTML actually use the weapons the plan selected?"

## Root Cause

Two separate gaps:

1. **Pre-write gate is existence-only**: `load_weapon_load_plan(project_dir) is not None`
   returns True → gate passes → HTML written with zero weapons.
2. **Post-write audit is advisory-only**: `quality_audit` runs before render commands
   and reports P0 issues, but the Agent can simply ignore the injected message and
   proceed to render. There is no hard block.

## Solution: Post-Write Weapon Enforcement Gate

After index.html is written/patched, if weapon-load-plan exists and selects weapons,
scan the HTML for their canonical function calls. If any selected weapon is missing,
inject the violations AND raise a hard gate error that blocks the current tool call.

### Where to trigger

`post_tool_call` hook on `write_file` and `patch` when the target is `index.html`.

### What to check

For each scene in weapon-load-plan.json where `selected` is a framepack_builtin weapon:
- Extract the weapon's canonical function name from `builtin_weapons.py`
- Search index.html for that function call (same logic as quality_audit's
  `_audit_weapon_load_plan`)
- If any selected weapon function is missing from HTML → BLOCK

### Why post-write, not pre-write

Pre-write can't check because the HTML doesn't exist yet. The natural enforcement
point is: "you wrote the HTML, now prove you used the weapons you said you would."

### Difference from quality_audit

quality_audit is advisory (injects message). This gate is a hard block (raises error).
The gate checks the same thing as `_audit_weapon_load_plan`, but instead of returning
a QualityIssue, it raises RuntimeError.

### HANDWRITE waivers

If a scene has `handwrite: true` with a valid waiver, the gate skips that scene.
The waiver must have `checked_sources` and `reason` filled — this is already enforced
by the matcher.

## Implementation Plan

1. Extract weapon-not-called detection into a reusable function in `quality_audit.py`
2. Add `check_weapon_implementation(project_dir) -> list[Violation]` that returns
   unimplemented weapons from the load plan
3. Add post_tool_call handler for index.html writes that calls check + hard blocks
4. Tests: RED (HTML with plan but no weapon calls → should block) → GREEN
