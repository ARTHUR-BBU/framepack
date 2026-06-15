"""Production quality audit tests for timeline/proof layer."""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from core.quality_audit import audit_project  # noqa: E402


def issue_codes(report):
    return [issue.code for issue in report.issues]


def write_minimal_project(project_dir: Path):
    hyperframes = project_dir / ".hyperframes"
    hyperframes.mkdir()
    (hyperframes / "expanded-prompt.md").write_text(
        """# Expanded Prompt

## HyperFrames Time Windows
| Scene | Start | Duration | Track |
|---|---:|---:|---:|
| scene_01 | 0 | 4 | 0 |
""",
        encoding="utf-8",
    )
    (project_dir / "index.html").write_text(
        '<div id="stage" class="clip" data-duration="4"><div id="scene_01" class="clip" data-start="0" data-duration="4" data-track-index="0"></div></div>',
        encoding="utf-8",
    )
    framepack = project_dir / ".framepack"
    framepack.mkdir()
    (framepack / "arsenal.json").write_text(
        json.dumps({"schema_version": "1.0.0", "project": project_dir.name, "weapons": {}}),
        encoding="utf-8",
    )


def test_quality_audit_reports_invalid_arsenal_duration_without_crashing(tmp_path):
    write_minimal_project(tmp_path)
    (tmp_path / ".framepack" / "arsenal.json").write_text(
        json.dumps({"schema_version": "1.0.0", "project": tmp_path.name, "hyperframes_config": {"duration": "bad"}, "weapons": {}}),
        encoding="utf-8",
    )

    report = audit_project(tmp_path)

    issue = next(issue for issue in report.issues if issue.code == "arsenal_duration_invalid")
    assert issue.severity == "P0"
    assert issue.details == {"actual": "bad", "expected": 4.0}


def test_quality_audit_reports_missing_timeline_manifest(tmp_path):
    write_minimal_project(tmp_path)

    report = audit_project(tmp_path)

    assert "timeline_manifest_missing" in issue_codes(report)
    issue = next(issue for issue in report.issues if issue.code == "timeline_manifest_missing")
    assert issue.severity == "P1"
    assert issue.path.endswith("timeline-manifest.json")


def test_quality_audit_reports_invalid_timeline_manifest(tmp_path):
    write_minimal_project(tmp_path)
    timeline_path = tmp_path / ".framepack" / "timeline-manifest.json"
    timeline_path.write_text("{bad json", encoding="utf-8")

    report = audit_project(tmp_path)

    issue = next(issue for issue in report.issues if issue.code == "timeline_manifest_invalid")
    assert issue.severity == "P0"
    assert issue.path == str(timeline_path)


def test_quality_audit_reports_timeline_duration_mismatch(tmp_path):
    write_minimal_project(tmp_path)
    timeline_path = tmp_path / ".framepack" / "timeline-manifest.json"
    timeline_path.write_text(
        json.dumps(
            {
                "schema_version": "1.0.0",
                "kind": "framepack_timeline_manifest",
                "project": {"name": tmp_path.name, "duration": 5.0},
                "scenes": [{"id": "scene_01", "start": 0, "duration": 5, "track_index": 0, "status": "draft"}],
            }
        ),
        encoding="utf-8",
    )

    report = audit_project(tmp_path)

    issue = next(issue for issue in report.issues if issue.code == "timeline_duration_mismatch")
    assert issue.severity == "P1"
    assert issue.details == {"actual": 5.0, "expected": 4.0}


def test_quality_audit_includes_timeline_scene_overlap(tmp_path):
    write_minimal_project(tmp_path)
    timeline_path = tmp_path / ".framepack" / "timeline-manifest.json"
    timeline_path.write_text(
        json.dumps(
            {
                "schema_version": "1.0.0",
                "kind": "framepack_timeline_manifest",
                "project": {"name": tmp_path.name, "duration": 6.0},
                "scenes": [
                    {"id": "scene_01", "start": 0, "duration": 4, "track_index": 0, "status": "draft"},
                    {"id": "scene_02", "start": 3, "duration": 3, "track_index": 0, "status": "draft"},
                ],
            }
        ),
        encoding="utf-8",
    )

    report = audit_project(tmp_path)

    issue = next(issue for issue in report.issues if issue.code == "timeline_scene_overlap")
    assert issue.severity == "P1"
    assert issue.scene == "scene_02"


