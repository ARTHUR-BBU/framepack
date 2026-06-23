# Framepack vNext Director Workbench MVP Implementation Plan

> **For Hermes:** Execute this plan task-by-task with strict TDD. Do not widen scope beyond this MVP.

**Goal:** Implement the first Framepack vNext slice: HyperFrames 0.7-aware intent routing, asset-intake guidance, handoff manifest helpers, and advisory pre-render taste audit messaging.

**Architecture:** Add small pure-Python core modules first, then wire them lightly into existing hooks/skills. Keep behavior report-first and non-blocking. Do not rewrite Framepack's existing frame.md / expanded-prompt pipeline.

**Tech Stack:** Python stdlib, pytest, existing Framepack plugin hooks/skills.

---

## Scope

Build MVP 1 + part of MVP 2 from the design:

```text
Intent Router + Asset Intake + Handoff Manifest + Pre-render advisory message
```

Out of scope for this pass:

- Full automatic HyperFrames workflow execution.
- Full catalog install/wiring.
- Template harvesting.
- Version bump.
- Commit/push unless separately requested.

## Files likely to change

Create:

- `framepack-plugin/core/intent_router.py`
- `framepack-plugin/core/handoff_manifest.py`
- `framepack-plugin/core/pre_render_audit.py`
- `framepack-plugin/tests/test_intent_router.py`
- `framepack-plugin/tests/test_handoff_manifest.py`
- `framepack-plugin/tests/test_pre_render_audit.py`

Modify:

- `framepack-plugin/hooks/on_pre_tool_call.py`
- `framepack-plugin/skills/framepack/SKILL.md`
- `framepack-plugin/skills/framepack-director/SKILL.md`
- possibly `framepack-plugin/guardrails.md`

Validation:

```bash
cd framepack-plugin
python -m pytest tests/test_intent_router.py tests/test_handoff_manifest.py tests/test_pre_render_audit.py -q -o "addopts="
python -m pytest tests/ -q -o "addopts="
```

After modifying plugin files, sync to deployment directory and MD5 verify:

```bash
python - <<'PY'
from pathlib import Path
import hashlib, shutil
src = Path('F:/hyperframes/framepack-plugin')
dst = Path('F:/Hermes_windows/plugins/framepack')
files = [
  'core/intent_router.py',
  'core/handoff_manifest.py',
  'core/pre_render_audit.py',
  'hooks/on_pre_tool_call.py',
  'skills/framepack/SKILL.md',
  'skills/framepack-director/SKILL.md',
  'guardrails.md',
]
for rel in files:
    s, d = src / rel, dst / rel
    if s.exists():
        d.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(s, d)
        sm = hashlib.md5(s.read_bytes()).hexdigest()
        dm = hashlib.md5(d.read_bytes()).hexdigest()
        print(rel, sm == dm, sm, dm)
        assert sm == dm
PY
```

---

## Task 1: Add intent router core

**Objective:** Classify user/project intent into a HyperFrames workflow, plus route-specific asset prompts and risks.

**Files:**

- Create: `framepack-plugin/core/intent_router.py`
- Create: `framepack-plugin/tests/test_intent_router.py`

**Step 1: Write failing tests**

Tests should cover:

- product launch URL/brief → `product-launch-video`
- general website tour → `website-to-video`
- topic explainer → `faceless-explainer`
- GitHub PR → `pr-to-video`
- talking-head captions → `embedded-captions`
- talking-head graphic package → `graphic-overlays`
- short logo/stat motion → `motion-graphics`
- unclear/custom → `general-video`
- NOEMA/template/reference video → Framepack-specific paths
- every route returns likely assets and non-blocking asset choices

API to test:

```python
from core.intent_router import route_intent

route = route_intent("Make a 30s product launch video for https://example.com")
assert route.workflow == "product-launch-video"
assert "logo" in route.likely_assets
assert route.user_choices == ["provide_assets", "generate_programmatic_visuals", "continue_without_assets"]
```

