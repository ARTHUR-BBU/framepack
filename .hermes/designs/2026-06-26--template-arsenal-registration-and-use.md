# Template Arsenal Registration + Use UX — Design

> Status: approved-by-user-in-chat ("一次性搞完")
> Scope: post-release / Unreleased Framepack development, no v0.15.0 tag movement.

## Verdict

Template Arsenal 已经能“做菜”（scaffold/package），现在补的是“上菜单 + 点菜单”：

```text
template bundle
  → register into .framepack/arsenal.json as kind=template_suite
  → list registered templates
  → select/use a template and write .framepack/template-selection.md evidence
  → standard Framepack co-creation continues with frame.md + expanded-prompt.md
```

No new render runtime, no new template-specific audit police, no hook mutation. It remains CLI/core-first and report-first.

## Components

1. `core/templates/arsenal.py`
   - `register_template_bundle(project_dir, template_dir, overwrite=True)`
   - `list_registered_templates(project_dir)`
   - `select_template(project_dir, template_id, brief=None, params=None, assets=None)`
   - Bundle hash for local template integrity.

2. `scripts/framepack_template.py`
   - Add `register <template_dir> --project <project_dir> --format json`
   - Add `registered --project <project_dir> --format json`
   - Add `select <template-id> --project <project_dir> --brief ... --param key=value --asset path --format json`

3. Tests
   - `tests/test_template_arsenal.py` for core behavior.
   - Extend `tests/test_template_cli.py` for command contracts.

## Data contract

Arsenal entry under `.framepack/arsenal.json`:

```json
{
  "id": "miara-style-template",
  "kind": "template_suite",
  "source": "local",
  "status": "active",
  "path": "templates/miara-style-template",
  "description": "...",
  "suitable_for": ["product launch"],
  "not_suitable_for": ["..."],
  "params": ["brand_name"],
  "hash": "sha256:...",
  "template_card": "templates/miara-style-template/TEMPLATE_CARD.md"
}
```

Selection evidence:

```text
.framepack/template-selection.md
```

Records selected template, brief, params, assets, and next co-creation questions. This is evidence, not a new workflow engine.

## Error handling

- Missing project/template path → exit 2 in CLI.
- Incomplete template with ERROR issues → registration exits 2.
- Missing template id during select → exit 2.
- Existing user fields in arsenal preserved.
- Existing non-template weapons preserved.

## Verification

- RED/GREEN targeted tests.
- Full plugin suite.
- CLI smoke in temp project.
- Deploy sync to `F:/Hermes_windows/plugins/framepack/` with MD5.
- Subagent test team + review + simplify before commit/push.