def test_quality_audit_reports_invalid_timeline_duration_without_crashing(tmp_path):
    write_minimal_project(tmp_path)
    timeline_path = tmp_path / ".framepack" / "timeline-manifest.json"
    timeline_path.write_text(
        json.dumps(
            {
                "schema_version": "1.0.0",
                "kind": "framepack_timeline_manifest",
                "project": {"name": tmp_path.name, "duration": "bad"},
                "scenes": [{"id": "scene_01", "start": 0, "duration": 4, "track_index": 0, "status": "draft"}],
            }
        ),
        encoding="utf-8",
    )

    report = audit_project(tmp_path)

    issue = next(issue for issue in report.issues if issue.code == "timeline_duration_invalid")
    assert issue.severity == "P1"
    assert issue.details == {"actual": "bad", "expected": 4.0}


def test_quality_audit_reports_invalid_timeline_numeric_fields_without_crashing(tmp_path):
    write_minimal_project(tmp_path)
    timeline_path = tmp_path / ".framepack" / "timeline-manifest.json"
    timeline_path.write_text(
        json.dumps(
            {
                "schema_version": "1.0.0",
                "kind": "framepack_timeline_manifest",
                "project": {"name": tmp_path.name, "duration": 4.0},
                "scenes": [{"id": "scene_01", "start": "bad", "duration": 4, "track_index": "main", "status": "draft"}],
            }
        ),
        encoding="utf-8",
    )

    report = audit_project(tmp_path)

    issue = next(issue for issue in report.issues if issue.code == "timeline_scene_invalid")
    assert issue.severity == "P1"
    assert issue.scene == "scene_01"
    assert "numeric" in issue.message


def test_quality_audit_reports_invalid_proof_time_without_crashing(tmp_path):
    write_minimal_project(tmp_path)
    timeline_path = tmp_path / ".framepack" / "timeline-manifest.json"
    timeline_path.write_text(
        json.dumps(
            {
                "schema_version": "1.0.0",
                "kind": "framepack_timeline_manifest",
                "project": {"name": tmp_path.name, "duration": 4.0},
                "scenes": [
                    {
                        "id": "scene_01",
                        "start": 0,
                        "duration": 4,
                        "track_index": 0,
                        "status": "draft",
                        "proofs": [{"time": "not-a-number", "label": "scene_01_final", "required": True}],
                    }
                ],
                "proofs": {"directory": ".framepack/proofs", "contact_sheet": ".framepack/proofs/contact-sheet.jpg", "required": []},
            }
        ),
        encoding="utf-8",
    )

    report = audit_project(tmp_path)

    issue = next(issue for issue in report.issues if issue.code == "proof_invalid")
    assert issue.severity == "P2"
    assert issue.scene == "scene_01"
    assert issue.details["label"] == "scene_01_final"


def test_quality_audit_reports_missing_required_proof(tmp_path):
    write_minimal_project(tmp_path)
    timeline_path = tmp_path / ".framepack" / "timeline-manifest.json"
    timeline_path.write_text(
        json.dumps(
            {
                "schema_version": "1.0.0",
                "kind": "framepack_timeline_manifest",
                "project": {"name": tmp_path.name, "duration": 4.0},
                "scenes": [
                    {
                        "id": "scene_01",
                        "start": 0,
                        "duration": 4,
                        "track_index": 0,
                        "status": "draft",
                        "proofs": [{"time": 3.95, "label": "scene_01_final", "required": True}],
                    }
                ],
                "proofs": {"directory": ".framepack/proofs", "contact_sheet": ".framepack/proofs/contact-sheet.jpg", "required": []},
            }
        ),
        encoding="utf-8",
    )

    report = audit_project(tmp_path)

    issue = next(issue for issue in report.issues if issue.code == "proof_missing")
    assert issue.severity == "P2"
    assert issue.scene == "scene_01"
    assert issue.details["label"] == "scene_01_final"


def test_quality_audit_reports_missing_boundary_proof(tmp_path):
    write_minimal_project(tmp_path)
    timeline_path = tmp_path / ".framepack" / "timeline-manifest.json"
    timeline_path.write_text(
        json.dumps(
            {
                "schema_version": "1.0.0",
                "kind": "framepack_timeline_manifest",
                "project": {"name": tmp_path.name, "duration": 4.0},
                "scenes": [
                    {
                        "id": "scene_01",
                        "start": 0,
                        "duration": 4,
                        "track_index": 0,
                        "status": "draft",
                        "continuity": {"first_frame_depends_on": "scene_00.final_frame", "boundary_proofs": [{"time": 0.05, "label": "scene_01_boundary_after", "required": True}]},
                    }
                ],
                "proofs": {"directory": ".framepack/proofs", "contact_sheet": ".framepack/proofs/contact-sheet.jpg", "required": []},
            }
        ),
        encoding="utf-8",
    )

    report = audit_project(tmp_path)

    issue = next(issue for issue in report.issues if issue.code == "boundary_proof_missing")
    assert issue.severity == "P1"
    assert issue.scene == "scene_01"


