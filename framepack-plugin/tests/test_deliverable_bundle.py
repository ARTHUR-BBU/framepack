"""Tests for P1.5 Deliverable Bundle."""

from __future__ import annotations

from pathlib import Path

from core.deliverable_bundle import (
    DeliverableBundle,
    check_bundle,
    generate_share_copy_template,
    generate_case_study_template,
    save_bundle_templates,
)


class TestDeliverableBundle:
    def test_empty_project_all_missing(self, tmp_path):
        bundle = check_bundle(tmp_path)
        assert bundle.has_share_copy is False
        assert bundle.has_case_study is False
        assert bundle.has_qa_frames is False
        assert bundle.has_render is False

    def test_render_present(self, tmp_path):
        renders = tmp_path / "renders"
        renders.mkdir()
        (renders / "video.mp4").write_text("fake", encoding="utf-8")
        bundle = check_bundle(tmp_path)
        assert bundle.has_render is True

    def test_zero_byte_render_is_not_present(self, tmp_path):
        renders = tmp_path / "renders"
        renders.mkdir()
        (renders / "video.mp4").write_bytes(b"")
        bundle = check_bundle(tmp_path)
        assert bundle.has_render is False

    def test_share_copy_present(self, tmp_path):
        (tmp_path / "share-copy.txt").write_text("Check this out!", encoding="utf-8")
        bundle = check_bundle(tmp_path)
        assert bundle.has_share_copy is True

    def test_case_study_present(self, tmp_path):
        (tmp_path / "CASE-STUDY.md").write_text("# Case Study", encoding="utf-8")
        bundle = check_bundle(tmp_path)
        assert bundle.has_case_study is True

    def test_qa_frames_present(self, tmp_path):
        qa = tmp_path / "renders" / "qa"
        qa.mkdir(parents=True)
        (qa / "frame_01.png").write_text("fake", encoding="utf-8")
        bundle = check_bundle(tmp_path)
        assert bundle.has_qa_frames is True

    def test_complete_bundle(self, tmp_path):
        renders = tmp_path / "renders"
        renders.mkdir()
        (renders / "video.mp4").write_text("fake", encoding="utf-8")
        (tmp_path / "share-copy.txt").write_text("text", encoding="utf-8")
        (tmp_path / "CASE-STUDY.md").write_text("# Study", encoding="utf-8")
        qa = renders / "qa"
        qa.mkdir()
        (qa / "frame_01.png").write_text("fake", encoding="utf-8")
        bundle = check_bundle(tmp_path)
        assert bundle.is_complete() is True

    def test_share_copy_template(self):
        text = generate_share_copy_template(
            title="Éderson Transfer",
            style="cinematic sports",
            duration="30s",
        )
        assert "Éderson Transfer" in text
        assert "30s" in text

    def test_case_study_template(self):
        text = generate_case_study_template(
            case_name="ederson-manutd-30s",
            tone="chaotic",
        )
        assert "ederson-manutd-30s" in text
        assert "chaotic" in text

    def test_save_bundle_templates(self, tmp_path):
        save_bundle_templates(tmp_path, title="Test", style="cinematic", duration="20s", case_name="test-case", tone="cinematic")
        assert (tmp_path / "share-copy.txt").is_file()
        assert (tmp_path / "CASE-STUDY.md").is_file()
