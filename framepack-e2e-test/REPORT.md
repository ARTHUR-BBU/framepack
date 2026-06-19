# Framepack v0.14.0 端到端实战测试报告

- 测试日期: 2026-06-19
- 被测版本: Framepack v0.14.0 (`F:/hyperframes/framepack-plugin/plugin.yaml`)
- 环境: Windows 10, Python 3.14.2, Pillow 12.1.0, numpy 2.4.2
- 测试原则: **只测不改**, 发现问题写报告不改代码
- 测试脚本目录: `F:/hyperframes/framepack-e2e-test/`
  - `test1_control_profile.py` — ControlProfile 解析 + render_directive
  - `test2_weight_audit.py` — 权重一致性检查
  - `test3_caution_compat.py` — caution_motion 向后兼容
  - `test4_quality_audit.py` — quality_audit 完整管线
  - `test5_sprite_forge.py` — Sprite Forge 脚本运行
  - `test6_hook_wiring.py` — Hook 接线验证
  - `test7_edge_probes.py` — 边界条件与代码气味探查

## 总览

| 测试 | 内容 | 结果 |
|------|------|------|
| 1 | ControlProfile 解析 + render_directive 端到端 | **PASS** |
| 2 | 权重一致性检查端到端 | **PASS** |
| 3 | caution_motion 向后兼容 | **PASS** |
| 4 | quality_audit 完整管线 | **PASS** |
| 5 | Sprite Forge 脚本运行 | **PASS** (含 1 项发现) |
| 6 | Hook 接线验证 | **PASS** |
| - | 边界/代码气味探查 | 无功能 bug, 2 项代码气味, 1 项文档与实现轻微不一致 |

**结论: v0.14.0 五行权重系统 + Sprite Forge 核心功能全部按设计工作, 无阻断性 bug。**
发现 3 个非阻断的小问题, 详见"发现的问题"章节。

---

## 测试 1: ControlProfile 解析 + render_directive 端到端 — PASS

### 输入 frame.md (节选)
```yaml
control_profile:
  weights:
    creative_autonomy: 0.9    # high 档
    restraint_force: 0.5      # medium 档
    atmosphere_density: 0.85  # high 档, cap=floor(0.85*7)=5
    motion_dynamism: 0.2      # low 档
    weapon_reliance: 0.5      # medium 档
  self_assessment:
    content_understanding: 0.7
    color_confidence: 0.6
    rhythm_confidence: 0.5
    restraint_instinct: 0.8
  caution_motion:
    glow: 0.5
    shake: 0.8
```

### 解析结果
```
weights           = Weights(creative_autonomy=0.9, restraint_force=0.5,
                           atmosphere_density=0.85, motion_dynamism=0.2,
                           weapon_reliance=0.5)
self_assessment   = SelfAssessment(content_understanding=0.7, color_confidence=0.6,
                                   rhythm_confidence=0.5, restraint_instinct=0.8)
caution_motion    = {'glow': 0.5, 'shake': 0.8}
atmosphere_layer_cap() = 5   (= floor(0.85*7), 符合设计)
```

### render_directive() 全文
```
## 五行权重指令（自动生成，来自你的 control_profile）

木 creative_autonomy=0.9: 信任你的创意判断，可以自主选择风格、混合独特元素，不必拘泥风格库。
金 restraint_force=0.5: 中庸克制力——适度即可，但警惕过度堆砌。
火 atmosphere_density=0.85: 氛围密度高，层数上限约5层，可以铺多层氛围。
水 motion_dynamism=0.2: 动作张力低，保持沉稳/平静的节奏，用 drift、fade 这类温和动词。
土 weapon_reliance=0.5: 中庸武器依赖——武器和裸写搭配使用。

以上指令基于你试菜后的自评权重，请在后续阶段遵循。
```

