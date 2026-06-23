"""Audio Cue Ledger — BGM beat-locked timeline anchors.

For rhythm-first videos, Framepack turns BGM into timeline anchors.
Music cues are assets, not vibes.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional


@dataclass(frozen=True)
class CueBinding:
    """A binding between a music cue time and a scene event."""
    time: float
    scene: str
    event: str
    tolerance_seconds: float = 0.15


@dataclass(frozen=True)
class AudioCueLedger:
    """Full audio cue ledger for a project."""
    track: str
    source: str  # user-provided | hyperframes-beats | external-analyzer | manual
    strong_cues: list[float] = field(default_factory=list)
    beat_grid: list[float] = field(default_factory=list)
    cue_bindings: list[CueBinding] = field(default_factory=list)
    analysis_method: str = ""


def load_ledger(path: Path | str) -> Optional[AudioCueLedger]:
    """Load an audio cue ledger from JSON. Returns None if missing/invalid."""
    path = Path(path)
    if not path.is_file():
        return None
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        bindings = [
            CueBinding(
                time=b["time"],
                scene=b["scene"],
                event=b["event"],
                tolerance_seconds=b.get("tolerance_seconds", 0.15),
            )
            for b in data.get("cue_bindings", [])
        ]
        return AudioCueLedger(
            track=data.get("track", ""),
            source=data.get("source", ""),
            strong_cues=data.get("strong_cues", []),
            beat_grid=data.get("beat_grid", []),
            cue_bindings=bindings,
            analysis_method=data.get("analysis_method", ""),
        )
    except (json.JSONDecodeError, KeyError, TypeError):
        return None


def save_ledger(ledger: AudioCueLedger, path: Path | str) -> None:
    """Save an audio cue ledger to JSON."""
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    data = {
        "track": ledger.track,
        "source": ledger.source,
        "analysis_method": ledger.analysis_method,
        "strong_cues": ledger.strong_cues,
        "beat_grid": ledger.beat_grid,
        "cue_bindings": [
            {
                "time": b.time,
                "scene": b.scene,
                "event": b.event,
                "tolerance_seconds": b.tolerance_seconds,
            }
            for b in ledger.cue_bindings
        ],
    }
    path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8", newline="\n")


def validate_ledger(ledger: AudioCueLedger) -> list[str]:
    """Validate a ledger. Returns list of issue strings (empty = valid)."""
    issues: list[str] = []
    if not ledger.track:
        issues.append("No track path specified.")

    if not ledger.strong_cues and not ledger.beat_grid:
        issues.append("No cue data (strong_cues and beat_grid both empty).")

    # Check binding-cue mismatch
    cue_set = set(ledger.strong_cues)
    for binding in ledger.cue_bindings:
        if ledger.strong_cues and binding.time not in cue_set:
            # Allow tolerance-based matching
            matched = any(abs(binding.time - c) <= binding.tolerance_seconds for c in ledger.strong_cues)
            if not matched:
                issues.append(
                    f"Cue binding mismatch: scene '{binding.scene}' at t={binding.time}s "
                    f"is not in strong_cues."
                )

    return issues


def create_manual_ledger(
    track: str,
    source: str,
    manual_cues: list[float],
    scene_bindings: Optional[dict[str, float]] = None,
) -> AudioCueLedger:
    """Create a ledger from manually-specified cue marks.

    Args:
        track: Path to BGM file.
        source: Source description.
        manual_cues: List of cue timestamps (seconds).
        scene_bindings: Optional {scene_name: cue_time} mapping.
    """
    bindings: list[CueBinding] = []
    if scene_bindings:
        for scene, time in scene_bindings.items():
            bindings.append(CueBinding(time=time, scene=scene, event="manual mark"))

    return AudioCueLedger(
        track=track,
        source=source,
        strong_cues=sorted(manual_cues),
        beat_grid=[],
        cue_bindings=bindings,
        analysis_method="manual",
    )
