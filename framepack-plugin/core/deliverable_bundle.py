"""Deliverable Bundle — post-render deliverable completeness checker.

A successful case should produce a complete deliverable bundle, not just
a stray mp4. This module checks for and generates templates for:
- share-copy.txt (social media share text)
- CASE-STUDY.md (reusable case study)
- QA frames (visual evidence)
- render output (mp4)
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from core.render_artifacts import find_nonempty_render


@dataclass(frozen=True)
class DeliverableBundle:
    """Status of deliverable artifacts in a project."""
    has_render: bool
    has_share_copy: bool
    has_case_study: bool
    has_qa_frames: bool
    render_path: str = ""
    share_copy_path: str = ""
    case_study_path: str = ""
    qa_frames_dir: str = ""

    def is_complete(self) -> bool:
        """All four deliverable types present."""
        return self.has_render and self.has_share_copy and self.has_case_study and self.has_qa_frames

    def missing(self) -> list[str]:
        """List missing deliverable names."""
        result = []
        if not self.has_render:
            result.append("render")
        if not self.has_share_copy:
            result.append("share-copy")
        if not self.has_case_study:
            result.append("case-study")
        if not self.has_qa_frames:
            result.append("qa-frames")
        return result


def check_bundle(project_dir: str | Path) -> DeliverableBundle:
    """Check a project for deliverable artifacts."""
    project = Path(project_dir)

    # Render: look in renders/ for mp4
    render = find_nonempty_render(project)
    has_render = render is not None
    render_path = str(render) if render else ""

    # Share copy
    share_copy_path = project / "share-copy.txt"
    has_share_copy = share_copy_path.is_file()

    # Case study (CASE-STUDY.md or TEST-REPORT.md)
    case_study_path = ""
    has_case_study = False
    for name in ("CASE-STUDY.md", "TEST-REPORT.md"):
        p = project / name
        if p.is_file():
            has_case_study = True
            case_study_path = str(p)
            break

    # QA frames: look for image files in renders/qa*/ or qa-frames*/
    qa_frames_dir = ""
    has_qa_frames = False
    qa_dirs = [
        project / "renders" / "qa",
        project / "renders" / "qa-final",
        project / "qa-frames",
        project / "qa-frames-v2",
    ]
    for qa_dir in qa_dirs:
        try:
            has_images = any(
                f.suffix.lower() in (".png", ".jpg", ".jpeg")
                for f in qa_dir.iterdir()
            )
        except OSError:
            has_images = False
        if has_images:
            has_qa_frames = True
            qa_frames_dir = str(qa_dir)
            break

    return DeliverableBundle(
        has_render=has_render,
        has_share_copy=has_share_copy,
        has_case_study=has_case_study,
        has_qa_frames=has_qa_frames,
        render_path=render_path,
        share_copy_path=str(share_copy_path) if has_share_copy else "",
        case_study_path=case_study_path,
        qa_frames_dir=qa_frames_dir,
    )


def generate_share_copy_template(title: str, style: str, duration: str) -> str:
    """Generate a share-copy.txt template."""
    return (
        f"# Share Copy — {title}\n"
        f"\n"
        f"## Twitter/X (280 chars)\n"
        f"{title} — {style} {duration} video.\n"
        f"\n"
        f"## LinkedIn\n"
        f"Excited to share our latest video: {title}.\n"
        f"Style: {style} | Duration: {duration}\n"
        f"\n"
        f"## Description / YouTube\n"
        f"{title}\n"
        f"\n"
        f"A {style} video, {duration}.\n"
        f"\n"
        f"## Tags\n"
        f"#framepack #hyperframes #video\n"
    )


def generate_case_study_template(case_name: str, tone: str) -> str:
    """Generate a CASE-STUDY.md template."""
    return (
        f"# Case Study: {case_name}\n"
        f"\n"
        f"## Overview\n"
        f"- Case: {case_name}\n"
        f"- Tone: {tone}\n"
        f"- Date: (fill in)\n"
        f"\n"
        f"## Creative Direction\n"
        f"- Intent:\n"
        f"- Visual style:\n"
        f"- Key decisions:\n"
        f"\n"
        f"## Workflow Evidence\n"
        f"- Asset intake:\n"
        f"- Script lane:\n"
        f"- Studio preview:\n"
        f"- Readiness board:\n"
        f"\n"
        f"## Outcome\n"
        f"- Duration:\n"
        f"- Resolution:\n"
        f"- Lessons learned:\n"
        f"\n"
        f"## Reusable Assets\n"
        f"- Template candidates:\n"
        f"- Weapon candidates:\n"
    )


def save_bundle_templates(
    project_dir: str | Path,
    title: str,
    style: str,
    duration: str,
    case_name: str,
    tone: str,
) -> None:
    """Generate and save share-copy.txt + CASE-STUDY.md templates."""
    project = Path(project_dir)

    share_copy = generate_share_copy_template(title, style, duration)
    (project / "share-copy.txt").write_text(share_copy, encoding="utf-8", newline="\n")

    case_study = generate_case_study_template(case_name, tone)
    (project / "CASE-STUDY.md").write_text(case_study, encoding="utf-8", newline="\n")
