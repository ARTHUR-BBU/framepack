from pathlib import Path

from core.environment_doctor import EnvironmentDoctor, EnvironmentIssue
from core.hyperframes_support import HyperFramesSupportWindow


class FakeRunner:
    def __init__(self, responses=None, failures=None):
        self.responses = responses or {}
        self.failures = failures or {}
        self.calls = []

    def __call__(self, args, timeout=30, env=None, cwd=None):
        key = tuple(args)
        self.calls.append((key, dict(env or {})))
        self.cwd_calls = getattr(self, "cwd_calls", [])
        self.cwd_calls.append((key, str(cwd) if cwd is not None else None))
        if key in self.failures:
            raise RuntimeError(self.failures[key])
        if key in self.responses:
            return self.responses[key]
        raise RuntimeError(f"unexpected command: {' '.join(args)}")


def support_window():
    return HyperFramesSupportWindow(
        supported_min="0.7.3",
        supported_max_tested="0.7.21",
        soft_max="0.7.x",
        hard_block_below="0.7.0",
        latest_supported_for_downgrade="0.7.21",
    )


def test_missing_hyperframes_cli_recommends_agent_managed_install(tmp_path):
    runner = FakeRunner(
        responses={
            ("node", "--version"): "v22.11.0",
            ("npm", "--version"): "10.9.0",
            ("npx", "--version"): "10.9.0",
        },
        failures={
            ("hyperframes", "--version"): "not found",
        },
    )
    doctor = EnvironmentDoctor(
        project_dir=tmp_path,
        skills_dir=tmp_path / "skills",
        support_window=support_window(),
        runner=runner,
    )

    report = doctor.run()

    assert report.status == "blocked"
    assert report.hyperframes_cli.installed is False
    assert any(issue.code == "hyperframes_cli_missing" for issue in report.issues)
    assert "install_hyperframes" in report.recommended_actions


def test_missing_hyperframes_skills_are_reported_without_blocking_discovery(tmp_path):
    runner = FakeRunner(
        responses={
            ("node", "--version"): "v22.11.0",
            ("npm", "--version"): "10.9.0",
            ("npx", "--version"): "10.9.0",
            ("hyperframes", "--version"): "0.7.3",
        },
    )
    doctor = EnvironmentDoctor(
        project_dir=tmp_path,
        skills_dir=tmp_path / "skills",
        support_window=support_window(),
        runner=runner,
    )

    report = doctor.run()

    assert report.hyperframes_cli.installed is True
    assert report.support.status == "supported"
    assert report.status == "needs_setup"
    assert sorted(report.missing_skills) == ["gsap", "hyperframes", "hyperframes-cli"]
    assert "install_hyperframes_skills" in report.recommended_actions


def test_supported_cli_and_skills_are_ready(tmp_path):
    for name in ["hyperframes", "hyperframes-cli", "gsap"]:
        skill_dir = tmp_path / "skills" / name
        skill_dir.mkdir(parents=True)
        (skill_dir / "SKILL.md").write_text(f"# {name}\n", encoding="utf-8")

    runner = FakeRunner(
        responses={
            ("node", "--version"): "v22.11.0",
            ("npm", "--version"): "10.9.0",
            ("npx", "--version"): "10.9.0",
            ("hyperframes", "--version"): "0.7.3",
        },
    )
    doctor = EnvironmentDoctor(
        project_dir=tmp_path,
        skills_dir=tmp_path / "skills",
        support_window=support_window(),
        runner=runner,
    )

    report = doctor.run()

    assert report.status == "ready"
    assert report.missing_skills == []
    assert report.recommended_actions == []


def test_latest_tested_cli_is_ready_without_guarded_smoke(tmp_path):
    for name in ["hyperframes", "hyperframes-cli", "gsap"]:
        skill_dir = tmp_path / "skills" / name
        skill_dir.mkdir(parents=True)
        (skill_dir / "SKILL.md").write_text(f"# {name}\n", encoding="utf-8")

    runner = FakeRunner(
        responses={
            ("node", "--version"): "v22.11.0",
            ("npm", "--version"): "10.9.0",
            ("npx", "--version"): "10.9.0",
            ("hyperframes", "--version"): "0.7.3",
        },
    )
    doctor = EnvironmentDoctor(
        project_dir=tmp_path,
        skills_dir=tmp_path / "skills",
        support_window=support_window(),
        runner=runner,
    )

    report = doctor.run()

    assert report.status == "ready"
    assert report.support.status == "supported"
    assert report.support.requires_smoke is False


