"""Weapon source inventory for the pre-HTML Weapon Matching Pass."""

from __future__ import annotations

from dataclasses import dataclass, field
import json
from pathlib import Path
from typing import Any

from .builtin_weapons import BUILTIN_WEAPONS


PROXY_RETRY_NOTE = (
    "Official catalog/registry lookup may be behind a wall. On timeout, registry skip, "
    "or catalog fetch failure, probe HTTP_PROXY/HTTPS_PROXY/ALL_PROXY, npm proxy, git proxy, "
    "and Windows proxy; local default often 127.0.0.1:59527. Retry via proxy before falling back."
)


@dataclass(frozen=True)
class WeaponSource:
    id: str
    source_type: str
    kind: str
    status: str
    load: dict[str, Any] = field(default_factory=dict)
    keywords: tuple[str, ...] = ()
    notes: str = ""


FRAMEPACK_KEYWORDS: dict[str, tuple[str, ...]] = {
    "text-split-enter": (r"\btitle\b|标题|大字|hero\s*text|文字分裂|split[-\s]?enter|左右合拢|拼合|东方之润", r"进场|enter|reveal|入场"),
    "splittext-stagger-chars": (r"逐字|每个字|字符|\bchars?\b|\bletters?\b|stagger\s*chars?|SplitText|飞入",),
    "caption-clip-wipe": (r"擦出|擦除|wipe|clip[-\s]?wipe|left\s*to\s*right|从左到右|字幕揭示|caption",),
    "typewriter-cursor": (r"打字机|typewriter|光标|cursor|逐字打出|terminal\s*typing",),
    "anime-text-split": (r"anime\.js|animejs|anime\s*文字|anime\s*text|轻量文字拆分", r"逐字|\bletters?\b|word|文字拆分|text\s*split"),
    "number-count-up": (r"\b\d+(?:\.\d+)?\s*(?:\+|%|x|k|m|万|亿)?\b", r"数字|number|count|计数|跳动|数据冲击|stat|KPI|指标"),
    "data-chart-editorial": (r"图表|\bchart\b|折线|柱状|数据点|market|市场|SVG\s*path|dashoffset|stroke-dashoffset|NYT|editorial\s*chart",),
    "sticky-flowchart": (r"流程图|flowchart|白板|便利贴|sticky|节点|连接线|process\s*map|journey\s*map",),
    "macos-notification": (r"通知|notification|toast|macOS|弹窗|横幅|signup|新评论|社交证明",),
    "card-cascade-reveal": (r"\b(?:cards?|card)\b|卡片|card\s*(?:cascade|fan|grid)|扇形|依次翻出|功能卡", r"cascade|stagger|扇形|飞出|翻出|网格"),
    "hero-3d-device-spin": (r"3D\s*(?:设备|device|手机|phone|macbook|mockup)|设备旋转|device\s*spin|hero\s*device|产品截图.*旋转",),
    "stagger-grid-reveal": (r"网格|grid|矩阵|tiles?|cells?|stagger\s*grid|依次揭示|中心向外",),
    "float-3d-card": (r"悬浮卡片|float(?:ing)?\s*card|3D\s*卡片|parallax\s*card|微微悬浮|rotationX|透视",),
    "bg-blur-mask": (r"背景模糊|blur\s*(?:mask|background)|backdrop-filter|景深|暗化背景|聚焦前景",),
    "gradient-shift": (r"渐变|gradient|色彩流动|背景流动|呼吸感|linear-gradient|色带",),
    "particle-blob-bg": (r"粒子|particle|blob|有机体|organic\s*blob|蠕动|morphing\s*background",),
    "light-leak-cinema": (r"漏光|light\s*leak|胶片|film\s*grain|letterbox|电影感|cinema|35mm|颗粒",),
    "glitch-flicker": (r"故障|glitch|flicker|闪烁|CRT|像素错位|digital\s*noise|干扰",),
    "elastic-scale-enter": (r"弹性|elastic|bounce|back\.out|scale\s*enter|弹入|缩放入场|pop\s*in",),
    "sprite-animation": (r"精灵|sprite|逐帧|frame\s*animation|spritesheet|序列帧|帧动画|背景定位",),
    "svg-morph-transition": (r"SVG\s*变形|svg\s*morph|path\s*morph|形态变形|morph\s*transition|d\s*属性",),
}


