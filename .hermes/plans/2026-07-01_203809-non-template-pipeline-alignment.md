# Non-Template Pipeline Alignment Implementation Plan

> **For Hermes:** Use test-driven-development skill to implement this plan task-by-task. Do not skip RED → GREEN → refactor. If delegating, give each task this plan plus the design doc path.

**Goal:** Rework Framepack Pipeline Visibility so non-template projects are first-class, while preserving template parameter cards as a branch-specific convenience.

**Architecture:** Keep the existing advisory, file/artifact-based progress model. Replace the template-centered stage spine with the official HyperFrames pipeline mapping: Capture/Design/Script/Storyboard/VO+Timing/Build/Validate, surfaced in Chinese. Do not introduce a state machine, `state.json`, or a schema engine.

**Tech Stack:** Python 3.11, pytest, Framepack plugin hooks, existing `core.gates.*` readiness gates.

**Source design:** `F:/hyperframes/.hermes/designs/2026-07-01--official-prompt-pipeline-alignment.md`

---

## Current Context

Relevant current behavior:

- `framepack-plugin/core/pipeline_progress.py` defines template-centered stages:
  - `TEMPLATE_SELECTED`
  - `PARAMS_FILLED`
  - `FRAME_MD`
  - `EXPANDED_PROMPT`
  - `HTML_GENERATED`
  - `RENDER_READY`
- Empty projects currently start at `TEMPLATE_SELECTED`.
- `framepack-plugin/hooks/on_post_tool_call.py` handles `asset-intake.md`, but only injects a material check; it does not update `.framepack/progress.md`.
- Template parameter card logic should remain intact.

Non-goals:

- Do not add a state machine.
- Do not create `.framepack/state.json`.
- Do not redesign all gates.
- Do not change HyperFrames compatibility window.
- Do not bump plugin version unless explicitly requested later.

---

## Task 1: Rewrite PipelineStage around official pipeline semantics

**Objective:** Make `pipeline_progress.py` non-template-first by changing the stage enum, labels, evidence, and detection logic.

**Files:**

- Modify: `F:/hyperframes/framepack-plugin/core/pipeline_progress.py`
- Modify tests: `F:/hyperframes/framepack-plugin/tests/test_pipeline_progress.py`

**Step 1: Write failing tests**

Update `test_pipeline_progress.py`:

- Replace `test_empty_project_starts_at_template_stage` with a test that asserts empty projects start at `PipelineStage.INTAKE` and do **not** render “已选模板”.
- Add test for non-template asset intake:

```python
def test_asset_intake_detected_as_intake_stage():
    d = _make_project()
    try:
        fp = d / ".framepack"
        fp.mkdir()
        (fp / "asset-intake.md").write_text("brand:\n  logo: logo.png\n", encoding="utf-8")
        result = detect_pipeline_stage(d)
        assert result.current_stage == PipelineStage.INTAKE
+        assert result.has_asset_intake is True
        md = render_progress_markdown(result)
        assert "素材准备" in md
        assert "asset-intake.md" in md
        assert "已选模板" not in md
    finally:
        shutil.rmtree(d)
```

- Update existing tests to expect:
  - `frame.md` → `PipelineStage.DESIGN`
  - `.hyperframes/expanded-prompt.md` → `PipelineStage.STORYBOARD`
  - `index.html` → `PipelineStage.BUILD`

**Step 2: Run tests to verify RED**

Run:

```bash
cd F:/hyperframes/framepack-plugin && python -m pytest tests/test_pipeline_progress.py -q -o "addopts="
```

Expected: failures because `PipelineStage.INTAKE`, `has_asset_intake`, and Chinese labels do not exist yet.

**Step 3: Implement minimal change**

In `core/pipeline_progress.py`:

- Replace enum with:

```python
class PipelineStage(IntEnum):
    """Official HyperFrames-aligned pipeline stages. Value = progress depth."""

    INTAKE = 0
    DESIGN = 1
    SCRIPT = 2
    STORYBOARD = 3
    TIMING = 4
    BUILD = 5
    VALIDATE = 6
```

- Replace labels with:

