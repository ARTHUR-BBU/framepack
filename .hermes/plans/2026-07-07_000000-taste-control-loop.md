# Taste Control Loop Implementation Plan

> **For Hermes:** Implement task-by-task with strict TDD. Do not claim completion without source + deployed verification.

**Goal:** Turn P1 taste findings into a persistent action ledger and pre-render control injection.

**Architecture:** Add a small `core/taste_control.py` module that consumes existing `QualityIssue` objects from `quality_audit.audit_project()`. The hook stays thin: build ledger, inject summary if open P1 taste debt exists.

**Tech Stack:** Python stdlib, pytest, existing Framepack hook/test patterns.

---

## Task 1: Core action-card ledger

**Objective:** Convert taste-derived P1 quality issues into persistent cards.

**Files:**
- Create: `framepack-plugin/core/taste_control.py`
- Create: `framepack-plugin/tests/test_taste_control_loop.py`

**Steps:**
1. Write failing test: a synthetic project with `text_dominance` produces `.framepack/taste-audit.json`, `.framepack/taste-debt.md`, and one open card.
2. Run: `python -m pytest tests/test_taste_control_loop.py::test_p1_taste_issue_generates_open_action_card -q -o "addopts="`
3. Implement dataclasses + `build_taste_control(project_dir)`.
4. Re-run focused test.

## Task 2: Waiver support

**Objective:** Matching waiver turns same issue from open to waived, without deleting audit history.

**Files:**
- Modify: `framepack-plugin/core/taste_control.py`
- Modify: `framepack-plugin/tests/test_taste_control_loop.py`

**Steps:**
1. Write failing test with `.framepack/taste-waivers.json` matching `code: text_dominance` and a reason.
2. Expected: card status `waived`, `open_count == 0`, debt markdown records waived item.
3. Implement waiver loader and matcher (`issue_id` or `code`, reason required).
4. Re-run focused tests.

## Task 3: Resolution support

**Objective:** When source files are fixed and issue disappears, stale previous debt becomes resolved.

**Files:**
- Modify: `framepack-plugin/core/taste_control.py`
- Modify: `framepack-plugin/tests/test_taste_control_loop.py`

**Steps:**
1. Write failing test: run once with text dominance, then rewrite expanded prompt to include product visual / less copy, run again.
2. Expected: previous issue appears as `resolved`; no open cards.
3. Implement previous-ledger merge from existing `.framepack/taste-audit.json`.
4. Re-run focused tests.

## Task 4: Pre-render hook injection

**Objective:** `npx hyperframes render` injects `Framepack Taste Control` when open P1 debt exists; lint does not.

**Files:**
- Modify: `framepack-plugin/hooks/on_pre_tool_call.py`
- Modify: `framepack-plugin/tests/test_pre_render_hook.py`

**Steps:**
1. Write failing hook tests for render injection, waiver no-injection, lint no-injection.
2. Implement `_inject_taste_control(ctx, workdir)` and call only inside `_is_pre_render_review_command` branch.
3. Re-run focused hook tests.

## Task 5: Verification + deployment sync

**Commands:**

```bash
cd framepack-plugin
python -m pytest tests/test_taste_control_loop.py tests/test_pre_render_hook.py tests/test_quality_audit_taste_bridge.py tests/test_taste_audit.py -q -o "addopts="
python -m pytest tests/ -q -o "addopts="
```

Then sync source plugin to deployment directory and md5-compare changed files:

```bash
python scripts/sync_to_deploy.py  # if available; otherwise use project’s existing sync pattern
```

If no sync helper exists, copy changed plugin files to `F:/Hermes_windows/plugins/framepack/` and run an md5 script for every changed file.

Run deployed focused smoke from `F:/Hermes_windows/plugins/framepack/`.

## Risks

- Taste issue identity must be stable enough across runs but not overfit line numbers.
- Waiver must not hide unrelated future issues; code-only matching is acceptable for v1 but issue_id wins when present.
- Hook must stay advisory/control-message, not P0 block.
