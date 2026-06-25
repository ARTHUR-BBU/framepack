# Template Arsenal MVP Implementation Plan

> **For Hermes:** Use dispatching-parallel-agents + executing-plans to implement this plan in an isolated git worktree. Use TDD for Python code: failing tests first, then minimal implementation, then refactor.

**Goal:** Implement Framepack Template Arsenal MVP: template bundle recognition/list/inspect/scaffold/package as a lightweight arsenal-style system, with reference-video jobs treated as reference → template bundle → template use rather than shallow DNA-only inspiration.

**Architecture:** Add `framepack-plugin/core/templates/` as a small pure-Python package for template cards, registry discovery, scaffolding, and source packaging. Add `framepack-plugin/scripts/framepack_template.py` CLI for `list`, `inspect`, `scaffold`, and `package`. Keep template quality on the existing standard audit path; no template-specific audit gates or runtime.

**Tech Stack:** Python stdlib, pytest, existing Framepack plugin layout. No new third-party dependencies.

---

## Non-negotiable constraints

- Work in an isolated git worktree, not directly in `F:/hyperframes`.
- Do not commit unrelated untracked artifacts: `.hermes/reports/`, `.hermes/backups/`, root `assets/` media/demo outputs.
- TDD required for new Python behavior.
- Changed plugin source must be synced to `F:/Hermes_windows/plugins/framepack/` and verified with MD5 before claiming runtime readiness.
- `video-template-productization` skill and `video-reference-miner` runtime skill edits are durable local skill changes; if committed repo does not track them, report them separately.
- Subagents may be asked to use `glm5.2` if available, but Hermes delegation does not expose per-call model pinning; record this limitation honestly.

---

## Expected final commit scope

Likely commit files:

- `.hermes/designs/2026-06-25--template-productization-runtime.md`
- `.hermes/plans/2026-06-26_004227-template-arsenal-execution.md`
- `framepack-plugin/core/templates/__init__.py`
- `framepack-plugin/core/templates/types.py`
- `framepack-plugin/core/templates/registry.py`
- `framepack-plugin/core/templates/scaffold.py`
- `framepack-plugin/core/templates/productize.py`
- `framepack-plugin/core/templates/markdown.py`
- `framepack-plugin/scripts/framepack_template.py`
- `framepack-plugin/tests/test_template_card.py`
- `framepack-plugin/tests/test_template_registry.py`
- `framepack-plugin/tests/test_template_scaffold.py`
- `framepack-plugin/tests/test_template_cli.py`

Maybe modify:

- `framepack-plugin/core/promotion_candidates.py` only if needed to rename/report `template_suite_candidate` without breaking old tests.
- `framepack-plugin/tests/test_promotion_candidates.py` only if that behavior changes.

Do not modify hooks/gates in MVP.

---

## Task 0: Create isolated worktree and copy approved design/plan

**Objective:** Keep main working tree clean while implementing.

**Steps:**

1. From `F:/hyperframes`, create a sibling worktree branch:
   ```bash
   git worktree add -b template-arsenal-mvp ../hyperframes-template-arsenal main
   ```
2. Copy the approved design doc and this plan into the worktree:
   ```bash
   mkdir -p ../hyperframes-template-arsenal/.hermes/designs ../hyperframes-template-arsenal/.hermes/plans
   cp .hermes/designs/2026-06-25--template-productization-runtime.md ../hyperframes-template-arsenal/.hermes/designs/
   cp .hermes/plans/2026-06-26_004227-template-arsenal-execution.md ../hyperframes-template-arsenal/.hermes/plans/
   ```
3. Verify worktree status:
   ```bash
   cd ../hyperframes-template-arsenal
   git status --short
   ```

**Expected:** Only copied design/plan are untracked initially.

---

## Task 1: TDD — template card parsing and inspection model

**Objective:** Define the core data shape for template bundles.

**Files:**

- Create: `framepack-plugin/core/templates/__init__.py`
- Create: `framepack-plugin/core/templates/types.py`
- Test: `framepack-plugin/tests/test_template_card.py`

**RED tests:**

Create tests using `tmp_path` that assert:

1. A directory with `TEMPLATE_CARD.md` frontmatter can be parsed into `TemplateCard`.
2. Missing `TEMPLATE_CARD.md` returns an inspect report with status `incomplete` and an `ERROR` issue.
3. Missing optional docs/assets/renders produce `WARNING` or `INFO`, not exceptions.
4. `TemplateCard` includes at least: `id`, `name`, `description`, `suitable_for`, `params`, `path`.

