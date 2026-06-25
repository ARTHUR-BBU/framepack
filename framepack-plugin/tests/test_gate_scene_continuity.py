from __future__ import annotations

import json
from pathlib import Path

from core.gates.scene_continuity import check_scene_continuity
from core.render_readiness import GateStatus, build_readiness_board


def _expanded(project: Path, text: str) -> None:
    hp = project / ".hyperframes"
    hp.mkdir(parents=True, exist_ok=True)
    hp.joinpath("expanded-prompt.md").write_text(text, encoding="utf-8")


def _fp(project: Path) -> Path:
    path = project / ".framepack"
    path.mkdir(parents=True, exist_ok=True)
    return path


def test_scene_continuity_red_when_multiscene_prompt_has_no_kinetic_continuity(tmp_path: Path):
    _expanded(tmp_path, """# Story Bible
## Scene 1
Logo enters.
## Scene 2
Product appears.
""")

    result = check_scene_continuity(tmp_path)

    assert result.status is GateStatus.RED
    assert "Kinetic Continuity" in result.evidence


def test_scene_continuity_yellow_when_text_exists_but_timeline_has_no_boundary_proofs(tmp_path: Path):
    _expanded(tmp_path, """# Story Bible
## Scene 1
Kinetic Continuity: Incoming energy: spark. Action relay: line. Outgoing transition seed: glow. Motif state: grows.
## Scene 2
Kinetic Continuity: Incoming energy: glow. Action relay: cut. Outgoing transition seed: flash. Motif state: resolves.
""")

    result = check_scene_continuity(tmp_path)

    assert result.status is GateStatus.YELLOW
    assert "timeline" in result.evidence.lower()


def test_scene_continuity_green_with_timeline_boundary_proofs(tmp_path: Path):
    _expanded(tmp_path, """# Story Bible
## Scene 1
Kinetic Continuity: Incoming energy: spark. Action relay: line. Outgoing transition seed: glow. Motif state: grows.
## Scene 2
Kinetic Continuity: Incoming energy: glow. Action relay: cut. Outgoing transition seed: flash. Motif state: resolves.
""")
    _fp(tmp_path).joinpath("timeline-manifest.json").write_text(
        json.dumps(
            {
                "scenes": [
                    {"id": "scene-1", "continuity": {"boundary_proofs": ["glow handoff visible at 3.0s"]}},
                    {"id": "scene-2", "continuity": {"boundary_proofs": ["incoming glow matches prior seed"]}},
                ]
            }
        ),
        encoding="utf-8",
    )

    result = check_scene_continuity(tmp_path)

    assert result.status is GateStatus.GREEN


def test_readiness_board_includes_scene_continuity_gate_for_multiscene_prompt(tmp_path: Path):
    _expanded(tmp_path, """# Story Bible
## Scene 1
Logo enters.
## Scene 2
Product appears.
""")

    board = build_readiness_board(tmp_path)

    gates = {gate.name: gate for gate in board.gates}
    assert gates["Scene Continuity"].status is GateStatus.RED
