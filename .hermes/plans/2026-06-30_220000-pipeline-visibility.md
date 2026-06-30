# Pipeline Visibility Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** 把现有 7 个 readiness gate 串成伴随式流水线（写完产物立刻校验），并给用户一个单文件进度视图 `.framepack/progress.md`。

**Architecture:** 不造新状态机。在 `on_post_tool_call` 现有的 frame.md / expanded-prompt.md 处理路径里追加 gate 调用；新模块 `core/pipeline_progress.py` 负责检测产物存在性 + 生成进度 markdown；模板参数卡复用现有 `TemplateCard.params`（不造 schema 引擎）。

**Tech Stack:** Python 3.11, pytest, dataclasses, pathlib

**Design doc:** `F:/hyperframes/.hermes/designs/2026-06-30--pipeline-visibility.md`

---

## 关键事实（已核实，影响实现）

1. `on_post_tool_call.py:568` 已经有 `if _is_frame_md(file_path)` 路由分支 → 调 `_handle_frame_md(ctx, file_path)`。
2. `_handle_frame_md` 现在只做 LLM 质量审查（`_analyze_frame_md`），**没跑任何 gate 函数**。
3. gate 函数签名统一：`check_xxx(project_dir: str | Path) -> GateResult | None`。
4. `GateResult` 字段：`name: str, status: GateStatus, evidence: str, risk: str = ""`。`GateStatus` = `GREEN/YELLOW/RED`。
5. `TemplateCard.params: tuple[str, ...]` 已存在，`list_builtin_templates()` 已返回 `params`。**决策 3 不需要加字段。**
6. gate 异常处理现成范式：`on_pre_tool_call.py` 的 `_inject_readiness_board` 用 try/except + logger.warning，advisory 不阻断。

---

## Task 1: 新建 `core/pipeline_progress.py` — 进度检测核心

**Objective:** 一个纯函数模块，检测项目目录里哪些产物已存在，返回进度数据结构。

**Files:**
- Create: `framepack-plugin/core/pipeline_progress.py`
- Test: `framepack-plugin/tests/test_pipeline_progress.py`

**Step 1: 写失败测试**

```python
# tests/test_pipeline_progress.py
"""Pipeline progress detection tests."""
from __future__ import annotations

import shutil
import tempfile
from pathlib import Path

from core.pipeline_progress import detect_pipeline_stage, PipelineStage, render_progress_markdown


def _make_project() -> Path:
    return Path(tempfile.mkdtemp())


def test_empty_project_is_template_stage():
    d = _make_project()
    try:
        result = detect_pipeline_stage(d)
        assert result.current_stage == PipelineStage.TEMPLATE_SELECTED
        assert result.current_stage.value == 0  # nothing yet
    finally:
        shutil.rmtree(d)


def test_template_selection_detected():
    d = _make_project()
    try:
        fp = d / ".framepack"
        fp.mkdir()
        (fp / "template-selection.md").write_text("# selected", encoding="utf-8")
        result = detect_pipeline_stage(d)
        assert result.current_stage.value >= PipelineStage.TEMPLATE_SELECTED.value
    finally:
        shutil.rmtree(d)


def test_frame_md_detected():
    d = _make_project()
    try:
        (d / "frame.md").write_text("# frame", encoding="utf-8")
        result = detect_pipeline_stage(d)
        assert result.has_frame_md is True
        assert result.current_stage.value >= PipelineStage.FRAME_MD.value
    finally:
        shutil.rmtree(d)


def test_expanded_prompt_detected():
    d = _make_project()
    try:
        (d / "frame.md").write_text("# frame", encoding="utf-8")
        exp = d / ".hyperframes"
        exp.mkdir()
        (exp / "expanded-prompt.md").write_text("# expanded", encoding="utf-8")
        result = detect_pipeline_stage(d)
        assert result.has_expanded_prompt is True
        assert result.current_stage.value >= PipelineStage.EXPANDED_PROMPT.value
    finally:
        shutil.rmtree(d)


def test_index_html_detected():
    d = _make_project()
    try:
        (d / "frame.md").write_text("# f", encoding="utf-8")
        (d / ".hyperframes").mkdir()
        (d / ".hyperframes" / "expanded-prompt.md").write_text("# e", encoding="utf-8")
        (d / "index.html").write_text("<html></html>", encoding="utf-8")
        result = detect_pipeline_stage(d)
        assert result.has_index_html is True
        assert result.current_stage.value >= PipelineStage.HTML_GENERATED.value
    finally:
        shutil.rmtree(d)


def test_render_progress_markdown_has_all_stages():
    d = _make_project()
    try:
        (d / "frame.md").write_text("# f", encoding="utf-8")
        result = detect_pipeline_stage(d)
        md = render_progress_markdown(result)
        assert "已选模板" in md
        assert "已出视觉稿" in md
        assert "frame.md" in md
    finally:
        shutil.rmtree(d)


def test_render_progress_markdown_shows_gate_status():
    """Gate results attach to progress and show in markdown."""
    from core.render_readiness import GateResult, GateStatus
    d = _make_project()
    try:
        (d / "frame.md").write_text("# f", encoding="utf-8")
        gate_result = GateResult(name="control_profile", status=GateStatus.GREEN, evidence="ok")
        result = detect_pipeline_stage(d, gate_results=[gate_result])
        md = render_progress_markdown(result)
        assert "control_profile" in md
        assert "GREEN" in md or "✅" in md
    finally:
        shutil.rmtree(d)
```

