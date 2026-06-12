"""Arsenal hook integration tests."""

import json
import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

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


def test_hyperframes_init_help_version_skip_arsenal_audit(tmp_path):
    expanded = tmp_path / ".hyperframes" / "expanded-prompt.md"
    expanded.parent.mkdir()
    expanded.write_text("## Execution Manifest\n- weapon: ghost-fx\n  scene: scene_1\n", encoding="utf-8")
    ctx = MagicMock()

    hook = _pre_hook(ctx)
    hook(tool_name="terminal", args={"command": "npx hyperframes init --example blank", "workdir": str(tmp_path)})

    ctx.inject_message.assert_not_called()
    assert not (tmp_path / ".framepack" / "arsenal.json").exists()


def test_hyperframes_command_noops_when_no_expanded_prompt(tmp_path):
    (tmp_path / "frame.md").write_text("ok", encoding="utf-8")
    ctx = MagicMock()

    hook = _pre_hook(ctx)
    hook(tool_name="terminal", args={"command": "npx hyperframes lint", "workdir": str(tmp_path)})

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
