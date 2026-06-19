# Framepack v0.14 实施计划：权重控制系统 + Sprite Forge

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** 将 Framepack 的创意控制从状态机升级为五行权重系统，并新增 sprite-forge 精灵锻造能力。

**Architecture:** 新增 `core/control_profile.py`（权重数据结构）+ `core/restraint_audit.py`（权重一致性审计），扩展 quality_audit 和 hooks 实现权重穿透（三节点注入），新增 `framepack-sprite-forge` skill（出图纸 + 后处理脚本），guardrails.md + director skill 更新试菜流程。

**Tech Stack:** Python (numpy + Pillow), Hermes Plugin hooks, YAML frontmatter

**设计文档:**
- `F:/hyperframes/.hermes/designs/2026-06-19--v014-weight-control-system.md`
- `F:/hyperframes/.hermes/designs/2026-06-19--sprite-forge-integration.md`

**当前状态:** v0.13 品味接线完成，432 tests passed，部署同步 content hash 双确认。

---

## Phase A: 权重核心——ControlProfile 数据结构

### Task A1: ControlProfile 数据结构 + 权重验证

**Objective:** 创建五行权重的数据结构，支持读取/验证/默认值/向后兼容。

**Files:**
- Create: `core/control_profile.py`
- Test: `tests/test_control_profile.py`

**Step 1: Write failing tests**

```python
# tests/test_control_profile.py
"""ControlProfile — 五行权重系统数据结构测试."""
import textwrap
from pathlib import Path
from core.control_profile import ControlProfile, Weights, SelfAssessment


class TestWeightsDataclass:
    def test_default_weights_are_conservative_midline(self):
        w = Weights()
        # 默认 = 中等铁轨，保守值（向后兼容旧项目）
        assert 0.4 <= w.creative_autonomy <= 0.6
        assert 0.4 <= w.restraint_force <= 0.6
        assert 0.3 <= w.atmosphere_density <= 0.5
        assert 0.4 <= w.motion_dynamism <= 0.6
        assert 0.4 <= w.weapon_reliance <= 0.6

    def test_weights_clamped_to_0_1_range(self):
        w = Weights(creative_autonomy=1.5, restraint_force=-0.3, atmosphere_density=0.5,
                    motion_dynamism=0.5, weapon_reliance=0.5)
        assert w.creative_autonomy == 1.0
        assert w.restraint_force == 0.0

    def test_atmosphere_layer_cap(self):
        # 层数上限 = floor(density × 7)
        assert Weights(atmosphere_density=0.3).atmosphere_layer_cap() == 2
        assert Weights(atmosphere_density=1.0).atmosphere_layer_cap() == 7
        assert Weights(atmosphere_density=0.0).atmosphere_layer_cap() == 0


class TestSelfAssessment:
    def test_default_self_assessment_is_midline(self):
        sa = SelfAssessment()
        for field in ("content_understanding", "color_confidence",
                       "rhythm_confidence", "restraint_instinct"):
            assert 0.4 <= getattr(sa, field) <= 0.6


class TestControlProfileParsing:
    def _frame_md_with_profile(self, weights_yaml: str, assessment_yaml: str = "") -> str:
        assessment_block = f"  self_assessment:\n{assessment_yaml}" if assessment_yaml else ""
        return textwrap.dedent(f"""\
            ---
            colors:
              primary: "#1a1a2e"
              accent: "#c9a96e"
              background: "#0d0d1a"
            typography:
              heading: "Playfair Display"
              body: "DM Sans"
            control_profile:
            {assessment_block}
              weights:
                {weights_yaml}
            ---
            # Frame
            """)

    def test_parse_full_control_profile(self):
        md = self._frame_md_with_profile(
            weights_yaml="creative_autonomy: 0.8\n    restraint_force: 0.7\n    "
                         "atmosphere_density: 0.3\n    motion_dynamism: 0.6\n    weapon_reliance: 0.5",
            assessment_yaml="    content_understanding: 0.85\n    color_confidence: 0.8\n"
                            "    rhythm_confidence: 0.7\n    restraint_instinct: 0.9\n"
        )
        cp = ControlProfile.from_frame_md(md)
        assert cp is not None
        assert cp.weights.creative_autonomy == 0.8
        assert cp.weights.restraint_force == 0.7
        assert cp.self_assessment.restraint_instinct == 0.9

    def test_parse_returns_none_when_no_control_profile(self):
        """旧项目没有 control_profile → 返回 None（向后兼容）"""
        md = "---\ncolors:\n  primary: \"#fff\"\n---\n# Frame"
        assert ControlProfile.from_frame_md(md) is None

    def test_parse_partial_weights_uses_defaults(self):
        """只填了部分权重，其余用默认"""
        md = self._frame_md_with_profile(
            weights_yaml="creative_autonomy: 0.9\n    atmosphere_density: 0.2"
        )
        cp = ControlProfile.from_frame_md(md)
        assert cp.weights.creative_autonomy == 0.9
        assert cp.weights.atmosphere_density == 0.2
        # 未填的用默认
        assert 0.4 <= cp.weights.restraint_force <= 0.6

    def test_parse_invalid_weight_value_clamped(self):
        md = self._frame_md_with_profile(
            weights_yaml="creative_autonomy: 999\n    restraint_force: -5"
        )
        cp = ControlProfile.from_frame_md(md)
        assert cp.weights.creative_autonomy == 1.0
        assert cp.weights.restraint_force == 0.0

    def test_from_frame_md_file_not_found(self):
        cp = ControlProfile.from_frame_md_file(Path("/nonexistent/frame.md"))
        assert cp is None
```

