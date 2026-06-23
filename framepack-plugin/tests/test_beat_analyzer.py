"""Tests for P2.1 Real Beat Analyzer integration."""

from __future__ import annotations

import json
from pathlib import Path

from core.beat_analyzer import (
    BeatAnalysisResult,
    analyze_bgm,
    analyze_project_bgm,
    parse_beat_json,
)


class TestParseBeatJson:
    def test_parse_hyperframes_style_json(self):
        payload = json.dumps({
            "track": "assets/bgm.mp3",
            "duration": 30.0,
            "strong_cues": [1.2, 5.5, 9.8],
            "beat_grid": [0.5, 1.0, 1.5],
            "confidence": 0.82,
        })
        result = parse_beat_json(payload, track="assets/bgm.mp3", source="hyperframes-beats")
        assert result.status == "OK"
        assert result.ledger is not None
        assert result.ledger.track == "assets/bgm.mp3"
        assert result.ledger.strong_cues == [1.2, 5.5, 9.8]
        assert result.confidence == 0.82

    def test_parse_alt_keys(self):
        payload = json.dumps({
            "beats": [0.25, 0.75],
            "cues": [4.0, 8.0],
        })
        result = parse_beat_json(payload, track="bgm.wav", source="external")
        assert result.status == "OK"
        assert result.ledger is not None
        assert result.ledger.beat_grid == [0.25, 0.75]
        assert result.ledger.strong_cues == [4.0, 8.0]

    def test_parse_invalid_json(self):
        result = parse_beat_json("not json", track="bgm.mp3", source="x")
        assert result.status == "ERROR"
        assert result.ledger is None
        assert "json" in result.message.lower()


class TestAnalyzeBgm:
    def test_missing_audio_file_skips(self, tmp_path):
        result = analyze_bgm(tmp_path / "missing.mp3")
        assert result.status == "SKIP"
        assert result.ledger is None
        assert "missing" in result.message.lower()

    def test_runner_success_writes_ledger(self, tmp_path):
        audio = tmp_path / "bgm.mp3"
        audio.write_bytes(b"fake audio bytes")

        def runner(path: Path) -> str:
            assert path == audio
            return json.dumps({"strong_cues": [1.0, 2.0], "beat_grid": [0.5, 1.0, 1.5]})

        result = analyze_bgm(audio, runner=runner)
        assert result.status == "OK"
        assert result.ledger is not None
        assert result.ledger.strong_cues == [1.0, 2.0]
        assert result.ledger.analysis_method == "external-runner"

    def test_runner_failure_returns_error(self, tmp_path):
        audio = tmp_path / "bgm.mp3"
        audio.write_bytes(b"fake audio bytes")

        def runner(path: Path) -> str:
            raise RuntimeError("analyzer exploded")

        result = analyze_bgm(audio, runner=runner)
        assert result.status == "ERROR"
        assert "exploded" in result.message


class TestAnalyzeProjectBgm:
    def test_project_without_audio_skips(self, tmp_path):
        result = analyze_project_bgm(tmp_path)
        assert result.status == "SKIP"
        assert "no bgm" in result.message.lower() or "audio" in result.message.lower()

    def test_project_audio_writes_audio_cues_json(self, tmp_path):
        assets = tmp_path / "assets" / "audio"
        assets.mkdir(parents=True)
        audio = assets / "bgm.mp3"
        audio.write_bytes(b"fake")

        def runner(path: Path) -> str:
            return json.dumps({"strong_cues": [3.0], "beat_grid": [1.0, 2.0, 3.0]})

        result = analyze_project_bgm(tmp_path, runner=runner, write_ledger=True)
        assert result.status == "OK"
        ledger_path = tmp_path / ".framepack" / "audio-cues.json"
        assert ledger_path.is_file()
        data = json.loads(ledger_path.read_text(encoding="utf-8"))
        assert data["strong_cues"] == [3.0]
