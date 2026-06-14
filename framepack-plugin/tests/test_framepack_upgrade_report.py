import json
import subprocess
import sys
from pathlib import Path

from core.framepack_upgrade_report import build_upgrade_report

SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "framepack_upgrade_report.py"


def test_build_upgrade_report_summarizes_environment_skill_and_smoke():
    report = build_upgrade_report(
        environment={
            "status": "needs_upgrade",
            "checks": {"hyperframes_cli": {"version": "0.6.88"}},
            "support": {"status": "too_old", "installed_version": "0.6.88"},
            "recommended_actions": ["upgrade_hyperframes"],
        },
        install_plan={
            "status": "changed",
            "items": [{"skill": "hyperframes", "action": "install_skill", "overlay_ids": ["hf-root-duration"]}],
        },
        skill_upgrades=[
            {
                "kind": "framepack_skill_upgrade_plan",
                "skill": "hyperframes",
                "decision": "auto_merge",
                "applied_overlays": ["hf-root-duration"],
                "upstream_absorbed": ["hf-old-rule"],
                "user_local_blocks": ["proxy-note"],
                "manual_review_required": False,
            }
        ],
        smoke={"blank_init": "pass", "hook_classification": "pass"},
    )

    data = report.to_dict()
    assert data["kind"] == "framepack_upgrade_report"
    assert data["status"] == "needs_upgrade"
    assert data["hyperframes"]["installed_version"] == "0.6.88"
    assert data["skills"][0]["skill"] == "hyperframes"
    assert data["skills"][0]["decision"] == "auto_merge"
    assert data["smoke"]["blank_init"] == "pass"
    assert "upgrade_hyperframes" in data["recommended_actions"]
    json.dumps(data, ensure_ascii=False)


def test_report_status_becomes_manual_review_if_any_skill_requires_review():
    report = build_upgrade_report(
        environment={"status": "ready", "recommended_actions": []},
        install_plan={"status": "ready", "items": []},
        skill_upgrades=[{"skill": "hyperframes-cli", "decision": "manual_review", "manual_review_required": True}],
        smoke={},
    )

    assert report.status == "manual_review"


def test_cli_reads_input_json_files_and_writes_output(tmp_path):
    env = tmp_path / "env.json"
    install = tmp_path / "install.json"
    upgrade = tmp_path / "upgrade.json"
    smoke = tmp_path / "smoke.json"
    output = tmp_path / "report.json"
    env.write_text(json.dumps({"status": "ready", "checks": {"hyperframes_cli": {"version": "0.6.97"}}, "recommended_actions": []}), encoding="utf-8")
    install.write_text(json.dumps({"status": "ready", "items": []}), encoding="utf-8")
    upgrade.write_text(json.dumps({"skill": "hyperframes", "decision": "replace", "manual_review_required": False}), encoding="utf-8")
    smoke.write_text(json.dumps({"blank_init": "pass"}), encoding="utf-8")

    result = subprocess.run(
        [
            sys.executable,
            str(SCRIPT),
            "--environment",
            str(env),
            "--install-plan",
            str(install),
            "--skill-upgrade",
            str(upgrade),
            "--smoke",
            str(smoke),
            "--output",
            str(output),
        ],
        text=True,
        capture_output=True,
        check=True,
    )

    stdout_data = json.loads(result.stdout)
    file_data = json.loads(output.read_text(encoding="utf-8"))
    assert stdout_data == file_data
    assert file_data["kind"] == "framepack_upgrade_report"
    assert file_data["status"] == "ready"