**Run RED:**

```bash
cd framepack-plugin
python -m pytest tests/test_template_card.py -q -o "addopts="
```

Expected: fails because package/modules do not exist.

**GREEN implementation:**

Implement stdlib-only dataclasses:

- `TemplateIssue(severity, code, message, path=None)`
- `TemplateCard(id, name, description, suitable_for, params, path, not_suitable_for=())`
- `TemplateInspectReport(template_dir, status, card=None, issues=(), summary={})`

Implement helpers:

- `load_template_card(template_dir: Path) -> TemplateCard | None`
- `inspect_template_bundle(template_dir: Path) -> TemplateInspectReport`

Use a small YAML-ish frontmatter parser, not PyYAML. Support:

```yaml
id: miara-style-template
name: Miara Style Template
description: Glassy product explainer
suitable_for:
  - product launch
params:
  - brand_name
```

**GREEN verification:**

```bash
python -m pytest tests/test_template_card.py -q -o "addopts="
```

---

## Task 2: TDD — registry discovery and list behavior

**Objective:** Discover template bundles under one or more roots.

**Files:**

- Create: `framepack-plugin/core/templates/registry.py`
- Test: `framepack-plugin/tests/test_template_registry.py`

**RED tests:**

1. `discover_templates([root])` finds `root/templates/<id>/TEMPLATE_CARD.md`.
2. It also supports a direct case/project directory with `TEMPLATE_CARD.md`.
3. It ignores directories without a card unless `include_incomplete=True`.
4. Returned list is sorted by template id/name for stable CLI output.

**Run RED:**

```bash
python -m pytest tests/test_template_registry.py -q -o "addopts="
```

**GREEN implementation:**

Implement:

- `discover_templates(roots: Iterable[Path], include_incomplete: bool = False) -> list[TemplateInspectReport]`
- Candidate roots:
  - direct root if it has `TEMPLATE_CARD.md`
  - `root/templates/*`
  - optionally `root/cases/*` if they have `TEMPLATE_CARD.md`

No recursive deep search in MVP.

**GREEN verification:**

```bash
python -m pytest tests/test_template_registry.py -q -o "addopts="
```

---

## Task 3: TDD — scaffold and package template bundle

**Objective:** Create a template bundle skeleton and package existing source projects into that structure.

**Files:**

- Create: `framepack-plugin/core/templates/markdown.py`
- Create: `framepack-plugin/core/templates/scaffold.py`
- Create: `framepack-plugin/core/templates/productize.py`
- Test: `framepack-plugin/tests/test_template_scaffold.py`

**RED tests:**

1. `scaffold_template_bundle(target_dir, card)` writes:
   - `TEMPLATE_CARD.md`
   - `TEMPLATE_GUIDE.md`
   - `PARAMS.md`
   - `template.params.example.json`
   - `assets/`
   - `renders/`
   - `snapshots/`
   - `source/` or `SOURCE_NOTES.md`
2. Existing files are not overwritten unless `overwrite=True`.
3. `package_template_source(source_dir, target_dir, card)` copies selected source files if present:
   - `index.html`
   - `hyperframes.json`
   - `package.json`
   - `assets/`
   - `renders/`
   - `snapshots/`
4. Reference-miner artifacts, if present, are preserved under `source/` or referenced in `SOURCE_NOTES.md`:
   - `VIDEO_DNA.md`
   - `TEMPLATE_BLUEPRINT.md`
   - `.hermes/content_decomposition.md`

**Run RED:**

```bash
python -m pytest tests/test_template_scaffold.py -q -o "addopts="
```

**GREEN implementation:**

Implement atomic preflight where practical: validate source/target before writes. Use `shutil.copytree(..., dirs_exist_ok=True)` carefully only for intended directories.

**GREEN verification:**

```bash
python -m pytest tests/test_template_scaffold.py -q -o "addopts="
```

---

## Task 4: TDD — CLI list/inspect/scaffold/package

**Objective:** Expose template operations as a CLI script.

**Files:**

- Create: `framepack-plugin/scripts/framepack_template.py`
- Test: `framepack-plugin/tests/test_template_cli.py`

**RED tests:**

Use `subprocess.run` with `sys.executable` or importable `main(argv)`:

