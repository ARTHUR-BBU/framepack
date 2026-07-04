from pathlib import Path
from unittest.mock import Mock
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))


def test_registers_framepack_match_weapons_cli_command():
    import importlib.util

    init_path = Path(__file__).resolve().parents[1] / "__init__.py"
    spec = importlib.util.spec_from_file_location("framepack_plugin_init_for_match_test", init_path)
    mod = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(mod)

    ctx = Mock()
    mod._register_cli_commands(ctx)

    names = [call.kwargs["name"] for call in ctx.register_cli_command.call_args_list]
    assert "framepack-match-weapons" in names
