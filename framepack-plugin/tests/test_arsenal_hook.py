"""Arsenal hook integration tests."""

import json
import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from hooks.on_post_tool_call import register as register_post
from hooks.on_pre_tool_call import register as register_pre


def _post_hook(ctx):
    register_post(ctx)
    return ctx.register_hook.call_args[0][1]


def _pre_hook(ctx):
    register_pre(ctx)
    return ctx.register_hook.call_args[0][1]


def test_expanded_prompt_write_creates_arsenal_registry(tmp_path):
    expanded = tmp_path / ".hyperframes" / "expanded-prompt.md"
    expanded.parent.mkdir()
    expanded.write_text("## Execution Manifest\n- weapon: text-split-enter\n  scene: scene_1\n", encoding="utf-8")
    ctx = MagicMock()
    ctx.llm.complete.return_value.text = '{"has_style_block":true,"has_rhythm":true,"scene_count":1,"scenes_with_full_beats":1,"has_motifs":true,"issues":[],"total_duration_guess":"1s","summary":"ok"}'

    hook = _post_hook(ctx)
    hook(tool_name="write_file", args={"path": str(expanded)})

    arsenal = tmp_path / ".framepack" / "arsenal.json"
    assert arsenal.exists()
    data = json.loads(arsenal.read_text(encoding="utf-8"))
    assert "text-split-enter" in data["weapons"]


def test_expanded_prompt_write_registers_manifest_weapons(tmp_path):
    expanded = tmp_path / ".hyperframes" / "expanded-prompt.md"
    expanded.parent.mkdir()
    expanded.write_text("## Execution Manifest\n- weapon: caption-clip-wipe\n  scene: scene_2\n", encoding="utf-8")
    ctx = MagicMock()
    ctx.llm.complete.return_value.text = '{"has_style_block":true,"has_rhythm":true,"scene_count":1,"scenes_with_full_beats":1,"has_motifs":true,"issues":[],"total_duration_guess":"1s","summary":"ok"}'

    hook = _post_hook(ctx)
    hook(tool_name="write_file", args={"path": str(expanded)})

    data = json.loads((tmp_path / ".framepack" / "arsenal.json").read_text(encoding="utf-8"))
    assert data["weapons"]["caption-clip-wipe"]["used_by"] == ["scene_2"]


def test_expanded_prompt_write_injects_warning_for_unknown_weapon(tmp_path):
    expanded = tmp_path / ".hyperframes" / "expanded-prompt.md"
    expanded.parent.mkdir()
    expanded.write_text("## Execution Manifest\n- weapon: ghost-fx\n  scene: scene_9\n", encoding="utf-8")
    ctx = MagicMock()
    ctx.llm.complete.return_value.text = '{"has_style_block":true,"has_rhythm":true,"scene_count":1,"scenes_with_full_beats":1,"has_motifs":true,"issues":[],"total_duration_guess":"1s","summary":"ok"}'

    hook = _post_hook(ctx)
    hook(tool_name="write_file", args={"path": str(expanded)})

    injected = "\n".join(call.args[0] for call in ctx.inject_message.call_args_list)
    assert "Framepack Arsenal Warning" in injected
    assert "ghost-fx" in injected


def test_expanded_prompt_write_does_not_crash_on_bad_manifest(tmp_path):
    expanded = tmp_path / ".hyperframes" / "expanded-prompt.md"
    expanded.parent.mkdir()
    expanded.write_text("## Execution Manifest\n- weapon: [bad\n", encoding="utf-8")
    ctx = MagicMock()
    ctx.llm.complete.side_effect = RuntimeError("llm down")

    hook = _post_hook(ctx)
    hook(tool_name="write_file", args={"path": str(expanded)})

    assert (tmp_path / ".framepack" / "arsenal.json").exists()


def test_hyperframes_command_warns_when_manifest_weapon_missing_from_registry(tmp_path):
    (tmp_path / "frame.md").write_text("ok", encoding="utf-8")
    expanded = tmp_path / ".hyperframes" / "expanded-prompt.md"
    expanded.parent.mkdir()
    expanded.write_text("## Execution Manifest\n- weapon: ghost-fx\n  scene: scene_1\n", encoding="utf-8")
    ctx = MagicMock()

    hook = _pre_hook(ctx)
    hook(tool_name="terminal", args={"command": "npx hyperframes lint", "workdir": str(tmp_path)})

    injected = "\n".join(call.args[0] for call in ctx.inject_message.call_args_list)
    assert "Framepack Arsenal Warning" in injected
    assert "ghost-fx" in injected


def test_hyperframes_command_from_case_creates_workbench_root_agents(tmp_path):
    workbench = tmp_path / "workbench"
    cases = workbench / "cases"
    case = cases / "video-01"
    case.mkdir(parents=True)
    (workbench / "WORKBENCH.md").write_text("# Workbench\n", encoding="utf-8")
    (case / "frame.md").write_text("ok", encoding="utf-8")

    ctx = MagicMock()
    hook = _pre_hook(ctx)
    hook(tool_name="terminal", args={"command": "npx hyperframes lint", "workdir": str(case)})

    root_agents = workbench / "AGENTS.md"
    assert root_agents.is_file()
    assert "FRAMEPACK MANAGED BLOCK" in root_agents.read_text(encoding="utf-8")


