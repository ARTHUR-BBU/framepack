# Design: Hook Intervention Integration

> Status: draft for implementation planning.
>
> Problem: all three business departments (Taste, Weapon, Audit) have Intervention bridge functions, but the pre-render hook in `on_pre_tool_call.py` bypasses them — it calls `_safe_inject()` directly for quality audit, pre-render audit, and taste control.

## Current state

```text
on_pre_tool_call.py pre-render path (line 466-470):
  _enforce_weapon_receipt_before_render(ctx, workdir)   ← Weapon: HAS bridge but may inject directly
  _inject_taste_control(ctx, workdir)                   ← Taste: bypasses bridge, uses build_taste_control_message()
  _inject_readiness_board(ctx, workdir)                 ← Readiness: standalone, no department
  _audit_quality_for_hyperframes(ctx, workdir)          ← Audit: bypasses bridge, direct inject
  _audit_pre_render_for_hyperframes(ctx, workdir)       ← Audit: bypasses bridge, direct inject
```

Also line 465:
  `_audit_quality_for_hyperframes(ctx, workdir)` runs on ALL hyperframes commands, not just pre-render.

## What "wiring through Intervention" means

The goal is NOT to change what message the Agent sees. The goal is to unify the message production path:

```text
BEFORE:
  department.findings → format_message() → _safe_inject(ctx, message)

AFTER:
  department.findings → bridge_function() → InterventionEvent[] → group → format → _safe_inject(ctx, message)
```

## Design constraints

1. **No behavior change for the Agent** — the same information reaches the Agent, just produced through a different path.
2. **No new hook category** — reuse existing pre-render injection point.
3. **Message format can improve** — grouped by severity (hard_stop first, then decision_required, then advisory), but content is equivalent.
4. **Deduplication across departments** — if Taste and Audit both report "no proof frames", group_events handles it.
5. **Backward compatibility** — existing tests for `_build_quality_audit_message`, `build_pre_render_audit_message`, `build_taste_control_message` must still pass.

## Implementation plan

### Step 1: Add `_inject_intervention_events` helper

A new function in `on_pre_tool_call.py` that:
- accepts `list[InterventionEvent]`
- calls `group_events()` to dedupe and group by severity
- formats a unified message (hard_stop first, decision_required next, advisory last)
- calls `_safe_inject(ctx, message)`

### Step 2: Wire Audit through bridge

Replace `_audit_quality_for_hyperframes` internals:
- run `audit_project()` → get `QualityAuditReport`
- call `intervention_events_for_quality_audit(report.issues)`
- call `_inject_intervention_events(ctx, events)`

Replace `_audit_pre_render_for_hyperframes` internals similarly.

### Step 3: Wire Taste through bridge

Replace `_inject_taste_control` internals:
- run `build_taste_control()` → get `TasteControlReport`
- call `intervention_events_for_taste_report(report)`
- call `_inject_intervention_events(ctx, events)`

### Step 4: Preserve receipt persistence

Taste Control writes `.framepack/taste-audit.json` and `taste-debt.md`. This must still happen even when going through Intervention.

### Step 5: Verify

- Existing tests pass (message content equivalent)
- New test: InterventionEvent path produces same severity/action mapping
- Full suite green
- Deploy sync + deploy suite green