def test_quality_audit_existing_proofs_clear_missing_and_report_contact_sheet(tmp_path):
    write_minimal_project(tmp_path)
    proofs_dir = tmp_path / ".framepack" / "proofs"
    proofs_dir.mkdir()
    (proofs_dir / "proof-001-scene_01_final-3.950s.png").write_bytes(b"fake")
    timeline_path = tmp_path / ".framepack" / "timeline-manifest.json"
    timeline_path.write_text(
        json.dumps(
            {
                "schema_version": "1.0.0",
                "kind": "framepack_timeline_manifest",
                "project": {"name": tmp_path.name, "duration": 4.0},
                "scenes": [
                    {
                        "id": "scene_01",
                        "start": 0,
                        "duration": 4,
                        "track_index": 0,
                        "status": "draft",
                        "proofs": [{"time": 3.95, "label": "scene_01_final", "required": True}],
                    }
                ],
                "proofs": {"directory": ".framepack/proofs", "contact_sheet": ".framepack/proofs/contact-sheet.jpg", "required": []},
            }
        ),
        encoding="utf-8",
    )

    report = audit_project(tmp_path)

    assert "proof_missing" not in issue_codes(report)
    issue = next(issue for issue in report.issues if issue.code == "contact_sheet_missing")
    assert issue.severity == "P3"


def test_quality_audit_rejects_nan_and_infinity_numeric_fields(tmp_path):
    write_minimal_project(tmp_path)
    timeline_path = tmp_path / ".framepack" / "timeline-manifest.json"
    timeline_path.write_text(
        json.dumps(
            {
                "schema_version": "1.0.0",
                "kind": "framepack_timeline_manifest",
                "project": {"name": tmp_path.name, "duration": float("nan")},
                "scenes": [
                    {"id": "scene_01", "start": "Infinity", "duration": "-Infinity", "track_index": 0, "status": "draft"}
                ],
                "proofs": {"directory": ".framepack/proofs", "contact_sheet": ".framepack/proofs/contact-sheet.jpg", "required": [{"time": "NaN", "label": "global", "required": True}]},
            }
        ),
        encoding="utf-8",
    )
    (tmp_path / ".framepack" / "arsenal.json").write_text(
        json.dumps({"schema_version": "1.0.0", "project": tmp_path.name, "hyperframes_config": {"duration": "Infinity"}, "weapons": {}}),
        encoding="utf-8",
    )

    report = audit_project(tmp_path)
    codes = issue_codes(report)

    assert "arsenal_duration_invalid" in codes
    assert "timeline_duration_invalid" in codes
    assert "timeline_scene_invalid" in codes
    assert "proof_invalid" in codes


def test_quality_audit_reports_proof_paths_outside_project(tmp_path):
    write_minimal_project(tmp_path)
    timeline_path = tmp_path / ".framepack" / "timeline-manifest.json"
    outside = tmp_path.parent / "outside-proofs"
    timeline_path.write_text(
        json.dumps(
            {
                "schema_version": "1.0.0",
                "kind": "framepack_timeline_manifest",
                "project": {"name": tmp_path.name, "duration": 4.0},
                "scenes": [],
                "proofs": {"directory": "../outside-proofs", "contact_sheet": str(outside / "contact-sheet.jpg"), "required": []},
            }
        ),
        encoding="utf-8",
    )

    report = audit_project(tmp_path)
    issues = [issue for issue in report.issues if issue.code == "proof_path_outside_project"]

    assert len(issues) == 2
    assert {issue.details["field"] for issue in issues} == {"proofs.directory", "proofs.contact_sheet"}


def test_quality_audit_allows_project_local_proof_paths(tmp_path):
    write_minimal_project(tmp_path)
    timeline_path = tmp_path / ".framepack" / "timeline-manifest.json"
    timeline_path.write_text(
        json.dumps(
            {
                "schema_version": "1.0.0",
                "kind": "framepack_timeline_manifest",
                "project": {"name": tmp_path.name, "duration": 4.0},
                "scenes": [],
                "proofs": {"directory": ".framepack/proofs", "contact_sheet": ".framepack/proofs/contact-sheet.jpg", "required": []},
            }
        ),
        encoding="utf-8",
    )

    report = audit_project(tmp_path)

    assert "proof_path_outside_project" not in issue_codes(report)
