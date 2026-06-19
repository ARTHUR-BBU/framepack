# Framepack v0.14.0 多角度实战测试 — 总汇总报告

> 测试日期: 2026-06-19 | 6 命题 × 3 轮 × 6 个独立 subagent | 511 单元测试全绿 + 瑕疵修复后

---

## 一、测试矩阵总览

| 命题 | 测试角度 | 断言/探针数 | PASS | FAIL | 发现数 |
|------|----------|------------|------|------|--------|
| A | 五行权重端到端 + 相生相克验证 | 30 | 29 | 1(预期) | 3 |
| B | 向后兼容 + 版本迁移 | 22 硬契约 + 7 探针 | 22/22 | 0/7(印证) | 7 |
| C | 权重一致性审计深度测试 | 59 | 59 | 0 | 5 |
| D | Sprite Forge 完整管线 | 全轮通过 | - | - | 7 |
| E | Hook 神经通路真实模拟 | 10 基线 + 补充 | 10/10 | 0 | 2 |
| F | quality_audit 完整审计管线 | 71 | 71 | 0 | 3 |
| **合计** | | **~193** | **~191** | **~2** | **27** |

**核心结论：v0.14.0 功能可用、零阻断性 bug，但发现 1 个高危设计缺陷（E-1）和 1 个功能性 bug（B-7）需要尽快修复。**

---

## 二、按严重度分级的问题清单

### 🔴 高危（建议立即修复，2 项）

**1. [E-1] 权重神经通路被 LLM 质检硬耦合 — 静默断流**
- 位置：`hooks/on_post_tool_call.py` `_handle_frame_md` / `_handle_expanded_prompt`
- 现象：`_analyze_frame_md(ctx, content)` 返回 None 时（LLM 不可用/超时/限流/JSON 不可解析），函数提前 return，其后的权重注入块被整体跳过
- 影响：权重注入是纯本地计算（零 LLM 依赖），但任意一次 LLM 抖动就让整个 v0.14 权重特性对该次写入**静默失效**，无任何错误信号
- 根因：权重注入代码放在 `if analysis is None: return` 之后
- 建议：把权重注入从 `_analyze_*` 的早返回中解耦——先注入权重（纯本地），再做 LLM 质检

**2. [B-7] BLOCK-COLLISION — 跨块名匹配导致数据误迁移**
- 位置：`core/control_profile.py` `_extract_yaml_block`
- 现象：`_extract_yaml_block(text, 'forbidden_motion')` 按裸块名全文匹配第一个出现的 `forbidden_motion:` 行，不绑定 `control_profile` 父 YAML 上下文
- 实测复现：`frame.md` 同时含 `control_profile` 和 `taste.visual_physics.forbidden_motion` 时，taste 块的 motion 列表被误迁移进 `ControlProfile.caution_motion`
- 风险：SKILL.md 文档化了该嵌套结构（L293），非空想风险
- 建议：`_extract_yaml_block` 增加父块绑定或缩进约束

### 🟡 中等（建议下个迭代修复，9 项）

| # | 来源 | 问题 | 位置 |
|---|------|------|------|
| 3 | D-1 | 非品红底色键失效**静默通过**（0 透明却报 OK） | process_sprite.py |
| 4 | D-2 | 非正方形 cell 被强制压方、内容裁切丢失 | process_sprite.py |
| 5 | D-3 | QC 报告**不落盘**（仅 stdout 文本） | process_sprite.py |
| 6 | B-1 | caution_motion 迁移结果在 render_directive() 中**不可见** | control_profile.py |
| 7 | B-2 | 审计层**不消费** caution_motion | restraint_audit.py |
| 8 | B-4 | 缺失权重回退 0.5，但 Weights() 默认 atmosphere_density=0.4（两套语义） | control_profile.py |
| 9 | B-5 | forbidden_motion 误写为 dict 格式**静默吞掉整个 profile** | control_profile.py |
| 10 | C-1 | 裸 `sceneN:` 行（无武器名）跨行吞下一行首词，hw_ratio 被压到 0.0 | restraint_audit.py:113 |
| 11 | A-F1 | 相生相克在代码层完全未实现（文档承诺 vs 代码落差） | control_profile.py docstring |

### 🟢 低/信息级（可择机处理，16 项）

| # | 来源 | 问题 |
|---|------|------|
| 12 | C-2 | `surprises` 复数不被计数（漏报 restraint_force_mismatch） |
| 13 | C-3 | afterglow/glowing 等同源词虚增氛围层数（误报，P2 可解释兜底） |
| 14 | C-4 | `scene\d+` 无词首锚定，`obscene1:` 误匹配 |
| 15 | C-5 | 旧评论称连字符武器名「被截断」已过时（源码已修复） |
| 16 | D-4 | magenta_residue_ratio 仅识别品红残留 |
| 17 | D-5 | make_layout_guide 不支持非方格布局 |
| 18 | D-6 | QC transparent_ratio 是"居中后画布"比例 ≠ 原始色键透明率 |
| 19 | D-7 | 全空场景仍产出空帧/空 GIF |
| 20 | B-3 | 缺乏弃用/迁移引导日志 |
| 21 | B-6 | 无源文件升级工具（设计观察） |
| 22 | F-1 | `transforms?` 正则匹配 "transformation"，导致 motif 漏报 |
| 23 | F-2 | lint cache 裸码与原生 quality-audit code 命名空间冲突 |
| 24 | F-3 | 任务书 vs 源码命名漂移（_audit_param_drift vs _audit_parameter_drift） |
| 25 | A-F2 | 木(creative_autonomy)与水(motion_dynamism)无对应产出端审计 |
| 26 | A-F3 | 测试脚本 exit 1 是设计选择（非 bug） |
| 27 | E-2 | sanitizer 对中文权重文案是 no-op（确认正常） |