**Step 2: Verify RED**

Run:

```bash
cd framepack-plugin
python -m pytest tests/test_intent_router.py -q -o "addopts="
```

Expected: fail because module does not exist.

**Step 3: Implement minimal core**

Implement:

- `IntentRoute` dataclass.
- `route_intent(text: str) -> IntentRoute`.
- Keyword/regex-based rules, ordered from specific to general.
- Route-specific asset lists.
- Human-readable reason and handoff risks.

Keep it deterministic and stdlib-only.

**Step 4: Verify GREEN**

Run same test command. Expected: pass.

---

## Task 2: Add handoff manifest core

**Objective:** Convert an `IntentRoute` plus creative constraints into a handoff manifest dictionary/markdown block for HyperFrames.

**Files:**

- Create: `framepack-plugin/core/handoff_manifest.py`
- Create: `framepack-plugin/tests/test_handoff_manifest.py`

**Step 1: Write failing tests**

Test API:

```python
from core.intent_router import route_intent
from core.handoff_manifest import build_handoff_manifest, render_handoff_manifest_markdown

route = route_intent("product launch for https://example.com")
manifest = build_handoff_manifest(route, tone="brutalist", metaphor="factory as organism")
assert manifest["workflow"] == "product-launch-video"
assert manifest["hyperframes_pipeline_hints"]["studio_preview_required"] is True
assert "no text-only reuse" in manifest["qa_redlines"]
md = render_handoff_manifest_markdown(manifest)
assert "## Framepack Handoff Manifest" in md
```

Also test that the manifest carries user decision points:

```text
after Director Story Bible
after Studio preview
before render
```

**Step 2: Verify RED**

```bash
cd framepack-plugin
python -m pytest tests/test_handoff_manifest.py -q -o "addopts="
```

Expected: fail because module does not exist.

**Step 3: Implement minimal core**

Implement:

- `build_handoff_manifest(route, tone=None, metaphor=None, rhythm=None, forbidden=None, catalog_candidates=None, framepack_arsenal_candidates=None) -> dict`
- `render_handoff_manifest_markdown(manifest: dict) -> str`

No YAML dependency. Use simple markdown with fenced JSON.

**Step 4: Verify GREEN**

Run test. Expected: pass.

---

## Task 3: Add advisory pre-render taste audit core

**Objective:** Produce a non-blocking advisory report before render/preview based on existing project artifacts.

**Files:**

- Create: `framepack-plugin/core/pre_render_audit.py`
- Create: `framepack-plugin/tests/test_pre_render_audit.py`

**Step 1: Write failing tests**

Use tempdir synthetic projects. Tests should cover:

- Missing `expanded-prompt.md` produces advisory, not blocker.
- Missing asset-intake indicators show optional asset suggestions.
- HTML with old NOEMA asset refs while expanded prompt names another domain produces stale-prop advisory.
- Report includes user choices: revise now / add assets / render anyway.
- Report uses advisory language and never says block/stop/forbid.

API:

```python
from core.pre_render_audit import audit_pre_render, build_pre_render_audit_message

report = audit_pre_render(project_dir)
assert report.verdict in {"READY", "WARN", "NEEDS_USER_DECISION"}
msg = build_pre_render_audit_message(report)
assert "render anyway" in msg
assert "BLOCK" not in msg.upper()
```

**Step 2: Verify RED**

```bash
cd framepack-plugin
python -m pytest tests/test_pre_render_audit.py -q -o "addopts="
```

Expected: fail because module does not exist.

**Step 3: Implement minimal core**

Implement:

- `PreRenderFinding` dataclass.
- `PreRenderAuditReport` dataclass.
- `audit_pre_render(project_dir: Path) -> PreRenderAuditReport`.
- `build_pre_render_audit_message(report) -> str`.

Heuristics for MVP:

