"""HyperFrames lint warning classifier and cache bridge.

This module bridges HyperFrames lint --json output into Framepack's quality
audit system. It:

1. Classifies each lint finding using a data-driven classification table.
2. Caches classified results in .framepack/hyperframes-findings.json.
3. Provides helpers for quality_audit to merge findings into its report.

Design principles:
  - Data-driven: classification table is a dict, not if/else chains.
  - Safe default: unknown warning codes default to upstream_limit (P2).
  - No CLI dependency: reads cached lint output, never runs npx itself.
  - Structured input: expects hyperframes lint --json output, not regex-parsed stdout.
"""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)


# ── Classification table ────────────────────────────────────────────────
# Data-driven: each entry maps a HyperFrames warning code to a category.
# Unknown codes default to upstream_limit (safe: don't break Agent workflow).

WARNING_CLASSIFICATION: dict[str, dict[str, Any]] = {
    # ── Upstream limitations (HyperFrames architecture, cannot fix) ──
    "gsap_studio_edit_blocked": {
        "category": "upstream_limit",
        "default_severity": "P2",
        "description": (
            "HyperFrames 架构限制：GSAP 注册 timeline 的元素 Studio 不可拖拽编辑。"
            "HF 0.7.22+ 的 SDK resolveEditingAffordances API 部分缓解此问题——"
            "外部编辑器现在可以查询元素可编辑性。Framepack weapon-load-plan 可标注 studio_editable。"
        ),
    },
    # ── Quality issues (must fix) ──
    "overlapping_gsap_tweens": {
        "category": "quality_issue",
        "default_severity": "P2",
        "description": (
            "GSAP tweens 时间轴重叠，可能导致视觉闪烁或动画冲突。"
            "应缩短前一个 tween、后移后一个 tween，或添加 overwrite: 'auto'。"
        ),
    },
    "timeline_track_too_dense": {
        "category": "quality_issue",
        "default_severity": "P2",
        "description": (
            "单个 timeline track 元素过多，可能影响可读性和性能。"
            "考虑拆分到多个 track 或减少同时间段的动画数量。"
        ),
    },
    "composition_file_too_large": {
        "category": "quality_issue",
        "default_severity": "P3",
        "description": (
            "HTML 文件行数过多，建议拆分为子 composition。"
            "小文件更易阅读、迭代和 diff。"
        ),
    },
    "font_family_without_font_face": {
        "category": "quality_issue",
        "default_severity": "P1",
        "description": (
            "使用了未声明 @font-face 的字体族名。"
            "应添加 @font-face 声明或 vendor 字体文件到 assets/fonts/。"
            "（HF 0.7.22+ 不再对 system-ui 和 var() 报此 warning。）"
        ),
    },
    # ── HF 0.7.21+ new lint rules ──
    "crossorigin_on_media": {
        "category": "quality_issue",
        "default_severity": "P0",
        "description": (
            "media 元素上的 crossorigin 属性会导致 preview 显示空白。"
            "移除 crossorigin 属性或使用本地 vendor 的媒体文件。"
        ),
    },
    "visible_markup_comment": {
        "category": "quality_issue",
        "default_severity": "P2",
        "description": "HTML 注释内容在渲染中可见。检查注释是否在 DOM 结构外。"
    },
    "id_less_media_wash": {
        "category": "quality_issue",
        "default_severity": "P0",
        "description": (
            "仅有 data-hf-id 没有 real id 的 video/audio 会渲染成白屏并丢失音频。"
            "确保 media 元素有真实 id 属性。"
        ),
    },
}

# Default for unknown warning codes
_UNKNOWN_DEFAULT: dict[str, Any] = {
    "category": "upstream_limit",
    "default_severity": "P2",
    "description": (
        "未知的 HyperFrames warning。暂归类为上游限制，待确认后更新分类表。"
    ),
}


# ── Cache file paths ────────────────────────────────────────────────────

def _lint_output_path(project_dir: Path) -> Path:
    """Where Agent should redirect hyperframes lint --json output."""
    return project_dir / ".framepack" / "lint-output.json"


def _findings_cache_path(project_dir: Path) -> Path:
    """Where classified findings are cached for quality_audit."""
    return project_dir / ".framepack" / "hyperframes-findings.json"


# ── Classification ───────────────────────────────────────────────────────

