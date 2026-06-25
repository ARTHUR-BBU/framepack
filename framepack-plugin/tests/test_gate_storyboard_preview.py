from __future__ import annotations

from pathlib import Path

from core.gates.storyboard_preview import check_storyboard_preview
from core.render_readiness import GateStatus, build_readiness_board


def _expanded(project: Path, text: str) -> None:
    hp = project / ".hyperframes"
    hp.mkdir(parents=True, exist_ok=True)
    hp.joinpath("expanded-prompt.md").write_text(text, encoding="utf-8")


def _fp(project: Path) -> Path:
    path = project / ".framepack"
    path.mkdir(parents=True, exist_ok=True)
    return path


def test_storyboard_preview_red_when_multiscene_story_bible_has_no_preview(tmp_path: Path):
    _expanded(tmp_path, """# Story Bible
## Scene 1
Hook
## Scene 2
Payoff
""")

    result = check_storyboard_preview(tmp_path)

    assert result.status is GateStatus.RED
    assert "missing .framepack/storyboard-preview.md" in result.evidence


def test_storyboard_preview_green_when_preview_contract_is_confirmed(tmp_path: Path):
    _expanded(tmp_path, """# Story Bible
## Scene 1
Hook
## Scene 2
Payoff
""")
    _fp(tmp_path).joinpath("storyboard-preview.md").write_text(
        """# Storyboard Preview
- scene_count: 2
- user_confirmed: true
- recurring_motifs:
  - pearl glow
### Scene 1
- Visual: macro pearl on silk
- Feel: quiet luxury
- Key: first glint
### Scene 2
- Visual: product reveal
- Feel: confident
- Key: CTA lands
""",
        encoding="utf-8",
    )

    result = check_storyboard_preview(tmp_path)

    assert result.status is GateStatus.GREEN


def test_storyboard_preview_yellow_when_not_user_confirmed(tmp_path: Path):
    _expanded(tmp_path, """# Story Bible
## Scene 1
Hook
## Scene 2
Payoff
""")
    _fp(tmp_path).joinpath("storyboard-preview.md").write_text(
        """# Storyboard Preview
- scene_count: 2
- user_confirmed: false
- recurring_motifs:
  - pearl glow
### Scene 1
- Visual: macro pearl
- Feel: quiet
- Key: glint
### Scene 2
- Visual: reveal
- Feel: confident
- Key: CTA
""",
        encoding="utf-8",
    )

    result = check_storyboard_preview(tmp_path)

    assert result.status is GateStatus.YELLOW
    assert "not user-confirmed" in result.evidence


def test_readiness_board_includes_storyboard_gate_for_expanded_prompt(tmp_path: Path):
    _expanded(tmp_path, """# Story Bible
## Scene 1
Hook
## Scene 2
Payoff
""")

    board = build_readiness_board(tmp_path)

    gates = {gate.name: gate for gate in board.gates}
    assert gates["Storyboard Preview"].status is GateStatus.RED
