import json
from pathlib import Path

from core.hyperframes_adapter import (
    CommandCategory,
    classify_hyperframes_command,
    command_invocation,
    parse_help_commands,
    parse_help_flags,
    build_capability_snapshot,
    load_cached_capabilities,
    save_capabilities,
    diff_skill_text,
    diff_skill_directories,
    detect_proxy_settings,
    snapshot_from_cli,
)


def test_command_invocation_matches_only_shell_command_position():
    assert command_invocation("npx hyperframes lint") is not None
    assert command_invocation("cd demo && npx hyperframes render index.html") is not None
    assert command_invocation("hyperframes preview --port 3002") is not None

    assert command_invocation("npm view hyperframes dist-tags --json") is None
    assert command_invocation("python - <<'PY'\nprint('npx hyperframes lint')\nPY") is None


def test_command_invocation_ignores_developer_meta_commands_that_mention_hyperframes():
    for command in [
        "git diff -- . | grep 'npx hyperframes render'",
        "grep -R 'hyperframes render' framepack-plugin/tests",
        "python -m pytest tests/test_hyperframes_adapter.py -q",
        "PYTHONPATH=/f/Hermes_windows/plugins/framepack python -c 'import core.hyperframes_adapter'",
        "git ls-files | grep hyperframes",
        "printf 'note; hyperframes render'",
        "echo \"| npx hyperframes lint\"",
        "python -c \"print('&& hyperframes preview')\"",
    ]:
        assert command_invocation(command) is None


def test_classifies_commands_by_handoff_and_side_effect_policy():
    assert classify_hyperframes_command("npx hyperframes lint").category is CommandCategory.REQUIRES_HANDOFF
    assert classify_hyperframes_command("npx hyperframes render index.html").category is CommandCategory.REQUIRES_HANDOFF
    assert classify_hyperframes_command("npx hyperframes inspect .").category is CommandCategory.REQUIRES_HANDOFF
    assert classify_hyperframes_command("npx hyperframes snapshot .").category is CommandCategory.REQUIRES_HANDOFF

    assert classify_hyperframes_command("npx hyperframes info").category is CommandCategory.DISCOVERY
    assert classify_hyperframes_command("npx hyperframes doctor").category is CommandCategory.DISCOVERY
    assert classify_hyperframes_command("npx hyperframes upgrade --check --json").category is CommandCategory.DISCOVERY
    for command in [
        "npx --no-install hyperframes --version",
        "npx --yes hyperframes@latest --version",
        "npx --package hyperframes hyperframes --version",
    ]:
        classification = classify_hyperframes_command(command)
        assert classification.category is CommandCategory.DISCOVERY
        assert classification.requires_handoff is False
        assert classification.is_side_effectful is False

    assert classify_hyperframes_command("npx hyperframes init demo --example blank").category is CommandCategory.PROJECT_SCAFFOLD
    assert classify_hyperframes_command("npx hyperframes catalog --json").category is CommandCategory.REGISTRY
    assert classify_hyperframes_command("npx hyperframes add caption-kinetic-slam").category is CommandCategory.REGISTRY
    assert classify_hyperframes_command("npx hyperframes capture https://example.com").category is CommandCategory.REGISTRY

    assert classify_hyperframes_command("npx hyperframes transcribe audio.mp3").category is CommandCategory.MEDIA_PREPROCESS
    assert classify_hyperframes_command("npx hyperframes tts hello").category is CommandCategory.MEDIA_PREPROCESS
    assert classify_hyperframes_command("npx hyperframes remove-background input.mp4").category is CommandCategory.MEDIA_PREPROCESS

    assert classify_hyperframes_command("npx hyperframes publish -y").category is CommandCategory.CLOUD_SIDE_EFFECT
    assert classify_hyperframes_command("npx hyperframes cloud render .").category is CommandCategory.CLOUD_SIDE_EFFECT
    assert classify_hyperframes_command("npx hyperframes lambda deploy").category is CommandCategory.CLOUD_SIDE_EFFECT
    assert classify_hyperframes_command("npx hyperframes cloudrun deploy").category is CommandCategory.CLOUD_SIDE_EFFECT


