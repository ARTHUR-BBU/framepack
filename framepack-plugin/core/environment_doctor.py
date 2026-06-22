"""Framepack first-run environment doctor.

This module is deliberately side-effect free. It inspects the user's local
Hermes/HyperFrames environment and returns an Agent-actionable report, but it
never installs, upgrades, downgrades, or overwrites skills by itself.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any, Callable

from .hyperframes_adapter import _redact_proxy_secrets_in_text
from .hyperframes_support import HyperFramesSupportWindow, HyperFramesVersionDecision, classify_hyperframes_version

Runner = Callable[..., str]

REQUIRED_HYPERFRAMES_SKILLS = ["hyperframes", "hyperframes-cli", "gsap"]


@dataclass(frozen=True)
class ToolCheck:
    name: str
    installed: bool
    version: str | None = None
    error: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(frozen=True)
class EnvironmentIssue:
    code: str
    severity: str
    message: str

    def to_dict(self) -> dict[str, str]:
        return asdict(self)


@dataclass(frozen=True)
class EnvironmentReport:
    status: str
    project_dir: str
    node: ToolCheck
    npm: ToolCheck
    npx: ToolCheck
    hyperframes_cli: ToolCheck
    support: HyperFramesVersionDecision
    missing_skills: list[str]
    issues: list[EnvironmentIssue]
    recommended_actions: list[str]

    def to_dict(self) -> dict[str, Any]:
        return {
            "kind": "framepack_environment_report",
            "status": self.status,
            "project_dir": self.project_dir,
            "checks": {
                "node": self.node.to_dict(),
                "npm": self.npm.to_dict(),
                "npx": self.npx.to_dict(),
                "hyperframes_cli": self.hyperframes_cli.to_dict(),
            },
            "support": asdict(self.support),
            "missing_skills": list(self.missing_skills),
            "issues": [issue.to_dict() for issue in self.issues],
            "recommended_actions": list(self.recommended_actions),
        }


class EnvironmentDoctor:
    def __init__(
        self,
        *,
        project_dir: str | Path,
        skills_dir: str | Path,
        support_window: HyperFramesSupportWindow,
        runner: Runner,
    ) -> None:
        self.project_dir = Path(project_dir)
        self.skills_dir = Path(skills_dir)
        self.support_window = support_window
        self.runner = runner

    def run(self) -> EnvironmentReport:
        node = self._check_tool("node", ["node", "--version"])
        npm = self._check_tool("npm", ["npm", "--version"])
        npx = self._check_tool("npx", ["npx", "--version"])
        hyperframes_cli = self._check_hyperframes_cli()
        missing_skills = self._missing_skills()
        issues: list[EnvironmentIssue] = []
        actions: list[str] = []

        if not node.installed:
            issues.append(EnvironmentIssue("node_missing", "error", "Node.js is required for HyperFrames."))
            actions.append("install_node")
        if not npm.installed:
            issues.append(EnvironmentIssue("npm_missing", "error", "npm is required to install/run HyperFrames."))
            actions.append("install_npm")
        if not npx.installed:
            issues.append(EnvironmentIssue("npx_missing", "error", "npx is required to run HyperFrames smoke checks."))
            actions.append("install_npx")

        if hyperframes_cli.installed and hyperframes_cli.version:
            support = classify_hyperframes_version(hyperframes_cli.version, self.support_window)
        else:
            support = classify_hyperframes_version("0.0.0", self.support_window)
            issues.append(
                EnvironmentIssue(
                    "hyperframes_cli_missing",
                    "error",
                    "HyperFrames CLI is missing; Framepack can create creative handoff files but cannot render.",
                )
            )
            actions.append("install_hyperframes")

        if missing_skills:
            issues.append(
                EnvironmentIssue(
                    "hyperframes_skills_missing",
                    "warning",
                    "Local Hermes HyperFrames skills are missing or incomplete.",
                )
            )
            actions.append("install_hyperframes_skills")

        if hyperframes_cli.installed:
            if support.status in {"too_old", "hard_too_old"}:
                issues.append(
                    EnvironmentIssue(
                        "hyperframes_version_unsupported",
                        "error" if support.status == "hard_too_old" else "warning",
                        f"Installed HyperFrames {support.installed_version} is outside Framepack's supported window.",
                    )
                )
                if support.recommend_upgrade:
                    actions.append("upgrade_hyperframes")
            elif support.requires_smoke:
                issues.append(
                    EnvironmentIssue(
                        "hyperframes_requires_smoke",
                        "warning",
                        "Installed HyperFrames is newer/prerelease; run isolated blank smoke before handoff.",
                    )
                )
                actions.append("run_blank_smoke")

        status = self._status(node, npm, npx, hyperframes_cli, support, missing_skills)
        return EnvironmentReport(
            status=status,
            project_dir=str(self.project_dir),
            node=node,
            npm=npm,
            npx=npx,
            hyperframes_cli=hyperframes_cli,
            support=support,
            missing_skills=missing_skills,
            issues=issues,
            recommended_actions=_dedupe(actions),
        )

    def _check_hyperframes_cli(self) -> ToolCheck:
        primary = self._check_tool("hyperframes_cli", ["hyperframes", "--version"])
        if primary.installed:
            return primary

        # No-install fallback detects a project-local HyperFrames dependency
        # without fetching `hyperframes@latest` or mutating npm cache. The doctor
        # is a report-only instrument; it must not install while measuring.
        fallback = self._check_tool(
            "hyperframes_cli",
            ["npx", "--no-install", "hyperframes", "--version"],
            cwd=self.project_dir,
        )
        if fallback.installed:
            return fallback
        combined = primary.error or fallback.error
        if primary.error and fallback.error and primary.error != fallback.error:
            combined = f"{primary.error}; fallback: {fallback.error}"
        return ToolCheck(name="hyperframes_cli", installed=False, error=combined)

    def _check_tool(self, name: str, args: list[str], cwd: Path | None = None) -> ToolCheck:
        try:
            output = self.runner(args, timeout=30, cwd=str(cwd) if cwd is not None else None)
            version = output.strip().splitlines()[-1] if output.strip() else None
            return ToolCheck(name=name, installed=True, version=version)
        except Exception as exc:
            return ToolCheck(name=name, installed=False, error=_redact_proxy_secrets_in_text(str(exc)))

    def _missing_skills(self) -> list[str]:
        missing: list[str] = []
        for name in REQUIRED_HYPERFRAMES_SKILLS:
            if not self._has_standalone_skill(name):
                missing.append(name)
        return missing

    def _has_standalone_skill(self, name: str) -> bool:
        """Return whether ``name`` exists as a loadable standalone Hermes skill.

        Hermes skills can be stored either directly under the provided skills
        directory or one category below it (for example
        ``skills/software-development/hyperframes-cli/SKILL.md``). References
        nested inside another skill do not count: upstream HyperFrames 0.6.121
        ships ``hyperframes-cli`` as its own skill, and Framepack expects
        ``skill_view('hyperframes-cli')`` to work.
        """
        direct = self.skills_dir / name / "SKILL.md"
        if direct.is_file():
            return True
        if not self.skills_dir.is_dir():
            return False
        for candidate in self.skills_dir.glob(f"*/{name}/SKILL.md"):
            if (candidate.parent.parent / "SKILL.md").is_file():
                continue
            if candidate.is_file():
                return True
        return False

    def _status(
        self,
        node: ToolCheck,
        npm: ToolCheck,
        npx: ToolCheck,
        hyperframes_cli: ToolCheck,
        support: HyperFramesVersionDecision,
        missing_skills: list[str],
    ) -> str:
        if not (node.installed and npm.installed and npx.installed and hyperframes_cli.installed):
            return "blocked"
        if support.status in {"hard_too_old", "too_old"}:
            return "blocked" if support.status == "hard_too_old" else "needs_upgrade"
        if support.requires_smoke:
            return "guarded"
        if missing_skills:
            return "needs_setup"
        return "ready"


def _dedupe(actions: list[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for action in actions:
        if action not in seen:
            seen.add(action)
            result.append(action)
    return result
