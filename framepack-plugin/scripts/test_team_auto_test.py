#!/usr/bin/env python
"""Framepack v0.15.0 test-team automatic acceptance script.

Runs source tests, release/version synchronization checks, optional real-case
Quality Audit, and deployed-plugin smoke checks. It is intentionally report-first:
it does not mutate project files except writing reports under --output-dir.
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
import time
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any

FRAMEPACK_VERSION = "0.15.0"
REPORT_JSON = "framepack-v0150-auto-test-report.json"
REPORT_MD = "framepack-v0150-auto-test-report.md"
PLANNED_CHECKS = [
    "source_pytest",
    "release_version_sync",
    "quality_audit_cli",
    "deployed_smoke",
    "case_quality_audit",
]


@dataclass
class CheckResult:
    name: str
    status: str
    command: list[str] | None = None
    exit_code: int | None = None
    duration_seconds: float | None = None
    stdout_tail: str | None = None
    stderr_tail: str | None = None
    details: dict[str, Any] | None = None


def _tail(text: str, limit: int = 4000) -> str:
    return text[-limit:] if len(text) > limit else text


def _run(name: str, command: list[str], cwd: Path, timeout: int = 300) -> CheckResult:
    started = time.time()
    try:
        completed = subprocess.run(
            command,
            cwd=str(cwd),
            text=True,
            capture_output=True,
            timeout=timeout,
            check=False,
        )
        status = "passed" if completed.returncode == 0 else "failed"
        return CheckResult(
            name=name,
            status=status,
            command=command,
            exit_code=completed.returncode,
            duration_seconds=round(time.time() - started, 2),
            stdout_tail=_tail(completed.stdout),
            stderr_tail=_tail(completed.stderr),
        )
    except subprocess.TimeoutExpired as exc:
        return CheckResult(
            name=name,
            status="failed",
            command=command,
            exit_code=None,
            duration_seconds=round(time.time() - started, 2),
            stdout_tail=_tail(exc.stdout or ""),
            stderr_tail=f"timeout after {timeout}s\n{_tail(exc.stderr or '')}",
        )


def _write_reports(payload: dict[str, Any], output_dir: Path) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    (output_dir / REPORT_JSON).write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (output_dir / REPORT_MD).write_text(_render_markdown(payload), encoding="utf-8")


def _render_markdown(payload: dict[str, Any]) -> str:
    lines = [
        "# Framepack v0.15.0 Auto Test Report",
        "",
        f"- Repo: `{payload['repo']}`",
        f"- Version: `{payload['framepack_version']}`",
        f"- Dry run: `{payload['dry_run']}`",
        "",
        "## Summary",
        "",
        f"- Passed: {payload['summary']['passed']}",
        f"- Failed: {payload['summary']['failed']}",
        f"- Skipped: {payload['summary']['skipped']}",
        "",
        "## Checks",
        "",
    ]
    for check in payload["checks"]:
        lines.append(f"### {check['status'].upper()} · {check['name']}")
        if check.get("command"):
            lines.append("")
            lines.append("Command:")
            lines.append("```text")
            lines.append(" ".join(check["command"]))
            lines.append("```")
        if check.get("details"):
            lines.append("")
            lines.append("Details:")
            lines.append("```json")
            lines.append(json.dumps(check["details"], ensure_ascii=False, indent=2))
            lines.append("```")
        for key in ("stdout_tail", "stderr_tail"):
            if check.get(key):
                lines.append("")
                lines.append(key + ":")
                lines.append("```text")
                lines.append(check[key])
                lines.append("```")
        lines.append("")
    return "\n".join(lines).rstrip() + "\n"


def _summarize(checks: list[CheckResult]) -> dict[str, int]:
    return {
        "passed": sum(1 for c in checks if c.status == "passed"),
        "failed": sum(1 for c in checks if c.status == "failed"),
        "skipped": sum(1 for c in checks if c.status == "skipped"),
    }


def _quality_summary_from_report(report_path: Path) -> dict[str, Any] | None:
    try:
        data = json.loads(report_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None
    return {"summary": data.get("summary", {}), "issues": len(data.get("issues", []))}


def _deployed_smoke_code(deployed: Path) -> str:
    return (
        "import sys,json; from pathlib import Path; "
        f"root=Path({str(deployed)!r}); sys.path.insert(0,str(root)); "
        "from core.quality_audit import audit_project; "
        "version_line=[line for line in (root/'plugin.yaml').read_text(encoding='utf-8').splitlines() if line.startswith('version:')][0]; "
        f"assert {FRAMEPACK_VERSION!r} in version_line, version_line; "
        "print('deployed import/version ok')"
    )


def _build_payload(repo: Path, output_dir: Path, checks: list[CheckResult], dry_run: bool) -> dict[str, Any]:
    return {
        "kind": "framepack_test_team_auto_test",
        "framepack_version": FRAMEPACK_VERSION,
        "repo": str(repo),
        "output_dir": str(output_dir),
        "dry_run": dry_run,
        "planned_checks": PLANNED_CHECKS,
        "summary": _summarize(checks),
        "checks": [asdict(check) for check in checks],
    }


def run(args: argparse.Namespace) -> dict[str, Any]:
    repo = Path(args.repo).resolve()
    plugin = repo / "framepack-plugin"
    output_dir = Path(args.output_dir).resolve()
    case_project = Path(args.case_project).resolve() if args.case_project else None
    deployed = Path(args.deployed_plugin).resolve() if args.deployed_plugin else None

    if args.dry_run:
        checks = [CheckResult(name=name, status="skipped", details={"reason": "dry-run"}) for name in PLANNED_CHECKS]
        payload = _build_payload(repo, output_dir, checks, dry_run=True)
        _write_reports(payload, output_dir)
        return payload

    checks: list[CheckResult] = []
    checks.append(_run("source_pytest", [sys.executable, "-m", "pytest", "tests/", "-q", "-o", "addopts="], plugin, timeout=args.timeout))
    checks.append(_run("release_version_sync", [sys.executable, "-m", "pytest", "tests/test_deploy_manifest.py", "-q", "-o", "addopts="], plugin, timeout=args.timeout))
    checks.append(_run("quality_audit_cli", [sys.executable, "scripts/framepack_quality_audit.py", "--help"], plugin, timeout=60))

    if deployed and deployed.exists():
        code = _deployed_smoke_code(deployed)
        checks.append(_run("deployed_smoke", [sys.executable, "-c", code], repo, timeout=60))
    else:
        checks.append(CheckResult("deployed_smoke", "skipped", details={"reason": "deployed plugin path missing", "path": str(deployed) if deployed else None}))

    if case_project and case_project.exists():
        case_report = output_dir / "case-quality-audit.json"
        check = _run(
            "case_quality_audit",
            [sys.executable, "scripts/framepack_quality_audit.py", str(case_project), "--format", "json", "--output", str(case_report)],
            plugin,
            timeout=args.timeout,
        )
        summary = _quality_summary_from_report(case_report)
        if summary:
            check.details = {**(check.details or {}), **summary, "case_project": str(case_project), "report": str(case_report)}
        checks.append(check)
    else:
        checks.append(CheckResult("case_quality_audit", "skipped", details={"reason": "case project not provided or missing", "path": str(case_project) if case_project else None}))

    payload = _build_payload(repo, output_dir, checks, dry_run=False)
    _write_reports(payload, output_dir)
    return payload


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo", default=str(Path(__file__).resolve().parents[2]), help="Framepack repository root")
    parser.add_argument("--case-project", default="", help="Optional real HyperFrames/Framepack case project to quality-audit")
    parser.add_argument("--deployed-plugin", default="F:/Hermes_windows/plugins/framepack", help="Optional deployed Framepack plugin path")
    parser.add_argument("--output-dir", default="test-team-reports/v0.15.0", help="Directory for JSON/Markdown reports")
    parser.add_argument("--timeout", type=int, default=300, help="Per-command timeout in seconds")
    parser.add_argument("--dry-run", action="store_true", help="Print planned checks and write a dry-run report without running commands")
    args = parser.parse_args(argv)

    payload = run(args)
    sys.stdout.write(json.dumps(payload, ensure_ascii=False, indent=2) + "\n")
    return 1 if payload["summary"]["failed"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
