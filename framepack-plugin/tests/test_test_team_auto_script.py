"""Test-team v0.11.0 auto-test script tests."""

import importlib.util
import json
import subprocess
import sys
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[2] / "scripts" / "test_team_v0110_auto_test.py"


def _load_script_module():
    spec = importlib.util.spec_from_file_location("test_team_v0110_auto_test", SCRIPT)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def test_test_team_auto_script_dry_run_emits_plan(tmp_path):
    output_dir = tmp_path / "report"

    result = subprocess.run(
        [sys.executable, str(SCRIPT), "--dry-run", "--output-dir", str(output_dir)],
        text=True,
        capture_output=True,
        check=True,
    )

    payload = json.loads(result.stdout)
    assert payload["kind"] == "framepack_test_team_auto_test"
    assert payload["framepack_version"] == "0.11.0"
    assert payload["dry_run"] is True
    assert "source_pytest" in payload["planned_checks"]
    assert "deployed_smoke" in payload["planned_checks"]
    assert "case_quality_audit" in payload["planned_checks"]


def test_test_team_auto_script_writes_json_report_for_dry_run(tmp_path):
    output_dir = tmp_path / "report"

    subprocess.run(
        [sys.executable, str(SCRIPT), "--dry-run", "--output-dir", str(output_dir)],
        text=True,
        capture_output=True,
        check=True,
    )

    report = json.loads((output_dir / "framepack-v0110-auto-test-report.json").read_text(encoding="utf-8"))
    assert report["framepack_version"] == "0.11.0"
    assert report["summary"]["failed"] == 0


def test_quality_summary_is_read_from_report_file_not_truncated_stdout(tmp_path):
    module = _load_script_module()
    report_path = tmp_path / "case-quality-audit.json"
    report_path.write_text(
        json.dumps({"summary": {"P0": 1, "P1": 2}, "issues": [{}, {}, {}]}),
        encoding="utf-8",
    )

    assert module._quality_summary_from_report(report_path) == {"summary": {"P0": 1, "P1": 2}, "issues": 3}


def test_deployed_smoke_code_checks_plugin_yaml_version():
    module = _load_script_module()
    code = module._deployed_smoke_code(Path("F:/Hermes_windows/plugins/framepack"))

    assert "plugin.yaml" in code
    assert "0.11.0" in code
