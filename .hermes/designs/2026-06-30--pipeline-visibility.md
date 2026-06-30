# Pipeline Visibility — 伴随式 Gate + 用户状态牌

> 设计文档 · 2026-06-30
> 状态：方向已定，待实现
> 关联测试组反馈：v0.16 acceptance（miara-style-template case）

## 一句话

厨房里 7 个质检员全挤在出菜口，备菜全程没人看。给他们排个班，再给服务员面前放一块"现在第几步"的状态屏。

---

## 问题陈述

测试组反馈（现象成立，已核实）：

1. **用户看不到"到底生成到哪一步了"** — 中间态 5+ 层（template → frame.md → expanded-prompt → HTML → render），无贯穿全程的状态视图。
2. **"验证是终审不是伴随"** — 7 个 gate 全在 render 前那一刻才跑。
3. **模板参数后知后觉** — select 后没一次性收齐必填参数，后面临时补。

## 根因（证据支持，已逐行核实）

Framepack **不是没有验证体系，是体系造好了没接进流程**。

| 组件 | 现状 | 证据 |
|---|---|---|
| 7 个 gate 检查 | ✅ 存在 | `core/gates/{asset_intake,audio_cues,scene_continuity,control_profile,source_extraction,storyboard_preview}.py` |
| gate 调度引擎 | ✅ 存在 | `core/gates/registry.py` → `evaluate_native_gates()` |
| **运行时调用点** | ❌ **仅 1 处** | `on_pre_tool_call.py` → `_inject_readiness_board()`，触发条件 = render/preview 命令 |
| 伴随式校验 | ❌ **不存在** | `on_post_tool_call.py` 搜 `frame.md` / `expanded-prompt` 零命中 |

类比：质检员招齐了，没排班表，全挤在下班前打卡。机制不缺，**缺的是编排**。

---

## 方案（三个决策点，方向已定）

### 决策 1：伴随式 Gate — 把现有 gates 接进 post_tool_call

**不造新状态机。** 现有 gate 函数零改动，只增加调用点。

```
post_tool_call 检测到 write_file:
  ├── 路径匹配 frame.md          → 跑 check_control_profile_consistency
  ├── 路径匹配 expanded-prompt.md → 跑 check_scene_continuity + check_storyboard_preview
  └── 路径匹配 index.html         → 跑 check_source_extraction + check_asset_depth
                                    （render 前的全套 readiness board 保持不变）
```

**为什么不造新状态机**：gate 逻辑已经成熟、有测试覆盖。状态机是额外抽象层，管"现在第几步"的事交给决策 2 的 progress 文件。职责分离：gate 管"这步合格没"，progress 文件管"现在第几步"。

### 决策 2：用户状态牌 — 单文件 `.framepack/progress.md`

不搞双通道（不一边注入 Agent 一边写文件）。一个持久 markdown，每次伴随 gate 跑完自动覆写。

```
# 项目进度

当前阶段：出分镜 ✅ → 下一步：可预览

- ✅ 已选模板（miara-style-template）
- ✅ 已填参数（brand_name / tagline / cta）
- ✅ 已出视觉稿（frame.md · control_profile gate PASS）
- ✅ 已出分镜（expanded-prompt.md · scene_continuity PASS · storyboard PASS）
- ⬜ 可预览（待 HTML 生成 + lint）
- ⬜ 可渲染（待 readiness board 全绿）

_最后更新：由 post_tool_call gate 自动写入_
```

**为什么单文件**：simplify。用户任何时刻 `read_file` 就能看到；Agent 也能读来恢复上下文。状态查询 = 读一个文件，不是查一个系统。

文件写入逻辑：progress updater 读项目目录，检测哪些产物已存在（frame.md / expanded-prompt.md / index.html / 渲染产物），结合最近一次 gate 结果，生成对应阶段。

阶段定义（6 段，对应测试组要的）：

