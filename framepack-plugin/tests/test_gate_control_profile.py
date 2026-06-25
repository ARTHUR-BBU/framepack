from __future__ import annotations

from pathlib import Path

from core.gates.control_profile import check_control_profile_consistency
from core.render_readiness import GateStatus, build_readiness_board


def _write(project: Path, frame: str, expanded: str) -> None:
    project.joinpath("frame.md").write_text(frame, encoding="utf-8")
    hp = project / ".hyperframes"
    hp.mkdir(parents=True, exist_ok=True)
    hp.joinpath("expanded-prompt.md").write_text(expanded, encoding="utf-8")


def test_control_profile_yellow_when_low_motion_uses_aggressive_verbs(tmp_path: Path):
    _write(
        tmp_path,
        """# Frame
control_profile:
  motion_dynamism: low
  creative_autonomy: medium
""",
        "Scene 1: SLAM, CRASH, BURST, SHATTER typography across the screen.",
    )

    result = check_control_profile_consistency(tmp_path)

    assert result.status is GateStatus.YELLOW
    assert "motion_dynamism" in result.evidence


def test_control_profile_yellow_when_high_motion_is_only_soft_verbs(tmp_path: Path):
    _write(
        tmp_path,
        """# Frame
control_profile:
  motion_dynamism: high
  creative_autonomy: medium
""",
        "Scene 1: elements fade, drift, breathe, float gently with calm pacing.",
    )

    result = check_control_profile_consistency(tmp_path)

    assert result.status is GateStatus.YELLOW
    assert "motion_dynamism" in result.evidence


def test_control_profile_yellow_when_low_autonomy_has_no_support(tmp_path: Path):
    _write(
        tmp_path,
        """# Frame
control_profile:
  motion_dynamism: medium
  creative_autonomy: low
""",
        "Scene 1: create a stylish abstract video with custom animation.",
    )

    result = check_control_profile_consistency(tmp_path)

    assert result.status is GateStatus.YELLOW
    assert "creative_autonomy" in result.evidence


def test_control_profile_green_when_weights_match_director_evidence(tmp_path: Path):
    _write(
        tmp_path,
        """# Frame
visual_style: Velvet Standard
reference_dna: luxury editorial macro photography
control_profile:
  motion_dynamism: low
  creative_autonomy: low
""",
        "Scene 1: elements fade, drift, breathe, float. Use weapon: card-cascade and reference_dna details.",
    )

    result = check_control_profile_consistency(tmp_path)

    assert result.status is GateStatus.GREEN


def test_readiness_board_includes_control_profile_gate_when_profile_present(tmp_path: Path):
    _write(
        tmp_path,
        """# Frame
control_profile:
  motion_dynamism: low
  creative_autonomy: medium
""",
        "Scene 1: SLAM, CRASH, BURST, SHATTER typography across the screen.",
    )

    board = build_readiness_board(tmp_path)

    gates = {gate.name: gate for gate in board.gates}
    assert gates["Control Profile"].status is GateStatus.YELLOW
