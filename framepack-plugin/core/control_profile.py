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
    # v0.14: motion 审计——每个 motion 名 → 0-1 谨慎度权重。
    # 旧版 forbidden_motion (list) 解析时自动转为 0.9（高谨慎度）。
    # 注意：caution_motion 是字典而非单一权重，故不进 _WEIGHT_KEYS。
    caution_motion: dict[str, float] = field(default_factory=dict)

    def __post_init__(self):
        # frozen dataclass → 用 object.__setattr__ 绕过；值 clamp 到 0-1。
        clamped = {k: _clamp(v) for k, v in self.caution_motion.items()}
        object.__setattr__(self, "caution_motion", clamped)

    # ── Parsing ──

    _WEIGHT_KEYS = ("creative_autonomy", "restraint_force",
                    "atmosphere_density", "motion_dynamism", "weapon_reliance")
    _ASSESS_KEYS = ("content_understanding", "color_confidence",
                    "rhythm_confidence", "restraint_instinct")

    # 旧版 forbidden_motion list → 每项自动转为此 caution 值（高谨慎度）。
    _FORBIDDEN_CAUTION = 0.9

    # ── Directive Rendering ──

    def render_directive(self) -> str:
        """把五行权重翻译成面向当前阶段的具体行为指令文本（给 hook 注入用）。

        五行各有高/中/低三档指引文案，根据权重值自动选择。
        """
        w = self.weights
        lines = ["## 五行权重指令（自动生成，来自你的 control_profile）", ""]

        # 木 creative_autonomy
        if w.creative_autonomy > 0.7:
            lines.append(f"木 creative_autonomy={w.creative_autonomy}: 信任你的创意判断，"
                         "可以自主选择风格、混合独特元素，不必拘泥风格库。")
        elif w.creative_autonomy < 0.3:
            lines.append(f"木 creative_autonomy={w.creative_autonomy}: 创意自主度低，"
                         "需要风格库引导，优先参考 visual-styles.md 的推荐。")
        else:
            lines.append(f"木 creative_autonomy={w.creative_autonomy}: "
                         "中庸自主度——可自主但建议参考风格库验证。")

        # 金 restraint_force
        if w.restraint_force > 0.7:
            lines.append(f"金 restraint_force={w.restraint_force}: 克制力高，"
                         "保持精简，每个元素的存在必须有理由，少即是多。")
        elif w.restraint_force < 0.3:
            lines.append(f"金 restraint_force={w.restraint_force}: 克制力低，"
                         "注意堆砌倾向——加之前问自己：这个元素是否真的必要？")
        else:
            lines.append(f"金 restraint_force={w.restraint_force}: "
                         "中庸克制力——适度即可，但警惕过度堆砌。")

        # 火 atmosphere_density
        cap = w.atmosphere_layer_cap()
        if w.atmosphere_density < 0.3:
            lines.append(f"火 atmosphere_density={w.atmosphere_density}: "
                         f"氛围密度低，层数上限约{cap}层，默认克制不加。")
        elif w.atmosphere_density > 0.7:
            lines.append(f"火 atmosphere_density={w.atmosphere_density}: "
                         f"氛围密度高，层数上限约{cap}层，可以铺多层氛围。")
        else:
            lines.append(f"火 atmosphere_density={w.atmosphere_density}: "
                         f"中庸氛围密度，层数上限约{cap}层。")

        # 水 motion_dynamism
        if w.motion_dynamism > 0.7:
            lines.append(f"水 motion_dynamism={w.motion_dynamism}: 动作张力高，"
                         "可以用大胆/激进的动画动词（SLAM、PUNCH、BURST）。")
        elif w.motion_dynamism < 0.3:
            lines.append(f"水 motion_dynamism={w.motion_dynamism}: 动作张力低，"
                         "保持沉稳/平静的节奏，用 drift、fade 这类温和动词。")
        else:
            lines.append(f"水 motion_dynamism={w.motion_dynamism}: "
                         "中庸动作张力——动静搭配。")

        # 土 weapon_reliance
        if w.weapon_reliance > 0.7:
            lines.append(f"土 weapon_reliance={w.weapon_reliance}: 武器依赖度高，"
                         "每个场景尽量用武器库兜底，HANDWRITE 需要理由。")
        elif w.weapon_reliance < 0.3:
            lines.append(f"土 weapon_reliance={w.weapon_reliance}: 武器依赖度低，"
                         "允许自由裸写 GSAP，武器是可选强化工具不是强制。")
        else:
            lines.append(f"土 weapon_reliance={w.weapon_reliance}: "
                         "中庸武器依赖——武器和裸写搭配使用。")

        lines.append("")
        lines.append("以上指令基于你试菜后的自评权重，请在后续阶段遵循。")
        return "\n".join(lines)

    @classmethod
    def from_frame_md(cls, text: str) -> ControlProfile | None:
        """从 frame.md 文本解析 control_profile 块。

        返回 None 当：
          - 没有 control_profile 块（旧项目向后兼容）
          - 有块但没填任何权重/自评
        """
        if "control_profile" not in text:
            return None

        # 先提取 control_profile 块，限制子块搜索范围（B-7 修复：
        # 避免 taste.visual_physics 等其他块的同名子块被误抓）
        profile_block = _extract_yaml_block(text, "control_profile")
        if not profile_block.strip():
            return None

        weight_block = _extract_yaml_block(profile_block, "weights")
        assess_block = _extract_yaml_block(profile_block, "self_assessment")
        caution_block = _extract_yaml_block(profile_block, "caution_motion")
        forbidden_block = _extract_yaml_block(profile_block, "forbidden_motion")

        weight_vals = _parse_key_values(weight_block, cls._WEIGHT_KEYS)
        assess_vals = _parse_key_values(assess_block, cls._ASSESS_KEYS)
        # caution_motion 是 dict（任意 key），不受 _WEIGHT_KEYS 过滤。
        caution_vals = _parse_dict_block(caution_block)
        # 旧版 forbidden_motion 是 list（key 即 motion 名）→ 每项转 0.9。
        # 显式 caution_motion 值优先于 forbidden 的默认 0.9（新格式胜出）。
        for name in _parse_list_block(forbidden_block):
            caution_vals.setdefault(name, cls._FORBIDDEN_CAUTION)

        if not weight_vals and not assess_vals and not caution_vals:
            return None

        return cls(
            weights=Weights(**{k: weight_vals.get(k, 0.5)
                               for k in cls._WEIGHT_KEYS}),
            self_assessment=SelfAssessment(**{k: assess_vals.get(k, 0.5)
                                               for k in cls._ASSESS_KEYS}),
            caution_motion=caution_vals,
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


def _parse_dict_block(block_text: str) -> dict[str, float]:
    """Parse a YAML-ish 'key: float' block into a dict (any key allowed).

    Used for caution_motion, where key = motion 名, value = 0-1 谨慎度。
    glow / 任何 key 都按普通条目处理，无白名单过滤。
    """
    result: dict[str, float] = {}
    for line in block_text.splitlines():
        match = re.match(r'^\s*([A-Za-z0-9_][\w\-]*)\s*:\s*(-?[\d.]+)\s*$', line)
        if match:
            try:
                result[match.group(1)] = float(match.group(2))
            except ValueError:
                pass
    return result


def _parse_list_block(block_text: str) -> list[str]:
    """Parse a YAML-ish '- item' list block into a list of names.

    Used for the legacy forbidden_motion list (key 即 motion 名)。
    """
    result: list[str] = []
    for line in block_text.splitlines():
        match = re.match(r'^\s*-\s*(.+?)\s*$', line)
        if match:
            name = match.group(1).strip().strip('"').strip("'")
            if name:
                result.append(name)
    return result