| 阶段 | 判定依据 |
|---|---|
| 已选模板 | `.framepack/template-selection.md` 存在 |
| 已填参数 | template-selection.md 含必填字段值 |
| 已出视觉稿 | `frame.md` 存在 + control_profile gate 有结果 |
| 已出分镜 | `expanded-prompt.md` 存在 + scene_continuity/storyboard gate 有结果 |
| 可预览 | `index.html` 存在 + source_extraction/asset_depth gate 有结果 |
| 可渲染 | render readiness board 全绿（现有逻辑） |

### 决策 3：模板参数前置 — select 后强制必填卡

template select 完成后，inject 一条结构化提示：列出该模板的必填参数，要求 Agent 先确认再继续共创。参数卡写进 `.framepack/template-selection.md`。

必填字段从模板定义（`core/templates/builtin.py`）的 `required_params` 读。不造参数 schema 引擎——字段就那几个（brand_name / tagline / cta），写在模板定义里。

---

## 组件改动清单（最小集）

| 文件 | 改动 | 新/改 |
|---|---|---|
| `hooks/on_post_tool_call.py` | 加路径判定 → 调对应 gate → 写 progress.md | 改 |
| `core/pipeline_progress.py` | 新模块：检测产物存在性 + 生成 progress.md 内容 | 新 |
| `core/templates/builtin.py` | 模板定义加 `required_params` 字段 | 改 |
| `hooks/on_post_tool_call.py` | template select 后 inject 参数卡提示 | 改 |

**不改的**：
- 7 个 gate 函数（签名、逻辑、测试全不动）
- `on_pre_tool_call.py` 的 render readiness（现状保留）
- gate 调度引擎 `core/gates/registry.py`

---

## 数据流

```
Agent 写 frame.md (write_file)
   ↓ post_tool_call
路径判定 → match frame.md
   ↓
跑 check_control_profile_consistency(project_dir)
   ↓ GateResult
pipeline_progress.update(project_dir, gate_results)
   ↓
覆写 .framepack/progress.md
   ↓
inject 一句话给 Agent："视觉稿已通过校验，下一步出分镜"
```

## 错误处理

- gate 函数抛异常 → 不阻断流程，progress.md 标 ⚠️ + 记错误信息（advisory，不 block）
- progress.md 写入失败 → 静默降级，只 inject 给 Agent（不因状态牌坏了卡住整个创作）
- 模板无 required_params → 跳过参数卡步骤（向后兼容）

## 测试策略（TDD）

| 测试 | 验什么 |
|---|---|
| 写 frame.md → control_profile gate 被调用 | post_tool_call 路由正确 |
| 写 expanded-prompt → scene_continuity + storyboard 被调用 | 多 gate 组合 |
| progress.md 内容反映当前阶段 | 6 阶段判定逻辑 |
| gate 异常 → progress 标 ⚠️ 不崩 | 错误降级 |
| 无 required_params 的模板 → 不弹参数卡 | 向后兼容 |
| 现有 881 个测试全绿 | 零回归 |

## 不做的事（simplify）

- **不造 pipeline state machine / state.json** — 过度抽象。阶段判定靠"检测文件存在 + gate 结果"，不需要显式状态转移图。
- **不搞双通道状态推送** — 一个 progress.md 够了。注入 Agent 转述是额外复杂度，收益不明。
- **不造参数 schema 引擎** — 必填字段写死在模板定义里。新模板加一行 required_params 而已。
- **不改 gate 逻辑** — 它们是对的，只是没被串起来。

## 与 HyperFrames 升级的关系

本设计与 0.7.3 → 0.7.21 升级（绿区，零适配）独立。progress.md 的"可预览/可渲染"阶段语义不依赖 HyperFrames 版本——它读的是 Framepack 自己的产物和 gate 结果。

---

## 实现顺序（plan skill 接管）

1. TDD: `core/pipeline_progress.py` — 产物检测 + progress.md 生成
2. TDD: `on_post_tool_call.py` 路由 — 路径 → gate 映射
3. TDD: 模板 required_params + 参数卡 inject
4. 全量回归 881 测试 → 部署同步(md5) → commit