```python
_STAGE_LABELS = {
    PipelineStage.INTAKE: "素材准备",
    PipelineStage.DESIGN: "视觉身份",
    PipelineStage.SCRIPT: "文案脚本",
    PipelineStage.STORYBOARD: "分镜导演稿",
    PipelineStage.TIMING: "配音/节奏",
    PipelineStage.BUILD: "制作中",
    PipelineStage.VALIDATE: "验片交付",
}
```

- Add fields to `PipelineProgress`:

```python
has_asset_intake: bool
has_template_selection: bool
has_frame_md: bool
has_expanded_prompt: bool
has_index_html: bool
```

- Detection logic:

```python
has_asset_intake = (project / ".framepack" / "asset-intake.md").is_file()
has_template_selection = (project / ".framepack" / "template-selection.md").is_file()
has_frame_md = (project / "frame.md").is_file()
has_expanded_prompt = (project / ".hyperframes" / "expanded-prompt.md").is_file()
has_index_html = (project / "index.html").is_file()

if has_index_html:
    stage = PipelineStage.BUILD
elif has_expanded_prompt:
    stage = PipelineStage.STORYBOARD
elif has_frame_md:
    stage = PipelineStage.DESIGN
else:
    stage = PipelineStage.INTAKE
```

- Evidence helper should include both template and non-template evidence at INTAKE:

```python
def _stage_evidence(progress: PipelineProgress, stage: PipelineStage) -> str:
    if stage == PipelineStage.INTAKE:
        evidence = []
        if progress.has_asset_intake:
            evidence.append("asset-intake.md")
        if progress.has_template_selection:
            evidence.append("template-selection.md")
        return " / ".join(evidence)
    if stage == PipelineStage.DESIGN and progress.has_frame_md:
        return "frame.md"
    if stage == PipelineStage.STORYBOARD and progress.has_expanded_prompt:
        return "expanded-prompt.md"
    if stage == PipelineStage.BUILD and progress.has_index_html:
        return "index.html"
    return ""
```

**Step 4: Run tests to verify GREEN**

Run:

```bash
cd F:/hyperframes/framepack-plugin && python -m pytest tests/test_pipeline_progress.py -q -o "addopts="
```

Expected: all `test_pipeline_progress.py` tests pass.

**Step 5: Commit candidate**

Do not commit until all tasks and full verification pass, unless user explicitly asks for per-task commits.

---

## Task 2: Preserve template evidence without making template the spine

**Objective:** Ensure template projects still show `template-selection.md` as entry evidence, but no global “已选模板” stage exists.

**Files:**

- Modify tests: `F:/hyperframes/framepack-plugin/tests/test_pipeline_progress.py`
- Modify: `F:/hyperframes/framepack-plugin/core/pipeline_progress.py`

**Step 1: Write failing test**

Add:

```python
def test_template_selection_is_intake_evidence_not_stage_spine():
    d = _make_project()
    try:
        fp = d / ".framepack"
        fp.mkdir()
        (fp / "template-selection.md").write_text("# selected", encoding="utf-8")
        result = detect_pipeline_stage(d)
        assert result.has_template_selection is True
        assert result.current_stage == PipelineStage.INTAKE
        md = render_progress_markdown(result)
        assert "素材准备" in md
        assert "template-selection.md" in md
        assert "已选模板" not in md
    finally:
        shutil.rmtree(d)
```

**Step 2: Run test to verify RED/GREEN**

Run:

```bash
cd F:/hyperframes/framepack-plugin && python -m pytest tests/test_pipeline_progress.py::test_template_selection_is_intake_evidence_not_stage_spine -q -o "addopts="
```

Expected:

- RED before Task 1 implementation.
- GREEN after Task 1 if evidence helper is correct.

**Step 3: Keep old template param tests unchanged**

Do not remove or weaken:

- `test_template_selection_write_injects_param_card`
- `test_template_selection_without_params_is_noop`

The template parameter card is still valid; only the global progress spine changes.

---

## Task 3: Update asset-intake hook to write progress.md

**Objective:** Make non-template warm-start/capture visible as soon as `.framepack/asset-intake.md` is written.

