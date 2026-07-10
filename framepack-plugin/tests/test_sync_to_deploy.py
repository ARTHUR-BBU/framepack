"""Tests for sync_to_deploy.py — the LF-normalized deploy sync script.

Phase 7: closes the "text diff zero but md5 mismatch" gap caused by CRLF/LF.
"""
from pathlib import Path
import subprocess
import sys

import pytest

SCRIPT = Path(__file__).resolve().parent.parent / "scripts" / "sync_to_deploy.py"


def test_sync_script_exists():
    assert SCRIPT.is_file(), f"sync_to_deploy.py not found at {SCRIPT}"


def test_sync_check_returns_zero_when_in_sync(tmp_path, monkeypatch):
    """--check should return 0 when source and deploy are identical."""
    src = tmp_path / "src"
    dst = tmp_path / "dst"
    src.mkdir()
    dst.mkdir()
    (src / "test.py").write_text("print('hello')\n", encoding="utf-8")
    (dst / "test.py").write_text("print('hello')\n", encoding="utf-8")

    result = subprocess.run(
        [sys.executable, str(SCRIPT), "--check", "--source", str(src), "--deploy", str(dst)],
        capture_output=True, text=True, timeout=30,
    )
    assert result.returncode == 0, result.stdout + result.stderr


def test_sync_check_fails_on_text_diff(tmp_path):
    """--check should return non-zero when content actually differs."""
    src = tmp_path / "src"
    dst = tmp_path / "dst"
    src.mkdir()
    dst.mkdir()
    (src / "test.py").write_text("print('new')\n", encoding="utf-8")
    (dst / "test.py").write_text("print('old')\n", encoding="utf-8")

    result = subprocess.run(
        [sys.executable, str(SCRIPT), "--check", "--source", str(src), "--deploy", str(dst)],
        capture_output=True, text=True, timeout=30,
    )
    assert result.returncode != 0


def test_sync_writes_lf_normalized_copy(tmp_path):
    """After sync, deployed files should be LF-normalized and match source text hash."""
    src = tmp_path / "src"
    dst = tmp_path / "dst"
    src.mkdir()
    dst.mkdir()
    (src / "test.py").write_text("print('hello')\n", encoding="utf-8")

    result = subprocess.run(
        [sys.executable, str(SCRIPT), "--source", str(src), "--deploy", str(dst)],
        capture_output=True, text=True, timeout=30,
    )
    assert result.returncode == 0, result.stdout + result.stderr

    deployed = (dst / "test.py").read_bytes()
    assert b"\r\n" not in deployed, "deployed file should be LF-normalized"


def test_sync_check_passes_on_crlf_in_deploy_only(tmp_path):
    """Source is LF, deploy has CRLF but same text → --check should pass (text hash matches)."""
    src = tmp_path / "src"
    dst = tmp_path / "dst"
    src.mkdir()
    dst.mkdir()
    content = "print('hello')\n"
    (src / "test.py").write_text(content, encoding="utf-8", newline="\n")
    (dst / "test.py").write_text(content.replace("\n", "\r\n"), encoding="utf-8", newline="")

    result = subprocess.run(
        [sys.executable, str(SCRIPT), "--check", "--source", str(src), "--deploy", str(dst)],
        capture_output=True, text=True, timeout=30,
    )
    assert result.returncode == 0, f"Expected pass on CRLF-only diff, got: {result.stdout}{result.stderr}"