### 验证项 (全部 PASS)
- 五行元素标注 木/金/火/水/土 全部出现 ✓
- 氛围层数上限 `5` (= floor(0.85 × 7)) 出现在指令 ✓
- creative_autonomy=0.9 走 high 档 ("信任你的创意判断") ✓
- motion_dynamism=0.2 走 low 档 ("保持沉稳/平静的节奏") ✓
- restraint_force=0.5 / weapon_reliance=0.5 走 medium 档 ✓
- atmosphere_density=0.85 走 high 档 ("氛围密度高") ✓

### 评估
指令文本清晰、可执行。每条都给出"五行元素 + 权重名 + 数值 + 具体行为建议"三件套,
Agent 拿到能直接对照执行。三档阈值 (high >0.7, low <0.3, medium 中间) 边界经探查 1
验证为严格 `>0.7` / `<0.3`。

---

## 测试 2: 权重一致性检查端到端 — PASS

### 输入
- `frame.md`: `atmosphere_density=0.2, weapon_reliance=0.9, restraint_force=0.8`
- `expanded-prompt.md` (故意不匹配):
  - 6 个氛围关键词 (particle / glow / gradient / noise / bokeh / vignette)
  - 4 个 scene 全 HANDWRITE
  - 4 个 "surprise"

### 检测到的 3 个 issue (全部 P2, 全部 requires_explanation=True)

**Issue 1 — atmosphere_density_mismatch (P2)**
```
atmosphere_density=0.2 建议上限约1层，但 expanded-prompt 检测到6层。
请在 expanded-prompt.md 里解释为何超出，或削减层数。
```

**Issue 2 — weapon_reliance_mismatch (P2)**
```
weapon_reliance=0.9（高依赖）但 HANDWRITE 比例=100%。
高依赖应多用武器兜底，请解释为何大量裸写。
```

**Issue 3 — restraint_force_mismatch (P2)**
```
restraint_force=0.8（克制倾向）但检测到4个 surprise。
克制高时建议 ≤1 个 surprise，请解释。
```

### 验证项 (全部 PASS)
- 3 个期望 issue 全部检出 ✓
- 全部 severity = `P2` ✓
- 全部 `requires_explanation=True` ✓
- 全部 message 含"解释"字样 ✓

---

## 测试 3: caution_motion 向后兼容 — PASS

### 新旧格式解析结果对比

| 场景 | 输入 | 解析后 caution_motion |
|------|------|----------------------|
| A 新格式 | `caution_motion: {glow: 0.5, shake: 0.8}` | `{glow: 0.5, shake: 0.8}` |
| B 旧格式 | `forbidden_motion: [glow, shake]` | `{glow: 0.9, shake: 0.9}` |
| C 混合 | `caution_motion: {glow: 0.3}` + `forbidden_motion: [shake]` | `{glow: 0.3, shake: 0.9}` |

### 验证项 (全部 PASS)
- B 旧格式 `forbidden_motion` 自动转 `0.9` 高谨慎度 ✓
- C 混合场景: 显式 `caution_motion` 值胜出 (glow=0.3), 仅 forbidden 独有的项走 0.9 默认 ✓
- 越界值 clamp 正常 (探查 8: `glow: 1.5 → 1.0`, `shake: -0.3 → 0.0`) ✓

向后兼容设计合理: 新格式优先, 旧格式降级映射不丢失信息。

---

## 测试 4: quality_audit 完整管线 — PASS

### 输入 (tempdir 最小项目)
```
<tmp>/
├── frame.md                          # 含 control_profile, weights 故意设紧约束
└── .hyperframes/
    └── expanded-prompt.md            # 故意不匹配 (6 层氛围 + 全 HANDWRITE + 4 surprise)
```

### audit_project() 结果
```
共返回 7 个 issue, summary = {'P0': 1, 'P1': 1, 'P2': 5, 'P3': 0}
```
(P0/P1 来自 arsenal_missing / manifest 相关检查, 因为最小项目没有 arsenal.json,
属于预期噪声, 不是权重子系统的问题。)

