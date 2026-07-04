from pathlib import Path
from unittest.mock import Mock, patch
import sys

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))


def test_expanded_prompt_write_generates_weapon_load_plan_and_injects_summary(tmp_path):
    from hooks.on_post_tool_call import _handle_expanded_prompt

    exp_dir = tmp_path / ".hyperframes"
    exp_dir.mkdir()
    expanded = exp_dir / "expanded-prompt.md"
    expanded.write_text(
        """
## Scene 3 — 120+ 数据冲击
The KPI number 120+ should count up with snap.
""",
        encoding="utf-8",
    )
    ctx = Mock()

    with patch("hooks.on_post_tool_call._analyze_expanded_prompt", return_value=None), \
         patch("hooks.on_post_tool_call._sync_arsenal_for_expanded_prompt"), \
         patch("hooks.on_post_tool_call._inject_param_card_if_manifest"), \
         patch("hooks.on_post_tool_call._run_pipeline_gates_and_update"):
        _handle_expanded_prompt(ctx, str(expanded))

    assert (tmp_path / ".framepack" / "weapon-load-plan.json").is_file()
    injected = "\n".join(call.args[0] for call in ctx.inject_message.call_args_list)
    assert "Weapon Matching Pass" in injected
    assert "number-count-up" in injected


def test_pre_html_write_generates_missing_weapon_plan_from_expanded_prompt(tmp_path):
    from hooks.on_pre_tool_call import _ensure_weapon_plan_before_html

    exp_dir = tmp_path / ".hyperframes"
    exp_dir.mkdir()
    (exp_dir / "expanded-prompt.md").write_text(
        """
## Scene 3 — 120+ 数据冲击
The KPI number 120+ should count up with snap.
""",
        encoding="utf-8",
    )
    ctx = Mock()

    _ensure_weapon_plan_before_html(ctx, str(tmp_path / "index.html"))

    assert (tmp_path / ".framepack" / "weapon-load-plan.json").is_file()
    injected = "\n".join(call.args[0] for call in ctx.inject_message.call_args_list)
    assert "Weapon Matching Pass" in injected
    assert "number-count-up" in injected


def test_pre_html_write_blocks_when_prompt_missing(tmp_path):
    from hooks.on_pre_tool_call import _ensure_weapon_plan_before_html

    ctx = Mock()

    with pytest.raises(RuntimeError, match="Weapon Matching Pass"):
        _ensure_weapon_plan_before_html(ctx, str(tmp_path / "index.html"))

    assert not (tmp_path / ".framepack" / "weapon-load-plan.json").exists()
    injected = "\n".join(call.args[0] for call in ctx.inject_message.call_args_list)
    assert "could not run" in injected
    assert "expanded-prompt.md" in injected


def test_pre_html_write_noops_when_plan_exists(tmp_path):
    from core.weapon_matcher import match_weapons_for_prompt
    from core.weapon_load_plan import write_weapon_load_plan
    from hooks.on_pre_tool_call import _ensure_weapon_plan_before_html

    plan = match_weapons_for_prompt("## Scene 1\nThe KPI number 120+ should count up with snap.", tmp_path)
    write_weapon_load_plan(tmp_path, plan)
    ctx = Mock()

    _ensure_weapon_plan_before_html(ctx, str(tmp_path / "index.html"))

    ctx.inject_message.assert_not_called()


def test_patch_path_detection_scans_all_update_files():
    from hooks.on_pre_tool_call import _pre_tool_html_paths

    paths = _pre_tool_html_paths(
        "patch",
        {
            "mode": "patch",
            "patch": """*** Begin Patch
*** Update File: notes.md
@@
-old
+new
*** Update File: subdir/index.html
@@
-old
+new
*** End Patch""",
        },
    )

    assert paths == ["notes.md", "subdir/index.html"]


def test_terminal_index_html_detection_uses_workdir(tmp_path):
    from hooks.on_pre_tool_call import _pre_tool_html_paths

    paths = _pre_tool_html_paths(
        "terminal",
        {"command": "python build.py > index.html", "workdir": str(tmp_path)},
    )

    assert paths == [str(tmp_path / "index.html")]
