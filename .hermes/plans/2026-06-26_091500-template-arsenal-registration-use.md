# Template Arsenal Registration + Use UX Implementation Plan

> **For Hermes:** Execute with TDD, then subagent test/review team, simplify, commit, deploy sync, update handoff, push.

**Goal:** Finish Template Arsenal bridge: register packaged template bundles into `.framepack/arsenal.json`, list registered template suites, and select a template into `.framepack/template-selection.md` for standard Framepack co-creation.

**Architecture:** Add a pure-Python `core/templates/arsenal.py` layer over existing `core.arsenal_registry`. Keep templates as `kind=template_suite` weapons with `source=local` and content hash. Extend `scripts/framepack_template.py` with `register`, `registered`, and `select` commands. No hook, render, or template-specific audit runtime.

**Tech Stack:** Python stdlib, pytest, existing Framepack plugin structure.

---

## Task 1: Core TDD — register template bundle into arsenal

Files:
- Create `framepack-plugin/core/templates/arsenal.py`
- Create `framepack-plugin/tests/test_template_arsenal.py`

Tests:
- Package/scaffold a complete template bundle in tmpdir.
- Register into a tmp project.
- Assert `.framepack/arsenal.json` exists and contains `weapons[template_id]` with `kind=template_suite`, `source=local`, `path`, `description`, `params`, `suitable_for`, `hash`.
- Assert non-template weapon entries are preserved.
- Assert incomplete template with ERROR issue raises `ValueError` before mutating registry.

## Task 2: Core TDD — list and select registered templates

Files:
- Modify `core/templates/arsenal.py`
- Test `tests/test_template_arsenal.py`

Tests:
- `list_registered_templates(project_dir)` returns only `kind=template_suite` entries sorted by id.
- `select_template()` writes `.framepack/template-selection.md` with template id/name/path, brief, params, assets, and next questions for missing params.
- Selecting a missing template raises `KeyError` and does not write selection evidence.

## Task 3: CLI TDD — register/registered/select commands

Files:
- Modify `framepack-plugin/scripts/framepack_template.py`
- Modify `framepack-plugin/tests/test_template_cli.py`

Tests:
- `register <template_dir> --project <project> --format json` returns entry + arsenal_path.
- `registered --project <project> --format json` lists registered template ids.
- `select <id> --project <project> --brief ... --param brand_name=Acme --format json` writes evidence and returns missing params/selection path.
- Missing paths/missing template id exits 2.

## Task 4: Verification + deploy sync

Commands:
- `python -m pytest tests/test_template_*.py -q -o "addopts="`
- `python -m pytest tests/ -q -o "addopts="`
- CLI smoke: scaffold/register/select in temp project.
- Copy changed plugin files to `F:/Hermes_windows/plugins/framepack/` and MD5 compare.
- Deployed smoke with `PYTHONPATH=F:/Hermes_windows/plugins/framepack`.

## Task 5: Subagent testing/review/simplify

Dispatch 3 subagents:
1. CLI/test worker: run temp project workflow and report exact commands/exit codes.
2. Contract reviewer: compare against design/plan and verify no hook/render/audit runtime was added.
3. Code reviewer: security/path handling/atomic writes/schema compatibility.

Parent verifies outputs, applies blocker fixes with TDD if any, then simplify pass.

## Task 6: Commit, handoff, push

- Stage only intended source/tests/docs/handoff.
- Commit feature/fixes.
- Update `.hermes/CONTEXT.md`.
- Push `main` to GitHub.