def test_side_effectful_commands_are_flagged_even_when_no_handoff_required():
    assert classify_hyperframes_command("npx hyperframes info").is_side_effectful is False
    assert classify_hyperframes_command("npx hyperframes catalog --json").is_side_effectful is False
    for command in [
        "init --example blank",
        "add component hero",
        "capture ./component.html",
        "tts --text hi",
        "transcribe audio.mp3",
        "remove-background input.png",
        "auth --api-key xxx",
        "render",
        "snapshot",
        "cloudrun",
    ]:
        assert classify_hyperframes_command(f"npx hyperframes {command}").is_side_effectful is True


def test_unknown_hyperframes_command_defaults_conservative_requires_handoff():
    result = classify_hyperframes_command("npx hyperframes future-renderish-command --flag")

    assert result.category is CommandCategory.REQUIRES_HANDOFF
    assert result.requires_handoff is True
    assert "unknown" in result.notes[0]


def test_parse_help_commands_and_flags_from_cli_text():
    help_text = """
Commands:
  init        Scaffold a new composition project
  render      Render a composition to MP4
  catalog     Browse and install blocks
  cloud       Render HyperFrames compositions on the HeyGen cloud
"""
    render_help = """
OPTIONS
  --resolution=<resolution>    Output resolution preset
  --batch=<batch>              Path to a JSON array
  --browser-timeout=<timeout>  Page navigation timeout
  --json                       Emit machine-readable JSON
"""

    assert parse_help_commands(help_text) == ["init", "render", "catalog", "cloud"]
    assert parse_help_flags(render_help) == ["--resolution", "--batch", "--browser-timeout", "--json"]


def test_build_capability_snapshot_from_supplied_help_outputs(tmp_path):
    snapshot = build_capability_snapshot(
        version="0.6.97",
        root_help="""
COMMANDS
  init
  render
  catalog
  doctor
""",
        command_help={
            "render": "OPTIONS\n --resolution=<resolution>\n --batch=<batch>\n --page-side-compositing\n",
            "catalog": "OPTIONS\n --json\n --type=<type>\n --tag=<tag>\n",
        },
        registry_items=[],
    )

    assert snapshot["version"] == "0.6.97"
    assert snapshot["commands"]["render"]["category"] == "requires_handoff"
    assert "--resolution" in snapshot["commands"]["render"]["flags"]
    assert snapshot["registry_available"] is False
    assert snapshot["safe_offline_examples"] == ["blank"]

    save_capabilities(tmp_path, snapshot)
    assert load_cached_capabilities(tmp_path)["version"] == "0.6.97"


def test_snapshot_from_cli_uses_runner_and_treats_empty_catalog_as_fallback():
    calls = []

    def runner(args, timeout=30):
        calls.append(tuple(args))
        joined = " ".join(args)
        if "--version" in joined:
            return "0.6.97"
        if "render --help" in joined:
            return "OPTIONS\n --resolution=<resolution>\n --batch=<batch>\n"
        if "catalog --json" in joined:
            return "[]"
        if joined.endswith("--help"):
            return "COMMANDS\n  init\n  render\n  catalog\n  doctor\n"
        if "catalog --json" in joined:
            return "[]"
        return "OPTIONS\n --json\n"

    snapshot = snapshot_from_cli(runner=runner, commands_to_probe=["render", "catalog"])

    assert snapshot["version"] == "0.6.97"
    assert snapshot["registry_available"] is False
    assert snapshot["safe_offline_examples"] == ["blank"]
    assert "--resolution" in snapshot["commands"]["render"]["flags"]
    assert any("catalog" in " ".join(call) for call in calls)


