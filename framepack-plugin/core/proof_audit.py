"""Proof-file checks for Framepack timeline manifests."""

from __future__ import annotations

from dataclasses import dataclass
import math
from pathlib import Path
import re
from typing import Any


@dataclass
class ProofIssue:
    code: str
    severity: str
    message: str
    path: str | None = None
    scene: str | None = None
    details: dict[str, Any] | None = None


def _required(item: dict[str, Any]) -> bool:
    return bool(item.get("required", True))


def _sanitize_label(label: str) -> str:
    text = re.sub(r"[^A-Za-z0-9._-]+", "-", label.strip().lower())
    text = re.sub(r"-+", "-", text).strip("-._")
    return text or "proof"


def _proof_exists(proofs_dir: Path, label: str, time: float) -> bool:
    sanitized = _sanitize_label(label)
    suffix = f"-{sanitized}-{time:.3f}s.png"
    return any(path.name.endswith(suffix) for path in proofs_dir.glob("proof-*.png"))


def _coerce_time(value: Any) -> float | None:
    if isinstance(value, bool):
        return None
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    return number if math.isfinite(number) else None


def _resolve_project_path(project_dir: Path, value: Any) -> Path:
    path = Path(str(value))
    if path.is_absolute():
        return path.resolve()
    return (project_dir / path).resolve()


def _is_within_project(project_dir: Path, path: Path) -> bool:
    root = project_dir.resolve()
    resolved = path.resolve()
    try:
        return resolved.is_relative_to(root)
    except AttributeError:  # pragma: no cover - py<3.9 defensive
        return str(resolved).startswith(str(root))


def _proofs_dir(project_dir: Path, timeline: dict[str, Any]) -> Path:
    proofs = timeline.get("proofs") if isinstance(timeline.get("proofs"), dict) else {}
    directory = proofs.get("directory") or ".framepack/proofs"
    return _resolve_project_path(project_dir, directory)


def _contact_sheet_path(project_dir: Path, timeline: dict[str, Any]) -> Path:
    proofs = timeline.get("proofs") if isinstance(timeline.get("proofs"), dict) else {}
    contact_sheet = proofs.get("contact_sheet") or ".framepack/proofs/contact-sheet.jpg"
    return _resolve_project_path(project_dir, contact_sheet)


def _path_scope_issues(project_dir: Path, timeline: dict[str, Any]) -> list[ProofIssue]:
    issues: list[ProofIssue] = []
    proofs = timeline.get("proofs") if isinstance(timeline.get("proofs"), dict) else {}
    checks = {
        "proofs.directory": proofs.get("directory") or ".framepack/proofs",
        "proofs.contact_sheet": proofs.get("contact_sheet") or ".framepack/proofs/contact-sheet.jpg",
    }
    for field, value in checks.items():
        resolved = _resolve_project_path(project_dir, value)
        if not _is_within_project(project_dir, resolved):
            issues.append(
                ProofIssue(
                    "proof_path_outside_project",
                    "P1",
                    f"{field} resolves outside the project directory; proof evidence must stay project-local",
                    str(resolved),
                    details={"field": field, "configured": value, "project_dir": str(project_dir.resolve())},
                )
            )
    return issues


def _missing_issue(code: str, severity: str, proofs_dir: Path, scene_id: str | None, item: dict[str, Any]) -> ProofIssue:
    label = str(item.get("label"))
    time = _coerce_time(item.get("time"))
    assert time is not None
    return ProofIssue(
        code,
        severity,
        f"Required proof {label!r} at {time:.3f}s is missing",
        str(proofs_dir),
        scene=scene_id,
        details={"label": label, "time": time},
    )


def _invalid_proof_issue(proofs_dir: Path, scene_id: str | None, item: dict[str, Any]) -> ProofIssue:
    label = str(item.get("label", ""))
    return ProofIssue(
        "proof_invalid",
        "P2",
        "Required proof has non-numeric time",
        str(proofs_dir),
        scene=scene_id,
        details={"label": label, "time": item.get("time")},
    )


def audit_proofs(project_dir: Path, timeline: dict[str, Any]) -> list[ProofIssue]:
    project_dir = Path(project_dir)
    issues: list[ProofIssue] = []
    issues.extend(_path_scope_issues(project_dir, timeline))
    proofs_dir = _proofs_dir(project_dir, timeline)
    checked_any = False
    existing_any = proofs_dir.exists() and any(proofs_dir.glob("proof-*.png"))

    for scene in timeline.get("scenes", []) or []:
        if not isinstance(scene, dict):
            continue
        scene_id = str(scene.get("id")) if scene.get("id") else None
        for item in scene.get("proofs", []) or []:
            if not isinstance(item, dict) or "time" not in item or not item.get("label") or not _required(item):
                continue
            checked_any = True
            time = _coerce_time(item.get("time"))
            if time is None:
                issues.append(_invalid_proof_issue(proofs_dir, scene_id, item))
                continue
            if not _proof_exists(proofs_dir, str(item["label"]), time):
                issues.append(_missing_issue("proof_missing", "P2", proofs_dir, scene_id, item))
        continuity = scene.get("continuity") if isinstance(scene.get("continuity"), dict) else {}
        for item in continuity.get("boundary_proofs", []) or []:
            if not isinstance(item, dict) or "time" not in item or not item.get("label") or not _required(item):
                continue
            checked_any = True
            time = _coerce_time(item.get("time"))
            if time is None:
                issues.append(_invalid_proof_issue(proofs_dir, scene_id, item))
                continue
            if not _proof_exists(proofs_dir, str(item["label"]), time):
                issues.append(_missing_issue("boundary_proof_missing", "P1", proofs_dir, scene_id, item))

    proofs = timeline.get("proofs") if isinstance(timeline.get("proofs"), dict) else {}
    for item in proofs.get("required", []) or []:
        if not isinstance(item, dict) or "time" not in item or not item.get("label") or not _required(item):
            continue
        checked_any = True
        time = _coerce_time(item.get("time"))
        if time is None:
            issues.append(_invalid_proof_issue(proofs_dir, None, item))
            continue
        if not _proof_exists(proofs_dir, str(item["label"]), time):
            issues.append(_missing_issue("proof_missing", "P2", proofs_dir, None, item))

    if existing_any and not _contact_sheet_path(project_dir, timeline).exists():
        issues.append(
            ProofIssue(
                "contact_sheet_missing",
                "P3",
                "Proof frames exist but contact sheet is missing",
                str(_contact_sheet_path(project_dir, timeline)),
            )
        )
    return issues