**Step 2: 运行测试确认失败**

Run: `cd framepack-plugin && python -m pytest tests/test_pipeline_progress.py -v -o "addopts="`
Expected: FAIL — `ModuleNotFoundError: No module named 'core.pipeline_progress'`

**Step 3: 写最小实现**

```python
# core/pipeline_progress.py
"""Pipeline progress detection for Framepack visibility.

Detects which workflow artifacts exist in a project and renders a user-facing
progress markdown. Advisory only — never blocks.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from enum import IntEnum
from pathlib import Path


class PipelineStage(IntEnum):
    """Ordered pipeline stages. Value = progress depth."""
    TEMPLATE_SELECTED = 0
    PARAMS_FILLED = 1
    FRAME_MD = 2
    EXPANDED_PROMPT = 3
    HTML_GENERATED = 4
    RENDER_READY = 5


_STAGE_LABELS = {
    PipelineStage.TEMPLATE_SELECTED: "已选模板",
    PipelineStage.PARAMS_FILLED: "已填参数",
    PipelineStage.FRAME_MD: "已出视觉稿",
    PipelineStage.EXPANDED_PROMPT: "已出分镜",
    PipelineStage.HTML_GENERATED: "可预览",
    PipelineStage.RENDER_READY: "可渲染",
}


@dataclass
class PipelineProgress:
    """Snapshot of project pipeline state."""
    current_stage: PipelineStage
    has_template_selection: bool
    has_frame_md: bool
    has_expanded_prompt: bool
    has_index_html: bool
    gate_results: list = field(default_factory=list)


def detect_pipeline_stage(
    project_dir: str | Path,
    gate_results: list | None = None,
) -> PipelineProgress:
    """Detect current pipeline stage by checking artifact presence."""
    project = Path(project_dir)
    gate_results = gate_results or []

    has_template_selection = (project / ".framepack" / "template-selection.md").is_file()
    has_frame_md = (project / "frame.md").is_file()
    has_expanded_prompt = (project / ".hyperframes" / "expanded-prompt.md").is_file()
    has_index_html = (project / "index.html").is_file()

    if has_index_html:
        stage = PipelineStage.HTML_GENERATED
    elif has_expanded_prompt:
        stage = PipelineStage.EXPANDED_PROMPT
    elif has_frame_md:
        stage = PipelineStage.FRAME_MD
    elif has_template_selection:
        stage = PipelineStage.TEMPLATE_SELECTED
    else:
        stage = PipelineStage.TEMPLATE_SELECTED  # empty project = start

    return PipelineProgress(
        current_stage=stage,
        has_template_selection=has_template_selection,
        has_frame_md=has_frame_md,
        has_expanded_prompt=has_expanded_prompt,
        has_index_html=has_index_html,
        gate_results=gate_results,
    )


def render_progress_markdown(progress: PipelineProgress) -> str:
    """Render a user-facing progress markdown."""
    lines = ["# 项目进度", ""]
    reached = progress.current_stage.value

    for stage in PipelineStage:
        label = _STAGE_LABELS[stage]
        if stage.value < reached:
            lines.append(f"- ✅ {label}")
        elif stage.value == reached:
            lines.append(f"- 🔄 {label} ← 当前")
        else:
            lines.append(f"- ⬜ {label}")

    if progress.gate_results:
        lines.append("")
        lines.append("**校验：**")
        for gr in progress.gate_results:
            status_emoji = {"GREEN": "✅", "YELLOW": "🟡", "RED": "🔴"}.get(
                str(gr.status), "⬜"
            )
            lines.append(f"- {status_emoji} {gr.name}: {gr.evidence}")

    lines.append("")
    lines.append("_由 Framepack pipeline gate 自动更新_")
    return "\n".join(lines)


def write_progress_file(project_dir: str | Path, progress: PipelineProgress) -> bool:
    """Write progress markdown to .framepack/progress.md. Returns False on failure."""
    try:
        fp_dir = Path(project_dir) / ".framepack"
        fp_dir.mkdir(parents=True, exist_ok=True)
        (fp_dir / "progress.md").write_text(
            render_progress_markdown(progress), encoding="utf-8"
        )
        return True
    except OSError:
        return False
```