### 权重一致性 issue (3 个, 全部 P2)
```
[code=atmosphere_density_mismatch] severity=P2
  path = <tmp>/.hyperframes/expanded-prompt.md
  details = {'requires_explanation': True}
  message = atmosphere_density=0.2 建议上限约1层，但 expanded-prompt 检测到6层...

[code=weapon_reliance_mismatch] severity=P2
  details = {'requires_explanation': True}
  message = weapon_reliance=0.9（高依赖）但 HANDWRITE 比例=100%...

[code=restraint_force_mismatch] severity=P2
  details = {'requires_explanation': True}
  message = restraint_force=0.8（克制倾向）但检测到4个 surprise...
```

### 验证项 (全部 PASS)
- `_audit_weight_consistency()` 成功把 `ConsistencyIssue` 桥接为 `QualityIssue` ✓
- 3 个权重 issue 出现在 `report.issues` 里 ✓
- severity 全部 `P2` ✓
- `details.requires_explanation=True` 元信息完整透传 ✓

---

## 测试 5: Sprite Forge 脚本运行 — PASS (含 1 项发现)

### 测试 sprite sheet 生成
用 Pillow 生成 800×400 (2 行 × 4 列) 测试 sheet:
- 背景: 纯品红 `#FF00FF` (255, 0, 255)
- 8 个 cell, 每格 200×200, 中央 60% 区域填不同色块 (留 20% 品红边距)
- 文件: `F:/hyperframes/framepack-e2e-test/sprite-work/raw-sheet.png`

### process_sprite.py process 命令输出
```
命令: python process_sprite.py process --input raw-sheet.png \
       --rows 2 --cols 4 --output-dir processed --cell-size 200 --fps 8
exit code: 0
stdout: Wrote F:\...\processed\sheet-transparent.png
```

### 产出文件清单 (全部生成成功)
| 文件 | 大小 | 状态 |
|------|------|------|
| `sheet-transparent.png` | 2040 B | OK |
| `frame_01.png` … `frame_08.png` | 476-490 B | 8 帧全部 OK |
| `animation.gif` | 5329 B | OK |

### 透明性验证 (numpy 实测 sheet-transparent.png)
```
尺寸        : (800, 400)
总像素      : 320000
透明 (a=0)  : 202904  (63.4%)   ← 品红背景被色键成功移除
不透明 (a=255): 117096  (36.6%) ← sprite 色块完整保留
frame_01.png: has_transparent=True, has_opaque=True
```

### make_layout_guide.py 输出
```
命令: python make_layout_guide.py --rows 2 --cols 4 --cell-size 200 --output layout-guide.png
exit code: 0
stdout: Wrote F:\...\layout-guide.png
layout-guide.png 尺寸: (800, 400)  (与预期一致)
```

### 验证项 (全部 PASS)
- `process_sprite.py process` exit=0 ✓
- 裁切出 8 帧 ✓
- 透明 PNG 真正透明 (63.4% 像素 alpha=0) ✓
- `make_layout_guide.py` 生成布局参考图, 尺寸正确 ✓

### ⚠️ 发现 1 (非阻断, 文档/实现轻微不一致)
> `SKILL.md` 与 `references/prompt-rules.md` 描述后处理流程包含 **"QC"**
> ("后处理 QC 会报警，Agent 据此提示用户哪条规则被破坏"),
> 但 `process_sprite.py` 实际只输出一行 `Wrote <path>`,
> **不生成任何 QC 报告文件, 也不在 stdout 输出 QC 内容**。
>
> 色键失败 (例如背景不是品红) 时脚本不会报错或警告, 只会产出一张几乎全透明的图。
> 任务书"QC 报告正常"这一验收点在脚本层未独立存在 — 已验证脚本本身能正常跑完,
> 但"QC 报告"在 v0.14.0 的脚本实现里是概念性的, 不是可观察的输出。

---

## 测试 6: Hook 接线验证 — PASS

