"""Native readiness gate registry."""

from __future__ import annotations

from pathlib import Path

from core.gates.asset_intake import check_asset_depth
from core.gates.audio_cues import check_audio_cues
from core.gates.control_profile import check_control_profile_consistency
from core.gates.hyperframes_capability_alignment import check_hyperframes_capability_alignment
from core.gates.scene_continuity import check_scene_continuity
from core.gates.source_extraction import check_source_extraction
from core.gates.storyboard_preview import check_storyboard_preview
from core.gates.types import GateResult


def evaluate_native_gates(project_dir: str | Path) -> list[GateResult]:
    """Evaluate new Gate Engine gates.

    A gate may return None when it is not applicable to the current project.
    """

    checks = [
        check_source_extraction,
        check_storyboard_preview,
        check_audio_cues,
        check_scene_continuity,
        check_hyperframes_capability_alignment,
        check_control_profile_consistency,
        check_asset_depth,
    ]
    results: list[GateResult] = []
    for check in checks:
        result = check(project_dir)
        if result is not None:
            results.append(result)
    return results
