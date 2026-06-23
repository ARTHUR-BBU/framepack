# Framepack Director Workflow Hardening — Implementation Plan

> **For Hermes:** Use subagent-driven-development or execute directly with TDD.

**Goal:** Turn Framepack from advisory-only director into a workflow gatekeeper with hard, inspectable artifact gates, /brag-style rails, and auto-hydrated workbench structure.

**Architecture:** Deterministic core modules + hook integration. Core logic is pure Python (testable without hooks). Hooks call core and inject advisory messages. Scripts wrap core for CLI use. All gates produce a green/yellow/red Readiness Board.

**Tech Stack:** Python 3.11, pytest, pathlib, no external deps.

**Design doc:** `.hermes/designs/2026-06-23--framepack-director-workflow-hardening.md`

---

## Codebase conventions (from existing patterns)

- `core/*.py` = pure domain logic, dataclass results, `_read()` helper with utf-8/replace
- `hooks/*.py` = call core, inject via `_safe_inject(ctx, message, role="user")`
- `scripts/*.py` = CLI wrapper around core, standalone entry point
- `tests/conftest.py` adds plugin root to sys.path; tests `from core.xxx import yyy`
- Tests use `tmp_path` fixture, build fake project trees
- Results are frozen dataclasses with `verdict`/`findings`/`issues` fields

## Implementation order

P0.1 Readiness Board (foundation — all gates report into it)
→ P0.5 Context Hydrator (extends existing guardrails.py)
→ P0.6 Case Scaffolder (creates the folder structure)
→ P0.2 Asset/Script/Director artifacts (templates + checker)
→ P0.4 Studio Preview gate
→ P0.3 Arsenal Provenance gate
→ Hook wiring (pre_tool_call reads board)

---

## Task 1: core/render_readiness.py — gate status model

**Objective:** Define the data model for readiness gates.

**Files:**
- Create: `framepack-plugin/core/render_readiness.py`
- Test: `framepack-plugin/tests/test_render_readiness.py`

**Step 1: Write failing test**

```python
from core.render_readiness import GateStatus, GateResult, ReadinessBoard

def test_gate_status_values():
    assert GateStatus.GREEN.value == "GREEN"
    assert GateStatus.YELLOW.value == "YELLOW"
    assert GateStatus.RED.value == "RED"

def test_gate_result_creation():
    r = GateResult(name="Asset Intake", status=GateStatus.RED,
                   evidence="missing .framepack/asset-intake.md",
                   risk="no asset decision")
    assert r.status is GateStatus.RED
    assert r.name == "Asset Intake"

def test_board_overall_red():
    board = ReadinessBoard(
        gates=[GateResult("Story Bible", GateStatus.GREEN, "exists", "")],
        overall=GateStatus.RED,
        recommended_label="draft",
    )
    assert board.overall is GateStatus.RED
```

**Step 2-4:** TDD cycle.

**Step 5: Commit:** `feat: add render readiness data model`

---

## Task 2: core/render_readiness.py — gate checkers

**Objective:** Functions that check each gate's artifact and return GateResult.

**Files:**
- Modify: `framepack-plugin/core/render_readiness.py`
- Test: `framepack-plugin/tests/test_render_readiness.py`

**Gates to check:**
- Asset Intake: `.framepack/asset-intake.md`
- Script Lanes: `.framepack/script-lanes.md` (has `## Selected lane`)
- Story Bible: `.hyperframes/expanded-prompt.md`
- Arsenal: `.framepack/arsenal.json`
- Catalog Decision: `.framepack/catalog-decision.md`
- Studio Preview: `.framepack/studio-preview.md`
- Context Sync: `.framepack/context-sync.md`
- HyperFrames Check: `.framepack/lint-output.json` (best-effort)

**Test:** build tmp project, check all RED; add artifacts one by one, verify GREEN.

**Step 5: Commit:** `feat: add gate checkers for readiness board`

---

## Task 3: core/render_readiness.py — board builder + markdown emitter

**Objective:** `build_readiness_board(project_dir) -> ReadinessBoard` + `render_board_markdown(board) -> str`.