### 6.A `_build_weight_directive()` 注入文本全文
输入: 带 `control_profile` 的 frame.md (creative_autonomy=0.6, restraint_force=0.45,
atmosphere_density=0.3, motion_dynamism=0.7, weapon_reliance=0.85)

返回非空字符串, 全文:
```
## 五行权重指令（自动生成，来自你的 control_profile）

木 creative_autonomy=0.6: 中庸自主度——可自主但建议参考风格库验证。
金 restraint_force=0.45: 中庸克制力——适度即可，但警惕过度堆砌。
火 atmosphere_density=0.3: 中庸氛围密度，层数上限约2层。
水 motion_dynamism=0.7: 中庸动作张力——动静搭配。
土 weapon_reliance=0.85: 武器依赖度高，每个场景尽量用武器库兜底，HANDWRITE 需要理由。

以上指令基于你试菜后的自评权重，请在后续阶段遵循。
```

### 6.B `_build_weight_consistency_report()` 报告全文
输入: mismatch 的 frame.md + expanded-prompt。返回非空, 全文:
```
## 五行权重一致性检查（P2，需要解释）

- [P2] atmosphere_density=0.2 建议上限约1层，但 expanded-prompt 检测到6层。请在 expanded-prompt.md 里解释为何超出，或削减层数。
- [P2] weapon_reliance=0.9（高依赖）但 HANDWRITE 比例=100%。高依赖应多用武器兜底，请解释为何大量裸写。
- [P2] restraint_force=0.8（克制倾向）但检测到4个 surprise。克制高时建议 ≤1 个 surprise，请解释。

请在 expanded-prompt.md 里对以上每项做出解释，或调整你的产出。
```

### 6.C 向后兼容
- 旧 frame.md (无 `control_profile`): `_build_weight_directive` → `None` ✓
- 旧 frame.md (无 `control_profile`): `_build_weight_consistency_report` → `None` ✓

### 验证项 (全部 PASS)
- directive 非 None, 含五行 木/金/火/水/土, 含 `control_profile` 提示 ✓
- report 非 None, 含 `P2` / `解释`, 三个 mismatch 项齐全 ✓
- 旧 frame.md 两个函数都返回 None (向后兼容) ✓

---

## 边界条件与代码气味探查

### 探查 1: 三档阈值边界 (PASS)
- `creative_autonomy=0.69` → 非 high; `=0.7` → 非 high (严格 `>0.7`); `=0.71` → high ✓
- 阈值是严格不等式, 边界值 0.7 落在 medium 档, 行为符合代码意图。

### 探查 2: mismatch 触发阈值 (PASS)
- `weapon_reliance=0.7 + 100% HANDWRITE` → 不触发 (需 `>0.7`) ✓
- `restraint_force=0.7 + 3 surprise` → 不触发 (需 `>0.7`) ✓

### 探查 3: atmosphere 容差 (PASS)
- `density=0.2 (cap=1)`, 2 层 → 不触发 (容差 `cap+1=2`); 3 层 → 触发 ✓

### 探查 4: 代码气味 — `_ATMOSPHERE_KEYWORDS` 有重复项
> `core/restraint_audit.py` 第 87-91 行:
> ```python
> _ATMOSPHERE_KEYWORDS = [
>     "particle", "grid-line", "gradient", "glow", "light-leak",
>     "noise", "bokeh", "vignette", "shimmer", "aura", "haze",
>     "grid", "gradient", "shimmer",   # ← gradient / shimmer 重复
> ]
> ```
> **影响**: 无功能 bug。`_count_atmosphere_layers` 用 `set` 去重, 不会重复计数。
> **性质**: 代码气味 (列表里 14 项, 去重后 12 项)。建议清理但不阻断。

### 探查 5: grid-line / grid 去重逻辑 (PASS)
- 仅 `grid-line`: 1 层; 仅 `grid`: 1 层; 两者同现: 1 层 (grid 被 discard) ✓

