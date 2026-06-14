"""Generate a HyperFrames upstream compatibility report.

This script is intentionally report-only. It never overwrites local HyperFrames
skills because local skills may contain Framepack hardening learned from real
render/debug sessions.
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import tarfile
import tempfile
from pathlib import Path
import shutil
import sys

PLUGIN_ROOT = Path(__file__).resolve().parent.parent
if str(PLUGIN_ROOT) not in sys.path:
    sys.path.insert(0, str(PLUGIN_ROOT))

from core.hyperframes_adapter import diff_skill_directories, save_capabilities, snapshot_from_cli


def _run(args: list[str], timeout: int = 60) -> str:
    executable_args = list(args)
    resolved = shutil.which(executable_args[0]) or shutil.which(executable_args[0] + ".cmd")
    if resolved:
        executable_args[0] = resolved
    completed = subprocess.run(executable_args, text=True, capture_output=True, timeout=timeout, check=False)
    output = (completed.stdout or "") + (completed.stderr or "")
    if completed.returncode != 0:
        raise RuntimeError(output.strip() or f"command failed with exit {completed.returncode}: {' '.join(args)}")
    return output


def _safe_extract(archive: tarfile.TarFile, destination: Path) -> None:
    destination = destination.resolve()
    destination.mkdir(parents=True, exist_ok=True)
    for member in archive.getmembers():
        target = (destination / member.name).resolve()
        if destination not in target.parents and target != destination:
            raise RuntimeError(f"unsafe tar member path: {member.name}")
        if not (member.isfile() or member.isdir()):
            raise RuntimeError(f"unsafe tar member type: {member.name}")
    archive.extractall(destination, filter="data")


def _pack_official_skills(version: str, workdir: Path) -> Path:
    pack_json = _run(["npm", "pack", f"hyperframes@{version}", "--json", "--pack-destination", str(workdir)], timeout=120)
    pack = json.loads(pack_json)[0]
    tarball = workdir / pack["filename"]
    with tarfile.open(tarball, "r:gz") as archive:
        _safe_extract(archive, workdir)
    return workdir / "package" / "dist" / "skills"


def generate_report(project_dir: Path, local_skills_dir: Path, output: Path, timeout: int = 60) -> dict:
    snapshot = snapshot_from_cli(timeout=timeout)
    save_capabilities(project_dir, snapshot)

    skill_report = {"summary": {"same": 0, "changed": 0, "missing_local": 0}, "skills": {}, "error": None}
    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)
        try:
            official_skills = _pack_official_skills(snapshot["version"], tmp_path)
            skill_report = diff_skill_directories(official_skills, local_skills_dir)
        except Exception as exc:
            skill_report["error"] = str(exc)

    report = {
        "kind": "hyperframes_upstream_report",
        "capabilities": snapshot,
        "skill_diff": skill_report,
        "policy": {
            "offline_safe_example": "blank",
            "registry_is_opportunistic": True,
            "never_blind_overwrite_local_skills": True,
        },
    }
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return report


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate HyperFrames upstream compatibility report")
    parser.add_argument("--project-dir", default=os.getcwd())
    parser.add_argument("--local-skills-dir", default="F:/Hermes_windows/skills/software-development")
    parser.add_argument("--output", default=".framepack/hyperframes-upstream-report.json")
    parser.add_argument("--timeout", type=int, default=60)
    args = parser.parse_args()

    report = generate_report(
        project_dir=Path(args.project_dir),
        local_skills_dir=Path(args.local_skills_dir),
        output=Path(args.output),
        timeout=args.timeout,
    )
    print(json.dumps({
        "version": report["capabilities"].get("version"),
        "registry_available": report["capabilities"].get("registry_available"),
        "proxy_retry": report["capabilities"].get("proxy_retry"),
        "skill_diff_summary": report["skill_diff"].get("summary"),
        "output": str(Path(args.output).resolve()),
    }, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