**Step 2: Run test to verify failure**

Run: `cd F:/hyperframes/framepack-plugin && python -m pytest tests/test_control_profile.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'core.control_profile'`

**Step 3: Write minimal implementation**

```python
# core/control_profile.py
"""ControlProfile — 五行权重系统.

五行权重（相生相克，涵盖所有创意控制）:
  木 creative_autonomy  — 创意自主度
  金 restraint_force    — 克制力
  火 atmosphere_density — 氛围密度
  水 motion_dynamism    — 动作张力
  土 weapon_reliance    — 武器依赖度
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from pathlib import Path


def _clamp(v: float) -> float:
    return max(0.0, min(1.0, v))


@dataclass(frozen=True)
class Weights:
    creative_autonomy: float = 0.5
    restraint_force: float = 0.5
    atmosphere_density: float = 0.4
    motion_dynamism: float = 0.5
    weapon_reliance: float = 0.5

    def __post_init__(self):
        object.__setattr__(self, "creative_autonomy", _clamp(self.creative_autonomy))
        object.__setattr__(self, "restraint_force", _clamp(self.restraint_force))
        object.__setattr__(self, "atmosphere_density", _clamp(self.atmosphere_density))
        object.__setattr__(self, "motion_dynamism", _clamp(self.motion_dynamism))
        object.__setattr__(self, "weapon_reliance", _clamp(self.weapon_reliance))

    def atmosphere_layer_cap(self) -> int:
        return int(self.atmosphere_density * 7)


@dataclass(frozen=True)
class SelfAssessment:
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
    weights: Weights = field(default_factory=Weights)
    self_assessment: SelfAssessment = field(default_factory=SelfAssessment)

    # ── Parsing ──

    _WEIGHT_KEYS = ("creative_autonomy", "restraint_force",
                    "atmosphere_density", "motion_dynamism", "weapon_reliance")
    _ASSESS_KEYS = ("content_understanding", "color_confidence",
                    "rhythm_confidence", "restraint_instinct")

    @classmethod
    def from_frame_md(cls, text: str) -> ControlProfile | None:
        if "control_profile" not in text:
            return None
        weight_vals = {k: float(v) for k, v in
                       re.findall(r'(\w+):\s*([\d.]+)', _extract_block(text, "weights"))
                       if k in cls._WEIGHT_KEYS}
        assess_vals = {k: float(v) for k, v in
                       re.findall(r'(\w+):\s*([\d.]+)', _extract_block(text, "self_assessment"))
                       if k in cls._ASSESS_KEYS}
        if not weight_vals and not assess_vals:
            return None
        return cls(
            weights=Weights(**{k: weight_vals.get(k, 0.5) for k in cls._WEIGHT_KEYS}),
            self_assessment=SelfAssessment(**{k: assess_vals.get(k, 0.5) for k in cls._ASSESS_KEYS}),
        )

    @classmethod
    def from_frame_md_file(cls, path: Path) -> ControlProfile | None:
        if not path.exists():
            return None
        try:
            return cls.from_frame_md(path.read_text(encoding="utf-8", errors="replace"))
        except Exception:
            return None


def _extract_block(text: str, block_name: str) -> str:
    """Extract a YAML sub-block by name (best-effort, line-based)."""
    lines = text.splitlines()
    capturing = False
    indent = -1
    out: list[str] = []
    for line in lines:
        stripped = line.lstrip()
        if stripped.startswith(f"{block_name}:"):
            indent = len(line) - len(stripped)
            capturing = True
            continue
        if capturing:
            if stripped.strip() == "":
                continue
            cur_indent = len(line) - len(stripped)
            if cur_indent <= indent and stripped and not stripped.startswith("#"):
                break
            out.append(line)
    return "\n".join(out)
```