1. `inspect <dir> --format json` returns JSON with `status`, `card`, and `issues`.
2. `list --root <root> --format json` returns templates.
3. `scaffold <target> --id <id> --name <name> --description <desc> --suitable-for <fit> --param <param>` creates a bundle.
4. `package <source> <target> ...` creates bundle and copies source files.
5. Invalid path exits `2`; incomplete template inspect exits `0` with issues.

**Run RED:**

```bash
python -m pytest tests/test_template_cli.py -q -o "addopts="
```

**GREEN implementation:**

Use `argparse`, `json`, and current package imports. Avoid network and external commands.

**GREEN verification:**

```bash
python -m pytest tests/test_template_cli.py -q -o "addopts="
```

---

## Task 5: Real sample smoke against `miara-style-template`

**Objective:** Exercise CLI on the real workbench sample without mutating it.

**Steps:**

1. Inspect current sample:
   ```bash
   cd F:/hyperframes-template-arsenal/framepack-plugin
   python scripts/framepack_template.py inspect F:/Framepack-01-test/cases/miara-style-template --format json
   ```
2. It may report `incomplete` because no `TEMPLATE_CARD.md` exists yet. That is acceptable; output must be structured and exit code `0`.
3. Package it into a temp directory:
   ```bash
   rm -rf /tmp/framepack-template-smoke
   python scripts/framepack_template.py package F:/Framepack-01-test/cases/miara-style-template /tmp/framepack-template-smoke/miara-style-template --id miara-style-template --name "Miara Style Template" --description "Glassy mascot/product explainer template" --suitable-for "product launch" --suitable-for "brand explainer" --param brand_name --param tagline --param accent_color
   python scripts/framepack_template.py inspect /tmp/framepack-template-smoke/miara-style-template --format json
   ```

**Expected:** Package command exits `0`; inspect reports `complete` or at worst only INFO/WARNING for optional evidence.

---

## Task 6: Subagent review/testing team

**Objective:** Use parallel subagents for independent validation.

Dispatch three workers in parallel:

1. **Contract reviewer:** Compare implementation against design/plan. Verify no template-specific audit/gate/runtime was added and reference-video flow is reference → template → use.
2. **CLI/sample tester:** Run template CLI against temp fixtures and real `miara-style-template`; report commands, exit codes, JSON summaries.
3. **Code reviewer:** Review diff for security/logic issues; check path handling, no broad copy/delete, no credential leakage, no network.

Context note for agents: user requested glm5.2 where available; Hermes delegation in this environment inherits parent model and cannot pin per-child model via `delegate_task`. Ask workers to behave as independent reviewers regardless of model.

Parent must verify any claimed report/output independently.

---

## Task 7: Full verification, deployment sync, and commit

**Verification commands:**

```bash
cd F:/hyperframes-template-arsenal/framepack-plugin
python -m pytest tests/test_template_*.py -q -o "addopts="
python -m pytest tests/ -q -o "addopts="
python scripts/framepack_template.py inspect F:/Framepack-01-test/cases/miara-style-template --format json
```

**Static scan:**

```bash
cd F:/hyperframes-template-arsenal
python framepack-plugin/scripts/scan_worktree_added_lines.py || python - <<'PY'
import subprocess, re
p = subprocess.run(['git','diff','--cached','--unified=0'], text=True, capture_output=True)
print('scan fallback lines=', len(p.stdout.splitlines()))
PY
```

If scanner path does not exist in this branch, run a small Python added-line scan for credential leakage/shell injection.

**Deployment sync:**

Copy changed plugin files to:

```text
F:/Hermes_windows/plugins/framepack/
```

Then MD5 compare every changed plugin file between source and deployed.

**Deployed smoke:**

Run from a neutral directory with `PYTHONPATH=F:/Hermes_windows/plugins/framepack`:

```bash
python - <<'PY'
from pathlib import Path
from core.templates.types import inspect_template_bundle
r = inspect_template_bundle(Path('F:/Framepack-01-test/cases/miara-style-template'))
print('deployed_template_inspect_status=', r.status)
print('deployed_template_issue_count=', len(r.issues))
PY
```

**Commit:**

Stage only intended files. Do not stage `.hermes/reports/`, `.hermes/backups/`, or root `assets/`.

Suggested commit message:

```bash
git commit -m "feat: add Framepack template arsenal MVP"
```

Use `[verified]` prefix only if independent review is successful and parsed/verified.
