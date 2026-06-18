# Direction 5: HyperFrames Upstream Warning Bridge (方向 5 设计)

> **version:** design-draft
> **date:** 2026-06-18
> **status:** PENDING APPROVAL

## 问题陈述

Framepack quality_audit 做的是纯静态审计（读 HTML + expanded-prompt + arsenal）。
HyperFrames lint/inspect 是动态审计（跑 JS 运行时检测动画冲突、布局溢出）。
两者完全独立，Agent 面对两个报告没有统一视图。

具体痛点：
1. HyperFrames lint 报 5 个 warning，Agent 不知道哪些该修、哪些是上游结构限制修不了
2. `gsap_studio_edit_blocked` 是 HyperFrames 的设计决策（GSAP 管的元素 Studio 不能拖拽），不是 bug，但 Agent 可能花时间去试图修它
3. 没有系统化的上游缺陷追踪——类似问题再出现，还是靠文档里的一行文字

## 设计目标

1. **一站式质量报告**：quality_audit 的输出合并 HyperFrames lint/inspect 的 findings，统一分类
2. **数据驱动的 warning 分类**：维护一张分类表，上游限制 vs 质量问题，未知 warning 自动兜底
3. **上游缺陷追踪**：利用已有的 hermes_adapter patch 注册表，追踪等待上游解决的功能缺失
4. **零 CLI 依赖**：不调用 `npx hyperframes lint --json`（太重），而是读缓存的 lint 输出文件
5. **不欠 AI 债**：解析器通用、分类表可扩展、未知 warning 不漏

## 核心设计

### 数据流

```
Agent 跑 "npx hyperframes lint --json > .framepack/lint-output.json"
    ↓
post_tool_call hook 检测到 terminal 命令包含 "hyperframes lint --json"
    ↓
解析 .framepack/lint-output.json（结构化 JSON，不是正则解析 stdout）
    ↓
每个 finding 查分类表 → 标记 category
    ↓
写入 .framepack/hyperframes-findings.json（规范化缓存）
    ↓
quality_audit 读 .framepack/hyperframes-findings.json
    ↓
统一报告：质量问题 + 上游限制 分开展示
```

**关键决策：为什么让 Agent 写 `--json` 而不是 hook 自己跑 lint？**
- hook 拦截终端命令是"命令还没执行前"（pre_tool_call），此时没有 stdout
- post_tool_call 能拿到 result，但 Hermes 的 terminal result 是文本截断后的，不适合做 JSON 解析
- 正确做法：Agent 跑 `lint --json` 时重定向到文件，hook 检测到文件存在就处理

**关键决策：为什么不 hook 拦截 stdout？**
- post_tool_call 的 result 字段是 Hermes 截断后的文本，大 JSON 会被截断
- 依赖 stdout 格式就是依赖实现细节，违反"不欠 AI 债"
- `--json` + 文件重定向是稳定的、结构化的、不截断的

### Warning 分类表

数据驱动，不硬编码 if/else。分类表是 Python dict，一条 warning 对应一个条目，未知 warning 归入 `upstream_limit`（安全兜底）。

```python
WARNING_CLASSIFICATION: dict[str, dict] = {
    # ── 上游限制（HyperFrames 架构决定，不能修，只能等上游） ──
    "gsap_studio_edit_blocked": {
        "category": "upstream_limit",
        "default_severity": "P2",
        "description": "HyperFrames 架构限制：GSAP 注册 timeline 的元素 Studio 不可拖拽编辑",
        "upstream_status": "open",        # open | fixed | wontfix
        "upstream_request": "suppress 标记或 per-element Studio 编辑豁免",
    },
    # ── 质量问题（必须修） ──
    "overlapping_gsap_tweens": {
        "category": "quality_issue",
        "default_severity": "P2",
        "description": "GSAP tweens 时间轴重叠，可能导致视觉闪烁或动画冲突",
    },
    "timeline_track_too_dense": {
        "category": "quality_issue",
        "default_severity": "P2",
        "description": "单个 timeline track 元素过多，可能影响可读性和性能",
    },
    "composition_file_too_large": {
        "category": "quality_issue",
        "default_severity": "P3",
        "description": "HTML 文件行数过多，建议拆分为子 composition",
    },
    "font_family_without_font_face": {
        "category": "quality_issue",
        "default_severity": "P1",
        "description": "使用了未声明 @font-face 的字体族名",
    },
}
```

**未知 warning 的处理**：查不到的 code → `category: "upstream_limit"`, `severity: P2`。
理由：未知 = 上游新加的，安全兜底到"不用管"比安全兜底到"必须修"好——不会导致 Agent 修不了的东西。

### 缓存文件格式

`.framepack/hyperframes-findings.json`：

```json
{
  "version": 1,
  "source": "hyperframes-lint",
  "hyperframes_version": "0.6.99",
  "timestamp": "2026-06-18T10:30:00",
  "raw": { /* 原始 lint --json 输出 */ },
  "classified": [
    {
      "code": "gsap_studio_edit_blocked",
      "severity": "P2",
      "category": "upstream_limit",
      "message": "...",
      "description": "HyperFrames 架构限制：..."
    },
    {
      "code": "overlapping_gsap_tweens",
      "severity": "P2",
      "category": "quality_issue",
      "message": "...",
      "description": "GSAP tweens 时间轴重叠..."
    }
  ]
}
```

### quality_audit 报告变更

`_build_quality_audit_message` 的输出增加分类统计：

