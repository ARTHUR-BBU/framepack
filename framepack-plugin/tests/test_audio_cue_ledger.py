"""Tests for P1.3 Audio Cue Ledger."""

from __future__ import annotations

import json
from pathlib import Path

from core.audio_cue_ledger import (
    CueBinding,
    AudioCueLedger,
    load_ledger,
    save_ledger,
    validate_ledger,
    create_manual_ledger,
)


class TestAudioCueLedger:
    def test_load_valid_ledger(self, tmp_path):
        data = {
            "track": "assets/audio/bgm.mp3",
            "source": "user-provided",
            "strong_cues": [1.0, 5.0, 10.0],
            "beat_grid": [0.5, 1.0, 1.5],
            "cue_bindings": [
                {"time": 5.0, "scene": "scene_2", "event": "title impact", "tolerance_seconds": 0.15}
            ],
        }
        p = tmp_path / ".framepack" / "audio-cues.json"
        p.parent.mkdir(parents=True)
        p.write_text(json.dumps(data), encoding="utf-8")
        ledger = load_ledger(p)
        assert ledger is not None
        assert ledger.track == "assets/audio/bgm.mp3"
        assert len(ledger.strong_cues) == 3
        assert len(ledger.cue_bindings) == 1

    def test_load_missing_returns_none(self, tmp_path):
        ledger = load_ledger(tmp_path / "nonexistent.json")
        assert ledger is None

    def test_load_read_error_returns_none(self, tmp_path, monkeypatch):
        p = tmp_path / ".framepack" / "audio-cues.json"
        p.parent.mkdir(parents=True)
        p.write_text("{}", encoding="utf-8")

        def explode(*args, **kwargs):
            raise OSError("permission denied")

        monkeypatch.setattr(type(p), "read_text", explode)
        assert load_ledger(p) is None

    def test_validate_ledger_valid(self, tmp_path):
        ledger = AudioCueLedger(
            track="bgm.mp3",
            source="user-provided",
            strong_cues=[1.0, 5.0],
            beat_grid=[],
            cue_bindings=[CueBinding(time=5.0, scene="scene_2", event="impact")],
        )
        issues = validate_ledger(ledger)
        assert len(issues) == 0

    def test_validate_ledger_no_cues(self, tmp_path):
        ledger = AudioCueLedger(
            track="bgm.mp3",
            source="user-provided",
            strong_cues=[],
            beat_grid=[],
            cue_bindings=[],
        )
        issues = validate_ledger(ledger)
        assert any("no cue" in i.lower() for i in issues)

    def test_validate_binding_mismatch(self, tmp_path):
        """Binding references a time not in strong_cues."""
        ledger = AudioCueLedger(
            track="bgm.mp3",
            source="user-provided",
            strong_cues=[1.0, 5.0],
            beat_grid=[],
            cue_bindings=[CueBinding(time=99.0, scene="scene_3", event="x")],
        )
        issues = validate_ledger(ledger)
        assert any("mismatch" in i.lower() or "not in" in i.lower() for i in issues)

    def test_create_manual_ledger(self, tmp_path):
        """Create a ledger from manual cue marks."""
        ledger = create_manual_ledger(
            track="assets/bgm.mp3",
            source="user-provided",
            manual_cues=[2.0, 8.0, 15.0],
            scene_bindings={"scene_1": 2.0, "scene_3": 15.0},
        )
        assert ledger.track == "assets/bgm.mp3"
        assert len(ledger.strong_cues) == 3
        assert len(ledger.cue_bindings) == 2

    def test_save_ledger(self, tmp_path):
        ledger = AudioCueLedger(
            track="bgm.mp3",
            source="user",
            strong_cues=[1.0],
            beat_grid=[0.5],
            cue_bindings=[],
        )
        p = tmp_path / ".framepack" / "audio-cues.json"
        save_ledger(ledger, p)
        assert p.is_file()
        data = json.loads(p.read_text(encoding="utf-8"))
        assert data["track"] == "bgm.mp3"