def list_framepack_builtin_sources() -> list[WeaponSource]:
    sources: list[WeaponSource] = []
    for weapon_id, weapon in sorted(BUILTIN_WEAPONS.items()):
        if weapon_id.startswith("rules.") or weapon_id == "transitions-pack":
            continue
        sources.append(
            WeaponSource(
                id=weapon_id,
                source_type="framepack_builtin",
                kind=str(weapon.get("kind", "part")),
                status="executable",
                load={
                    "skill": "framepack-animation-library",
                    "file_path": str(weapon.get("code") or ""),
                    "function": str(weapon.get("function") or ""),
                    "engine": str(weapon.get("engine") or ""),
                },
                keywords=FRAMEPACK_KEYWORDS.get(weapon_id, ()),
                notes="Framepack executable builtin weapon",
            )
        )
    return sources


def list_specialist_skill_sources() -> list[WeaponSource]:
    return [
        WeaponSource("skill:gsap", "specialist_skill", "skill", "reference", {"skill": "gsap"}, (r"GSAP|timeline|easing|stagger|MotionPath|ScrollTrigger",), "GSAP official skill for API/easing/timeline patterns"),
        WeaponSource("skill:hyperframes:captions", "specialist_skill", "reference", "reference", {"skill": "software-development/hyperframes", "file_path": "references/captions.md"}, (r"caption|字幕|word[-\s]?synced|karaoke|逐词|歌词|subtitle",), "HyperFrames caption reference"),
        WeaponSource("skill:hyperframes:transitions", "specialist_skill", "reference", "reference", {"skill": "software-development/hyperframes", "file_path": "references/transitions.md"}, (r"transition|转场|crossfade|blur\s*crossfade|wipe|硬切|clip timing",), "HyperFrames transition references; replaces deprecated transitions-pack"),
        WeaponSource("skill:hyperframes:audio-reactive", "specialist_skill", "reference", "reference", {"skill": "software-development/hyperframes", "file_path": "references/audio-reactive.md"}, (r"audio[-\s]?reactive|beat|BGM|节拍|频谱|waveform|pulse",), "HyperFrames audio-reactive reference"),
        WeaponSource("skill:hyperframes:css-patterns", "specialist_skill", "reference", "reference", {"skill": "software-development/hyperframes", "file_path": "references/css-patterns.md"}, (r"highlight|marker|scribble|circle|手绘圈|强调标注",), "HyperFrames CSS emphasis patterns"),
        WeaponSource("skill:framepack-reference-miner", "specialist_skill", "skill", "reference", {"skill": "framepack-reference-miner"}, (r"参考视频|reference video|DNA|复刻|template from reference",), "Reference video DNA mining"),
        WeaponSource("skill:sprite-to-hyperframes", "specialist_skill", "skill", "reference", {"skill": "sprite-to-hyperframes"}, (r"sprite|精灵|spritesheet|mascot|吉祥物",), "Sprite sheet to HyperFrames workflow"),
        WeaponSource("skill:media-use", "specialist_skill", "skill", "reference", {"skill": "media-use"}, (r"BGM|SFX|音效|素材|media|music",), "Media asset acquisition/handling"),
    ]


def list_hyperframes_official_sources() -> list[WeaponSource]:
    return [
        WeaponSource(
            "hyperframes:catalog",
            "hyperframes_official",
            "reference",
            "reference",
            {"command": "npx hyperframes catalog --json"},
            (r"catalog|registry|official component|官方组件|模板|component",),
            PROXY_RETRY_NOTE,
        )
    ]


def list_project_local_sources(project_dir: str | Path | None = None) -> list[WeaponSource]:
    if not project_dir:
        return []
    path = Path(project_dir) / ".framepack" / "arsenal.json"
    if not path.is_file():
        return []
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return []
    weapons = data.get("weapons") if isinstance(data.get("weapons"), dict) else {}
    sources: list[WeaponSource] = []
    for weapon_id, weapon in sorted(weapons.items()):
        if not isinstance(weapon, dict) or str(weapon.get("status", "active")) == "unused":
            continue
        sources.append(
            WeaponSource(
                id=weapon_id,
                source_type="project_local",
                kind=str(weapon.get("kind", "local")),
                status="executable",
                load={
                    "file_path": str(weapon.get("code") or weapon.get("local_path") or ""),
                    "function": str(weapon.get("function") or ""),
                },
                keywords=tuple(weapon.get("keywords", []) or []),
                notes="Project-local arsenal weapon",
            )
        )
    return sources


def list_all_weapon_sources(project_dir: str | Path | None = None) -> list[WeaponSource]:
    return (
        list_hyperframes_official_sources()
        + list_framepack_builtin_sources()
        + list_specialist_skill_sources()
        + list_project_local_sources(project_dir)
    )