**Step 4: 运行测试确认通过**

Run: `cd framepack-plugin && python -m pytest tests/test_pipeline_progress.py -v -o "addopts="`
Expected: 7 passed

**Step 5: 全量回归**

Run: `cd framepack-plugin && python -m pytest tests/ -q -o "addopts="`
Expected: 888 passed (881 + 7 new)

**Step 6: Commit**

```bash
git add core/pipeline_progress.py tests/test_pipeline_progress.py
git commit -m "feat: add pipeline_progress module for stage detection"
```

---

## Task 2: 在 `_handle_frame_md` 追加 gate 调用 + progress 更新

**Objective:** 写完 frame.md 后，自动跑 `check_control_profile_consistency` gate 并更新 progress.md。

**Files:**
- Modify: `framepack-plugin/hooks/on_post_tool_call.py` (`_handle_frame_md` 函数内，追加 gate + progress)
- Test: `framepack-plugin/tests/test_post_tool_gate_routing.py` (新建)

**Step 1: 写失败测试**

```python
# tests/test_post_tool_gate_routing.py
"""Test that post_tool_call routes frame.md writes to control_profile gate."""
from __future__ import annotations

import shutil
import tempfile
from pathlib import Path
from unittest.mock import MagicMock, patch

from hooks.on_post_tool_call import _FramepackPostToolCallHooks


def _make_hooks_obj():
    return _FramepackPostToolCallHooks()


def _make_project_with_frame() -> Path:
    d = Path(tempfile.mkdtemp())
    (d / "frame.md").write_text(
        "# Frame\n\ncontrol_profile:\n  creative_autonomy: 0.6\n",
        encoding="utf-8",
    )
    return d


def test_frame_md_write_triggers_control_profile_gate():
    d = _make_project_with_frame()
    try:
        ctx = MagicMock()
        ctx.inject_message = MagicMock()
        hooks_obj = _make_hooks_obj()

        captured_gate_calls = []
        with patch("core.gates.control_profile.check_control_profile_consistency") as mock_gate:
            mock_gate.return_value = None  # gate not applicable
            hooks_obj.on_post_tool_call(
                tool_name="write_file",
                args={"path": str(d / "frame.md")},
            )
            assert mock_gate.called, "control_profile gate should be called after frame.md write"
            assert mock_gate.call_args[0][0] == d or Path(mock_gate.call_args[0][0]) == d
    finally:
        shutil.rmtree(d)


def test_frame_md_write_updates_progress_file():
    d = _make_project_with_frame()
    try:
        ctx = MagicMock()
        hooks_obj = _make_hooks_obj()
        with patch("core.gates.control_profile.check_control_profile_consistency") as mock_gate:
            mock_gate.return_value = None
            hooks_obj.on_post_tool_call(
                tool_name="write_file",
                args={"path": str(d / "frame.md")},
            )
        assert (d / ".framepack" / "progress.md").is_file(), "progress.md should be written"
    finally:
        shutil.rmtree(d)


def test_expanded_prompt_write_triggers_continuity_and_storyboard_gates():
    d = Path(tempfile.mkdtemp())
    (d / "frame.md").write_text("# f", encoding="utf-8")
    (d / ".hyperframes").mkdir()
    (d / ".hyperframes" / "expanded-prompt.md").write_text("# expanded", encoding="utf-8")
    try:
        ctx = MagicMock()
        hooks_obj = _make_hooks_obj()
        with patch("core.gates.scene_continuity.check_scene_continuity") as mock_cont, \
             patch("core.gates.storyboard_preview.check_storyboard_preview") as mock_sb:
            mock_cont.return_value = None
            mock_sb.return_value = None
            hooks_obj.on_post_tool_call(
                tool_name="write_file",
                args={"path": str(d / ".hyperframes" / "expanded-prompt.md")},
            )
            assert mock_cont.called
            assert mock_sb.called
    finally:
        shutil.rmtree(d)


def test_gate_exception_does_not_crash():
    """Gate raising exception must not break the write flow."""
    d = _make_project_with_frame()
    try:
        ctx = MagicMock()
        hooks_obj = _make_hooks_obj()
        with patch("core.gates.control_profile.check_control_profile_consistency") as mock_gate:
            mock_gate.side_effect = RuntimeError("boom")
            # Should NOT raise
            hooks_obj.on_post_tool_call(
                tool_name="write_file",
                args={"path": str(d / "frame.md")},
            )
    finally:
        shutil.rmtree(d)
```

