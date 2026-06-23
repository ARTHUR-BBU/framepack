"""Compatibility adapter between Framepack and upstream HyperFrames.

This module centralizes HyperFrames CLI drift handling. Framepack should ask this
adapter whether a command is discovery, handoff-consuming, registry-related, or
side-effectful instead of hardcoding ad-hoc regexes inside hooks.
"""

from __future__ import annotations

import difflib
import hashlib
import json
import re
import subprocess
import shutil
import os
from urllib.parse import urlsplit, urlunsplit
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from pathlib import Path
from typing import Any


class CommandCategory(str, Enum):
    REQUIRES_HANDOFF = "requires_handoff"
    DISCOVERY = "discovery"
    PROJECT_SCAFFOLD = "project_scaffold"
    REGISTRY = "registry"
    MEDIA_PREPROCESS = "media_preprocess"
    CLOUD_SIDE_EFFECT = "cloud_side_effect"
    NOT_HYPERFRAMES = "not_hyperframes"


DISCOVERY_COMMANDS = {
    "help",
    "version",
    "info",
    "doctor",
    "upgrade",
    "browser",
    "docs",
    "compositions",
    "benchmark",
    "skills",
    "telemetry",
    "feedback",
    "auth",
}

PROJECT_SCAFFOLD_COMMANDS = {"init"}
REGISTRY_COMMANDS = {"catalog", "add", "capture"}
MEDIA_PREPROCESS_COMMANDS = {"beats", "transcribe", "tts", "remove-background"}
CLOUD_SIDE_EFFECT_COMMANDS = {"publish", "cloud", "lambda", "cloudrun"}
REQUIRES_HANDOFF_COMMANDS = {"lint", "inspect", "snapshot", "preview", "present", "render"}
SIDE_EFFECTFUL_COMMANDS = {
    "init",
    "add",
    "capture",
    "beats",
    "transcribe",
    "tts",
    "remove-background",
    "auth",
    "publish",
    "cloud",
    "lambda",
    "cloudrun",
    "preview",
    "present",
    "render",
    "snapshot",
}


@dataclass(frozen=True)
class HyperFramesInvocation:
    command: str | None
    args: list[str] = field(default_factory=list)
    raw: str = ""


@dataclass(frozen=True)
class CommandClassification:
    invocation: HyperFramesInvocation | None
    category: CommandCategory
    requires_handoff: bool
    is_side_effectful: bool = False
    notes: list[str] = field(default_factory=list)


def strip_heredoc_bodies(command: str) -> str:
    """Return shell header only, excluding heredoc/script bodies."""
    lines = command.splitlines()
    if not lines:
        return command
    kept: list[str] = []
    for line in lines:
        kept.append(line)
        if re.search(r"<<\s*['\"]?[A-Za-z_][A-Za-z0-9_]*['\"]?", line):
            break
    return "\n".join(kept)


def _strip_shell_quoted_segments(command: str) -> str:
    """Replace shell quoted strings with empty quotes before command scanning.

    The adapter only wants executable command positions. Text inside quotes can
    contain `; hyperframes render` or `| npx hyperframes lint` as data for grep,
    printf, Python, etc.; treating those as commands causes handoff warnings in
    developer/review workflows.
    """
    result: list[str] = []
    quote: str | None = None
    escaped = False
    for char in command:
        if escaped:
            if quote is None:
                result.append(char)
            escaped = False
            continue
        if char == "\\" and quote != "'":
            if quote is None:
                result.append(char)
            escaped = True
            continue
        if quote:
            if char == quote:
                result.append(quote)
                quote = None
            continue
        if char in {"'", '"'}:
            quote = char
            result.append(char)
            continue
        result.append(char)
    return "".join(result)


def _command_position_pattern() -> re.Pattern[str]:
    # Match HyperFrames only when it appears where a shell command can start:
    # line start, ;, &, | operators, optionally after `npx` with common
    # package-resolution flags (`--yes`, `--no-install`, `--package ...`).
    # Version/help probes with these flags are discovery; they must not trip
    # Framepack handoff preflight.
    npx_prefix = r"(?:npx(?:\s+(?:--yes|--no-install|--package(?:=\S+|\s+\S+)))*\s+)?"
    return re.compile(
        r"(?:^|[;&|]|&&|\|\|)\s*"
        + npx_prefix +
        r"hyperframes(?:@[\w.\-]+)?"
        r"(?:\s+(?P<cmd>[A-Za-z][\w-]*|--help|-h|--version|-v))?",
        re.MULTILINE,
    )