**Step 4: Run test to verify pass**

Run: `cd F:/hyperframes/framepack-plugin && python -m pytest tests/test_control_profile.py -v`
Expected: 8 passed

**Step 5: Commit**

```bash
git add core/control_profile.py tests/test_control_profile.py
git commit -m "feat(v0.14): ControlProfile 五行权重数据结构 + 解析/验证"
```

---

### Task A2: 权重→行为指令生成器

**Objective:** 把五行权重翻译成面向当前阶段的具体行为指令文本（给 hook 注入用）。

**Files:**
- Modify: `core/control_profile.py` (add `render_directive()`)
- Test: `tests/test_control_profile.py` (append)

**Step 1: Write failing tests**

```python
# append to tests/test_control_profile.py

class TestWeightDirectiveRendering:
    def test_render_directive_contains_all_five_weights(self):
        cp = ControlProfile(weights=Weights(
            creative_autonomy=0.8, restraint_force=0.7, atmosphere_density=0.3,
            motion_dynamism=0.6, weapon_reliance=0.5))
        directive = cp.render_directive()
        for label in ("creative_autonomy", "restraint_force",
                      "atmosphere_density", "motion_dynamism", "weapon_reliance"):
            assert label in directive

    def test_render_directive_high_autonomy_says_trust_yourself(self):
        cp = ControlProfile(weights=Weights(creative_autonomy=0.85))
        d = cp.render_directive()
        assert "信任" in d or "trust" in d.lower()

    def test_render_directive_low_restraint_warns_about_piling(self):
        cp = ControlProfile(weights=Weights(restraint_force=0.15))
        d = cp.render_directive()
        assert "堆砌" in d or "piling" in d.lower()

    def test_render_directive_includes_atmosphere_layer_cap(self):
        cp = ControlProfile(weights=Weights(atmosphere_density=0.3))
        d = cp.render_directive()
        assert "2" in d  # floor(0.3*7)=2
```

**Step 2: Run → FAIL (render_directive not defined)**

**Step 3: Implement `render_directive()`**

在 `ControlProfile` 类中添加方法，根据各权重的高低（>0.7 高 / 0.3-0.7 中 / <0.3 低），生成中文行为指引文本。每个维度有高/中/低三档指引文案。组装成一段完整的指令文本，供 Hook 1 注入。

**Step 4: Run → PASS**
**Step 5: Commit** `feat(v0.14): 权重→行为指令生成器 render_directive()`

---

## Phase B: 权重穿透——Hook 注入

### Task B1: Hook 1 — frame.md 写入后注入权重指令

**Objective:** frame.md 写入后，读取 control_profile，注入权重执行指令。

**Files:**
- Modify: `hooks/on_post_tool_call.py` — `_handle_frame_md()` 扩展
- Test: `tests/test_frame_md_hook_weights.py` (新建)

**Step 1: Write failing test**

测试 `_handle_frame_md` 在 frame.md 含 control_profile 时，注入的消息包含权重指令。用 mock ctx。