def test_snapshot_from_cli_handles_registry_failure_without_blocking():
    def runner(args, timeout=30):
        joined = " ".join(args)
        if "--version" in joined:
            return "0.6.97"
        if joined.endswith("--help"):
            return "COMMANDS\n  render\n  catalog\n"
        if "catalog --json" in joined:
            raise RuntimeError("network timeout")
        return "OPTIONS\n --json\n"

    snapshot = snapshot_from_cli(runner=runner, commands_to_probe=["render", "catalog"])

    assert snapshot["version"] == "0.6.97"
    assert snapshot["registry_available"] is False
    assert "registry_error: network timeout" in snapshot["notes"]


def test_detect_proxy_settings_redacts_credentials_and_builds_env():
    def config_runner(args, timeout=5):
        joined = " ".join(args)
        if "npm config get https-proxy" in joined:
            return "http://user:pass@127.0.0.1:7890\n"
        if "npm config get proxy" in joined:
            return "null\n"
        if "git config --global --get http.proxy" in joined:
            return "\n"
        if "git config --global --get https.proxy" in joined:
            return "\n"
        return "\n"

    proxy = detect_proxy_settings(env={}, config_runner=config_runner)

    assert proxy is not None
    assert proxy["source"] == "npm:https-proxy"
    assert proxy["display_url"] == "http://[REDACTED]@127.0.0.1:7890"
    assert proxy["env"]["HTTPS_PROXY"] == "http://user:pass@127.0.0.1:7890"
    assert proxy["env"]["HTTP_PROXY"] == "http://user:pass@127.0.0.1:7890"


def test_snapshot_from_cli_retries_registry_with_detected_proxy_when_first_attempt_empty():
    calls = []

    def runner(args, timeout=30, env=None):
        calls.append((tuple(args), dict(env or {})))
        joined = " ".join(args)
        if "--version" in joined:
            return "0.6.97"
        if "render --help" in joined:
            return "OPTIONS\n --resolution=<resolution>\n"
        if joined.endswith("--help"):
            return "COMMANDS\n  render\n  catalog\n"
        if "catalog --json" in joined:
            if env and env.get("HTTPS_PROXY") == "http://127.0.0.1:7890":
                return '[{"name":"kinetic-type","type":"example"}]'
            return "[]"
        return "OPTIONS\n --json\n"

    proxy = {
        "source": "env:HTTPS_PROXY",
        "url": "http://127.0.0.1:7890",
        "display_url": "http://127.0.0.1:7890",
        "env": {"HTTPS_PROXY": "http://127.0.0.1:7890", "HTTP_PROXY": "http://127.0.0.1:7890"},
    }

    snapshot = snapshot_from_cli(
        runner=runner,
        commands_to_probe=["render", "catalog"],
        proxy_detector=lambda: proxy,
    )

    assert snapshot["registry_available"] is True
    assert snapshot["registry_count"] == 1
    assert snapshot["proxy_retry"]["attempted"] is True
    assert snapshot["proxy_retry"]["source"] == "env:HTTPS_PROXY"
    assert snapshot["proxy_retry"]["display_url"] == "http://127.0.0.1:7890"
    assert any(env.get("HTTPS_PROXY") == "http://127.0.0.1:7890" for _, env in calls)


def test_snapshot_from_cli_records_no_proxy_when_registry_fails_and_no_proxy_detected():
    def runner(args, timeout=30, env=None):
        joined = " ".join(args)
        if "--version" in joined:
            return "0.6.97"
        if joined.endswith("--help"):
            return "COMMANDS\n  render\n  catalog\n"
        if "catalog --json" in joined:
            raise RuntimeError("network timeout")
        return "OPTIONS\n --json\n"

    snapshot = snapshot_from_cli(
        runner=runner,
        commands_to_probe=["render", "catalog"],
        proxy_detector=lambda: None,
    )

    assert snapshot["registry_available"] is False
    assert snapshot["proxy_retry"] == {"attempted": False, "proxy_detected": False}
    assert "registry_error: network timeout" in snapshot["notes"]


