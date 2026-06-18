# Design: Param Guard — Prevent Parameter Drift at Source

> 日期: 2026-06-18
> 状态: 待审核
> 关联: 方向 4 / 五方向计划 Task 4.1–4.5

## 问题

Agent 写 HTML 时凭记忆翻译 Execution Manifest 的参数值。
quality_audit._audit_parameter_drift 能事后检测漂移（P1 报告），
但 Agent 已经写完了，需要回头改。

典型漂移：
- Manifest: staggerAmount=0.85 → HTML: staggerAmount=0.5
- Manifest: ease="power2.out" → HTML: ease="power3.out"
- Manifest: duration=1.4 → HTML: duration=2.0

## 方案: pre-write 参数对照卡

核心思路：在 Agent 准备写 index.html 之前，把 Execution Manifest 的
每个武器的精确参数值注入到上下文里，让 Agent 写代码时"对照卡就在眼前"。

### 触发时机

```
hyperframes init 或 hyperframes init --example xxx（命令完成）
    ↓ on_post_tool_call hook 检测到 init
    ↓ 读 .hyperframes/expanded-prompt.md 末尾的 Execution Manifest
    ↓ 解析每个 weapon 的 params
    ↓ 生成参数对照卡文本
    ↓ ctx.inject_message（注入到会话）
```

### 对照卡格式

```
📋 WEAPON PARAMETER REFERENCE CARD (copied from Execution Manifest)
═══════════════════════════════════════════════════════════════

Scene 1 — "Grid Awakening":
  ⚔️ text-reveal-fade-in() → canonical: staggerReveal()
    staggerAmount: 0.85
    ease: "power2.out"
    duration: 1.2
  ⚔️ particle-field() → canonical: createParticleBlob()
    particleCount: 40
    radius: 120

Scene 2 — "Data Cathedral":
  ⚔️ card-cascade-reveal() → canonical: buildCardCascade()
    columns: 3
    gap: 24
    staggerAmount: 0.15

═══════════════════════════════════════════════════════════════
⚠️ Use EXACT values above. Do NOT translate from memory.
═══════════════════════════════════════════════════════════════
```

### 关键设计决策

1. **不替换，只注入** — 对照卡是额外的上下文信息，
   不修改 expanded-prompt.md 或任何文件
2. **只触发一次** — init 之后注入一次，后续 write_file 不重复注入
3. **依赖 Execution Manifest** — 如果 expanded-prompt.md 没有 Manifest，
   不注入（可能不是 HyperFrames 项目）
4. **P1 附 canonical 代码片段** — quality_audit 检测到漂移时，
   在 issue.details 里附带"应该这么写"的代码片段
   （这是方向 4 的第二层：事后矫正的加强）

### 实现组件

```
core/param_guard.py:
  - extract_param_card(project_dir) → str | None
    从 expanded-prompt.md 解析 Manifest → 生成对照卡文本
  - is_init_command(cmd_result) → bool
    判断 post_tool_call 的结果是否是 hyperframes init

hooks/on_post_tool_call.py:
  - 在现有 hook 逻辑中加一段：
    if is_init_command:
        card = extract_param_card(project_dir)
        if card:
            ctx.inject_message(card, role="user")
```

### 测试计划

TDD:
1. test_extract_param_card_reads_manifest — 解析 Manifest 生成对照卡
2. test_extract_param_card_no_manifest — 没有 Manifest 返回 None
3. test_extract_param_card_empty_params — 参数为空的 weapon 只列名不列值
4. test_is_init_command — 识别 init 命令
5. test_param_card_values_match_manifest — 对照卡值精确匹配
6. test_quality_audit_p1_includes_canonical_snippet — P1 附代码片段

### 范围界定

本方向做：
- pre-write 对照卡注入（事前预防）
- quality_audit P1 附 canonical 代码片段（事后矫正加强）

本方向不做：
- blocks/ 整体注册体系（方向 2 遗留，更大范围）
- Agent 行为引导层（Manifest 里给代码骨架——这更复杂，留后续）