```python
# tests/test_frame_md_hook_weights.py
def test_frame_md_with_control_profile_injects_weight_directive(tmp_path):
    frame_md = tmp_path / "frame.md"
    frame_md.write_text(textwrap.dedent("""\
        ---
        colors:
          primary: "#1a1a2e"
        control_profile:
          weights:
            creative_autonomy: 0.85
            restraint_force: 0.9
            atmosphere_density: 0.2
            motion_dynamism: 0.5
            weapon_reliance: 0.3
        ---
        # Frame
        """), encoding="utf-8")
    ctx = MockCtx()
    _handle_frame_md(ctx, str(frame_md))
    injected = ctx.injected_messages
    assert any("creative_autonomy" in m for m in injected)
    assert any("0.85" in m for m in injected)
```

**Step 2: Run → FAIL**
**Step 3: Modify `_handle_frame_md`** — 在现有 LLM 质量检查后，加 `ControlProfile.from_frame_md()` 读取，有 profile 就调用 `render_directive()`，追加到注入消息。
**Step 4: Run → PASS**
**Step 5: Commit** `feat(v0.14): Hook 1 frame.md 权重指令注入`

---

### Task B2: Hook 2 — expanded-prompt.md 权重一致性检查

**Objective:** expanded-prompt.md 写入后，对照 control_profile 做五行一致性检查，注入检查结果。

**Files:**
- Create: `core/restraint_audit.py`
- Modify: `hooks/on_post_tool_call.py` — `_handle_expanded_prompt()` 扩展
- Test: `tests/test_restraint_audit.py`

**Step 1: Write failing tests for restraint_audit**

```python
# tests/test_restraint_audit.py
from core.restraint_audit import audit_weight_consistency, ConsistencyIssue

def test_low_density_but_many_atmosphere_layers_flags_p2():
    """atmosphere_density=0.2 但 expanded-prompt 有 5 层氛围 → P2"""
    cp = ControlProfile(weights=Weights(atmosphere_density=0.2))
    expanded = "BG: particle-field, grid-lines, gradient-shift, radial-glow, light-leak"
    issues = audit_weight_consistency(cp, expanded_prompt=expanded)
    assert any(i.code == "atmosphere_density_mismatch" and i.severity == "P2" for i in issues)

def test_matching_density_no_warning():
    cp = ControlProfile(weights=Weights(atmosphere_density=0.3))
    expanded = "BG: grid-lines, gradient-shift"  # 2层 = floor(0.3*7)
    issues = audit_weight_consistency(cp, expanded_prompt=expanded)
    assert not any(i.code == "atmosphere_density_mismatch" for i in issues)

def test_high_weapon_reliance_but_all_handwrite():
    """weapon_reliance=0.8 但 Manifest 全标 HANDWRITE → P2"""
    cp = ControlProfile(weights=Weights(weapon_reliance=0.8))
    expanded = "## Execution Manifest\nscene1: HANDWRITE\nscene2: HANDWRITE\nscene3: HANDWRITE"
    issues = audit_weight_consistency(cp, expanded_prompt=expanded)
    assert any(i.code == "weapon_reliance_mismatch" for i in issues)

def test_no_control_profile_returns_empty():
    """没有 control_profile → 不检查（向后兼容）"""
    issues = audit_weight_consistency(None, expanded_prompt="anything")
    assert issues == []

def test_p2_issues_require_explanation_field():
    """P2 issue 有 requires_explanation=True"""
    cp = ControlProfile(weights=Weights(atmosphere_density=0.2))
    expanded = "BG: a, b, c, d, e"
    issues = audit_weight_consistency(cp, expanded_prompt=expanded)
    for i in issues:
        if i.severity == "P2":
            assert i.requires_explanation is True
```

**Step 2: Run → FAIL**

**Step 3: Implement `core/restraint_audit.py`**