- If no `.hyperframes/expanded-prompt.md`, warn that Director Story Bible is missing.
- If no `.framepack/asset-intake.md` or `asset-intake.md`, suggest asset intake.
- If `index.html` contains `assets/(portraits|archive|artwork|qr)` and expanded prompt does not mention NOEMA, warn stale props.
- If no local BGM/audio mention in asset intake or expanded prompt, suggest optional BGM for product/brand videos.
- Always include user choice lines.

**Step 4: Verify GREEN**

Run test. Expected: pass.

---

## Task 4: Wire pre-render audit into pre_tool_call hook

**Objective:** Inject Framepack pre-render advisory before HyperFrames `preview`, `render`, `publish`, or cloud render commands when a project has `index.html`.

**Files:**

- Modify: `framepack-plugin/hooks/on_pre_tool_call.py`
- Create/modify tests if needed: `framepack-plugin/tests/test_lint_bridge_hooks.py` or new focused test `test_pre_render_hook.py`

**Step 1: Write failing tests**

Test with mocked ctx and command classification:

- `npx hyperframes preview` injects pre-render audit message.
- `npx hyperframes render` injects pre-render audit message.
- `npx hyperframes lint` should not inject the pre-render taste audit, because lint is technical checking before Studio.
- Injection message must say advisory/user decision, not blocking.

**Step 2: Verify RED**

Run focused hook test. Expected: fail because wiring is missing.

**Step 3: Implement hook wiring**

Add helper in `on_pre_tool_call.py`:

```python
def _is_pre_render_review_command(command: str) -> bool:
    # true for preview/render/publish/cloud/lambda/cloudrun render/progress surfaces as appropriate
```

Add `_audit_pre_render_for_hyperframes(ctx, workdir)` that calls `audit_pre_render()` and injects `build_pre_render_audit_message()`.

Important:

- Report-first only.
- Do not block.
- Do not inject for discovery, registry, media preprocess, scaffold, or lint-only.

**Step 4: Verify GREEN**

Run focused tests.

---

## Task 5: Update skills and guardrails copy

**Objective:** Teach agents the new product spine without changing runtime behavior further.

**Files:**

- Modify: `framepack-plugin/skills/framepack/SKILL.md`
- Modify: `framepack-plugin/skills/framepack-director/SKILL.md`
- Modify: `framepack-plugin/guardrails.md` if its managed block still says Framepack stops at expanded-prompt without Studio/pre-render audit nuance.

**Step 1: Write/adjust tests**

Add assertions to an existing skill contract test or create a new one:

- `framepack/SKILL.md` mentions Intent Router.
- `framepack-director/SKILL.md` mentions Director Story Bible.
- skill text says ask for assets during co-creation.
- skill text says pre-render audit happens after Studio preview and never blocks render.

**Step 2: Verify RED**

Run skill text test. Expected: fail until docs are patched.

**Step 3: Patch docs**

Add a compact vNext section. Do not rewrite the whole skill.

Required phrases:

- `Intent Router`
- `Director Story Bible`
- `Handoff Manifest`
- `Pre-render Taste Audit`
- `Framepack advises; user decides`
- `ask for assets`
- `HyperFrames catalog + Framepack dynamic arsenal`

**Step 4: Verify GREEN**

Run skill text test.

---

## Task 6: Run full plugin tests

**Objective:** Verify no regressions across Framepack plugin.

Run:

```bash
cd framepack-plugin
python -m pytest tests/ -q -o "addopts="
```

Expected: all tests pass.

If failures are unrelated/pre-existing, capture exact output and classify before touching.

---

## Task 7: Sync deployed plugin copy

**Objective:** Keep active Hermes deployment in sync after modifying plugin files.

Run the MD5 sync script from the validation section.

Then run deployed/source MD5 spot check output and keep it in final report.

---

## Task 8: Final verification report

**Objective:** Report concise evidence to user.

Include:

- files changed
- focused tests output
- full tests output
- deployed sync MD5 result
- known untracked dirs left alone

Do not claim production support for HyperFrames 0.7.3. This MVP only prepares Framepack's new director-workbench layer.