**Files:**

- Modify: `F:/hyperframes/framepack-plugin/hooks/on_post_tool_call.py`
- Modify tests: `F:/hyperframes/framepack-plugin/tests/test_post_tool_gate_routing.py`

**Step 1: Write failing test**

Add to `test_post_tool_gate_routing.py`:

```python
def test_asset_intake_write_runs_asset_depth_and_writes_progress():
    d = Path(tempfile.mkdtemp())
    fp = d / ".framepack"
    fp.mkdir()
    (fp / "asset-intake.md").write_text("brand:\n  logo: logo.png\n", encoding="utf-8")
    try:
        from hooks.on_post_tool_call import _handle_asset_intake
        from core.render_readiness import GateResult, GateStatus

        ctx = MagicMock()
        ctx.inject_message = MagicMock()
        fake_gate = GateResult(
            name="Asset Depth", status=GateStatus.GREEN, evidence="ok"
        )
        with patch("core.gates.asset_intake.check_asset_depth", return_value=fake_gate) as mock_gate:
            _handle_asset_intake(ctx, str(fp / "asset-intake.md"))
            assert mock_gate.called
        assert (fp / "progress.md").is_file()
        md = (fp / "progress.md").read_text(encoding="utf-8")
        assert "素材准备" in md
    finally:
        shutil.rmtree(d)
```

**Step 2: Run test to verify RED**

Run:

```bash
cd F:/hyperframes/framepack-plugin && python -m pytest tests/test_post_tool_gate_routing.py::test_asset_intake_write_runs_asset_depth_and_writes_progress -q -o "addopts="
```

Expected: fails because `_handle_asset_intake()` does not call `check_asset_depth` or write progress.

**Step 3: Implement minimal hook change**

At end of `_handle_asset_intake()` in `on_post_tool_call.py`, after existing inject logic:

```python
    project_dir = _project_dir_for_framepack_file(file_path)
    _run_pipeline_gates_and_update(
        ctx,
        project_dir,
        ["core.gates.asset_intake.check_asset_depth"],
    )
```

**Potential pitfall:** `_project_dir_for_framepack_file()` currently returns `path.parent` for normal files. For `.framepack/asset-intake.md`, that would return `.framepack`, not project root. Fix helper first or add explicit handling:

```python
if path.name in {"asset-intake.md", "template-selection.md"} and path.parent.name == ".framepack":
    return str(path.parent.parent)
```

Add a small test if needed.

**Step 4: Run targeted tests**

Run:

```bash
cd F:/hyperframes/framepack-plugin && python -m pytest tests/test_post_tool_gate_routing.py -q -o "addopts="
```

Expected: all pass.

---

## Task 4: Add non-template Prompt Completeness Card, file-triggered only

**Objective:** Give non-template projects a cold/warm-start “创作小票” after asset intake, without building a schema engine or touching router logic.

**Files:**

- Modify: `F:/hyperframes/framepack-plugin/hooks/on_post_tool_call.py`
- Modify tests: `F:/hyperframes/framepack-plugin/tests/test_post_tool_gate_routing.py`

**Step 1: Write failing test**

Add:

```python
def test_asset_intake_without_template_injects_non_template_completeness_card():
    d = Path(tempfile.mkdtemp())
    fp = d / ".framepack"
    fp.mkdir()
    (fp / "asset-intake.md").write_text("brand:\n  logo: logo.png\n", encoding="utf-8")
    try:
        from hooks.on_post_tool_call import _handle_asset_intake

        ctx = MagicMock()
        ctx.inject_message = MagicMock()
        _handle_asset_intake(ctx, str(fp / "asset-intake.md"))
        injected = "\n---\n".join(call.args[0] for call in ctx.inject_message.call_args_list)
        assert "创作小票" in injected
        assert "时长" in injected
        assert "画幅" in injected
        assert "风格" in injected
        assert "CTA" in injected
    finally:
        shutil.rmtree(d)
```

Add companion test:

