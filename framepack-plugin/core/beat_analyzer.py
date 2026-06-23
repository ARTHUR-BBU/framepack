"""Real beat analyzer integration for Framepack.

This module is intentionally honest: it can parse/use real analyzer output,
but if no analyzer/audio exists it returns SKIP instead of inventing beats.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Callable, Optional

from core.audio_cue_ledger import AudioCueLedger, save_ledger


AnalyzerRunner = Callable[[Path], str]


@dataclass(frozen=True)
class BeatAnalysisResult:
    """Result from a BGM beat analysis attempt."""
    status: str  # OK | SKIP | ERROR
    message: str
    ledger: Optional[AudioCueLedger] = None
    confidence: Optional[float] = None


def _as_float_list(value: object) -> list[float]:
    if not isinstance(value, list):
        return []
    result: list[float] = []
    for item in value:
        try:
            result.append(float(item))
        except (TypeError, ValueError):
            continue
    return result


def parse_beat_json(payload: str, track: str, source: str) -> BeatAnalysisResult:
    """Parse JSON from a real beat analyzer into an AudioCueLedger.

    Accepted key aliases:
    - strong_cues | cues | downbeats
    - beat_grid | beats
    """
    try:
        data = json.loads(payload)
    except json.JSONDecodeError as exc:
        return BeatAnalysisResult(status="ERROR", message=f"invalid beat JSON: {exc}")

    if not isinstance(data, dict):
        return BeatAnalysisResult(status="ERROR", message="beat JSON must be an object")

    strong_cues = _as_float_list(
        data.get("strong_cues", data.get("cues", data.get("downbeats", [])))
    )
    beat_grid = _as_float_list(data.get("beat_grid", data.get("beats", [])))
    confidence = data.get("confidence")
    try:
        confidence = float(confidence) if confidence is not None else None
    except (TypeError, ValueError):
        confidence = None

    ledger = AudioCueLedger(
        track=str(data.get("track") or track),
        source=source,
        strong_cues=strong_cues,
        beat_grid=beat_grid,
        cue_bindings=[],
        analysis_method=source,
    )
    return BeatAnalysisResult(
        status="OK",
        message=f"parsed {len(strong_cues)} strong cues and {len(beat_grid)} beat-grid points",
        ledger=ledger,
        confidence=confidence,
    )


def analyze_bgm(audio_path: str | Path, runner: Optional[AnalyzerRunner] = None) -> BeatAnalysisResult:
    """Analyze one BGM file.

    runner: optional callable that executes the real analyzer and returns JSON.
    If omitted, analysis is skipped rather than faked.
    """
    path = Path(audio_path)
    if not path.is_file():
        return BeatAnalysisResult(status="SKIP", message=f"audio file missing: {path}")
    if runner is None:
        return BeatAnalysisResult(
            status="SKIP",
            message="no beat analyzer runner configured; cannot produce real cues",
        )
    try:
        payload = runner(path)
    except Exception as exc:  # runner can be any external command wrapper
        return BeatAnalysisResult(status="ERROR", message=f"beat analyzer failed: {exc}")

    return parse_beat_json(payload, track=str(path), source="external-runner")


def _find_project_audio(project_dir: Path) -> Optional[Path]:
    candidates = [
        project_dir / "assets" / "audio" / "bgm.mp3",
        project_dir / "assets" / "audio" / "music.mp3",
        project_dir / "assets" / "bgm.mp3",
        project_dir / "bgm.mp3",
    ]
    for candidate in candidates:
        if candidate.is_file():
            return candidate
    suffixes = (".mp3", ".wav", ".m4a", ".aac", ".flac", ".ogg")
    for root in (project_dir / "assets" / "audio", project_dir / "assets"):
        try:
            entries = sorted(root.iterdir())
        except OSError:
            continue
        for entry in entries:
            if entry.is_file() and entry.suffix.lower() in suffixes:
                return entry
    return None


def analyze_project_bgm(
    project_dir: str | Path,
    runner: Optional[AnalyzerRunner] = None,
    write_ledger: bool = False,
) -> BeatAnalysisResult:
    """Find and analyze project BGM, optionally writing .framepack/audio-cues.json."""
    project = Path(project_dir)
    audio = _find_project_audio(project)
    if audio is None:
        return BeatAnalysisResult(status="SKIP", message="no BGM/audio file found in project")

    result = analyze_bgm(audio, runner=runner)
    if write_ledger and result.status == "OK" and result.ledger is not None:
        save_ledger(result.ledger, project / ".framepack" / "audio-cues.json")
    return result
