"""Tests for capability-alignment gate evidence checking."""

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from core.gates.hyperframes_capability_alignment import check_hyperframes_capability_alignment


def _fp(project: Path) -> Path:
    return project / ".framepack"


def test_used_capture_green_when_capture_dir_exists(tmp_path):
    """used: capture + capture/ directory exists → GREEN."""
    fp = _fp(tmp_path)
    fp.mkdir()
    (tmp_path / "capture").mkdir()
    (tmp_path / "capture" / "tokens.json").write_text("{}", encoding="utf-8")
    fp.joinpath("hyperframes-capability-alignment.md").write_text(
        "# Capability Alignment\n\n## Decisions\n- used: capture\n- waived: catalog (no matching components)\n",
        encoding="utf-8",
    )

    result = check_hyperframes_capability_alignment(tmp_path)
    assert result is not None
    assert result.status.value in ("green", "GREEN")


def test_used_capture_yellow_when_no_capture_dir(tmp_path):
    """used: capture but no capture/ directory → YELLOW (evidence missing)."""
    fp = _fp(tmp_path)
    fp.mkdir()
    fp.joinpath("hyperframes-capability-alignment.md").write_text(
        "# Capability Alignment\n\n## Decisions\n- used: capture\n",
        encoding="utf-8",
    )

    result = check_hyperframes_capability_alignment(tmp_path)
    assert result is not None
    assert result.status.value in ("yellow", "YELLOW")


def test_waived_catalog_green_with_reason(tmp_path):
    """waived: catalog with a reason → GREEN."""
    fp = _fp(tmp_path)
    fp.mkdir()
    fp.joinpath("hyperframes-capability-alignment.md").write_text(
        "# Capability Alignment\n\n## Decisions\n- used: capture\n- waived: catalog (pure CSS/SVG, no matching components)\n",
        encoding="utf-8",
    )
    (tmp_path / "capture").mkdir()

    result = check_hyperframes_capability_alignment(tmp_path)
    assert result is not None
    assert result.status.value in ("green", "GREEN")


def test_waived_catalog_yellow_without_reason(tmp_path):
    """waived: catalog but no reason text → YELLOW."""
    fp = _fp(tmp_path)
    fp.mkdir()
    fp.joinpath("hyperframes-capability-alignment.md").write_text(
        "# Capability Alignment\n\n## Decisions\n- waived: catalog\n",
        encoding="utf-8",
    )

    result = check_hyperframes_capability_alignment(tmp_path)
    assert result is not None
    assert result.status.value in ("yellow", "YELLOW")


def test_used_overlay_receipt_green(tmp_path):
    """used: product-launch-video with overlay-receipt → GREEN."""
    fp = _fp(tmp_path)
    fp.mkdir()
    fp.joinpath("overlay-receipt.md").write_text(
        "# Overlay Receipt\n- skill: product-launch-video\n", encoding="utf-8",
    )
    fp.joinpath("hyperframes-capability-alignment.md").write_text(
        "# Capability Alignment\n\n## Decisions\n- used: product-launch-video\n",
        encoding="utf-8",
    )

    result = check_hyperframes_capability_alignment(tmp_path)
    assert result is not None
    assert result.status.value in ("green", "GREEN")


def test_used_workflow_skill_yellow_without_receipt(tmp_path):
    """used: product-launch-video but no overlay-receipt → YELLOW."""
    fp = _fp(tmp_path)
    fp.mkdir()
    fp.joinpath("hyperframes-capability-alignment.md").write_text(
        "# Capability Alignment\n\n## Decisions\n- used: product-launch-video\n",
        encoding="utf-8",
    )

    result = check_hyperframes_capability_alignment(tmp_path)
    assert result is not None
    assert result.status.value in ("yellow", "YELLOW")