```python
def test_asset_intake_with_template_does_not_inject_non_template_card():
    d = Path(tempfile.mkdtemp())
    fp = d / ".framepack"
    fp.mkdir()
    (fp / "asset-intake.md").write_text("brand:\n  logo: logo.png\n", encoding="utf-8")
    (fp / "template-selection.md").write_text("# Template\nparams: brand_name\n", encoding="utf-8")
    try:
        from hooks.on_post_tool_call import _handle_asset_intake

        ctx = MagicMock()
        ctx.inject_message = MagicMock()
        _handle_asset_intake(ctx, str(fp / "asset-intake.md"))
        injected = "\n---\n".join(call.args[0] for call in ctx.inject_message.call_args_list)
        assert "创作小票" not in injected
    finally:
        shutil.rmtree(d)
```

**Step 2: Run tests to verify RED**

Run:

```bash
cd F:/hyperframes/framepack-plugin && python -m pytest tests/test_post_tool_gate_routing.py -q -o "addopts="
```

Expected: new non-template card tests fail.

**Step 3: Implement helper**

In `on_post_tool_call.py`, add:

```python
def _has_template_selection_for(file_path: str) -> bool:
    project = Path(_project_dir_for_framepack_file(file_path))
    return (project / ".framepack" / "template-selection.md").is_file()


def _build_non_template_completeness_card(asset_intake_text: str) -> str:
    return "\n".join([
        "📋 **Framepack — 非模板创作小票**",
        "",
        "当前入口：非模板 / cold-start 或 warm-start。进入 frame.md 前，请确认：",
        "",
        "- 时长：例如 15s / 30s / 60s",
        "- 画幅：16:9 / 9:16 / 1:1",
        "- 风格/情绪：calm / medium / high，或具体视觉参考",
        "- 关键元素：logo / 产品图 / 人物 / 数据 / CTA",
        "- 音频：BGM / TTS / 无旁白 / 声画 hit",
        "- 输出目标：预览 / 官网 Hero / 发布会大屏 / 社媒投放",
        "",
        "有真实素材就优先用真实素材；不要直接脑补品牌资产。",
    ])
```

At end of `_handle_asset_intake()` before progress update or after existing asset check inject:

```python
    if not _has_template_selection_for(file_path):
        _safe_inject(ctx, _build_non_template_completeness_card(content), role="assistant")
```

**Step 4: Run targeted tests**

Run:

```bash
cd F:/hyperframes/framepack-plugin && python -m pytest tests/test_post_tool_gate_routing.py -q -o "addopts="
```

Expected: pass.

---

## Task 5: Update assertions and regressions across affected tests

**Objective:** Fix any legitimate test drift after renaming progress labels/stages.

**Files likely affected:**

- `F:/hyperframes/framepack-plugin/tests/test_pipeline_progress.py`
- `F:/hyperframes/framepack-plugin/tests/test_post_tool_gate_routing.py`
- Potentially any tests grepping progress labels.

**Step 1: Search for old labels/stages**

Use:

```bash
cd F:/hyperframes/framepack-plugin && python - <<'PY'
from pathlib import Path
terms = ["TEMPLATE_SELECTED", "PARAMS_FILLED", "已选模板", "已填参数", "已出视觉稿", "已出分镜"]
for p in Path("tests").rglob("*.py"):
    text = p.read_text(encoding="utf-8")
    hits = [t for t in terms if t in text]
    if hits:
        print(p, hits)
PY
```

Expected: only intentional test files show hits.

**Step 2: Run targeted tests**

Run:

```bash
cd F:/hyperframes/framepack-plugin && python -m pytest \
  tests/test_pipeline_progress.py \
  tests/test_post_tool_gate_routing.py \
  -q -o "addopts="
```

Expected: pass.

---

## Task 6: Full verification and deployment sync

**Objective:** Prove the change is safe in source and deployed plugin directories.

**Files:**

- Source plugin files changed above.
- Deployment mirror: `F:/Hermes_windows/plugins/framepack/`.

**Step 1: Run source full test suite**

Run:

```bash
cd F:/hyperframes/framepack-plugin && python -m pytest tests/ -q -o "addopts="
```

Expected: all tests pass. Current baseline before this plan: 894 passed.