```python
# core/restraint_audit.py
"""权重一致性审计 — 五行权重 vs 实际产出的匹配检查."""
from dataclasses import dataclass
from core.control_profile import ControlProfile
import re

@dataclass(frozen=True)
class ConsistencyIssue:
    code: str
    severity: str  # P2 | P3
    message: str
    requires_explanation: bool = False

def audit_weight_consistency(cp: ControlProfile | None,
                              expanded_prompt: str = "") -> list[ConsistencyIssue]:
    if cp is None:
        return []
    issues: list[ConsistencyIssue] = []
    w = cp.weights
    # 火: atmosphere_density vs 实际氛围层数
    layer_count = _count_atmosphere_layers(expanded_prompt)
    cap = w.atmosphere_layer_cap()
    if layer_count > cap + 1:
        issues.append(ConsistencyIssue(
            code="atmosphere_density_mismatch", severity="P2",
            message=f"atmosphere_density={w.atmosphere_density} 建议上限{cap}层，"
                    f"但 expanded-prompt 检测到{layer_count}层。请解释或削减。",
            requires_explanation=True))
    # 土: weapon_reliance vs HANDWRITE 比例
    hw_ratio = _handwrite_ratio(expanded_prompt)
    if w.weapon_reliance > 0.7 and hw_ratio > 0.5:
        issues.append(ConsistencyIssue(
            code="weapon_reliance_mismatch", severity="P2",
            message=f"weapon_reliance={w.weapon_reliance} 但 HANDWRITE 比例={hw_ratio:.0%}。"
                    f"高依赖应多用武器，请解释为何大量裸写。",
            requires_explanation=True))
    # 金: restraint_force vs surprise 数量
    surprise_count = len(re.findall(r'\bsurprise\b', expanded_prompt, re.IGNORECASE))
    if w.restraint_force > 0.7 and surprise_count > 2:
        issues.append(ConsistencyIssue(
            code="restraint_force_mismatch", severity="P2",
            message=f"restraint_force={w.restraint_force}（克制倾向）但检测到"
                    f"{surprise_count}个 surprise。克制高时建议≤1。",
            requires_explanation=True))
    return issues

_ATMOSPHERE_KEYWORDS = ["particle", "grid-line", "gradient", "glow", "light-leak",
                          "noise", "bokeh", "vignette", "shimmer", "aura", "haze"]

def _count_atmosphere_layers(text: str) -> int:
    return sum(1 for kw in _ATMOSPHERE_KEYWORDS
               if re.search(kw, text, re.IGNORECASE))

def _handwrite_ratio(text: str) -> float:
    manifest = re.findall(r'scene\d+:?\s*(\w+)', text, re.IGNORECASE)
    if not manifest:
        return 0.0
    hw = sum(1 for m in manifest if "handwrite" in m.lower())
    return hw / len(manifest)
```

**Step 4: Run → PASS (restraint_audit tests)**
**Step 5:** Modify `_handle_expanded_prompt` 调用 `audit_weight_consistency`，注入检查结果。
**Step 6: Run → PASS (hook test)**
**Step 7: Commit** `feat(v0.14): Hook 2 权重一致性检查 + restraint_audit`

---

### Task B3: caution_motion 向后兼容（forbidden_motion → caution）

**Objective:** taste block 从 forbidden_motion（开关）改为 caution_motion（权重），glow 移出 motion 管辖。旧 frame.md 的 forbidden_motion 自动转为高 caution 值。

**Files:**
- Modify: `core/taste_audit.py`
- Modify: `core/control_profile.py` — 加 caution_motion 解析
- Test: `tests/test_control_profile.py` (append), `tests/test_taste_audit.py` (append)

**Step 1: Write failing tests**

```python
# test caution_motion parsing
def test_parse_caution_motion_from_frame_md():
    md = textwrap.dedent("""\
        ---
        taste:
          caution_motion:
            generic slide-in: 0.8
            glow: 0.1
            slow_fade: 0.5
        ---
        """)
    cp = ControlProfile.from_frame_md(md)
    assert cp is not None
    assert cp.caution_motion["generic slide-in"] == 0.8
    assert cp.caution_motion["glow"] == 0.1

# test backward compat: forbidden_motion → high caution
def test_old_forbidden_motion_becomes_high_caution():
    md = textwrap.dedent("""\
        ---
        taste:
          forbidden_motion:
            - generic slide-in
            - random bounce
        ---
        """)
    cp = ControlProfile.from_frame_md(md)
    assert cp.caution_motion["generic slide-in"] >= 0.8
    assert cp.caution_motion["random bounce"] >= 0.8

# test glow NOT flagged by motion audit
def test_glow_not_flagged_by_motion_caution():
    """glow=0.1 应该通过 motion 审计（低 caution = 放开）"""
    md = "...\ntaste:\n  caution_motion:\n    glow: 0.1\n"
    cp = ControlProfile.from_frame_md(md)
    issues = audit_taste_motion(cp, "scene: glow effect on title")
    assert not any("glow" in i.message for i in issues)
```

