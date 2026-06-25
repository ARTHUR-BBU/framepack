"""Audio Cue Ledger readiness gate."""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

from core.gates.types import GateResult, GateStatus

_AUDIO_RE = re.compile(
    r"\b(BGM|beat|beats?|drop|chorus|audio[-\s]?reactive|voiceover|TTS|transcribe|caption|soundtrack)\b|节拍|音乐|卡点|鼓点|字幕|旁白",
    re.IGNORECASE,
)
_DROP_RE = re.compile(r"\b(drop|beat[-\s]?synced|beat\s+drives|BGM\s+drives)\b|卡点|鼓点", re.IGNORECASE)


def _read(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return ""


def _project_audio_text(project: Path) -> str:
    parts = [
        _read(project / ".hyperframes" / "expanded-prompt.md"),
        _read(project / ".framepack" / "asset-intake.md"),
        _read(project / ".framepack" / "handoff-manifest.md"),
    ]
    return "\n".join(parts)


def _read_json(path: Path) -> dict[str, Any] | None:
    try:
        data = json.loads(path.read_text(encoding="utf-8", errors="replace"))
    except (OSError, json.JSONDecodeError):
        return None
    return data if isinstance(data, dict) else None


def _has_valid_ledger(data: dict[str, Any]) -> bool:
    strong = data.get("strong_cues")
    bindings = data.get("cue_bindings")
    return isinstance(strong, list) and bool(strong) and isinstance(bindings, list) and bool(bindings)


def check_audio_cues(project_dir: str | Path) -> GateResult | None:
    """Require cue evidence when audio/BGM/beat language appears."""

    project = Path(project_dir)
    project_text = _project_audio_text(project)
    if not _AUDIO_RE.search(project_text):
        return None

    ledger_path = project / ".framepack" / "audio-cues.json"
    ledger = _read_json(ledger_path)
    if ledger is not None and _has_valid_ledger(ledger):
        return GateResult(
            name="Audio Cue Ledger",
            status=GateStatus.GREEN,
            evidence=".framepack/audio-cues.json (strong_cues + cue_bindings)",
            risk="",
        )

    manual_text = _read(project / ".framepack" / "audio-cues.md")
    if re.search(r"manual_cue_plan\s*:\s*\S", manual_text, re.IGNORECASE) or re.search(r"waiver_reason\s*:\s*\S", manual_text, re.IGNORECASE):
        return GateResult(
            name="Audio Cue Ledger",
            status=GateStatus.YELLOW,
            evidence="manual .framepack/audio-cues.md plan/waiver recorded",
            risk="audio timing is manually planned; verify in Studio before final render",
        )

    status = GateStatus.RED if _DROP_RE.search(project_text) else GateStatus.YELLOW
    return GateResult(
        name="Audio Cue Ledger",
        status=status,
        evidence="missing .framepack/audio-cues.json for audio/BGM-driven project",
        risk="beat/drop/caption timing may stay as vibe text instead of production evidence",
    )
