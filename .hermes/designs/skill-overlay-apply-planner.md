# Skill Overlay Apply Planner

## Goal

Turn Environment Doctor recommendations into a safe, auditable skill hardening plan.

This slice does **not** download official skills and does **not** fetch network resources. It only plans and applies Framepack hardening overlays to already-present local skill files.

## Why

Framepack has three kinds of skill text:

1. official upstream skill content — the factory manual
2. Framepack hardening overlays — recall stickers from our QA lab
3. user-local hardening blocks — 老田贴在仪表盘上的便利贴

The planner must never bulldoze #1 or #3. It owns only #2.

## Components

### `core/skill_overlay_planner.py`

Pure planning/application module.

Inputs:
- `skills_dir`
- list of `SkillOverlay`
- optional `dry_run`

Outputs:
- `SkillOverlayPlan`
- per-skill `SkillOverlayPlanItem`
- machine-safe dict serialization

Behaviors:
- missing target skill -> action `missing_skill`, no file write
- current overlay already present -> `noop`
- overlay inserted/updated -> `write_overlay`
- upstream absorbed -> `upstream_absorbed`, no file write
- malformed markers -> `manual_review`, no file write
- user-local hardening blocks are preserved and reported

### `scripts/apply_skill_overlays.py`

CLI wrapper for agent use.

- default `--dry-run`
- `--apply` required for writes
- reads built-in Framepack overlay registry from code for now
- emits JSON report

## Safety Model

- No network
- No package manager
- No whole-file replacement beyond `apply_overlays()` result
- No writes unless `--apply`
- Missing skills are a plan result, not an attempted installation
- Malformed managed markers block writes

## Tests

Use strict TDD:

1. missing skill produces plan item without writes
2. dry-run reports would-change but leaves file unchanged
3. apply writes overlay and preserves user-local block
4. malformed marker returns manual review and leaves file unchanged
5. upstream absorbed leaves file unchanged
6. CLI defaults to dry-run and serializes JSON
