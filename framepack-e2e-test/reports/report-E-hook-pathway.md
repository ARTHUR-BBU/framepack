# 命题 E 报告 — Hook 神经通路真实模拟（3 轮）

**被测对象**: Framepack v0.14.0 — `hooks/on_post_tool_call.py`
**核心函数**: `_build_weight_directive(frame_md_content)`、`_build_weight_consistency_report(frame_md_content, expanded_prompt)`
**神经通路**: `write_file` 工具调用 → `on_post_tool_call` → `_handle_frame_md` / `_handle_expanded_prompt` → `_build_weight_*` → `_safe_inject` → `ctx.inject_message`（突触）
**Python**: 3.14.2 ｜ **基线**: 现有 `test_frame_md_hook_weights.py` + `test_quality_audit_weight_bridge.py` 共 10 用例全绿
**原则**: 只测不改（插件源码 0 改动，仅新增模拟脚本与本报告）

---

## 1. 测试方法

驱动**真实注册 hook**（`register(ctx)` 拿到的生产 `on_post_tool_call` 闭包），用录制型 `RecCtx`
把每一次 `ctx.inject_message` 落盘可检。权重通路代码 100% 真实执行，零打桩。

仅对**与权重通路无关的外部依赖**打桩：
- `hydrate_guardrails` — 写 `AGENTS.md` + Hermes 补丁审计（文件系统/网络），属 guardrail 通路，非权重通路。
- `ctx.llm.complete` — 外部 LLM，按轮次控制（成功 JSON / 抛错 / 垃圾文本）。

> 现有单测 `test_frame_md_hook_weights.py` 只在隔离态调用 `_build_weight_directive` +
> 手动 `_safe_inject`，**从未穿过真实 hook 闭包**。本测试补上了「真实通路」这一层。

复现脚本: `F:/hyperframes/framepack-e2e-test/sim_E_hook_pathway.py`

---

## 2. 三轮模拟结果

### 第 1 轮 — frame.md 写入 → 五行权重指令注入（happy path）✅

fixture: 完整 `control_profile`（creative_autonomy=0.85 / restraint=0.9 / atmosphere=0.2 /
motion=0.75 / weapon=0.3 + self_assessment + caution_motion.glow=0.85）。LLM 返回合法 frame 质检 JSON。

| 检查项 | 结果 |
|---|---|
| 权重指令到达突触 (`ctx.inject_message`) | ✅ 1 条 |
| 含五行 木/金/火/水/土 | ✅ 全中 |
| layer cap 计算正确 `约1层` (floor(0.2×7)=1) | ✅ |
| 高档文案（信任 / 克制力高 / SLAM） | ✅ |
| **突触完整性**（指令原样到达，sanitizer 未篡改） | ✅ verbatim=True |

结论: happy path 通路完全正常，`_safe_inject` 的 sanitizer 对中文/无 backtick 的指令是 no-op。

### 第 2 轮 — expanded-prompt 写入 → 一致性报告（三类 mismatch）✅

fixture: `frame.md` 设 atmosphere_density=0.1 / weapon_reliance=0.9 / restraint_force=0.9；
`expanded-prompt` 故意塞 8 个氛围关键词 + 全 HANDWRITE manifest + 3 个 surprise。LLM 返回合法 JSON。

| 检查项 | 结果 |
|---|---|
| 一致性报告到达突触 | ✅ 1 条 |
| 含 `atmosphere_density` mismatch | ✅ |
| 含 `weapon_reliance` mismatch | ✅ |
| 含 `restraint_force` mismatch | ✅ |
| 三条全标 `[P2]` | ✅ (count==3) |
| 含要求解释结尾（"请在 expanded-prompt.md 里对以上每项做出解释"） | ✅ |
| **突触完整性**（报告原样到达） | ✅ verbatim=True |

结论: mismatch 检测通路完全正常；三类维度（火/土/金）全部触发，P2 分级与解释要求正确。

### 第 3 轮 — LLM 宕机 → 权重通路是否存活（韧性探测）🔴 发现 BUG

同样 fixture，`ctx.llm.complete` 抛 `RuntimeError("LLM unavailable")`：

| 子轮 | 通路产物到达突触 | 纯函数直调是否可用 |
|---|---|---|
| 3a frame.md（应注入权重指令） | **0 条** ❌ | `_build_weight_directive` ✅ 仍可用 |
| 3b expanded-prompt（应注入一致性报告） | **0 条** ❌ | `_build_weight_consistency_report` ✅ 仍可用（非空） |

**判定: 权重通路在 LLM 宕机下【静默断流】。** 纯本地函数本身完全正常，
但通过 hook 通路时一行都没推到 Agent 面前，且**无任何错误信号**。

补充验证（非抛错、而是 LLM 返回不可解析文本）——同样断流：