def command_invocation(command: str) -> HyperFramesInvocation | None:
    searchable = _strip_shell_quoted_segments(strip_heredoc_bodies(command))
    match = _command_position_pattern().search(searchable)
    if not match:
        return None
    subcommand = match.group("cmd")
    if subcommand in {"--help", "-h"}:
        subcommand = "help"
    elif subcommand in {"--version", "-v"}:
        subcommand = "version"
    return HyperFramesInvocation(command=subcommand, raw=searchable)


def classify_hyperframes_command(command: str) -> CommandClassification:
    invocation = command_invocation(command)
    if invocation is None:
        return CommandClassification(
            invocation=None,
            category=CommandCategory.NOT_HYPERFRAMES,
            requires_handoff=False,
        )

    subcommand = invocation.command or "help"
    if subcommand in DISCOVERY_COMMANDS:
        category = CommandCategory.DISCOVERY
    elif subcommand in PROJECT_SCAFFOLD_COMMANDS:
        category = CommandCategory.PROJECT_SCAFFOLD
    elif subcommand in REGISTRY_COMMANDS:
        category = CommandCategory.REGISTRY
    elif subcommand in MEDIA_PREPROCESS_COMMANDS:
        category = CommandCategory.MEDIA_PREPROCESS
    elif subcommand in CLOUD_SIDE_EFFECT_COMMANDS:
        category = CommandCategory.CLOUD_SIDE_EFFECT
    elif subcommand in REQUIRES_HANDOFF_COMMANDS:
        category = CommandCategory.REQUIRES_HANDOFF
    else:
        return CommandClassification(
            invocation=invocation,
            category=CommandCategory.REQUIRES_HANDOFF,
            requires_handoff=True,
            is_side_effectful=True,
            notes=[f"unknown HyperFrames command '{subcommand}' defaults to requires_handoff"],
        )

    return CommandClassification(
        invocation=invocation,
        category=category,
        requires_handoff=category is CommandCategory.REQUIRES_HANDOFF,
        is_side_effectful=subcommand in SIDE_EFFECTFUL_COMMANDS,
    )


def parse_help_commands(help_text: str) -> list[str]:
    commands: list[str] = []
    for line in help_text.splitlines():
        match = re.match(r"\s{2,}([a-z][\w-]*)\b", line)
        if match:
            cmd = match.group(1)
            if cmd not in commands and cmd not in {"options", "arguments"}:
                commands.append(cmd)
    return commands


def parse_help_flags(help_text: str) -> list[str]:
    flags: list[str] = []
    for match in re.finditer(r"(?<![\w-])(--[A-Za-z][\w-]*)", help_text):
        flag = match.group(1)
        if flag not in flags:
            flags.append(flag)
    return flags