**Step 2: Sync changed plugin files to deployment**

Only after tests pass, copy changed files to:

- `F:/Hermes_windows/plugins/framepack/core/pipeline_progress.py`
- `F:/Hermes_windows/plugins/framepack/hooks/on_post_tool_call.py`
- `F:/Hermes_windows/plugins/framepack/tests/test_pipeline_progress.py`
- `F:/Hermes_windows/plugins/framepack/tests/test_post_tool_gate_routing.py`

Use a copy mechanism already used in this repo. Verify with md5, not file size.

**Step 3: Verify md5 match**

Run something equivalent to:

```bash
cd F:/hyperframes && python - <<'PY'
from pathlib import Path
import hashlib
pairs = [
    (Path('framepack-plugin/core/pipeline_progress.py'), Path('F:/Hermes_windows/plugins/framepack/core/pipeline_progress.py')),
    (Path('framepack-plugin/hooks/on_post_tool_call.py'), Path('F:/Hermes_windows/plugins/framepack/hooks/on_post_tool_call.py')),
    (Path('framepack-plugin/tests/test_pipeline_progress.py'), Path('F:/Hermes_windows/plugins/framepack/tests/test_pipeline_progress.py')),
    (Path('framepack-plugin/tests/test_post_tool_gate_routing.py'), Path('F:/Hermes_windows/plugins/framepack/tests/test_post_tool_gate_routing.py')),
]
for src, dst in pairs:
    sm = hashlib.md5(src.read_bytes()).hexdigest()
    dm = hashlib.md5(dst.read_bytes()).hexdigest()
    print(src, sm, dst, dm, 'OK' if sm == dm else 'MISMATCH')
    assert sm == dm
PY
```

Expected: all `OK`.

**Step 4: Run deployed tests**

Run:

```bash
cd F:/Hermes_windows/plugins/framepack && python -m pytest tests/ -q -o "addopts="
```

Expected: all tests pass.

**Step 5: Git status and commit**

Run:

```bash
cd F:/hyperframes && git status --short
```

Expected changed files include source plugin files, tests, design doc, and this plan.

Commit only after verification:

```bash
cd F:/hyperframes && git add \
  .hermes/designs/2026-07-01--official-prompt-pipeline-alignment.md \
  .hermes/plans/2026-07-01_203809-non-template-pipeline-alignment.md \
  framepack-plugin/core/pipeline_progress.py \
  framepack-plugin/hooks/on_post_tool_call.py \
  framepack-plugin/tests/test_pipeline_progress.py \
  framepack-plugin/tests/test_post_tool_gate_routing.py

git commit -m "feat: align pipeline progress with non-template workflows"
```

Do not push unless user asks.

---

## Risks / Watchpoints

1. **Project dir resolution for `.framepack/asset-intake.md`:** `_project_dir_for_framepack_file()` currently likely returns `.framepack`, not project root, for `.framepack/*` files. Fix this carefully and test it.
2. **Skipped SCRIPT/TIMING stages:** Initial artifact set may not have explicit script/timing files. It is acceptable for progress to show them as pending/skipped-looking placeholders, but wording must not imply failure.
3. **Gate returns None without workflow:** `check_asset_depth()` returns `None` if no `handoff-manifest.md` workflow exists. Progress should still write; no gate result is fine.
4. **Template behavior:** Template parameter card must remain unchanged. Only progress spine changes.
5. **LLM failures:** Existing frame/expanded progress only runs after LLM analysis succeeds. This plan does not fix that; keep scope tight unless tests reveal a blocker.

---

## Acceptance Criteria

- Empty project progress no longer says “已选模板”.
- Non-template asset intake produces `.framepack/progress.md` with “素材准备”.
- Template selection is shown as evidence under “素材准备”, not as the pipeline spine.
- `frame.md` maps to “视觉身份”.
- `expanded-prompt.md` maps to “分镜导演稿”.
- `index.html` maps to “制作中”.
- Template param card tests remain green.
- Source full test suite passes.
- Deployed plugin full test suite passes.
- Source/deployed changed files match by md5.
