"""ControlProfile — 五行权重系统.

五行权重（相生相克，涵盖所有创意控制）:
  木 creative_autonomy  — 创意自主度
  金 restraint_force    — 克制力
  火 atmosphere_density — 氛围密度
  水 motion_dynamism    — 动作张力
  土 weapon_reliance    — 武器依赖度

相生相克（覆盖万控）:
  木 克 土 — 自主高，武器依赖自然降低（V1 模式）
  土 克 水 — 武器兜底多，动作更规范可控
  水 克 火 — 动作张力高，氛围不需要太浓（动静互补）
  火 克 金 — 氛围越浓，克制力被消耗（V3 死因）
  金 克 木 — 克制力约束自主，防止自主变放纵
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from pathlib import Path


def _clamp(v: float) -> float:
    return max(0.0, min(1.0, v))


@dataclass(frozen=True)
class Weights:
    """五个核心控制权重——像五行，正交但相生相克。"""
    creative_autonomy: float = 0.5      # 木｜创意自主度
    restraint_force: float = 0.5       # 金｜克制力
    atmosphere_density: float = 0.4    # 火｜氛围密度（默认偏克制）
    motion_dynamism: float = 0.5       # 水｜动作张力
    weapon_reliance: float = 0.5       # 土｜武器依赖度

    def __post_init__(self):
        for f in ("creative_autonomy", "restraint_force", "atmosphere_density",
                   "motion_dynamism", "weapon_reliance"):
            object.__setattr__(self, f, _clamp(getattr(self, f)))

    def atmosphere_layer_cap(self) -> int:
        """氛围层数上限 = floor(density × 7)。"""
        return int(self.atmosphere_density * 7)


@dataclass(frozen=True)
class SelfAssessment:
    """试菜结果：Agent 对自己能力的自我评估。"""
    content_understanding: float = 0.5
    color_confidence: float = 0.5
    rhythm_confidence: float = 0.5
    restraint_instinct: float = 0.5

    def __post_init__(self):
        for f in ("content_understanding", "color_confidence",
                   "rhythm_confidence", "restraint_instinct"):
            object.__setattr__(self, f, _clamp(getattr(self, f)))


@dataclass(frozen=True)
class ControlProfile:
    """权重表——类比 Three.js 的 sceneWeights，frame.md 里的新块。"""
    weights: Weights = field(default_factory=Weights)
    self_assessment: SelfAssessment = field(default_factory=SelfAssessment)

    # ── Parsing ──

    _WEIGHT_KEYS = ("creative_autonomy", "restraint_force",
                    "atmosphere_density", "motion_dynamism", "weapon_reliance")
    _ASSESS_KEYS = ("content_understanding", "color_confidence",
                    "rhythm_confidence", "restraint_instinct")

    @classmethod
    def from_frame_md(cls, text: str) -> ControlProfile | None:
        """从 frame.md 文本解析 control_profile 块。

        返回 None 当：
          - 没有 control_profile 块（旧项目向后兼容）
          - 有块但没填任何权重/自评
        """
        if "control_profile" not in text:
            return None

        weight_block = _extract_yaml_block(text, "weights")
        assess_block = _extract_yaml_block(text, "self_assessment")

        weight_vals = _parse_key_values(weight_block, cls._WEIGHT_KEYS)
        assess_vals = _parse_key_values(assess_block, cls._ASSESS_KEYS)

        if not weight_vals and not assess_vals:
            return None

        return cls(
            weights=Weights(**{k: weight_vals.get(k, 0.5)
                               for k in cls._WEIGHT_KEYS}),
            self_assessment=SelfAssessment(**{k: assess_vals.get(k, 0.5)
                                               for k in cls._ASSESS_KEYS}),
        )

    @classmethod
    def from_frame_md_file(cls, path: Path) -> ControlProfile | None:
        """从 frame.md 文件解析。文件不存在或解析失败返回 None。"""
        if not path.exists():
            return None
        try:
            return cls.from_frame_md(
                path.read_text(encoding="utf-8", errors="replace"))
        except Exception:
            return None


# ── YAML block extraction helpers ──

def _extract_yaml_block(text: str, block_name: str) -> str:
    """Extract a YAML sub-block by name (best-effort, line-based).

    Finds a line like '  weights:' and captures subsequent more-indented lines
    until indentation returns to the same or lesser level.
    """
    lines = text.splitlines()
    capturing = False
    block_indent = -1
    out: list[str] = []
    for line in lines:
        stripped = line.lstrip()
        if stripped.strip() == "":
            if capturing:
                out.append(line)
            continue

        # Match the block header: e.g. "  weights:" at some indentation
        if not capturing:
            if re.match(rf'^\s*{re.escape(block_name)}:\s*$', line):
                block_indent = len(line) - len(stripped)
                capturing = True
            continue

        # We're capturing: check if this line belongs to the block
        cur_indent = len(line) - len(stripped)
        if cur_indent > block_indent:
            out.append(line)
        else:
            # Indentation dropped to block level or above → block ends
            capturing = False
            break

    return "\n".join(out)


def _parse_key_values(block_text: str, valid_keys: tuple[str, ...]) -> dict[str, float]:
    """Parse 'key: value' pairs from a YAML-ish block, filtering to valid keys."""
    result: dict[str, float] = {}
    for key in valid_keys:
        match = re.search(
            rf'{re.escape(key)}\s*:\s*(-?[\d.]+)', block_text)
        if match:
            try:
                result[key] = float(match.group(1))
            except ValueError:
                pass
    return result