**Step 2: Run → FAIL**
**Step 3:** 在 ControlProfile 加 `caution_motion: dict[str, float]` 字段 + 解析逻辑（同时处理新格式 `caution_motion:` 和旧格式 `forbidden_motion:` 列表）。
**Step 4:** Modify `taste_audit.py` — motion 相关检查改为读 `caution_motion`，glow 在 caution < 0.3 时不告警。
**Step 5: Run → PASS**
**Step 6: Commit** `feat(v0.14): caution_motion 权重化 + forbidden_motion 向后兼容`

---

## Phase C: Quality Audit 接线

### Task C1: 权重一致性检查接入 quality_audit

**Objective:** `audit_project()` 新增权重一致性检查，与现有 taste 接线同样的方式。

**Files:**
- Modify: `core/quality_audit.py` — `audit_project()` 加 `_audit_weight_consistency()`
- Test: `tests/test_quality_audit_weight_bridge.py`

**Step 1: Write failing test**

```python
def test_quality_audit_flags_atmosphere_density_mismatch(tmp_path):
    # 构造 frame.md with atmosphere_density=0.2
    # 构造 expanded-prompt.md with 6 层氛围
    # 跑 audit_project()
    # 断言 issues 里有 weight_consistency / atmosphere_density_mismatch
```

**Step 2: Run → FAIL**
**Step 3:** 在 `audit_project()` 的 `_audit_taste` 之后加 `_audit_weight_consistency(project_dir, frame_md, expanded_prompt)`。
**Step 4: Run → PASS**
**Step 5: Commit** `feat(v0.14): quality_audit 接入权重一致性检查`

---

### Task C2: 全量回归测试

**Objective:** 确保权重系统改动不破坏现有 432 个测试。

**Run:** `cd F:/hyperframes/framepack-plugin && python -m pytest tests/ -q`
**Expected:** 432 + 新增 tests passed, 1 skipped

如有失败，修复。全部通过后：
**Commit** `test(v0.14): 全量回归通过`

---

## Phase D: Skill 更新——试菜流程

### Task D1: director skill 加 Phase 0.5 试菜流程

**Objective:** director SKILL.md 新增试菜环节的完整指引，framepack-director skill 教 Agent 怎么试菜、怎么填 control_profile。

**Files:**
- Modify: `skills/framepack-director/SKILL.md` — 加 Phase 0.5 章节
- Modify: `skills/framepack-director/references/visual-styles.md` — 加 Kinetic Tech 风格 + 匹配度说明

**内容要点（SKILL.md 新增章节）：**

```markdown
## Phase 0.5: 试菜（Tasting）

在素材收集后、写 frame.md 前，做一次自我感知。

### 怎么试菜

1. 读用户素材 + 创意意图 + 内容气质
2. 问自己四个问题（诚实，不高估）：
   - 这个内容的气质我理解吗？→ content_understanding
   - 我对配色有信心吗？→ color_confidence
   - 我对节奏有把握吗？→ rhythm_confidence
   - 我的克制直觉够吗？→ restraint_instinct
3. 基于自评，填五行权重：
   - 木 creative_autonomy：自评高 → 自主度高
   - 金 restraint_force：克制直觉高 → 克制力高
   - 火 atmosphere_density：默认低（0.3），有把握才加
   - 水 motion_dynamism：按内容气质定
   - 土 weapon_reliance：节奏/转场信心低 → 武器兜底

### 五行相生相克（必读）

[插入相生相克图 + 三版实验的权重表]

### 展示给用户

"我对这个内容的把握：[自评]。基于这个把握，我的五行权重是：[权重]。
你觉得需要调整吗？"
```

**Commit** `feat(v0.14): director skill 试菜流程 + 五行权重指引`

---