### 探查 6: `_handwrite_ratio` 对连字符武器名的边界
> `_handwrite_ratio` 用正则 `scene\d+:?\s*(\w+)`, `\w` 不含连字符。
> 输入 `scene1: card-cascade-reveal` 时捕获到的 entry 是 `card` (被截断)。
> **影响**: HANDWRITE 计数仍准确 (HANDWRITE 无连字符), mismatch 触发判断不受影响;
> 但 ratio 的"分母 entries"语义略不精确 — 带连字符的武器名被截。
> **性质**: 边界语义瑕疵, 非阻断。

### 探查 7: control_profile 嵌在 YAML frontmatter 内 (PASS)
- 解析器用 `^\s*{block_name}:$` 匹配任意缩进, frontmatter 内嵌也能正确解析 ✓

### 探查 8: caution_motion 值越界 clamp (PASS)
- `glow: 1.5 → 1.0`, `shake: -0.3 → 0.0`, clamp 到 [0,1] ✓

---

## 发现的问题汇总 (只标不改)

### 🟡 发现 1: Sprite Forge 缺少可观察的 QC 报告输出 (非阻断)
- **位置**: `skills/framepack-sprite-forge/scripts/process_sprite.py`
- **现象**: SKILL.md / prompt-rules.md 描述后处理流程含 "QC 会报警",
  但脚本 stdout 仅输出 `Wrote <path>`, 不生成 QC 报告文件, 也不输出 QC 文本。
  色键失败时 (背景非品红) 脚本不报错, 只产出几乎全透明的图。
- **影响**: 任务书"QC 报告正常"验收点在脚本层无对应实现。
  Agent 无法从脚本输出得知生图是否违反 prompt-rules.md 的硬约束。
- **建议** (不改, 仅记录): 在 `run_pipeline` 末尾加一份 `qc-report.json`
  (记录透明像素比例、每帧 bbox、是否检测到品红残渣等), 或至少 stdout 打印一行 QC 摘要。

### 🟡 发现 2: `_ATMOSPHERE_KEYWORDS` 列表含重复项 (代码气味)
- **位置**: `core/restraint_audit.py:87-91`
- **现象**: `gradient` 和 `shimmer` 各出现 2 次。
- **影响**: 无 (set 去重)。仅代码气味。
- **建议** (不改, 仅记录): 去重列表。

### 🟡 发现 3: `_handwrite_ratio` 对连字符武器名截断 (边界语义瑕疵)
- **位置**: `core/restraint_audit.py:113` (`re.findall(r'scene\d+:?\s*(\w+)', ...)`)
- **现象**: `\w+` 不含连字符, `scene1: card-cascade-reveal` 被捕获为 `card`。
- **影响**: HANDWRITE 计数仍准, mismatch 触发判断不受影响;
  但当项目大量使用带连字符的武器名时, ratio 分母语义略偏。
- **建议** (不改, 仅记录): 正则改 `([\w-]+)` 以兼容连字符武器名。

---

## 最终结论

**Framepack v0.14.0 端到端实战测试: 6/6 主测试全部 PASS。**

1. 五行权重系统 (ControlProfile + render_directive + 三档文案 + 层数上限)
   完全按设计工作, 指令清晰可执行。
2. 权重一致性检查能稳定检出三类 P2 mismatch, message 全部含"解释"要求。
3. caution_motion 向后兼容正确: 旧 `forbidden_motion` 自动转 0.9, 新格式优先。
4. quality_audit 完整管线成功桥接权重检查, P2 issue 透传到 report。
5. Sprite Forge 色键/裁切/透明 PNG/GIF/布局参考图全部正常生成
   (唯一缺口: 无显式 QC 报告输出 — 见发现 1)。
6. Hook 接线 (`_build_weight_directive` / `_build_weight_consistency_report`)
   注入路径正确, 旧项目向后兼容返回 None。

发现的 3 个问题全部是非阻断的 (1 个文档/实现轻微不一致 + 2 个代码气味/边界瑕疵),
不影响 v0.14.0 的核心功能正确性。建议后续迭代处理, 本次测试不做代码修改。
