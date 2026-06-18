"""Framepack Guardrail Hydrator.

Synchronizes plugin-owned Framepack guardrails into the current project's
AGENTS.md managed block, and injects the same guardrails into the current
session when needed.
"""

from __future__ import annotations

import hashlib
import logging
import os
import re
import shutil
import tempfile
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

BLOCK_RE = re.compile(
    r"<!--\s*FRAMEPACK MANAGED BLOCK START(?:\s+version=[^\s]+\s+hash=[^\s]+\s+source=plugin)?\s*-->.*?<!--\s*FRAMEPACK MANAGED BLOCK END\s*-->",
    re.IGNORECASE | re.DOTALL,
)


@dataclass(frozen=True)
class GuardrailsPayload:
    version: str
    content: str
    digest: str
    block: str


@dataclass(frozen=True)
class GuardrailsSyncResult:
    changed: bool
    action: str
    path: Optional[Path]
    digest: str
    version: str
    error: Optional[str] = None


def _plugin_dir_from_hook_file() -> Path:
    return Path(__file__).resolve().parents[1]


def _read_plugin_version(plugin_dir: Path) -> str:
    manifest = plugin_dir / "plugin.yaml"
    if not manifest.exists():
        return "unknown"
    text = manifest.read_text(encoding="utf-8")
    match = re.search(r"^version:\s*[\"']?([^\"'\n]+)[\"']?\s*$", text, re.MULTILINE)
    return match.group(1).strip() if match else "unknown"


def _normalize_for_hash(content: str) -> str:
    return content.replace("\r\n", "\n").strip() + "\n"


def _sha256(content: str) -> str:
    digest = hashlib.sha256(_normalize_for_hash(content).encode("utf-8")).hexdigest()
    return f"sha256:{digest}"


def build_managed_block(content: str, version: str, digest: str) -> str:
    body = content.strip()
    return (
        f"<!-- FRAMEPACK MANAGED BLOCK START version={version} hash={digest} source=plugin -->\n"
        f"{body}\n"
        f"<!-- FRAMEPACK MANAGED BLOCK END -->\n"
    )


def build_guardrails_payload(plugin_dir: Path | str) -> GuardrailsPayload:
    plugin_dir = Path(plugin_dir)
    guardrails_path = plugin_dir / "guardrails.md"
    content = guardrails_path.read_text(encoding="utf-8")
    version = _read_plugin_version(plugin_dir)
    digest = _sha256(content)
    block = build_managed_block(content, version, digest)
    return GuardrailsPayload(version=version, content=content, digest=digest, block=block)


def _find_existing_block(text: str) -> Optional[re.Match[str]]:
    return BLOCK_RE.search(text)


def _managed_block_matches(match: re.Match[str], payload: GuardrailsPayload) -> bool:
    return _normalize_for_hash(match.group(0)) == _normalize_for_hash(payload.block)


def _backup_existing(path: Path) -> None:
    if not path.exists():
        return
    backup_dir = path.parent / ".hermes" / "backups"
    backup_dir.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S-%f")
    backup_path = backup_dir / f"AGENTS.md.{timestamp}.bak"
    shutil.copy2(path, backup_path)


def _atomic_write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp_name = tempfile.mkstemp(prefix=f".{path.name}.", suffix=".tmp", dir=str(path.parent))
    try:
        with os.fdopen(fd, "w", encoding="utf-8", newline="\n") as f:
            f.write(content)
        os.replace(tmp_name, path)
    except Exception:
        try:
            os.unlink(tmp_name)
        except OSError:
            pass
        raise


def _inject_guardrails(ctx, payload: GuardrailsPayload, reason: str = "") -> bool:
    if ctx is None or not hasattr(ctx, "inject_message"):
        return False
    prefix = "[Framepack Guardrails Updated]"
    if reason:
        prefix += f" ({reason})"
    message = (
        f"{prefix}\n"
        f"Framepack v{payload.version} guardrails are active for this current session. "
        f"Follow them immediately.\n\n"
        f"{payload.content.strip()}"
    )
    ctx.inject_message(message, role="user")
    return True


def _merge_managed_block(current: str, payload: GuardrailsPayload) -> tuple[bool, str, str]:
    """Return (changed, action, new_text) for an AGENTS.md body.

    Only the FRAMEPACK MANAGED BLOCK is replaced. Content outside that block is
    always preserved, even for old full-copy Framepack AGENTS.md files.
    """
    match = _find_existing_block(current)
    if match:
        if _managed_block_matches(match, payload):
            return False, "noop", current
        new_text = current[: match.start()] + payload.block + current[match.end() :]
        return True, "updated", new_text

    separator = "\n\n" if current and not current.endswith("\n\n") else ""
    return True, "inserted", current + separator + payload.block


def sync_project_agents(
    project_dir: Path | str,
    plugin_dir: Path | str | None = None,
    ctx=None,
    force_inject: bool = False,
    reason: str = "",
) -> GuardrailsSyncResult:
    project_dir = Path(project_dir)
    plugin_dir = Path(plugin_dir) if plugin_dir is not None else _plugin_dir_from_hook_file()
    payload = build_guardrails_payload(plugin_dir)
    agents_path = project_dir / "AGENTS.md"

    try:
        if not agents_path.exists():
            new_text = payload.block
            action = "created"
        else:
            current = agents_path.read_text(encoding="utf-8")
            changed, action, new_text = _merge_managed_block(current, payload)
            if not changed:
                if force_inject:
                    _inject_guardrails(ctx, payload, reason=reason or "hash matched")
                return GuardrailsSyncResult(False, action, agents_path, payload.digest, payload.version)

        _backup_existing(agents_path)
        _atomic_write_text(agents_path, new_text)
        _inject_guardrails(ctx, payload, reason=reason or action)
        return GuardrailsSyncResult(True, action, agents_path, payload.digest, payload.version)
    except Exception as e:
        logger.warning("Framepack guardrails sync failed for %s: %s", project_dir, e)
        injected = _inject_guardrails(ctx, payload, reason=reason or "sync failed")
        return GuardrailsSyncResult(
            False,
            "injected_only" if injected else "failed",
            agents_path,
            payload.digest,
            payload.version,
            error=str(e),
        )


def _safe_inject_patch_warning(ctx, report: str) -> None:
    """Inject a Hermes patch drift warning into the session (best-effort)."""
    if ctx is None or not hasattr(ctx, "inject_message"):
        return
    message = (
        "⚠️ **Hermes Patch Drift Detected**\n\n"
        f"{report}\n\n"
        "Local Hermes patches may have been overwritten by an upgrade. "
        "Re-apply the patches or verify functionality."
    )
    try:
        ctx.inject_message(message, role="user")
    except Exception as exc:
        logger.debug("patch warning injection failed: %s", exc)


def hydrate_guardrails(ctx, project_dir: Path | str | None = None, reason: str = "") -> GuardrailsSyncResult:
    if project_dir is None:
        project_dir = os.getcwd()
    result = sync_project_agents(project_dir, _plugin_dir_from_hook_file(), ctx=ctx, reason=reason)

    # Version-gated Hermes patch audit — only checks when Hermes version changes
    try:
        from core.hermes_adapter import run_patch_audit_if_needed
        patch_report = run_patch_audit_if_needed(project_dir)
        if patch_report and "drift" in patch_report.lower():
            _safe_inject_patch_warning(ctx, patch_report)
    except Exception as exc:
        logger.debug("Hermes patch audit skipped: %s", exc)

    return result
