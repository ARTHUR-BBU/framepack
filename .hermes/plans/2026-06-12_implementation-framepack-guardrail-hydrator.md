# Framepack Guardrail Hydrator Implementation Plan

> **For Hermes:** Implement task-by-task with TDD. Keep project AGENTS.md user content safe.

**Goal:** Add a plugin-managed guardrail distribution system that syncs Framepack guardrails into project AGENTS.md and injects them into the current session when Framepack is invoked.

**Architecture:** `framepack-plugin/guardrails.md` is the canonical source. A new `hooks/guardrails.py` module computes version/hash, manages a `FRAMEPACK MANAGED BLOCK` in the current project's AGENTS.md, backs up before writes, uses atomic replace, and injects current-session rules when created/updated/fallback. Existing pre/post hooks call the hydrator when Framepack is invoked.

**Tech Stack:** Python hooks, pathlib, hashlib, regex, pytest.

---

### Task 1: Add guardrails canonical source

Files:
- Create: `framepack-plugin/guardrails.md`

Steps:
1. Extract Framepack product guardrails from root `AGENTS.md` into plugin-local `guardrails.md`.
2. Keep it product/runtime focused; leave repo-development specifics in root `AGENTS.md`.

### Task 2: Add failing tests for sync behavior

Files:
- Create: `framepack-plugin/tests/test_guardrails_hydrator.py`

Tests:
- no AGENTS.md creates file with managed block
- existing AGENTS.md without block appends block and preserves content
- existing old block replaces only block
- hash match no-ops
- write failure falls back to injection

Run:
`cd framepack-plugin && python -m pytest tests/test_guardrails_hydrator.py -q -o "addopts="`
Expected: FAIL before implementation.

### Task 3: Implement hooks/guardrails.py

Files:
- Create: `framepack-plugin/hooks/guardrails.py`

Functions:
- `load_guardrails(plugin_dir)`
- `build_managed_block(content, version, hash)`
- `sync_project_agents(project_dir, plugin_dir, ctx=None, force_inject=False)`
- `hydrate_guardrails(ctx, project_dir=None, reason="")`

### Task 4: Wire existing hooks

Files:
- Modify: `hooks/on_pre_tool_call.py`
- Modify: `hooks/on_post_tool_call.py`

Trigger points:
- before hyperframes command
- after frame.md / expanded-prompt.md writes
- after skill_view loads Framepack-related skills if tool result includes skill names

### Task 5: Update docs/version if needed

Files:
- Modify: `README.md`
- Modify: `AGENTS.md`
- Modify: `plugin.yaml` description if scope changes warrant v0.9.2

README should remove or soften manual `cp AGENTS.md` as required setup and describe automatic hydration.

### Task 6: Verify and deploy

Commands:
- `cd framepack-plugin && python -m pytest tests/ -q -o "addopts="`
- Sync plugin files to `F:\Hermes_windows\plugins\framepack\`
- Verify `grep 0.9` / managed block behavior in `F:\Framepack-01-test\`
- Commit.
