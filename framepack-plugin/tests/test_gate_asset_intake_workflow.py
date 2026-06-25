from __future__ import annotations

from pathlib import Path

from core.gates.asset_intake import check_asset_depth
from core.render_readiness import GateStatus, build_readiness_board


def _fp(project: Path) -> Path:
    path = project / ".framepack"
    path.mkdir(parents=True, exist_ok=True)
    return path


def _write(project: Path, workflow: str, intake: str) -> None:
    fp = _fp(project)
    fp.joinpath("handoff-manifest.md").write_text(f"# Handoff Manifest\n- workflow: {workflow}\n", encoding="utf-8")
    fp.joinpath("asset-intake.md").write_text(intake, encoding="utf-8")


def test_asset_depth_yellow_when_product_launch_lacks_expected_decisions(tmp_path: Path):
    _write(
        tmp_path,
        "product-launch-video",
        """# Asset Intake
## Brand
- logo: assets/logo.png
## Products
## Text
## Audio
""",
    )

    result = check_asset_depth(tmp_path)

    assert result.status is GateStatus.YELLOW
    assert "product" in result.evidence.lower()
    assert "cta" in result.evidence.lower()
    assert "audio" in result.evidence.lower()


def test_asset_depth_green_when_product_launch_expected_assets_are_decided(tmp_path: Path):
    _write(
        tmp_path,
        "product-launch-video",
        """# Asset Intake
## Brand
- logo: assets/logo.png
## Products
- product_images: assets/product.png
## Text
- cta: Buy now
## Audio
- bgm: assets/bgm.mp3
## References
- reference_video: waived by user
""",
    )

    result = check_asset_depth(tmp_path)

    assert result.status is GateStatus.GREEN


def test_asset_depth_reference_waiver_does_not_satisfy_missing_audio(tmp_path: Path):
    _write(
        tmp_path,
        "product-launch-video",
        """# Asset Intake
## Brand
- logo: assets/logo.png
## Products
- product_images: assets/product.png
## Text
- cta: Buy now
## References
- reference_video: waived by user
""",
    )

    result = check_asset_depth(tmp_path)

    assert result.status is GateStatus.YELLOW
    assert "audio" in result.evidence.lower()


def test_asset_depth_yellow_when_embedded_captions_lacks_caption_inputs(tmp_path: Path):
    _write(
        tmp_path,
        "embedded-captions",
        """# Asset Intake
## Footage
- source_video: assets/source.mp4
## Text
""",
    )

    result = check_asset_depth(tmp_path)

    assert result.status is GateStatus.YELLOW
    assert "transcript" in result.evidence.lower()
    assert "caption" in result.evidence.lower()


def test_asset_depth_allows_explicit_waiver(tmp_path: Path):
    _write(
        tmp_path,
        "embedded-captions",
        """# Asset Intake
## Footage
- source_video: assets/source.mp4
## Text
- transcript: waived by user, burn captions from video
- caption_style: waived by user, use HyperFrames default
""",
    )

    result = check_asset_depth(tmp_path)

    assert result.status is GateStatus.GREEN


def test_readiness_board_includes_asset_depth_when_workflow_known(tmp_path: Path):
    _write(
        tmp_path,
        "product-launch-video",
        """# Asset Intake
## Brand
- logo: assets/logo.png
""",
    )

    board = build_readiness_board(tmp_path)

    gates = {gate.name: gate for gate in board.gates}
    assert gates["Asset Depth"].status is GateStatus.YELLOW