**Test:** empty project → all RED, markdown has table, overall=RED, label=draft.

**Step 5: Commit:** `feat: add readiness board builder and markdown renderer`

---

## Task 4: scripts/framepack_readiness.py — CLI

**Objective:** `python scripts/framepack_readiness.py <project_dir>` writes `.framepack/render-readiness.md`.

**Test:** subprocess or import test, verify file written.

**Step 5: Commit:** `feat: add readiness board CLI script`

---

## Task 5: core/context_hydrator.py — context sync checker

**Objective:** Detect workbench root, scan AGENTS.md/CLAUDE.md files, compare managed block version/hash to deployed plugin.

**Files:**
- Create: `framepack-plugin/core/context_hydrator.py`
- Test: `framepack-plugin/tests/test_context_hydrator.py`

**Test:** create fake workbench with stale AGENTS.md (version 0.11.0, no managed block) → `check_context_sync()` returns stale=True with the file listed.

**Step 5: Commit:** `feat: add context hydration checker`

---

## Task 6: core/context_hydrator.py — hydrate (update managed blocks)

**Objective:** Extend `sync_project_agents` pattern to update workbench root + case roots + generated project roots.

**Test:** stale AGENTS.md → hydrate → managed block appended → second check → synced.

**Step 5: Commit:** `feat: add context hydration writer`

---

## Task 7: core/case_scaffolder.py — workbench detection + case creation

**Objective:** Detect workbench root (has WORKBENCH.md or cases/), create `cases/<slug>/` with standard structure.

**Files:**
- Create: `framepack-plugin/core/case_scaffolder.py`
- Test: `framepack-plugin/tests/test_case_scaffolder.py`

**Test:** create fake workbench, scaffold case → verify directories, AGENTS.md managed block, .framepack/ dir, .hyperframes/ dir.

**Step 5: Commit:** `feat: add case scaffolder`

---

## Task 8: core/case_scaffolder.py — legacy case detection

**Objective:** `classify_case(case_dir) -> "standard_case"|"legacy_case"|"research_case"|"renderable_draft"`.

**Test:** full case → standard; partial case → legacy/renderable_draft.

**Step 5: Commit:** `feat: add legacy case classifier`

---

## Task 9: scripts/framepack_scaffold_case.py — CLI

**Objective:** `python scripts/framepack_scaffold_case.py --workbench <path> --case <slug>`.

**Step 5: Commit:** `feat: add case scaffolder CLI`

---

## Task 10: core/gate_templates.py — artifact templates

**Objective:** Template strings for asset-intake.md, director-inspect.md, script-lanes.md, studio-preview.md, catalog-decision.md, handoff-manifest.md, context-sync.md.

**Files:**
- Create: `framepack-plugin/core/gate_templates.py`
- Test: verify each template has required sections.

**Step 5: Commit:** `feat: add gate artifact templates`

---

## Task 11: Hook wiring — pre_tool_call readiness board injection

**Objective:** On preview/render/publish, build board and inject summary.

**Files:**
- Modify: `framepack-plugin/hooks/on_pre_tool_call.py`

**Test:** mock ctx, verify injected message contains board summary with GREEN/YELLOW/RED.

**Step 5: Commit:** `feat: wire readiness board into pre_tool_call hook`

---

## Task 12: Hook wiring — context hydrator on Framepack skill load

**Objective:** Extend existing guardrails hydration to also run context sync.

**Files:**
- Modify: `framepack-plugin/hooks/guardrails.py` (or `on_post_tool_call.py`)

**Step 5: Commit:** `feat: wire context hydrator into hook lifecycle`

---

## Task 13: Integration test — full readiness on Ederson-like case

**Objective:** Test that a project with only index.html + frame.md produces all-RED board.

**Step 5: Commit:** `test: add integration test for full readiness flow`

---

## Task 14: Sync to deployment + full regression

**Objective:** Copy to `F:/Hermes_windows/plugins/framepack/`, MD5 verify, run full test suite.

**Step 5: Commit:** `chore: sync hardening modules to deployment`