def build_capability_snapshot(
    *,
    version: str,
    root_help: str,
    command_help: dict[str, str] | None = None,
    registry_items: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    command_help = command_help or {}
    registry_items = registry_items or []
    command_names = parse_help_commands(root_help)
    for name in command_help:
        if name not in command_names:
            command_names.append(name)

    commands: dict[str, dict[str, Any]] = {}
    for name in sorted(command_names):
        classification = classify_hyperframes_command(f"npx hyperframes {name}")
        commands[name] = {
            "category": classification.category.value,
            "requires_handoff": classification.requires_handoff,
            "side_effectful": classification.is_side_effectful,
            "flags": parse_help_flags(command_help.get(name, "")),
        }

    return {
        "package": "hyperframes",
        "version": version,
        "checked_at": datetime.now(timezone.utc).isoformat(),
        "commands": commands,
        "safe_offline_examples": ["blank"],
        "registry_available": bool(registry_items),
        "registry_count": len(registry_items),
        "registry_items": registry_items,
        "notes": [],
    }


def _cache_path(project_dir: Path) -> Path:
    return project_dir / ".framepack" / "hyperframes-capabilities.json"


def save_capabilities(project_dir: str | Path, snapshot: dict[str, Any]) -> Path:
    project = Path(project_dir)
    path = _cache_path(project)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return path


def load_cached_capabilities(project_dir: str | Path) -> dict[str, Any] | None:
    path = _cache_path(Path(project_dir))
    if not path.is_file():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


def _sha(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def _default_runner(
    args: list[str],
    timeout: int = 30,
    env: dict[str, str] | None = None,
    cwd: str | None = None,
) -> str:
    executable_args = list(args)
    resolved = shutil.which(executable_args[0]) or shutil.which(executable_args[0] + ".cmd")
    if resolved:
        executable_args[0] = resolved
    process_env = None
    if env:
        process_env = os.environ.copy()
        process_env.update(env)
    completed = subprocess.run(
        executable_args,
        text=True,
        capture_output=True,
        timeout=timeout,
        check=False,
        shell=False,
        env=process_env,
        cwd=cwd,
    )
    output = (completed.stdout or "") + (completed.stderr or "")
    if completed.returncode != 0:
        raise RuntimeError(output.strip() or f"command failed with exit {completed.returncode}")
    return output


def _parse_registry_json(text: str) -> list[dict[str, Any]]:
    try:
        parsed = json.loads(text or "[]")
    except json.JSONDecodeError:
        return []
    if isinstance(parsed, list):
        return [item for item in parsed if isinstance(item, dict)]
    if isinstance(parsed, dict):
        items = parsed.get("items", [])
        if isinstance(items, list):
            return [item for item in items if isinstance(item, dict)]
    return []


def _normalize_proxy_url(value: str | None) -> str | None:
    if not value:
        return None
    value = value.strip()
    if not value or value.lower() in {"null", "undefined", "false", "none"}:
        return None
    if "://" not in value:
        value = "http://" + value
    return value


def _redact_proxy_url(value: str) -> str:
    parsed = urlsplit(value)
    if "@" not in parsed.netloc:
        return value
    host = parsed.hostname or ""
    if parsed.port:
        host = f"{host}:{parsed.port}"
    return urlunsplit((parsed.scheme, f"[REDACTED]@{host}", parsed.path, parsed.query, parsed.fragment))


def _redact_proxy_secrets_in_text(value: str) -> str:
    """Redact proxy credentials that may appear inside exception text."""
    return re.sub(
        r"\b([A-Za-z][A-Za-z0-9+.-]*://)([^\s/@:]+):([^\s/@]+)@([^\s/]+)",
        lambda match: f"{match.group(1)}[REDACTED]@{match.group(4)}",
        value,
    )


def _proxy_env(value: str) -> dict[str, str]:
    return {
        "HTTP_PROXY": value,
        "HTTPS_PROXY": value,
        "ALL_PROXY": value,
        "http_proxy": value,
        "https_proxy": value,
        "all_proxy": value,
    }


def _first_proxy_candidate(candidates: list[tuple[str, str | None]]) -> dict[str, Any] | None:
    for source, raw in candidates:
        value = _normalize_proxy_url(raw)
        if value:
            return {
                "source": source,
                "url": value,
                "display_url": _redact_proxy_url(value),
                "env": _proxy_env(value),
            }
    return None


def _parse_windows_proxy_server(output: str) -> str | None:
    # `reg query` output commonly ends with: ProxyServer    REG_SZ    127.0.0.1:7890
    for line in output.splitlines():
        if "ProxyServer" in line and "REG_SZ" in line:
            return line.split("REG_SZ", 1)[1].strip()
    return None


def detect_proxy_settings(
    *,
    env: dict[str, str] | None = None,
    config_runner=_default_runner,
) -> dict[str, Any] | None:
    """Detect local proxy/VPN settings suitable for retrying registry calls.

    Values are returned with credentials redacted for reporting, but the env map
    preserves the original proxy URL so subprocesses can actually use it.
    """
    env = dict(os.environ if env is None else env)
    candidates: list[tuple[str, str | None]] = [
        ("env:HTTPS_PROXY", env.get("HTTPS_PROXY") or env.get("https_proxy")),
        ("env:HTTP_PROXY", env.get("HTTP_PROXY") or env.get("http_proxy")),
        ("env:ALL_PROXY", env.get("ALL_PROXY") or env.get("all_proxy")),
    ]
    config_commands = [
        ("npm:https-proxy", ["npm", "config", "get", "https-proxy"]),
        ("npm:proxy", ["npm", "config", "get", "proxy"]),
        ("git:http.proxy", ["git", "config", "--global", "--get", "http.proxy"]),
        ("git:https.proxy", ["git", "config", "--global", "--get", "https.proxy"]),
    ]
    for source, command in config_commands:
        try:
            candidates.append((source, config_runner(command, timeout=5).strip()))
        except Exception:
            continue
    try:
        output = config_runner(
            ["reg", "query", r"HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings", "/v", "ProxyServer"],
            timeout=5,
        )
        candidates.append(("windows:ProxyServer", _parse_windows_proxy_server(output)))
    except Exception:
        pass
    return _first_proxy_candidate(candidates)


def _run_registry_catalog(runner, timeout: int, env: dict[str, str] | None = None) -> list[dict[str, Any]]:
    args = ["npx", "--yes", "hyperframes@latest", "catalog", "--json"]
    if env is None:
        text = runner(args, timeout=timeout)
    else:
        text = runner(args, timeout=timeout, env=env)
    return _parse_registry_json(text)


def snapshot_from_cli(
    *,
    runner=_default_runner,
    commands_to_probe: list[str] | None = None,
    timeout: int = 30,
    proxy_detector=detect_proxy_settings,
) -> dict[str, Any]:
    """Build a capability snapshot from the active HyperFrames CLI.

    The runner is injectable so tests do not hit network/processes. Registry
    failure is non-fatal: official catalog is an opportunistic supply source,
    while `blank` remains the offline-safe baseline.
    """
    notes: list[str] = []
    version = runner(["npx", "--yes", "hyperframes@latest", "--version"], timeout=timeout).strip().splitlines()[-1]
    root_help = runner(["npx", "--yes", "hyperframes@latest", "--help"], timeout=timeout)
    command_help: dict[str, str] = {}
    for name in commands_to_probe or parse_help_commands(root_help):
        try:
            command_help[name] = runner(["npx", "--yes", "hyperframes@latest", name, "--help"], timeout=timeout)
        except Exception as exc:  # pragma: no cover - live CLI drift path
            notes.append(f"command_help_error:{name}: {_redact_proxy_secrets_in_text(str(exc))}")

    registry_items: list[dict[str, Any]] = []
    proxy_retry: dict[str, Any] = {"attempted": False, "proxy_detected": False}
    registry_error: str | None = None
    try:
        registry_items = _run_registry_catalog(runner, timeout=timeout)
    except Exception as exc:
        registry_error = _redact_proxy_secrets_in_text(str(exc))
        notes.append(f"registry_error: {registry_error}")

    if not registry_items:
        try:
            proxy = proxy_detector() if proxy_detector else None
        except Exception as exc:  # pragma: no cover - defensive detector path
            proxy = None
            notes.append(f"proxy_detect_error: {_redact_proxy_secrets_in_text(str(exc))}")
        if proxy:
            proxy_retry = {
                "attempted": True,
                "proxy_detected": True,
                "source": proxy.get("source"),
                "display_url": proxy.get("display_url"),
                "succeeded": False,
            }
            try:
                retried_items = _run_registry_catalog(runner, timeout=timeout, env=proxy.get("env", {}))
                if retried_items:
                    registry_items = retried_items
                    proxy_retry["succeeded"] = True
                    notes.append(f"registry_proxy_retry_succeeded:{proxy.get('source')}")
                else:
                    notes.append(f"registry_proxy_retry_empty:{proxy.get('source')}")
            except Exception as exc:
                notes.append(
                    f"registry_proxy_retry_error:{proxy.get('source')}: "
                    f"{_redact_proxy_secrets_in_text(str(exc))}"
                )
        elif registry_error is not None:
            proxy_retry = {"attempted": False, "proxy_detected": False}

    snapshot = build_capability_snapshot(
        version=version,
        root_help=root_help,
        command_help=command_help,
        registry_items=registry_items,
    )
    snapshot["notes"].extend(notes)
    snapshot["proxy_retry"] = proxy_retry
    return snapshot


def diff_skill_text(name: str, official: str, local: str) -> dict[str, Any]:
    official_lines = official.splitlines()
    local_lines = local.splitlines()
    diff = list(difflib.unified_diff(official_lines, local_lines, fromfile="official", tofile="local", lineterm=""))
    local_only = [line[1:] for line in diff if line.startswith("+") and not line.startswith("+++")]
    official_only = [line[1:] for line in diff if line.startswith("-") and not line.startswith("---")]
    same = official == local
    return {
        "name": name,
        "same": same,
        "official_sha256": _sha(official),
        "local_sha256": _sha(local),
        "official_only_lines": official_only,
        "local_only_lines": local_only,
        "diff_line_count": len(diff),
        "recommendation": "no_action" if same else "review_merge_do_not_overwrite",
    }


def diff_skill_directories(official_dir: str | Path, local_dir: str | Path) -> dict[str, Any]:
    """Compare official HyperFrames skills with local patched skills.

    Report only. Local skills may contain real-world hardening rules, so changed
    files are marked for review/merge instead of blind overwrite.
    """
    official_root = Path(official_dir)
    local_root = Path(local_dir)
    skills: dict[str, dict[str, Any]] = {}
    summary = {"same": 0, "changed": 0, "missing_local": 0}

    for official_skill in sorted(official_root.glob("*/SKILL.md")):
        name = official_skill.parent.name
        local_skill = local_root / name / "SKILL.md"
        if not local_skill.is_file():
            text = official_skill.read_text(encoding="utf-8", errors="replace")
            skills[name] = {
                "name": name,
                "status": "missing_local",
                "official_sha256": _sha(text),
                "recommendation": "review_new_upstream_skill",
            }
            summary["missing_local"] += 1
            continue

        report = diff_skill_text(
            name,
            official_skill.read_text(encoding="utf-8", errors="replace"),
            local_skill.read_text(encoding="utf-8", errors="replace"),
        )
        report["status"] = "same" if report["same"] else "changed"
        skills[name] = report
        summary["same" if report["same"] else "changed"] += 1

    return {"summary": summary, "skills": skills}