| LLM 返回 | 权重指令到达突触 | 纯函数直调 |
|---|---|---|
| `"Sorry I cannot do that"` | 0 ❌ | ✅ |
| `""` 空串 | 0 ❌ | ✅ |
| `"{color_palette_ok:true"` 残缺 JSON | 0 ❌ | ✅ |

---

## 3. 发现的问题

### 🔴 [E-1] 权重神经通路被 LLM 质检调用硬耦合 —— 中高危

**现象**: `_handle_frame_md` 与 `_handle_expanded_prompt` 在 LLM 质检分析返回 `None` 时
**提前 `return`，导致其后才执行的权重注入块被整体跳过**。

根因定位（`hooks/on_post_tool_call.py`）：

```python
# _handle_frame_md（line ~608-623）
analysis = _analyze_frame_md(ctx, content)
if analysis is None:
    logger.warning("frame.md analysis failed")
    return                         # ← 提前返回
message = _build_frame_md_advice(analysis)
_safe_inject(ctx, message, role="user")
# 五行权重指令注入（v0.14）         ← 永远到不了
weight_directive = _build_weight_directive(content)
if weight_directive:
    _safe_inject(ctx, weight_directive, role="user")

# _handle_expanded_prompt（line ~668-694）同样的结构
analysis = _analyze_expanded_prompt(ctx, content)
if analysis is None:
    logger.warning("expanded-prompt analysis failed")
    return                         # ← 提前返回
...
# 五行权重一致性检查注入（v0.14）    ← 永远到不了
report = _build_weight_consistency_report(frame_md_content, content)
```

**为何是问题**:
1. **权重注入是纯本地计算**（`ControlProfile.from_frame_md` + `render_directive` /
   `audit_weight_consistency`），与 LLM **零依赖**，本不该受其影响。
2. `_analyze_*` 对**任何异常都吞掉返回 None**（网络错、超时、限流、JSON 不可解析、空响应），
   失败面极宽。任意一次 LLM 抖动都会让整个 v0.14 权重特性对该次写入**静默失效**。
3. **静默**——只有 `logger.warning`，Agent 与用户都看不到「权重指令没注入」，
   也没降级提示。control_profile 写了等于没写。
4. 这正是命题强调的「真实模拟」价值：隔离态单测（现有用例）测不出，
   因为它们绕过了 `_analyze_*` 那段提前 return。

**建议修复方向**（仅记录，未实施——只测不改）:
- 将权重注入块从 `_analyze_* is None` 的早返回中**解耦**：要么把权重注入挪到 `return` 之前，
  要么把 LLM 质检失败改为「跳过 advice 注入但继续走权重块」。
- 即便 LLM 质检失败，权重指令/一致性报告（纯本地）仍应照常推到 Agent。

**复现**: `python sim_E_hook_pathway.py`（见 Round 3 输出：r3a/r3b injected=0，direct_ok=true）。

### 🟡 [E-2] 观察：突触完整性良好（非问题，正向确认）

`_safe_inject → _sanitize_message` 对权重指令/一致性报告是**无损 no-op**：
- 指令文本含「以上指令基于…」中文，不命中 `ignore\s+previous` 等英文模式；
- 不含 ``` backticks、不含 `IMPORTANT...MUST`。
两轮 verbatim=True 证实权重消息原样到达突触，sanitizer 不会误伤中文权重文案。

### 🟡 [E-3] 观察：通路突触流量干净

Round 1/2 中 `ctx.inject_message` 总数=2（advice + 权重产物各 1），
说明 `_sync_arsenal_for_expanded_prompt`、`_inject_param_card_if_manifest` 在
最小 fixture 下未产生额外噪声注入（HANDWRITE-only manifest 无未知武器告警、无 param card）。

---

## 4. 结论

| 维度 | 结论 |
|---|---|
| happy path（frame.md 权重指令） | ✅ 通畅，五行齐全、cap 正确、突触无损 |
| happy path（expanded-prompt 一致性报告） | ✅ 通畅，三类 mismatch 全触发、P2 分级正确 |
| LLM 宕机/垃圾返回下的权重通路 | 🔴 **静默断流**（[E-1]，中高危） |

权重神经通路的「最后一公里」`_safe_inject → ctx.inject_message` 是健康的；
真正的隐患在**中段**：权重注入（纯本地、本应最稳）被前置的 LLM 质检调用绑死，
一旦 LLM 抖动，整个 v0.14 权重特性对该次写入无声失效。建议解耦。

## 产物
- 模拟脚本: `F:/hyperframes/framepack-e2e-test/sim_E_hook_pathway.py`
- 本报告: `F:/hyperframes/framepack-e2e-test/reports/report-E-hook-pathway.md`
- 插件源码: 未改动（git status 干净）