def classify_finding(finding: dict[str, Any]) -> dict[str, Any]:
    """Classify a single lint finding using the data-driven classification table.

    Returns a dict with: code, severity, category, message, description.
    Unknown codes default to upstream_limit P2 (safe default).
    """
    code = finding.get("code", "unknown")
    entry = WARNING_CLASSIFICATION.get(code, _UNKNOWN_DEFAULT)

    return {
        "code": code,
        "severity": entry["default_severity"],
        "category": entry["category"],
        "message": finding.get("message", ""),
        "description": entry.get("description", ""),
    }


def classify_lint_output(lint_json: dict[str, Any]) -> list[dict[str, Any]]:
    """Classify all findings from a hyperframes lint --json output.

    Args:
        lint_json: The full parsed JSON from `npx hyperframes lint --json`.

    Returns:
        List of classified finding dicts, sorted by severity (P0 first).
    """
    findings = lint_json.get("findings", [])
    if not isinstance(findings, list):
        logger.warning("lint output findings is not a list: %s", type(findings))
        return []

    classified = [classify_finding(f) for f in findings]

    # Sort by severity
    severity_order = {"P0": 0, "P1": 1, "P2": 2, "P3": 3}
    classified.sort(key=lambda c: severity_order.get(c["severity"], 9))

    return classified


# ── Cache read/write ─────────────────────────────────────────────────────

def save_lint_cache(project_dir: Path, lint_json: dict[str, Any]) -> None:
    """Parse lint --json output, classify findings, and save to cache.

    Creates .framepack/hyperframes-findings.json with both raw and classified data.
    """
    project_dir = Path(project_dir)
    cache_path = _findings_cache_path(project_dir)
    cache_path.parent.mkdir(parents=True, exist_ok=True)

    classified = classify_lint_output(lint_json)
    hyperframes_version = (
        lint_json.get("_meta", {}).get("version", "unknown")
    )

    cache = {
        "version": 1,
        "source": "hyperframes-lint",
        "hyperframes_version": hyperframes_version,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "raw": lint_json,
        "classified": classified,
    }

    try:
        cache_path.write_text(
            json.dumps(cache, indent=2, ensure_ascii=False),
            encoding="utf-8",
        )
        logger.info(
            "Lint cache saved: %d findings (%s)",
            len(classified),
            hyperframes_version,
        )
    except OSError as exc:
        logger.warning("Failed to save lint cache: %s", exc)


def load_lint_cache(project_dir: Path) -> dict[str, Any] | None:
    """Load classified findings from cache.

    Returns None if cache doesn't exist or is malformed.
    """
    project_dir = Path(project_dir)
    cache_path = _findings_cache_path(project_dir)

    if not cache_path.is_file():
        return None

    try:
        data = json.loads(cache_path.read_text(encoding="utf-8"))
        if not isinstance(data, dict) or "classified" not in data:
            logger.warning("Lint cache malformed: missing 'classified' key")
            return None
        return data
    except (json.JSONDecodeError, OSError) as exc:
        logger.warning("Failed to load lint cache: %s", exc)
        return None


# ── Quality audit integration ──────────────────────────────────────────

def merge_classified_into_quality_issues(
    classified: list[dict[str, Any]],
    html_path: str = "index.html",
) -> list:
    """Convert classified findings into QualityIssue objects for quality_audit.

    Upstream limitation findings get prefixed with 'upstream:' in their code
    and carry category='upstream_limit' in details.

    Args:
        classified: List of classified finding dicts from classify_lint_output.
        html_path: Path to index.html for the QualityIssue path field.

    Returns:
        List of QualityIssue instances.
    """
    from core.quality_audit import QualityIssue

    issues = []
    for entry in classified:
        code = entry["code"]
        severity = entry["severity"]
        category = entry.get("category", "upstream_limit")
        message = entry.get("message", "")
        description = entry.get("description", "")

        # Prefix upstream limitations to distinguish from framepack-native codes
        if category == "upstream_limit":
            issue_code = f"upstream:{code}"
            details = {
                "category": "upstream_limit",
                "original_code": code,
                "description": description,
            }
        else:
            issue_code = code
            details = {
                "category": "quality_issue",
                "original_code": code,
                "description": description,
            }

        # Build a rich message combining the lint message and our description
        full_message = message
        if description and description not in message:
            full_message = f"{message} — {description}"

        issues.append(
            QualityIssue(
                code=issue_code,
                severity=severity,
                message=full_message,
                path=html_path,
                details=details,
            )
        )

    return issues