@pytest.mark.parametrize(
    "command",
    [
        "npx hyperframes init --example blank",
        "npx hyperframes help",
        "npx hyperframes version",
        "npx hyperframes --help",
        "npx hyperframes --version",
        "npx hyperframes info",
        "npx hyperframes doctor",
        "npx hyperframes upgrade",
        "npx hyperframes browser",
        "npx hyperframes docs",
        "npx hyperframes compositions",
        "npx hyperframes benchmark .",
    ],
)
def test_hyperframes_discovery_commands_skip_arsenal_audit(command, tmp_path):
    expanded = tmp_path / ".hyperframes" / "expanded-prompt.md"
    expanded.parent.mkdir()
    expanded.write_text("## Execution Manifest\n- weapon: ghost-fx\n  scene: scene_1\n", encoding="utf-8")
    ctx = MagicMock()

    hook = _pre_hook(ctx)
    hook(tool_name="terminal", args={"command": command, "workdir": str(tmp_path)})

    ctx.inject_message.assert_not_called()
    assert not (tmp_path / ".framepack" / "arsenal.json").exists()


def test_hyperframes_command_creates_registry_even_when_no_expanded_prompt(tmp_path):
    (tmp_path / "frame.md").write_text("ok", encoding="utf-8")
    ctx = MagicMock()

    hook = _pre_hook(ctx)
    hook(tool_name="terminal", args={"command": "npx hyperframes lint", "workdir": str(tmp_path)})

    assert (tmp_path / ".framepack" / "arsenal.json").exists()


def test_hyperframes_command_creates_timeline_manifest_when_time_windows_exist(tmp_path):
    (tmp_path / "frame.md").write_text("ok", encoding="utf-8")
    expanded = tmp_path / ".hyperframes" / "expanded-prompt.md"
    expanded.parent.mkdir()
    expanded.write_text(
        """## HyperFrames Time Windows
| Scene | Start | Duration | Track |
|---|---:|---:|---:|
| scene_01 | 0 | 4 | 0 |
""",
        encoding="utf-8",
    )
    ctx = MagicMock()

    hook = _pre_hook(ctx)
    hook(tool_name="terminal", args={"command": "npx hyperframes render", "workdir": str(tmp_path)})

    timeline_path = tmp_path / ".framepack" / "timeline-manifest.json"
    assert timeline_path.exists()
    timeline = json.loads(timeline_path.read_text(encoding="utf-8"))
    assert timeline["scenes"][0]["id"] == "scene_01"
    injected = "\n".join(call.args[0] for call in ctx.inject_message.call_args_list)
    assert "Timeline Manifest" in injected
    assert "synced" in injected


def test_hyperframes_command_does_not_create_timeline_manifest_without_time_windows(tmp_path):
    (tmp_path / "frame.md").write_text("ok", encoding="utf-8")
    ctx = MagicMock()

    hook = _pre_hook(ctx)
    hook(tool_name="terminal", args={"command": "npx hyperframes lint", "workdir": str(tmp_path)})

    assert not (tmp_path / ".framepack" / "timeline-manifest.json").exists()


def test_hyperframes_command_injects_quality_audit_summary_when_index_exists(tmp_path):
    (tmp_path / "frame.md").write_text("ok", encoding="utf-8")
    expanded = tmp_path / ".hyperframes" / "expanded-prompt.md"
    expanded.parent.mkdir()
    expanded.write_text(
        """
## HyperFrames Time Windows
TOTAL DURATION: 55 seconds
## Execution Manifest
scene_2:
  weapon: text-split-enter
  params:
    travelDistance: "60px"
""",
        encoding="utf-8",
    )
    framepack = tmp_path / ".framepack"
    framepack.mkdir()
    (framepack / "arsenal.json").write_text(
        json.dumps({"schema_version": "1.0.0", "project": "stale-project", "hyperframes_config": {"duration": 30}, "weapons": {}}),
        encoding="utf-8",
    )
    (tmp_path / "index.html").write_text(
        "<div data-hf-id='x'></div><script>textSplitEnter(tl,el,{travelDistance:'200px'});</script>",
        encoding="utf-8",
    )
    ctx = MagicMock()

    hook = _pre_hook(ctx)
    hook(tool_name="terminal", args={"command": "npx hyperframes render", "workdir": str(tmp_path)})

    injected = "\n".join(call.args[0] for call in ctx.inject_message.call_args_list)
    # v0.13: P0 issues trigger BLOCKING header; the test data has P0 arsenal mismatches
    assert "BLOCKING" in injected
    assert "P0" in injected
    assert "weapon_parameter_drift" in injected


def test_terminal_command_with_hyperframes_as_argument_does_not_trigger(tmp_path):
    """Regression: `npm view hyperframes` queries a package; it does not run HyperFrames."""
    ctx = MagicMock()

    hook = _pre_hook(ctx)
    hook(tool_name="terminal", args={"command": "npm view hyperframes dist-tags --json", "workdir": str(tmp_path)})

    ctx.inject_message.assert_not_called()
    assert not (tmp_path / ".framepack" / "arsenal.json").exists()


def test_python_heredoc_containing_hyperframes_string_does_not_trigger(tmp_path):
    """Regression: inspect the executed shell header, not heredoc/script string literals."""
    ctx = MagicMock()
    command = """cd F:/Framepack-01-test && python - <<'PY'
print('npx hyperframes lint')
PY"""

    hook = _pre_hook(ctx)
    hook(tool_name="terminal", args={"command": command, "workdir": str(tmp_path)})

    ctx.inject_message.assert_not_called()
    assert not (tmp_path / ".framepack" / "arsenal.json").exists()