**Step 2: 运行确认失败**

Run: `cd framepack-plugin && python -m pytest tests/test_post_tool_gate_routing.py -v -o "addopts="`
Expected: FAIL — gate 不被调用（当前 `_handle_frame_md` 没调 gate）

**Step 3: 实现 — 在 `_handle_frame_md` 追加 gate 调用**

需要在 `on_post_tool_call.py` 顶部加 import，并在 `_handle_frame_md` 末尾追加 gate + progress 逻辑。

Import 区追加（在现有 import 块之后）：
```python
from core.gates.control_profile import check_control_profile_consistency
from core.gates.scene_continuity import check_scene_continuity
from core.gates.storyboard_preview import check_storyboard_preview
from core.pipeline_progress import (
    detect_pipeline_stage,
    write_progress_file,
)
from core.render_readiness import GateResult
```

新增辅助函数（在 `_handle_frame_md` 定义之前）：
```python
def _run_pipeline_gates(project_dir: Path, gate_funcs: list) -> list:
    """Run gate functions, collect results. Exceptions become None (skipped)."""
    results = []
    for func in gate_funcs:
        try:
            result = func(project_dir)
            if result is not None:
                results.append(result)
        except Exception as exc:
            logger.warning("pipeline gate %s failed: %s", func.__name__, exc)
    return results


def _update_pipeline_progress(ctx, project_dir: Path, gate_results: list) -> None:
    """Detect stage, write progress.md, inject one-line status."""
    try:
        progress = detect_pipeline_stage(project_dir, gate_results=gate_results)
        write_progress_file(project_dir, progress)
    except Exception as exc:
        logger.warning("pipeline progress update failed: %s", exc)
```

在 `_handle_frame_md` 函数末尾（现有 LLM 审查之后）追加：
```python
    # ── Pipeline gate + progress (Task 2) ──
    project_dir = _project_dir_for_framepack_file(file_path)
    gate_results = _run_pipeline_gates(
        project_dir, [check_control_profile_consistency]
    )
    _update_pipeline_progress(ctx, project_dir, gate_results)
```

在 `_handle_expanded_prompt` 函数末尾追加：
```python
    # ── Pipeline gate + progress ──
    project_dir = _project_dir_for_framepack_file(file_path)
    gate_results = _run_pipeline_gates(
        project_dir,
        [check_scene_continuity, check_storyboard_preview],
    )
    _update_pipeline_progress(ctx, project_dir, gate_results)
```

**Step 4: 运行确认通过**

Run: `cd framepack-plugin && python -m pytest tests/test_post_tool_gate_routing.py -v -o "addopts="`
Expected: 4 passed

**Step 5: 全量回归**

Run: `cd framepack-plugin && python -m pytest tests/ -q -o "addopts="`
Expected: 892 passed

**Step 6: Commit**

```bash
git add hooks/on_post_tool_call.py tests/test_post_tool_gate_routing.py
git commit -m "feat: route frame.md/expanded-prompt writes through gates + progress"
```

---

## Task 3: 模板参数卡 — select 后注入必填参数提示

**Objective:** template select 后，inject 一条提示列出该模板的 params（复用 `TemplateCard.params`），引导 Agent 先确认参数。

**Files:**
- Modify: `framepack-plugin/hooks/on_post_tool_call.py`（监听 template-selection.md 写入）
- Test: `framepack-plugin/tests/test_post_tool_gate_routing.py`（追加用例）

**Step 1: 写失败测试**

```python
# 追加到 test_post_tool_gate_routing.py

def test_template_selection_write_injects_param_card():
    """Writing template-selection.md triggers param card injection."""
    d = Path(tempfile.mkdtemp())
    fp = d / ".framepack"
    fp.mkdir()
    (fp / "template-selection.md").write_text(
        "# Template: miara-style-template\nparams: brand_name, tagline, cta\n",
        encoding="utf-8",
    )
    try:
        ctx = MagicMock()
        ctx.inject_message = MagicMock()
        hooks_obj = _make_hooks_obj()
        hooks_obj.on_post_tool_call(
            tool_name="write_file",
            args={"path": str(fp / "template-selection.md")},
        )
        # Should have injected a param-related message
        assert ctx.inject_message.called
        injected = ctx.inject_message.call_args[0][0]
        assert "brand_name" in injected or "参数" in injected or "param" in injected.lower()
    finally:
        shutil.rmtree(d)
```

