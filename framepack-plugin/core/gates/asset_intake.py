"""Workflow-aware Asset Intake depth gate."""

from __future__ import annotations

import re
from pathlib import Path

from core.gates.types import GateResult, GateStatus

_WORKFLOW_REQUIREMENTS: dict[str, dict[str, list[str]]] = {
    "product-launch-video": {
        "brand": ["logo"],
        "product": ["product", "product_images", "screenshot"],
        "cta": ["cta", "call to action"],
        "audio": ["bgm", "audio", "music"],
        "reference": ["reference"],
    },
    "embedded-captions": {
        "source_video": ["source_video", "footage", "video"],
        "transcript": ["transcript", "captions"],
        "caption_style": ["caption_style", "caption style", "font"],
    },
    "faceless-explainer": {
        "topic_or_source": ["topic", "source_summary", "source", "script"],
        "script": ["script", "selling_points", "beats"],
        "audio": ["voiceover", "tts", "bgm", "audio"],
    },
}


def _read(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return ""


def _workflow(project: Path) -> str | None:
    text = _read(project / ".framepack" / "handoff-manifest.md")
    match = re.search(r"workflow\s*:\s*([\w-]+)", text, re.IGNORECASE)
    return match.group(1).lower() if match else None


def _has_any(text: str, terms: list[str]) -> bool:
    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        lowered = line.lower()
        if not any(term.lower() in lowered for term in terms):
            continue
        if "waived" in lowered or "豁免" in lowered:
            return True
        if ":" in line:
            _, value = line.split(":", 1)
            if value.strip():
                return True
            continue
        return True
    return False


def check_asset_depth(project_dir: str | Path) -> GateResult | None:
    """Check whether Asset Intake is deep enough for the selected workflow."""

    project = Path(project_dir)
    workflow = _workflow(project)
    if not workflow or workflow not in _WORKFLOW_REQUIREMENTS:
        return None

    path = project / ".framepack" / "asset-intake.md"
    text = _read(path)
    if not text:
        return GateResult(
            name="Asset Depth",
            status=GateStatus.YELLOW,
            evidence=f"workflow={workflow} but .framepack/asset-intake.md is missing",
            risk="workflow-specific asset decisions are unavailable",
        )

    missing = [label for label, terms in _WORKFLOW_REQUIREMENTS[workflow].items() if not _has_any(text, terms)]
    if missing:
        return GateResult(
            name="Asset Depth",
            status=GateStatus.YELLOW,
            evidence=f"workflow={workflow} missing expected asset decisions: {', '.join(missing)}",
            risk="asset intake exists but may be too shallow for this workflow",
        )

    return GateResult(
        name="Asset Depth",
        status=GateStatus.GREEN,
        evidence=f"workflow={workflow} expected asset decisions recorded",
        risk="",
    )
