from __future__ import annotations

import json
from pathlib import Path

from core.gates.audio_cues import check_audio_cues
from core.render_readiness import GateStatus, build_readiness_board


def _expanded(project: Path, text: str) -> None:
    hp = project / ".hyperframes"
    hp.mkdir(parents=True, exist_ok=True)
    hp.joinpath("expanded-prompt.md").write_text(text, encoding="utf-8")


def _fp(project: Path) -> Path:
    path = project / ".framepack"
    path.mkdir(parents=True, exist_ok=True)
    return path


def test_audio_cues_not_applicable_without_audio_language(tmp_path: Path):
    _expanded(tmp_path, "# Story Bible\nSoft product reveal with no sound plan.")

    assert check_audio_cues(tmp_path) is None


def test_audio_cues_red_when_drop_is_mentioned_without_cue_evidence(tmp_path: Path):
    _expanded(tmp_path, "# Story Bible\nScene 2 hits on the BGM drop with beat-synced typography.")

    result = check_audio_cues(tmp_path)

    assert result.status is GateStatus.RED
    assert "missing .framepack/audio-cues.json" in result.evidence


def test_audio_cues_green_with_valid_audio_cue_ledger(tmp_path: Path):
    _expanded(tmp_path, "# Story Bible\nScene 2 hits on the BGM drop with beat-synced typography.")
    _fp(tmp_path).joinpath("audio-cues.json").write_text(
        json.dumps({"strong_cues": [{"time": 4.2, "label": "drop"}], "cue_bindings": [{"scene": "Scene 2", "cue": "drop"}]}),
        encoding="utf-8",
    )

    result = check_audio_cues(tmp_path)

    assert result.status is GateStatus.GREEN


def test_audio_cues_yellow_with_manual_waiver(tmp_path: Path):
    _expanded(tmp_path, "# Story Bible\nBGM drives the edit rhythm.")
    _fp(tmp_path).joinpath("audio-cues.md").write_text(
        "# Audio Cues\n- manual_cue_plan: Cut on chorus by ear\n- waiver_reason: no local mp3 yet\n",
        encoding="utf-8",
    )

    result = check_audio_cues(tmp_path)

    assert result.status is GateStatus.YELLOW
    assert "manual" in result.evidence.lower()


def test_readiness_board_includes_audio_cue_gate_when_audio_is_mentioned(tmp_path: Path):
    _expanded(tmp_path, "# Story Bible\nBGM drop drives the transition.")

    board = build_readiness_board(tmp_path)

    gates = {gate.name: gate for gate in board.gates}
    assert gates["Audio Cue Ledger"].status is GateStatus.RED