def test_skills_are_found_recursively_from_hermes_skills_root(tmp_path):
    """Hermes skills are category-grouped; doctor must not require a flat skills dir."""
    skills_root = tmp_path / "skills"
    for name in ["hyperframes", "hyperframes-cli", "gsap"]:
        skill_dir = skills_root / "software-development" / name
        skill_dir.mkdir(parents=True)
        (skill_dir / "SKILL.md").write_text(f"---\nname: {name}\n---\n", encoding="utf-8")

    runner = FakeRunner(
        responses={
            ("node", "--version"): "v22.11.0",
            ("npm", "--version"): "10.9.0",
            ("npx", "--version"): "10.9.0",
            ("hyperframes", "--version"): "0.7.3",
        },
    )
    doctor = EnvironmentDoctor(
        project_dir=tmp_path,
        skills_dir=skills_root,
        support_window=support_window(),
        runner=runner,
    )

    report = doctor.run()

    assert report.status == "ready"
    assert report.missing_skills == []


def test_nested_cli_reference_does_not_satisfy_standalone_hyperframes_cli_skill(tmp_path):
    """HyperFrames 0.7.3 ships a standalone hyperframes-cli skill; a folded reference is stale."""
    skills_root = tmp_path / "skills" / "software-development"
    for name in ["hyperframes", "gsap"]:
        skill_dir = skills_root / name
        skill_dir.mkdir(parents=True)
        (skill_dir / "SKILL.md").write_text(f"---\nname: {name}\n---\n", encoding="utf-8")
    folded_ref = skills_root / "hyperframes" / "references"
    folded_ref.mkdir(parents=True)
    (folded_ref / "cli-reference.md").write_text("---\nname: hyperframes-cli\n---\n", encoding="utf-8")

    runner = FakeRunner(
        responses={
            ("node", "--version"): "v22.11.0",
            ("npm", "--version"): "10.9.0",
            ("npx", "--version"): "10.9.0",
            ("hyperframes", "--version"): "0.7.3",
        },
    )
    doctor = EnvironmentDoctor(
        project_dir=tmp_path,
        skills_dir=skills_root,
        support_window=support_window(),
        runner=runner,
    )

    report = doctor.run()

    assert report.status == "needs_setup"
    assert report.missing_skills == ["hyperframes-cli"]


def test_skill_nested_under_another_skill_does_not_count_as_standalone(tmp_path):
    skills_root = tmp_path / "skills"
    host_skill = skills_root / "hyperframes"
    host_skill.mkdir(parents=True)
    (host_skill / "SKILL.md").write_text("# hyperframes\n", encoding="utf-8")
    nested_skill = host_skill / "hyperframes-cli"
    nested_skill.mkdir()
    (nested_skill / "SKILL.md").write_text("# folded cli\n", encoding="utf-8")
    gsap = skills_root / "gsap"
    gsap.mkdir()
    (gsap / "SKILL.md").write_text("# gsap\n", encoding="utf-8")

    runner = FakeRunner(
        responses={
            ("node", "--version"): "v22.11.0",
            ("npm", "--version"): "10.9.0",
            ("npx", "--version"): "10.9.0",
            ("hyperframes", "--version"): "0.7.3",
        },
    )
    doctor = EnvironmentDoctor(
        project_dir=tmp_path,
        skills_dir=skills_root,
        support_window=support_window(),
        runner=runner,
    )

    report = doctor.run()

    assert report.status == "needs_setup"
    assert report.missing_skills == ["hyperframes-cli"]


