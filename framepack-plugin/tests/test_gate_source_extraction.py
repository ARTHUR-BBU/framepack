from __future__ import annotations

from pathlib import Path

from core.gates.source_extraction import check_source_extraction
from core.render_readiness import GateStatus, build_readiness_board


def _fp(project: Path) -> Path:
    path = project / ".framepack"
    path.mkdir(parents=True, exist_ok=True)
    return path


def test_source_extraction_red_when_url_handoff_has_no_source_intake(tmp_path: Path):
    _fp(tmp_path).joinpath("handoff-manifest.md").write_text(
        "# Handoff Manifest\n- source_inputs:\n  - url: https://example.com/story\n",
        encoding="utf-8",
    )

    result = check_source_extraction(tmp_path)

    assert result.status is GateStatus.RED
    assert result.name == "Source Extraction"
    assert "missing .framepack/source-intake.md" in result.evidence


def test_source_extraction_green_when_extraction_contract_is_complete(tmp_path: Path):
    fp = _fp(tmp_path)
    fp.joinpath("handoff-manifest.md").write_text(
        "# Handoff Manifest\n- source_inputs:\n  - url: https://example.com/story\n",
        encoding="utf-8",
    )
    fp.joinpath("source-intake.md").write_text(
        """# Source Intake
- extraction_method: web_extract
- source_summary: A product launch page for a bicycle light.
- narrative_type: product launch
- must_preserve_points:
  - waterproof claim
""",
        encoding="utf-8",
    )

    result = check_source_extraction(tmp_path)

    assert result.status is GateStatus.GREEN


def test_source_extraction_yellow_when_extraction_failed_with_reason(tmp_path: Path):
    fp = _fp(tmp_path)
    fp.joinpath("handoff-manifest.md").write_text(
        "# Handoff Manifest\n- source_inputs:\n  - url: https://example.com/story\n",
        encoding="utf-8",
    )
    fp.joinpath("source-intake.md").write_text(
        """# Source Intake
- extraction_method: failed
- extraction_failed_reason: website blocks automated extraction
- waiver_reason: user approved manual draft
""",
        encoding="utf-8",
    )

    result = check_source_extraction(tmp_path)

    assert result.status is GateStatus.YELLOW
    assert "failed" in result.evidence.lower()


def test_readiness_board_includes_source_extraction_gate_when_url_present(tmp_path: Path):
    _fp(tmp_path).joinpath("handoff-manifest.md").write_text(
        "# Handoff Manifest\n- source_inputs:\n  - url: https://example.com/story\n",
        encoding="utf-8",
    )

    board = build_readiness_board(tmp_path)

    gates = {gate.name: gate for gate in board.gates}
    assert gates["Source Extraction"].status is GateStatus.RED