def test_snapshot_from_cli_redacts_proxy_credentials_from_retry_errors():
    def runner(args, timeout=30, env=None):
        joined = " ".join(args)
        if "--version" in joined:
            return "0.6.97"
        if joined.endswith("--help"):
            return "COMMANDS\n  render\n  catalog\n"
        if "catalog --json" in joined:
            if env:
                raise RuntimeError("failed via http://user:pass@127.0.0.1:7890")
            raise RuntimeError("network timeout")
        return "OPTIONS\n --json\n"

    proxy = {
        "source": "env:HTTPS_PROXY",
        "url": "http://user:pass@127.0.0.1:7890",
        "display_url": "http://[REDACTED]@127.0.0.1:7890",
        "env": {"HTTPS_PROXY": "http://user:pass@127.0.0.1:7890"},
    }

    snapshot = snapshot_from_cli(
        runner=runner,
        commands_to_probe=["render", "catalog"],
        proxy_detector=lambda: proxy,
    )

    joined_notes = "\n".join(snapshot["notes"])
    assert "user:pass" not in joined_notes
    assert "http://[REDACTED]@127.0.0.1:7890" in joined_notes


def test_snapshot_from_cli_redacts_proxy_credentials_from_command_help_errors():
    def runner(args, timeout=30, env=None):
        joined = " ".join(args)
        if "--version" in joined:
            return "0.6.97"
        if joined.endswith("--help") and "render" not in joined:
            return "COMMANDS\n  render\n  catalog\n"
        if "render --help" in joined:
            raise RuntimeError("failed via http://user:pass@127.0.0.1:7890")
        if "catalog --json" in joined:
            return "[]"
        return "OPTIONS\n --json\n"

    snapshot = snapshot_from_cli(
        runner=runner,
        commands_to_probe=["render", "catalog"],
        proxy_detector=lambda: None,
    )

    joined_notes = "\n".join(snapshot["notes"])
    assert "user:pass" not in joined_notes
    assert "http://[REDACTED]@127.0.0.1:7890" in joined_notes


def test_diff_skill_directories_reports_missing_and_changed_without_overwrite(tmp_path):
    official = tmp_path / "official"
    local = tmp_path / "local"
    (official / "hyperframes").mkdir(parents=True)
    (official / "gsap").mkdir(parents=True)
    (official / "hyperframes-media").mkdir(parents=True)
    (local / "hyperframes").mkdir(parents=True)
    (local / "gsap").mkdir(parents=True)

    (official / "hyperframes" / "SKILL.md").write_text("official base\nnew upstream rule\n", encoding="utf-8")
    (local / "hyperframes" / "SKILL.md").write_text("official base\nlocal hardening rule\n", encoding="utf-8")
    (official / "gsap" / "SKILL.md").write_text("same\n", encoding="utf-8")
    (local / "gsap" / "SKILL.md").write_text("same\n", encoding="utf-8")
    (official / "hyperframes-media" / "SKILL.md").write_text("new skill\n", encoding="utf-8")

    report = diff_skill_directories(official, local)

    assert report["summary"] == {"same": 1, "changed": 1, "missing_local": 1}
    assert report["skills"]["gsap"]["same"] is True
    assert report["skills"]["hyperframes"]["recommendation"] == "review_merge_do_not_overwrite"
    assert report["skills"]["hyperframes-media"]["status"] == "missing_local"


def test_skill_diff_report_preserves_local_hardening_instead_of_recommending_overwrite():
    official = """---
name: hyperframes
---
# HyperFrames
Use class=\"clip\".
"""
    local = official + "\nRoot duration is load-bearing.\nNever use CSS variables in font-family.\n"

    report = diff_skill_text("hyperframes", official, local)

    assert report["same"] is False
    assert report["recommendation"] == "review_merge_do_not_overwrite"
    assert report["local_only_lines"]
    assert any("Root duration" in line for line in report["local_only_lines"])