---

## 三、六大命题关键发现摘要

### 命题 A — 五行权重端到端（29/30 PASS）

端到端流程（解析→渲染→Hook注入→一致性审计）完全按设计工作。但"相生相克"在代码层是**隐喻不是约束**——五个权重是彻底正交的独立标量，无任何跨元素耦合。这在概念上可能是设计的，但文档措辞（"覆盖万控""V3死因"）容易让人误以为是计算约束。

### 命题 B — 向后兼容（22/22 硬契约 PASS）

核心迁移契约（旧 list→0.9、新 dict 优先、混合合并、clamp）功能正常。但 7 个探针暴露了迁移链路的**下游断层**：迁移出的 caution_motion 数据进了对象却在注入层断流（render_directive 不渲染）、审计层不消费、迁移完全静默。

### 命题 C — 一致性审计（59/59 PASS）

三个一致性检查（atmosphere/weapon_reliance/restraint_force）的**阈值逻辑全部正确**，无边界 bug。检测器在真实世界文本下有三处脆弱点：裸行跨行吞词（C-1）、复数漏报（C-2）、子串误报（C-3），均为非阻断。

### 命题 D — Sprite Forge（管线可用）

标准管线（去背/切帧/居中/清洗/重组/GIF/QC）端到端可用。threshold 参数对色键效果的影响方向正确且单调。但**非品红底色静默通过**是高危缺口（QC 无透明率下限检查），非正方形 cell 被强制压方导致内容裁切。

### 命题 E — Hook 神经通路（基线 10/10 PASS）

正常路径下五行权重指令和一致性报告都能正确到达 Agent 突触（ctx.inject_message）。但 LLM 宕机时**静默断流**——纯本地计算的权重注入不应受 LLM 可用性影响。

### 命题 F — quality_audit 主管线（71/71 PASS）

`audit_project()` 的 9 个 `_audit_*` 函数全部接线、条件触发正确、severity 映射正确、7 类边界/损坏输入全部 graceful。健康项目零 P0 阻断，report-first 设计达成"不打扰健康项目"目标。

---

## 四、建议修复优先级

```
立即修复（阻断核心特性可用性）
├── E-1: 权重注入从 _analyze_* 早返回中解耦
└── B-7: _extract_yaml_block 增加父块绑定

下个迭代（补全功能链路）
├── D-1: 非品红底色 → transparent_ratio < ε 告警
├── D-2: cell_size 支持 (w,h) 元组
├── D-3: QC 报告 --qc-report 落盘 JSON
├── B-1: render_directive 渲染 caution_motion
├── B-2: 审计层消费 caution_motion
├── C-1: 裸 sceneN: 行正则修复
└── A-F1: docstring 明确"相生相克为指导隐喻，非数值耦合"

择机处理（低优先级健壮性提升）
├── C-2/C-3/C-4: 检测器正则/词法优化
├── B-4/B-5: 默认值统一 + dict 格式校验
├── F-1/F-2: taste 正则 + 命名空间
└── D-4~D-7: Sprite Forge 健壮性增强
```

---

## 五、总体评价

**v0.14.0 是一个功能完整、设计合理的版本。** 193 项断言中 191 PASS，核心功能链路（五行权重解析→渲染→Hook注入→一致性审计→quality_audit主管线）在正常路径下全部可用。

最有价值的发现是 **E-1（LLM 耦合导致权重静默断流）**——这不是一个写代码时的低级错误，而是一个架构层面的耦合问题：纯本地计算的权重注入不应该依赖外部 LLM 调用的成功。这个发现证明了多角度实战测试的价值。

**三个确认没问题的领域：**
1. 五行权重的阈值逻辑和 cap 公式——精确无误
2. quality_audit 主管线 9 路审计——全接线、全 graceful
3. 向后兼容核心契约——22/22 硬断言通过

**报告文件：**
- A: `F:/hyperframes/framepack-e2e-test/reports/report-A-weight-flow.md`
- B: `F:/hyperframes/framepack-e2e-test/reports/report-B-backward-compat.md`
- C: `F:/hyperframes/framepack-e2e-test/reports/report-C-consistency-audit.md`
- D: `F:/hyperframes/framepack-e2e-test/reports/report-D-sprite-forge.md`
- E: `F:/hyperframes/framepack-e2e-test/reports/report-E-hook-pathway.md`
- F: `F:/hyperframes/framepack-e2e-test/reports/report-F-quality-audit.md`
- 汇总: `F:/hyperframes/framepack-e2e-test/reports/SUMMARY.md`（本文）
