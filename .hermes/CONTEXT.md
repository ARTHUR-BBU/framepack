# hyperframes 开发工程 — 工作交接台

> 新对话打开后，读完本文就能接上。
> 这不是历史日志，是当前手台；旧状态靠 Git 历史追溯。

## 当前状态

<!-- ⚠️ 此区块每次会话结束时整块替换。不要在上面追加。 -->

**阶段**: v0.14.1 已发版 ✅（v0.14.0 实战测试 → 9 瑕疵修复 → 版本 bump 完成）

**分支**: `main`
**源码版本**: plugin.yaml = 0.14.1 ✅
**测试**: 531 passed / 1 skipped ✅ 零回归（从 511 涨到 531，+20 回归测试）
**部署同步**: 源码与部署目录 204 文件 md5 全一致 ✅

### 实战测试结果（6 命题 × 3 轮 × 独立 subagent）

报告位置: `F:/hyperframes/framepack-e2e-test/reports/`
- report-A-weight-flow.md — 五行权重端到端
- report-B-backward-compat.md — 向后兼容+版本迁移
- report-C-consistency-audit.md — 一致性审计深度
- report-D-sprite-forge.md — Sprite Forge 管线
- report-E-hook-neural-pathway.md — Hook 神经通路
- report-F-quality-audit.md — quality_audit 主管线
- SUMMARY.md — 总汇总（27 个发现分级）

### 瑕疵修复进度（TDD 全流程）

| # | 等级 | 问题 | 测试数 | commit | 状态 |
|---|------|------|--------|--------|------|
| E-1 | 高危 | 权重注入被 LLM 质检耦合导致静默断流 | +3 | (E-1 commit) | ✅ |
| B-7 | 功能 | 跨块名误迁移 forbidden_motion | +2 | 7822f75 | ✅ |
| D-1 | 中危 | 非品红底色键失效静默通过 | +1 | 75408fb | ✅ |
| D-3 | 中危 | QC 报告不落盘 JSON | +1 | 75408fb | ✅ |
| D-2 | 中危 | 非正方形 cell 被强制压方 | +2 | 98ca8e2 | ✅ |
| B-1 | 中危 | render_directive 不渲染 caution_motion | +3 | c4cd361 | ✅ |
| B-2 | 中危 | 审计层不消费 caution_motion | +3 | c4cd361 | ✅ |
| **C-1** | 中危 | 裸 sceneN: 行正则跨行吞词 | +3 | 708307b | ✅ |
| **MED7** | 低 | docstring 明确相生相克为隐喻 | +2 | 708307b | ✅ |

## 瑕疵修复全部完成 ✅

9/9 瑕疵已修复，531 passed 零回归，部署同步。最后一轮（C-1+C-4+MED7）TDD 全流程：
- RED: 5 个失败测试（跨行吞词、词首锚定、隐喻缺失×2、uppercase IGNORECASE）
- GREEN: 正则 `\s*`→`[ \t]*` + 加 `\b`；Weights+模块 docstring 加隐喻说明
- 独立 reviewer subagent: passed=true，0 安全/逻辑问题
- 11 个 edge case 全通过（多裸 scene/tab/无冒号/大写/多位数字等）

## 已决策：bump 0.14.1 ✅

老田决策：bump 到 0.14.1（给瑕疵修复一个明确版本标签）。已完成：
- 23 文件版本引用同步，60 处替换
- 独立 reviewer 版本漂移审计：PASSED，0 阻断性发现
- 部署同步 204 文件 md5 全一致
- 全量回归 531 passed / 1 skipped

## 关键修复详情（已完成的）

### E-1（最有价值）
权重注入是纯本地计算（零 LLM 依赖），但被放在 `_handle_frame_md` / `_handle_expanded_prompt` 的 `_analyze_*()` 返回 None 的提前 return 之后。任何 LLM 抖动 → 权重特性静默失效。修复：权重注入移到分析调用之前 + 分析调用包 try/except。

### B-1 + B-2（同一通路两端）
caution_motion（向后兼容迁移的 forbidden_motion）进了 ControlProfile 对象，但：
- B-1: `render_directive()` 不渲染 → Agent 看不到 → 修复：五行之后追加 caution_motion 段落
- B-2: `audit_weight_consistency()` 不审计 → 高谨慎 motion 被使用无 issue → 修复：新增 caution_motion_violation 审计维度（P2）

### D-2
`center_single_sprite` 画布恒为正方形，sprite bbox 超过画布时硬裁。280x200 sprite 进 200x200 → 80px 被裁。修复：fit-in 缩放保留宽高比。

## 五行权重系统（v0.14 核心）

五个正交权重，相生相克涵盖所有创意控制（**注意：相生相克是隐喻不是硬约束，见 MED7**）：
- 木 creative_autonomy — 创意自主度
- 金 restraint_force — 克制力
- 火 atmosphere_density — 氛围密度
- 水 motion_dynamism — 动作张力
- 土 weapon_reliance — 武器依赖度

ControlProfile 默认权重: 全 0.5
render_directive(): high/low 分档生成行为指令

## 设计文档

- `F:/hyperframes/.hermes/designs/2026-06-19--v014-weight-control-system.md` — 权重控制系统设计
- `F:/hyperframes/.hermes/designs/2026-06-19--sprite-forge-integration.md` — Sprite Forge 集成设计

## 文件索引

- 源码: `F:/hyperframes/framepack-plugin/`
- 部署: `F:/Hermes_windows/plugins/framepack/`
- 权重核心: `core/control_profile.py` + `core/restraint_audit.py`
- Hook 穿透: `hooks/on_post_tool_call.py`（_build_weight_directive + _build_weight_consistency_report）
- Sprite Forge: `skills/framepack-sprite-forge/`
- 独立 skill: `F:/Hermes_windows/skills/software-development/framepack/SKILL.md`
- 测试报告: `F:/hyperframes/framepack-e2e-test/reports/`

## 开发铁律提醒

- TDD: RED → GREEN → 全量回归 → 部署同步(md5) → git commit
- 部署同步必须用 content hash（md5），不能只比 file size
- 改完 PLUGIN 文件必须同步到 `F:/Hermes_windows/plugins/framepack/`
- 修复 skill 用到问题应 patch skill_manage
