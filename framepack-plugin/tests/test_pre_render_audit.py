import os
import shutil
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from core.pre_render_audit import audit_pre_render, build_pre_render_audit_message


class TempProject:
    def __enter__(self):
        self.path = Path(tempfile.mkdtemp())
        return self.path

    def __exit__(self, exc_type, exc, tb):
        shutil.rmtree(self.path)


def write(path: Path, text: str):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def test_missing_director_story_bible_is_advisory_not_blocker():
    with TempProject() as project:
        write(project / "index.html", "<div data-composition-id='x'></div>")
        report = audit_pre_render(project)
        msg = build_pre_render_audit_message(report)

    assert report.verdict == "NEEDS_USER_DECISION"
    assert any(f.code == "missing_director_story_bible" for f in report.findings)
    assert "render anyway" in msg
    assert "BLOCK" not in msg.upper()
    assert "FORBID" not in msg.upper()


def test_missing_asset_intake_suggests_assets():
    with TempProject() as project:
        write(project / "index.html", "<div></div>")
        write(project / ".hyperframes" / "expanded-prompt.md", "Product launch for ACME")
        report = audit_pre_render(project)

    assert report.verdict == "NEEDS_USER_DECISION"
    finding = next(f for f in report.findings if f.code == "missing_asset_intake")
    assert "logo" in finding.suggestion.lower() or "素材" in finding.suggestion


def test_stale_noema_props_warn_when_story_is_not_noema():
    with TempProject() as project:
        write(project / "index.html", "<img src='assets/portraits/artist.jpg'><img src='assets/archive/01.jpg'>")
        write(project / ".hyperframes" / "expanded-prompt.md", "Framepack developer tool launch video")
        write(project / ".framepack" / "asset-intake.md", "brand:\n  logo: framepack.svg\naudio:\n  bgm: pulse.mp3\n")
        report = audit_pre_render(project)

    assert any(f.code == "stale_source_domain_props" for f in report.findings)
    assert report.verdict == "NEEDS_USER_DECISION"


def test_no_bgm_suggestion_for_product_or_brand_video():
    with TempProject() as project:
        write(project / "index.html", "<div></div>")
        write(project / ".hyperframes" / "expanded-prompt.md", "Brand product launch. Noema is not relevant.")
        write(project / ".framepack" / "asset-intake.md", "brand:\n  logo: logo.svg\n")
        report = audit_pre_render(project)

    assert any(f.code == "optional_bgm_missing" for f in report.findings)


def test_clean_project_can_be_ready_but_still_user_decides():
    with TempProject() as project:
        write(project / "index.html", "<div data-composition-id='x'></div>")
        write(
            project / ".hyperframes" / "expanded-prompt.md",
            "NOEMA original gold sample with BGM pulse.mp3\n"
            "Hero frame 5s\n"
            "must_read: original gold sample reads clearly\n"
            "reject_if: subject is occluded or motif is unreadable\n",
        )
        write(project / ".framepack" / "asset-intake.md", "roles:\n  brand_mark: noema.svg\n  audio: pulse.mp3\n")
        report = audit_pre_render(project)
        msg = build_pre_render_audit_message(report)

    assert report.verdict == "READY"
    assert "User choices" in msg
    assert "render anyway" in msg


def test_missing_hero_frame_acceptance_contract_is_final_readiness_p1():
    with TempProject() as project:
        write(project / "index.html", "<div data-composition-id='x'></div>")
        write(project / ".hyperframes" / "expanded-prompt.md", "Football transfer reveal with devil-ball motif and BGM pulse.mp3")
        write(project / ".framepack" / "asset-intake.md", "roles:\n  visual_subject: ederson.png\naudio:\n  bgm: pulse.mp3\n")
        report = audit_pre_render(project)

    assert report.verdict == "NEEDS_USER_DECISION"
    finding = next(f for f in report.findings if f.code == "missing_hero_frame_acceptance_contract")
    assert finding.severity == "P1"
    assert "hero" in finding.message.lower() or "proof" in finding.message.lower()