### Task D2: guardrails.md 更新

**Objective:** guardrails.md（产品规则源头）加入权重系统规则，Guardrail Hydrator 会自动同步到项目 AGENTS.md。

**Files:**
- Modify: `guardrails.md`

**新增内容：**
- Phase 0.5 试菜 + 五行权重的产品规则
- forbidden_motion → caution_motion 的语义修正说明
- 权重一致性检查 = P2 不阻断 + 要求解释

**Commit** `feat(v0.14): guardrails 权重系统规则`

---

## Phase E: Sprite Forge Skill

### Task E1: 后处理脚本 process_sprite.py（TDD）

**Objective:** 从 agent-sprite-forge 移植核心后处理函数，适配 Framepack 工作目录。

**Files:**
- Create: `skills/framepack-sprite-forge/scripts/process_sprite.py`
- Test: `tests/test_sprite_postprocess.py`

**Step 1: Write failing tests** — 用 Pillow 程序化生成测试图（品红背景 + 几何图形），验证去背景/切帧/对齐。

```python
# tests/test_sprite_postprocess.py
from PIL import Image
import numpy as np
from skills.framepack_sprite_forge.scripts.process_sprite import (
    remove_bg_magenta, split_grid, center_single_sprite)

def _make_test_sheet(rows=2, cols=2, cell=100):
    """生成 2×2 品红背景 + 白色方块测试图"""
    img = Image.new("RGB", (cols*cell, rows*cell), (255, 0, 255))
    arr = np.array(img)
    for r in range(rows):
        for c in range(cols):
            y, x = r*cell+25, c*cell+25
            arr[y:y+50, x:x+50] = 255  # 白色方块
    return Image.fromarray(arr)

def test_remove_bg_magenta_produces_transparent():
    sheet = _make_test_sheet()
    result = remove_bg_magenta(sheet, threshold=30)
    assert result.mode == "RGBA"
    arr = np.array(result)
    # 品红区域应变透明（alpha=0）
    assert arr[0, 0, 3] == 0  # 左上角 = 品红背景 → 透明
    # 白色方块区域应不透明（alpha=255）
    assert arr[25, 25, 3] == 255

def test_split_grid_returns_correct_count():
    sheet = _make_test_sheet(rows=3, cols=4)
    frames = split_grid(sheet, rows=3, cols=4)
    assert len(frames) == 12
    assert frames[0].size == (100, 100)

def test_center_single_sprite_aligns_offset():
    """角色偏左上的帧 → 居中"""
    frame = Image.new("RGBA", (100, 100), (0, 0, 0, 0))
    arr = np.array(frame)
    arr[10:30, 10:30] = [255, 255, 255, 255]  # 方块在左上
    centered = center_single_sprite(Image.fromarray(arr), cell_size=100)
    result_arr = np.array(centered)
    # 居中后方块应在 25-45 区域
    assert result_arr[35, 35, 3] == 255
```

**Step 2: Run → FAIL**
**Step 3:** 从 agent-sprite-forge 源码提取 `remove_bg_magenta`, `clean_edges`, `split_grid`, `center_single_sprite`, `compose_sheet`, `save_transparent_gif`，砍掉 prompt 生成和 Codex 专属逻辑。
**Step 4: Run → PASS**
**Step 5: Commit** `feat(v0.14): sprite-forge 后处理脚本 process_sprite.py`

---

### Task E2: make_layout_guide.py 移植

**Objective:** 布局参考图生成器，原样移植（纯 Pillow，零外部依赖）。

**Files:**
- Create: `skills/framepack-sprite-forge/scripts/make_layout_guide.py`
- Test: `tests/test_sprite_layout_guide.py`

**Step 1: Write failing test**

```python
def test_make_layout_guide_generates_png(tmp_path):
    from skills.framepack_sprite_forge.scripts.make_layout_guide import make_guide
    out = tmp_path / "guide.png"
    make_guide(rows=2, cols=2, cell_size=384, output=str(out))
    assert out.exists()
    img = Image.open(out)
    assert img.size == (768, 768)  # 2×384
```

**Step 2: Run → FAIL**
**Step 3:** 从源码移植，适配路径。
**Step 4: Run → PASS**
**Step 5: Commit** `feat(v0.14): sprite-forge 布局参考图生成器`