**Step 2: 运行确认失败**

Run: `cd framepack-plugin && python -m pytest tests/test_post_tool_gate_routing.py::test_template_selection_write_injects_param_card -v -o "addopts="`
Expected: FAIL — 当前不监听 template-selection.md

**Step 3: 实现**

在 `on_post_tool_call.py` 的路由分支（L578 `_is_asset_intake` 之后）追加：
```python
        elif _is_template_selection(file_path):
            _handle_template_param_card(ctx, file_path)
```

新增判断函数（在 `_is_asset_intake` 附近）：
```python
def _is_template_selection(file_path: str) -> bool:
    """template-selection.md — written after `framepack_template select`."""
    return os.path.basename(file_path) == "template-selection.md"
```

新增处理函数：
```python
def _handle_template_param_card(ctx, file_path: str) -> None:
    """After template select, inject param card so Agent gathers required fields first."""
    try:
        content = _read_file_safe(file_path)
        # Parse params from template-selection.md
        params = re.findall(r"params:\s*(.+)", content)
        param_list = []
        if params:
            param_list = [p.strip() for p in params[0].split(",") if p.strip()]
        if not param_list:
            return  # no params declared, nothing to inject

        lines = ["📋 **Framepack — 模板参数卡**\n", "选定模板后，先确认这些必填参数再继续共创：\n"]
        for p in param_list:
            lines.append(f"- {p}")
        lines.append("")
        lines.append("把这些参数确认清楚，避免后面临时补字段。")
        _safe_inject(ctx, "\n".join(lines), role="assistant")
    except Exception as exc:
        logger.warning("template param card injection failed: %s", exc)
```

**Step 4: 运行确认通过**

Run: `cd framepack-plugin && python -m pytest tests/test_post_tool_gate_routing.py::test_template_selection_write_injects_param_card -v -o "addopts="`
Expected: PASS

**Step 5: 全量回归 + Commit**

```bash
cd framepack-plugin && python -m pytest tests/ -q -o "addopts="
# Expected: 893 passed
git add hooks/on_post_tool_call.py tests/test_post_tool_gate_routing.py
git commit -m "feat: inject param card after template selection"
```

---

## Task 4: 部署同步 + 交接台更新

**Objective:** 同步到部署目录（md5 校验），更新 CONTEXT.md，最终 commit。

**Files:**
- Sync: `F:/Hermes_windows/plugins/framepack/` (8 个实现文件 + 测试)
- Update: `F:/hyperframes/.hermes/CONTEXT.md`

**Step 1: 同步部署**

```bash
cd framepack-plugin
for f in core/pipeline_progress.py hooks/on_post_tool_call.py; do
  dst="F:/Hermes_windows/plugins/framepack/$f"
  cp "$f" "$dst"
  src_md5=$(md5sum "$f" | cut -d' ' -f1)
  dst_md5=$(md5sum "$dst" | cut -d' ' -f1)
  [ "$src_md5" = "$dst_md5" ] && echo "✓ $f" || echo "✗ $f"
done
# 同步测试文件
for f in tests/test_pipeline_progress.py tests/test_post_tool_gate_routing.py; do
  cp "$f" "F:/Hermes_windows/plugins/framepack/$f"
done
```

**Step 2: deployed smoke**

```bash
cd F:/Hermes_windows/plugins/framepack
python -m pytest tests/test_pipeline_progress.py tests/test_post_tool_gate_routing.py -q -o "addopts="
# Expected: all passed
```

**Step 3: 全量 deployed 回归**

```bash
cd F:/Hermes_windows/plugins/framepack && python -m pytest tests/ -q -o "addopts="
```

**Step 4: 更新 CONTEXT.md + commit**

---

## Verification Checklist（实现完成后逐项过）

- [ ] 写 frame.md → control_profile gate 被调用（实测，非 mock）
- [ ] 写 expanded-prompt → scene_continuity + storyboard gate 被调用
- [ ] progress.md 反映当前阶段（6 段全显示）
- [ ] gate 异常 → progress 标记但不崩（advisory 不阻断）
- [ ] template select → 参数卡注入
- [ ] 无 required_params 的模板 → 跳过参数卡（向后兼容）
- [ ] 881 旧测试全绿（零回归）
- [ ] 部署目录 md5 一致 + deployed smoke 通过
