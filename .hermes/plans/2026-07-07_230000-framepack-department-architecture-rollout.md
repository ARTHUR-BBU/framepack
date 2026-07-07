# Plan: Framepack Department Architecture Rollout

> Source design: `.hermes/designs/2026-07-07--framepack-department-architecture.md`
>
> Status: planning complete; implementation starts only after this plan is accepted or explicitly continued.

## 0. Product goal

Turn Framepack from a pile of useful capabilities into a product organization inside the plugin:

```text
Intent & Intake → Director Bible → Taste Intelligence → Weapon Production → Production Audit → Intervention & Railguard → Knowledge Assets → Platform Integration
```

This is not an org-chart decoration. The purpose is to make every detector, gate, receipt, and workflow know which department owns it.

## 1. Non-negotiable order

The user-defined sequence is the operating contract:

1. Confirm department map.
2. Put architecture into README.
3. Write this rollout plan.
4. Start adjustment/implementation.
5. Return to each department's internal rules, processes, best practices.
6. Prioritize Taste Intelligence optimization first because Taste Layer 2.0 already has PRD and implementation foundation.

## 2. Current state

Already done before this plan:

- Department architecture draft created.
- User confirmed direction.
- English and Chinese README architecture sections updated.
- Taste Layer foundation already exists:
  - `core/taste_rules.py`
  - `core/taste_read.py`
  - `core/taste_text_detectors.py`
  - `core/taste_control.py`
  - Taste Layer PRD and implementation plan.

## 3. Rollout principles

### 3.1 Do not rename the world first

Avoid a big-bang directory reshuffle. Framepack has active tests, deployed plugin sync rules, and runtime hooks. Start with **ownership documents and shared contracts**, then migrate modules only where useful.

### 3.2 Gates belong to Intervention

Any current or future gate should have two parts:

- business finding from its source department, e.g. Taste / Weapon / Audit
- intervention mechanics from Intervention & Railguard

Example:

```text
Taste finds opening_visual_absence
  → Intervention decides advisory / decision_required / hard_stop
  → Intervention injects required next action
```

### 3.3 Receipts over vibes

Every department should leave a receipt:

| Department | Receipt |
|---|---|
| Intent & Intake | route + asset checklist |
| Director Bible | `frame.md`, `.hyperframes/expanded-prompt.md` |
| Taste Intelligence | `taste-audit.json`, `taste-debt.md`, action cards |
| Weapon Production | `weapon-load-plan.json`, arsenal, presets, scorecards |
| Production Audit | quality/upstream/pre-render report |
| Intervention & Railguard | intervention event ledger / required action output |
| Knowledge Assets | registered templates, reference DNA, research PRDs |
| Platform Integration | compatibility/deploy/readme verification receipts |

## 4. Implementation phases

### Phase 1 — Department ownership inventory

Goal: create a machine-readable and human-readable map of current modules to departments.

Deliverables:

- `.hermes/plans` or repo doc entry listing every current Framepack core module, hook, script, and skill ownership.
- A lightweight `DEPARTMENTS.md` or architecture section if approved later.

Tasks:

1. Inventory `framepack-plugin/core/*.py`, `hooks/*.py`, scripts, tests, skills.
2. Assign each to one primary department and optional supporting department.
3. Flag ambiguous modules that mix responsibilities.
4. Do not refactor yet.

Verification:

- Ad-hoc script checks all existing `core/*.py` files have an ownership row.
- No code behavior changes.

### Phase 2 — Intervention event contract

Goal: define the reusable shape for gates without migrating every gate yet.

Deliverables:

- New small module, likely `core/intervention_events.py`, only if implementation is approved.
- Tests covering event shape, severity/action values, dedupe/grouping basics.

Proposed contract:

```python
InterventionEvent(
    department="taste|weapon|audit|director|platform",
    code="...",
    severity="advisory|decision_required|hard_stop",
    reason="...",
    required_action="revise|load_weapon|attach_proof|write_waiver|ask_user|stop",
    artifact="...",
    acceptance="...",
)
```

Verification:

- TDD: RED tests first.
- Existing taste/weapon/audit behavior unchanged.

### Phase 3 — Adapt Taste Control to emit Intervention events

Goal: first real bridge between business finding and reusable intervention layer.

Deliverables:

- Taste findings still owned by Taste.
- Pre-render corrective message produced through Intervention mechanics.
- Existing `.framepack/taste-audit.json` / `taste-debt.md` behavior preserved.

Verification:

- Existing Taste suite remains green.
- New tests prove `opening_visual_absence` / P1 cards become `decision_required` intervention events.
- Deployed plugin sync + MD5.

### Phase 4 — Adapt Weapon gate to emit Intervention events

Goal: stop weapon enforcement from being a standalone one-off gate.

Deliverables:

- Weapon business logic remains in Weapon Production.
- Enforcement event formatting / hard-stop mechanics move to Intervention.

Verification:

- Existing weapon enforcement tests stay green.
- Red-team tests still catch fake calls, comments, shims, missing params.

### Phase 5 — Adapt Audit pre-render findings to Intervention events

Goal: quality audit can advise; Intervention decides how strongly to pull back.

Deliverables:

- Audit reports keep their independent report-first role.
- P1/P2 readiness issues get mapped into advisory / decision_required.

Verification:

- Existing quality_audit and pre_render tests stay green.
- Upstream-limit warnings remain non-fix/non-block.

### Phase 6 — Department-level docs and internal rules

Goal: only after mechanics are stable, write each department's internal operating rules.

Priority order:

1. Taste Intelligence
2. Weapon Production
3. Intervention & Railguard
4. Production Audit
5. Director Bible
6. Intent & Intake
7. Knowledge Assets
8. Platform Integration

For each department, define:

- trigger conditions
- owned artifacts
- incoming contracts
- outgoing contracts
- waivers
- verification tests
- examples of good/bad findings

### Phase 7 — Taste Intelligence optimization first

After department scaffolding is in place, return to the already-planned Taste Layer 2.0 roadmap:

1. Add Director Bible detectors.
2. Add HTML / implementation slop detectors.
3. Add proof-frame evidence loop.
4. Add register-aware severity.
5. Add rule-pack lifecycle.

## 5. Testing strategy

For every code-bearing phase:

- Load `test-driven-development` before editing Python.
- Write RED tests first.
- Run focused tests.
- Run full source suite.
- Sync plugin files to `F:/Hermes_windows/plugins/framepack`.
- Verify MD5 source/deploy match.
- Run deployed focused tests.
- Run deployed full or justified subset.
- Run ad-hoc `hermes-verify-*` script for changed behavior when requested or when no canonical command is available.
- Run `requesting-code-review` before commit.

## 6. Deployment rules

Any change under these plugin surfaces must be synced to deployment:

- `framepack-plugin/core/`
- `framepack-plugin/hooks/`
- `framepack-plugin/plugin.yaml`
- plugin skills / guardrails / `__init__.py`

Sync rule:

```text
copy source → F:/Hermes_windows/plugins/framepack
verify MD5, not just size
run deployed smoke/tests
```

## 7. Risks

| Risk | Why it matters | Mitigation |
|---|---|---|
| Big-bang refactor breaks runtime hooks | Hooks are live plugin behavior | contract-first, migrate one bridge at a time |
| Intervention becomes a god object | It might swallow Taste/Weapon/Audit logic | Intervention only formats/enforces events; business logic stays in source department |
| Taste starts checking implementation too early | It could duplicate Audit/Weapon | Taste may report taste debt; implementation truth belongs to Audit/Weapon |
| Weapon starts judging taste | Tool choice may override creative judgment | Weapon reads scene intent; Taste owns commercial judgment |
| Audit becomes director | Reports might start rewriting creative | Audit verifies promises, not redesigns story |
| README outruns code | Product story claims too much | Keep roadmap language explicit; verify docs with ad-hoc scripts |

## 8. Stop conditions

Stop and ask user if:

- A department boundary changes product semantics.
- A migration would rename many public files or break compatibility.
- A gate would become hard-blocking where it was advisory.
- A user-facing workflow would add a new mandatory creative decision point.

Do not ask for low-risk internal mechanics once direction is confirmed; choose the simple, clean path and verify.

## 9. Next concrete step

If user says continue after this plan:

1. Start Phase 1 inventory.
2. Produce module ownership matrix.
3. Verify every current `core/*.py` has a department owner.
4. Then move to Phase 2 Intervention event contract via TDD.