def test_hero_frame_acceptance_contract_suppresses_final_readiness_p1():
    with TempProject() as project:
        write(project / "index.html", "<div data-composition-id='x'></div>")
        write(
            project / ".hyperframes" / "expanded-prompt.md",
            "Football transfer reveal with BGM pulse.mp3\n\n"
            "Hero frame 14.8s\n"
            "must_read: identity shed reveal; ManU red subject becomes dominant\n"
            "reject_if: sprite overlaps face; recurring motif trail unreadable\n",
        )
        write(project / ".framepack" / "asset-intake.md", "roles:\n  visual_subject: ederson.png\naudio:\n  bgm: pulse.mp3\n")
        report = audit_pre_render(project)

    assert not any(f.code == "missing_hero_frame_acceptance_contract" for f in report.findings)


def test_generated_handoff_manifest_contract_suppresses_final_readiness_p1():
    with TempProject() as project:
        write(project / "index.html", "<div data-composition-id='x'></div>")
        write(project / ".hyperframes" / "expanded-prompt.md", "Football transfer reveal with BGM pulse.mp3")
        write(project / ".framepack" / "asset-intake.md", "roles:\n  visual_subject: ederson.png\naudio:\n  bgm: pulse.mp3\n")
        write(
            project / ".framepack" / "handoff-manifest.md",
            '"director_acceptance": {"hero_frames_required": true, "minimum_hero_frames": 3, "must_read_required": true, "reject_if_required": true, "default_reject_if": ["occluded"]}',
        )
        report = audit_pre_render(project)

    assert not any(f.code == "missing_hero_frame_acceptance_contract" for f in report.findings)


def test_asset_intake_without_roles_warns_about_asset_role_map():
    with TempProject() as project:
        write(project / "index.html", "<div data-composition-id='x'></div>")
        write(
            project / ".hyperframes" / "expanded-prompt.md",
            "Brand product launch with BGM pulse.mp3\nHero frame 5s\nmust_read: logo clear\nreject_if: logo occluded\n",
        )
        write(project / ".framepack" / "asset-intake.md", "brand:\n  logo: logo.png\nassets:\n  hero: product.png\naudio:\n  bgm: pulse.mp3\n")
        report = audit_pre_render(project)

    finding = next(f for f in report.findings if f.code == "asset_roles_missing")
    assert finding.severity == "P2"


def test_motion_footage_without_encoding_evidence_warns():
    with TempProject() as project:
        write(project / "index.html", "<video src='assets/highlight.mp4'></video>")
        write(
            project / ".hyperframes" / "expanded-prompt.md",
            "Sports promo with BGM pulse.mp3\nHero frame 9.6s\nmust_read: trail path readable\nreject_if: motif unreadable\n",
        )
        write(project / ".framepack" / "asset-intake.md", "roles:\n  motion_footage: assets/highlight.mp4\naudio:\n  bgm: pulse.mp3\n")
        report = audit_pre_render(project)

    finding = next(f for f in report.findings if f.code == "motion_footage_quality_unrecorded")
    assert finding.severity == "P2"


def test_motion_footage_negative_evidence_still_warns():
    with TempProject() as project:
        write(project / "index.html", "<video src='assets/highlight.mp4'></video>")
        write(
            project / ".hyperframes" / "expanded-prompt.md",
            "Sports promo with BGM pulse.mp3\nHero frame 9.6s\nmust_read: trail path readable\nreject_if: motif unreadable\n",
        )
        write(
            project / ".framepack" / "asset-intake.md",
            "roles:\n  motion_footage: assets/highlight.mp4\nquality:\n  ffprobe: not run\n  keyframe interval: unchecked\naudio:\n  bgm: pulse.mp3\n",
        )
        report = audit_pre_render(project)

    finding = next(f for f in report.findings if f.code == "motion_footage_quality_unrecorded")
    assert finding.severity == "P2"
