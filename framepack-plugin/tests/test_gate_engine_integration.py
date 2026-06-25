from __future__ import annotations

from pathlib import Path

from core.render_readiness import build_readiness_board, render_board_markdown, render_board_summary


def test_native_gates_have_stable_order_after_legacy_gates(tmp_path: Path):
    (tmp_path / "frame.md").write_text(
        """# Frame
control_profile:
  motion_dynamism: low
  creative_autonomy: low
""",
        encoding="utf-8",
    )
    fp = tmp_path / ".framepack"
    fp.mkdir(parents=True)
    fp.joinpath("handoff-manifest.md").write_text(
        "# Handoff Manifest\n- workflow: product-launch-video\n- source_inputs:\n  - url: https://example.com/story\n",
        encoding="utf-8",
    )
    fp.joinpath("asset-intake.md").write_text("# Asset Intake\n## Brand\n- logo: assets/logo.png\n", encoding="utf-8")
    hp = tmp_path / ".hyperframes"
    hp.mkdir(parents=True)
    hp.joinpath("expanded-prompt.md").write_text(
        """# Story Bible
## Scene 1
BGM drop. SLAM title.
## Scene 2
Product reveal.
""",
        encoding="utf-8",
    )

    board = build_readiness_board(tmp_path)
    names = [gate.name for gate in board.gates]

    assert names[-6:] == [
        "Source Extraction",
        "Storyboard Preview",
        "Audio Cue Ledger",
        "Scene Continuity",
        "Control Profile",
        "Asset Depth",
    ]


def test_render_board_summary_includes_top_risks_not_just_counts(tmp_path: Path):
    fp = tmp_path / ".framepack"
    fp.mkdir(parents=True)
    fp.joinpath("handoff-manifest.md").write_text(
        "# Handoff Manifest\n- source_inputs:\n  - url: https://example.com/story\n",
        encoding="utf-8",
    )

    board = build_readiness_board(tmp_path)
    summary = render_board_summary(board)

    assert "Top risks:" in summary
    assert "Source Extraction" in summary


def test_render_board_markdown_groups_native_gate_section(tmp_path: Path):
    fp = tmp_path / ".framepack"
    fp.mkdir(parents=True)
    fp.joinpath("handoff-manifest.md").write_text(
        "# Handoff Manifest\n- source_inputs:\n  - url: https://example.com/story\n",
        encoding="utf-8",
    )

    board = build_readiness_board(tmp_path)
    markdown = render_board_markdown(board)

    assert "## Director Intent Gates" in markdown
    assert "Source Extraction" in markdown


def test_render_board_markdown_does_not_duplicate_director_gates_in_main_table(tmp_path: Path):
    fp = tmp_path / ".framepack"
    fp.mkdir(parents=True)
    fp.joinpath("handoff-manifest.md").write_text(
        "# Handoff Manifest\n- source_inputs:\n  - url: https://example.com/story\n",
        encoding="utf-8",
    )

    board = build_readiness_board(tmp_path)
    markdown = render_board_markdown(board)

    assert markdown.count("| Source Extraction |") == 1


def test_native_gate_failure_advisory_includes_traceback(monkeypatch, tmp_path: Path):
    import core.gates.registry as registry

    def broken_native_gates(project: Path):
        raise RuntimeError("boom")

    monkeypatch.setattr(registry, "evaluate_native_gates", broken_native_gates)

    board = build_readiness_board(tmp_path)
    gate = next(g for g in board.gates if g.name == "Gate Engine")

    assert "RuntimeError: boom" in gate.evidence
    assert "Traceback" in gate.evidence
