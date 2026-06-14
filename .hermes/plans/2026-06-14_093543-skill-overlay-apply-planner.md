# Implementation Plan — Skill Overlay Apply Planner

> Execute with strict TDD.

## Task 1 — RED tests for core planner

Create `tests/test_skill_overlay_planner.py` covering:

- missing target skill reports `missing_skill` and does not write
- dry-run reports `write_overlay`/changed but leaves file unchanged
- apply writes overlay and preserves user-local hardening block ids
- malformed Framepack marker reports `manual_review` and leaves file unchanged
- upstream absorbed reports `upstream_absorbed` and leaves file unchanged

Run focused tests and confirm RED from missing module.

## Task 2 — Implement `core/skill_overlay_planner.py`

Implement:

- `SkillOverlayPlanItem`
- `SkillOverlayPlan`
- `plan_skill_overlays()`
- `apply_skill_overlay_plan()` or single `run_skill_overlay_plan(apply=False)` API

Keep it local-file only and deterministic.

## Task 3 — CLI wrapper

Create `scripts/apply_skill_overlays.py`:

- default dry-run
- `--apply` enables writes
- `--skills-dir`, `--output`
- JSON report

Use a small built-in overlay registry for HyperFrames hardening.

## Task 4 — Verification

- focused tests
- full plugin tests
- deployment sync
- deployed smoke dry-run
- security scan
- code review before commit