---

### Task E3: prompt-rules.md 知识库 + sheet-modes.md

**Objective:** 从 agent-sprite-forge 的 SKILL.md + prompt-rules 提炼生图 prompt 工程规则。

**Files:**
- Create: `skills/framepack-sprite-forge/references/prompt-rules.md`
- Create: `skills/framepack-sprite-forge/references/sheet-modes.md`

**内容：** 品红背景/精确网格/角色居中/帧间一致/单动作族/风格关键词的硬约束规则 + 素材类型/动作/网格推断指南。

**Commit** `feat(v0.14): sprite-forge prompt 规则知识库`

---

### Task E4: sprite-forge SKILL.md 主入口

**Objective:** sprite-forge skill 的完整工作流指引。

**Files:**
- Create: `skills/framepack-sprite-forge/SKILL.md`
- Create: `skills/framepack-sprite-forge/templates/sprite-prompt-output.md`

**内容：**
- Step A（出图纸）→ Step B（用户外出生图）→ Step C（裁切装订）三步流程
- 参数推断指南（类型/动作/网格/风格/视角）
- CLI 接口说明（process_sprite.py process --input ... --rows ... --cols ...）
- 与 sprite-animation 武器的衔接说明

**Commit** `feat(v0.14): sprite-forge SKILL.md 主入口 + 输出模板`

---

### Task E5: 在 builtin_weapons.py 注册 sprite-forge 衔接

**Objective:** 确保 sprite-animation 武器参数能感知 sprite-forge 产出的素材路径。

**Files:**
- Modify: `core/builtin_weapons.py` — sprite-animation 的 params 加 `spriteUrl` 字段说明

**Commit** `feat(v0.14): sprite-animation 武器参数衔接 sprite-forge 产出`

---

## Phase F: 版本同步 + 部署

### Task F1: 版本号 bump 0.12.0 → 0.14.0

**Objective:** 全量版本同步（22+ 文件 35+ 处），含 changelog。

**Files (同步范围):**
- `plugin.yaml` — version + changelog
- `__init__.py` — version
- `hooks/` — version 引用
- `core/` — version 引用
- `skills/` × 7+1(sprite-forge) — version
- `templates/` — version
- `scripts/tests/` — version 断言
- `README.md` — version + changelog
- `AGENTS.md` — version（通过 guardrails hydrator）
- `docs/` — version

**技巧:** 先更新版本同步测试的断言（RED）→ 批量替换所有文件 → 跑同步测试验证（GREEN）。保护 changelog 历史版本引用不被误改。

**Commit** `release(v0.14.0): 版本号全量同步`

---

### Task F2: 部署同步（content hash）

**Objective:** 源码目录 → 部署目录（`F:/Hermes_windows/plugins/framepack/`），用 md5 content hash 对比，不用 file size。

**Step 1:** 全量复制 .py/.md/.yaml/.json 文件
**Step 2:** md5 对比验证 0 mismatch
**Step 3:** 部署目录跑 `pytest tests/ -q` → 全过

**Commit** `deploy(v0.14.0): 部署同步 content hash 双确认`

---

### Task F3: 更新 CONTEXT.md 交接台

**Objective:** `.hermes/CONTEXT.md` 更新 v0.14 状态。

**Commit** `docs(v0.14.0): 交接台更新`

---

## 风险与缓解

| 风险 | 缓解 |
|------|------|
| Agent 不会"试菜"（弱模型） | 默认权重兜底，最多回到当前铁轨水平 |
| forbidden_motion → caution_motion 破坏旧项目 | 向后兼容：旧格式自动转高 caution 值 |
| sprite-forge 后处理依赖品红背景 | prompt-rules.md 强调硬约束 + QC 报告检测 |
| 版本号漂移 | 同步测试断言先行（RED→GREEN） |

## 执行顺序

Phase A → B → C → D 可以串行（权重系统核心）。
Phase E（sprite-forge）与 D 并行（独立 skill，不依赖权重系统）。
Phase F 最后（版本同步 + 部署）。

预计 Task 总数：~18 个 bite-sized tasks。
