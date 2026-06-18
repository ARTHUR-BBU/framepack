"""Shell command parsing utilities.

Extracted from hooks to avoid circular imports (pre/post hooks previously
imported private helpers from each other). These are pure shell-parsing
functions with no hook dependencies.
"""

from __future__ import annotations

import os
import re
import shlex
from pathlib import Path

_CD_BEFORE_COMMAND_RE = re.compile(
    r"(?:^|[;&|]\s*)cd\s+(?P<path>\"[^\"]+\"|'[^']+'|[^\s;&|]+)\s*(?:&&|;)",
    re.IGNORECASE,
)


def _shell_unquote_path(raw_path: str) -> str:
    try:
        parts = shlex.split(raw_path, posix=True)
    except ValueError:
        return raw_path.strip().strip("\"'")
    return parts[0] if parts else raw_path.strip().strip("\"'")


def resolve_effective_workdir(command: str, base_workdir: str) -> str:
    """Resolve shell `cd project && hyperframes ...` prefixes to the real project dir.

    Hermes terminal commands often use shell-level `cd <project> && npx hyperframes ...`
    instead of the tool's `workdir` argument. Hooks run before the shell executes,
    so relying only on args["workdir"] hydrates the caller cwd, not the project.
    """
    base = Path(base_workdir or os.getcwd())
    hyperframes_at = command.find("hyperframes")
    for match in _CD_BEFORE_COMMAND_RE.finditer(command):
        if hyperframes_at != -1 and match.start() > hyperframes_at:
            continue
        cd_path = Path(_shell_unquote_path(match.group("path")))
        if not cd_path.is_absolute():
            cd_path = base / cd_path
        return str(cd_path.resolve())
    return str(base.resolve())
