"""Scene continuity / boundary proof readiness gate."""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

from core.gates.types import GateResult, GateStatus


def _read(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return ""


def _scene_count(text: str) -> int:
    matches = re.findall(r"^#{2,4}\s*Scene\s+\d+\b", text, re.IGNORECASE | re.MULTILINE)
    if matches:
        return len(matches)
    return len(re.findall(r"\bScene\s+\d+\b", text, re.IGNORECASE))


def _has_kinetic_continuity(text: str) -> bool:
    required = [
        r"Kinetic\s+Continuity",
        r"Incoming\s+energy",
        r"Action\s+relay",
        r"Outgoing\s+transition\s+seed",
        r"Motif\s+state",
    ]
    return all(re.search(pattern, text, re.IGNORECASE) for pattern in required)


def _read_manifest(path: Path) -> dict[str, Any] | None:
    try:
        data = json.loads(path.read_text(encoding="utf-8", errors="replace"))
    except (OSError, json.JSONDecodeError):
        return None
    return data if isinstance(data, dict) else None


def _has_boundary_proofs(manifest: dict[str, Any], expected_boundaries: int) -> bool:
    scenes = manifest.get("scenes")
    if not isinstance(scenes, list):
        return False
    proof_count = 0
    for scene in scenes:
        if not isinstance(scene, dict):
            continue
        continuity = scene.get("continuity")
        if not isinstance(continuity, dict):
            continue
        proofs = continuity.get("boundary_proofs")
        if isinstance(proofs, list) and any(str(item).strip() for item in proofs):
            proof_count += 1
    return proof_count >= max(1, expected_boundaries)


def check_scene_continuity(project_dir: str | Path) -> GateResult | None:
    """Require Kinetic Continuity and boundary-proof binding for multi-scene projects."""

    project = Path(project_dir)
    expanded = _read(project / ".hyperframes" / "expanded-prompt.md")
    scenes = _scene_count(expanded)
    if scenes < 2:
        return None

    if not _has_kinetic_continuity(expanded):
        return GateResult(
            name="Scene Continuity",
            status=GateStatus.RED,
            evidence="multi-scene story bible lacks Kinetic Continuity contract",
            risk="scenes may become independent entrance animations instead of fused sequence",
        )

    manifest = _read_manifest(project / ".framepack" / "timeline-manifest.json")
    if manifest and _has_boundary_proofs(manifest, scenes - 1):
        return GateResult(
            name="Scene Continuity",
            status=GateStatus.GREEN,
            evidence="timeline-manifest continuity boundary_proofs present",
            risk="",
        )

    return GateResult(
        name="Scene Continuity",
        status=GateStatus.YELLOW,
        evidence="Kinetic Continuity text exists but timeline boundary_proofs are missing",
        risk="creative transition intent is not bound to production proof evidence",
    )
