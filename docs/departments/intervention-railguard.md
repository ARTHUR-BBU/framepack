# Intervention & Railguard Department

> Role: the floor manager + railway dispatcher. When the Agent drifts, Intervention pulls it back on track.
>
> Plain-English job: Intervention is the store manager. It doesn't decide what tastes good or which weapon to use. It decides **how hard to ring the bell** when a business department reports a problem.

## 1. Department boundary

Intervention owns the **mechanics of pulling back**, not the business judgment:

- Collects findings from Taste, Weapon, and Audit departments.
- Classifies intervention strength: advisory / decision_required / hard_stop.
- Formats and injects corrective messages.
- Requires concrete next actions: revise, load_weapon, attach_proof, write_waiver, ask_user, stop.
- Writes receipts so interventions leave a trail.

Intervention does **not** own:

- what counts as bad taste — Taste Intelligence owns that
- which weapon is correct — Weapon Production owns that
- whether a promise was kept — Production Audit owns that
- creative direction — Director Bible owns that

**The core anti-pattern Intervention exists to prevent**: each department writing its own ad-hoc gate/injection/receipt logic, scattered across the codebase.

## 2. Input contracts

Intervention receives structured events from business departments:

| Source department | Bridge function | Input type |
|---|---|---|
| Taste Intelligence | `intervention_events_for_taste_report()` | `TasteControlReport` open cards |
| Weapon Production | `intervention_events_for_weapon_violations()` | `WeaponViolation` list |
| Production Audit | `intervention_events_for_pre_render()` | `PreRenderFinding` list |
| Production Audit | `intervention_events_for_quality_audit()` | `QualityIssue` list |

All inputs arrive as `InterventionEvent` objects via `make_event()`.

## 3. Output contracts

| Artifact | Purpose |
|---|---|
| `InterventionEvent` | structured event with department, severity, required_action |
| Grouped event dict | `group_events()` → OrderedDict by severity |
| Summary stats | `summarize_events()` → counts by severity and action |
| Injected message | corrective message injected into agent context via hook |
| Receipt / ledger | intervention trail for auditability |

## 4. Severity policy

Intervention does not set severity. It inherits severity from the source department's mapping:

| Source severity | Intervention severity | Meaning |
|---|---|---|
| Taste `blocker` | `decision_required` | claimed quality cannot be trusted without evidence |
| Taste `risk` | `decision_required` | likely commercial-quality failure |
| Taste `suggestion` / `note` | `advisory` | quality improvement or FYI |
| Weapon violation | `hard_stop` | fake weapon call or missing weapon — must fix |
| Audit P0 | `hard_stop` | structural failure, must stop |
| Audit P1 | `decision_required` | promise not kept, user must decide |
| Audit P2 / P3 | `advisory` | FYI or quality improvement |

## 5. Required action vocabulary

Intervention uses a fixed set of required actions — no free-form "please fix this":

| Action | When | Who acts |
|---|---|---|
| `revise` | direction/implementation needs revision | Agent revises, user confirms |
| `load_weapon` | weapon gate violation | Agent loads the real weapon |
| `attach_proof` | motion/quality claim lacks evidence | Agent runs proof extraction |
| `write_waiver` | user wants to proceed despite known risk | User writes concrete waiver |
| `ask_user` | creative decision required | User decides |
| `stop` | structural failure, cannot proceed | Agent stops, escalates |

## 6. Event lifecycle

```text
Business department detects violation
  → calls bridge function (e.g. intervention_events_for_taste_report)
  → returns list[InterventionEvent]
  → hook collects events from all departments
  → group_events() dedupes by (department, code, artifact)
  → summarize_events() produces counts
  → hook injects grouped message into agent context
  → agent performs required action
  → originating department verifies resolution
```

## 7. Anti-conflict rules

### 7.1 Intervention does not invent business rules

Intervention may say: "Taste reported P1, you must revise/proof/waiver."

Intervention must NOT say: "This looks like a P1 taste issue." That judgment belongs to Taste.

### 7.2 Intervention does not bypass department bridges

New departments must add a bridge function (`intervention_events_for_*`), not inject messages directly. The pre-render hook in `on_pre_tool_call.py` must collect events through bridges, not call `_safe_inject()` with department-specific messages.

### 7.3 One finding, one event

If the same problem is detected by both Taste and Audit (e.g. no proof frames), each department emits its own event with its own department label. `group_events()` dedupes by `(department, code, artifact)` — same department finding the same thing twice is deduped; different departments finding related things are kept separate.

## 8. Governance chain completeness

After Phase 5 (v0.19+), the governance chain is complete:

```text
Taste Intelligence     → intervention_events_for_taste_report     ✅
Weapon Production      → intervention_events_for_weapon_violations ✅
Production Audit       → intervention_events_for_pre_render        ✅
Production Audit       → intervention_events_for_quality_audit     ✅
```

All three business departments now report through Intervention. No department bypasses the unified mechanism.

## 9. Current status

Implemented:

- InterventionEvent contract with department/severity/action validation
- group_events() deduplication
- summarize_events() statistics
- Taste bridge (Phase 3 of Rollout)
- Weapon bridge (Phase 4 of Rollout)
- Audit bridge — pre_render + quality_audit (Phase 5 of Rollout)

Next priority:

1. Hook integration: ensure `on_pre_tool_call.py` collects Audit events through the bridge, not direct injection
2. Cross-department event correlation: if Taste says "no proof" and Audit says "no proof frames", surface as one decision card with both department labels
3. Intervention receipt persistence: write `.framepack/intervention-ledger.json` for auditability