```
🧪 **Framepack Quality Audit — report-first / non-blocking**

P0: 0 · P1: 0 · P2: 3 · P3: 1
其中 upstream_limit: 1 (等上游)

Top findings:
- P2 overlapping_gsap_tweens: GSAP tweens overlap on "__unresolved__"...
- P2 timeline_track_too_dense: track 2 has 8 animations in 0.5s...

Upstream limitations (not actionable):
- P2 gsap_studio_edit_blocked: HyperFrames 架构限制 — Studio 不可编辑 GSAP 元素
```

### 上游缺陷追踪

在 `.framepack/hermes_patches.json` 的 patch 注册表里新增 `upstream_features` 字段：

```json
{
  "version": 1,
  "last_known_hermes_version": "0.x.x",
  "last_known_hyperframes_version": "0.6.99",
  "patches": [
    {
      "id": "skills_tool_file_path",
      "type": "hermes_patch",
      "target": "tools/skills_tool.py",
      "marker": "/* FRAMEPACK PATCH: file_path support */",
      "description": "Fix skill_view to pass file_path to _serve_plugin_skill"
    }
  ],
  "upstream_features": [
    {
      "id": "studio_edit_suppress_flag",
      "hyperframes_version": "0.6.99",
      "warning_code": "gsap_studio_edit_blocked",
      "status": "open",
      "request": "Add --suppress or per-element suppress attribute for Studio editability warnings",
      "workaround": "Accept as structural limitation; no code change available",
      "notes": "Present in all GSAP-heavy compositions. Not a render-quality issue."
    }
  ]
}
```

### 文档变更

#### guardrails.md 新增 Known Limitations 段落

在 "Core Principle" 之前插入：

```markdown
## Known Limitations

### HyperFrames 上游限制

| Warning Code | 描述 | 状态 | 规避方式 |
|---|---|---|---|
| gsap_studio_edit_blocked | GSAP 注册 timeline 的元素 Studio 不可拖拽 | 等上游加 suppress 标记 | 不在 Studio 里拖拽 GSAP 管的元素 |

这些是 HyperFrames 架构决定，不是 Framepack bug，也不是可以修复的质量问题。
quality_audit 会自动将它们分类为 `upstream_limit`，与可修复的质量问题分开展示。
```

#### framepack SKILL.md 新增 Known Limitations 段落

在警告分级段落后面补充 upstream_limit 的说明。

### Hook 集成

#### post_tool_call hook 新增 lint 缓存处理

在 `on_post_tool_call` 的 `terminal` 分支中：

1. 检测 terminal result 的 command 是否包含 `hyperframes lint --json`
2. 如果是，检查 `.framepack/lint-output.json` 是否存在（Agent 的重定向结果）
3. 如果存在，调用 `_process_lint_cache(project_dir)` → 解析 + 分类 + 写 `.framepack/hyperframes-findings.json`
4. 下次 `audit_project()` 自动读到新缓存

#### pre_tool_call hook 提醒

当 Agent 要跑 `hyperframes lint` 但没加 `--json` 时，注入提醒：

> 💡 建议加 `--json` 并重定向到 `.framepack/lint-output.json`，这样 Framepack quality_audit 能自动分类 warning。

## 文件变更清单

| 文件 | 动作 | 描述 |
|---|---|---|
| `core/warning_classifier.py` | 新建 | lint --json 解析 + 分类表 + 缓存读写 |
| `tests/test_warning_classifier.py` | 新建 | 分类逻辑测试 + 缓存读写测试 + 未知 warning 兜底 |
| `core/quality_audit.py` | 修改 | `audit_project()` 读缓存 + 报告分开展示 upstream_limit |
| `tests/test_quality_audit.py` | 修改 | 新增缓存集成测试 |
| `hooks/on_post_tool_call.py` | 修改 | 检测 `hyperframes lint --json` → 触发缓存处理 |
| `hooks/on_pre_tool_call.py` | 修改 | 检测 `hyperframes lint` 无 `--json` → 注入提醒 |
| `hooks/guardrails.py` | 修改 | hydrate_guardrails 注入 lint --json 引导 |
| `guardrails.md` | 修改 | 新增 Known Limitations 段落 |
| `skills/framepack/SKILL.md` | 修改 | 新增 Known Limitations + upstream_limit 说明 |
| `.framepack/hermes_patches.json`（模板） | 新建 | 新增 upstream_features 字段 + studio_edit_suppress_flag 条目 |

## 不做的事

- ❌ hook 自己跑 `npx hyperframes lint --json`（太重，每条 terminal 命令都触发不现实）
- ❌ 正则解析 stdout（用 `--json` 的结构化输出，不欠 AI 债）
- ❌ 把 inspect findings 也拉进来（inspect 主要检测布局溢出，和 lint 的 warning 分类体系不同；可以后续 v0.13 扩展）
- ❌ 自动修 warning（report-first，只报告不修改）

## 测试策略

TDD：先写测试再写代码。

1. **分类逻辑测试**：已知 warning → 正确分类；未知 warning → upstream_limit 兜底
2. **缓存读写测试**：lint-output.json → hyperframes-findings.json 的完整转换
3. **quality_audit 集成测试**：有缓存时报告包含 upstream_limit 统计；无缓存时行为不变
4. **边界测试**：空 findings、畸形 JSON、超大 finding list
5. **hook 测试**：terminal 命令含 `lint --json` → 触发处理；不含 → 不触发

## 与版本收口的关系

方向 5 完成后，所有 5 个方向完成，进入 Task 6.x 版本收口（plugin.yaml bump 到 0.11.2 → 全量同步 → release）。

方向 5 的 commit message：`feat: bridge HyperFrames lint warnings into quality_audit with upstream classification`
