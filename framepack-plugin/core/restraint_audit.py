"""权重一致性审计 — 五行权重 vs 实际产出的匹配检查.

P2 级别：提醒但不阻断，要求 Agent 在 expanded-prompt.md 里做出解释。
P3 级别：轻微提示，不要求解释。

检查维度：
  火 atmosphere_density — expanded-prompt 的氛围层数 vs density 决定的上限
  土 weapon_reliance    — Manifest 的 HANDWRITE 比例 vs reliance
  金 restraint_force    — surprise 数量 vs restraint
"""
from __future__ import annotations

import re
from dataclasses import dataclass

from core.control_profile import ControlProfile


@dataclass(frozen=True)
class ConsistencyIssue:
    """权重一致性检查发现的问题。"""
    code: str
    severity: str  # P2 | P3
    message: str
    requires_explanation: bool = True  # P2 默认要求解释


# ── 主审计函数 ──

def audit_weight_consistency(
    cp: ControlProfile | None,
    expanded_prompt: str = "",
) -> list[ConsistencyIssue]:
    """检查五行权重与 expanded-prompt 实际产出的一致性。

    返回 ConsistencyIssue 列表。空列表 = 一致。
    cp 为 None 时返回空列表（向后兼容旧项目无 control_profile）。
    """
    if cp is None or not expanded_prompt.strip():
        return []

    issues: list[ConsistencyIssue] = []
    w = cp.weights

    # 火: atmosphere_density vs 实际氛围层数
    layer_count = _count_atmosphere_layers(expanded_prompt)
    cap = w.atmosphere_layer_cap()
    if layer_count > cap + 1:  # 允许 +1 容差
        issues.append(ConsistencyIssue(
            code="atmosphere_density_mismatch",
            severity="P2",
            message=(f"atmosphere_density={w.atmosphere_density} 建议上限约{cap}层，"
                     f"但 expanded-prompt 检测到{layer_count}层。"
                     f"请在 expanded-prompt.md 里解释为何超出，或削减层数。"),
            requires_explanation=True,
        ))

    # 土: weapon_reliance vs HANDWRITE 比例
    hw_ratio = _handwrite_ratio(expanded_prompt)
    if w.weapon_reliance > 0.7 and hw_ratio > 0.5:
        issues.append(ConsistencyIssue(
            code="weapon_reliance_mismatch",
            severity="P2",
            message=(f"weapon_reliance={w.weapon_reliance}（高依赖）"
                     f"但 HANDWRITE 比例={hw_ratio:.0%}。"
                     f"高依赖应多用武器兜底，请解释为何大量裸写。"),
            requires_explanation=True,
        ))

    # 金: restraint_force vs surprise 数量
    surprise_count = len(re.findall(r'\bsurprise\b', expanded_prompt, re.IGNORECASE))
    if w.restraint_force > 0.7 and surprise_count > 2:
        issues.append(ConsistencyIssue(
            code="restraint_force_mismatch",
            severity="P2",
            message=(f"restraint_force={w.restraint_force}（克制倾向）"
                     f"但检测到{surprise_count}个 surprise。"
                     f"克制高时建议 ≤1 个 surprise，请解释。"),
            requires_explanation=True,
        ))

    return issues


# ── 辅助函数 ──

_ATMOSPHERE_KEYWORDS = [
    "particle", "grid-line", "gradient", "glow", "light-leak",
    "noise", "bokeh", "vignette", "shimmer", "aura", "haze",
    "grid", "gradient", "shimmer",
]


def _count_atmosphere_layers(text: str) -> int:
    """统计 expanded-prompt 里出现的氛围关键词数量。"""
    text_lower = text.lower()
    seen: set[str] = set()
    for kw in _ATMOSPHERE_KEYWORDS:
        if kw in text_lower and kw not in seen:
            seen.add(kw)
    # 去重：grid-line 和 grid 不重复计
    if "grid-line" in seen and "grid" in seen:
        seen.discard("grid")
    if "gradient" in seen:
        # gradient 可能匹配两次但只算一次
        pass
    return len(seen)


def _handwrite_ratio(text: str) -> float:
    """计算 Execution Manifest 里 HANDWRITE 的比例。"""
    # 匹配 sceneN: weapon_name 格式
    manifest_entries = re.findall(
        r'scene\d+:?\s*(\w+)', text, re.IGNORECASE)
    if not manifest_entries:
        return 0.0
    hw_count = sum(1 for entry in manifest_entries
                   if "handwrite" in entry.lower())
    return hw_count / len(manifest_entries)