def test_newer_same_band_cli_requires_blank_smoke_before_handoff(tmp_path):
    for name in ["hyperframes", "hyperframes-cli", "gsap"]:
        skill_dir = tmp_path / "skills" / name
        skill_dir.mkdir(parents=True)
        (skill_dir / "SKILL.md").write_text(f"# {name}\n", encoding="utf-8")

    runner = FakeRunner(
        responses={
            ("node", "--version"): "v22.11.0",
            ("npm", "--version"): "10.9.0",
            ("npx", "--version"): "10.9.0",
            ("hyperframes", "--version"): "0.7.22",
        },
    )
    doctor = EnvironmentDoctor(
        project_dir=tmp_path,
        skills_dir=tmp_path / "skills",
        support_window=support_window(),
        runner=runner,
    )

    report = doctor.run()

    assert report.status == "guarded"
    assert report.support.status == "newer_same_band"
    assert "run_blank_smoke" in report.recommended_actions


def test_doctor_uses_installed_hyperframes_command_not_npx_latest(tmp_path):
    runner = FakeRunner(
        responses={
            ("node", "--version"): "v22.11.0",
            ("npm", "--version"): "10.9.0",
            ("npx", "--version"): "10.9.0",
            ("hyperframes", "--version"): "0.7.3",
        },
    )
    doctor = EnvironmentDoctor(
        project_dir=tmp_path,
        skills_dir=tmp_path / "skills",
        support_window=support_window(),
        runner=runner,
    )

    doctor.run()

    called = [args for args, _env in runner.calls]
    assert ("hyperframes", "--version") in called
    assert ("npx", "--yes", "hyperframes@latest", "--version") not in called


def test_doctor_falls_back_to_npx_no_install_without_installing_latest(tmp_path):
    runner = FakeRunner(
        responses={
            ("node", "--version"): "v22.11.0",
            ("npm", "--version"): "10.9.0",
            ("npx", "--version"): "10.9.0",
            ("npx", "--no-install", "hyperframes", "--version"): "0.7.3",
        },
        failures={
            ("hyperframes", "--version"): "not on PATH",
        },
    )
    doctor = EnvironmentDoctor(
        project_dir=tmp_path,
        skills_dir=tmp_path / "skills",
        support_window=support_window(),
        runner=runner,
    )

    report = doctor.run()

    assert report.hyperframes_cli.installed is True
    assert report.hyperframes_cli.version == "0.7.3"
    called = [args for args, _env in runner.calls]
    assert ("npx", "--no-install", "hyperframes", "--version") in called
    assert ("npx", "--yes", "hyperframes@latest", "--version") not in called
    cwd_by_call = dict(runner.cwd_calls)
    assert cwd_by_call[("npx", "--no-install", "hyperframes", "--version")] == str(tmp_path)


def test_tool_errors_are_redacted_before_serialization(tmp_path):
    runner = FakeRunner(
        responses={
            ("node", "--version"): "v22.11.0",
            ("npm", "--version"): "10.9.0",
            ("npx", "--version"): "10.9.0",
        },
        failures={
            ("hyperframes", "--version"): "failed via http://user:pass@127.0.0.1:7890",
        },
    )
    doctor = EnvironmentDoctor(
        project_dir=tmp_path,
        skills_dir=tmp_path / "skills",
        support_window=support_window(),
        runner=runner,
    )

    data = doctor.run().to_dict()
    text = str(data)

    assert "user:pass" not in text
    assert "http://[REDACTED]@127.0.0.1:7890" in text


def test_report_serializes_to_json_safe_dict(tmp_path):
    runner = FakeRunner(
        responses={
            ("node", "--version"): "v22.11.0",
            ("npm", "--version"): "10.9.0",
            ("npx", "--version"): "10.9.0",
            ("hyperframes", "--version"): "0.7.3",
        },
    )
    doctor = EnvironmentDoctor(
        project_dir=tmp_path,
        skills_dir=tmp_path / "skills",
        support_window=support_window(),
        runner=runner,
    )

    data = doctor.run().to_dict()

    assert data["kind"] == "framepack_environment_report"
    assert data["checks"]["node"]["installed"] is True
    assert isinstance(data["issues"], list)
    assert all(isinstance(issue, dict) for issue in data["issues"])
