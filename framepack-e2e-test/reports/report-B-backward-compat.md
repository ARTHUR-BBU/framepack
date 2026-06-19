# 命题 B 测试报告: 向后兼容 + 版本迁移

| 项目 | 值 |
|---|---|
| 被测代码 | `F:/hyperframes/framepack-plugin/` |
| Framepack 版本 | v0.14.0 |
| Python | 3.14.2 |
| 测试日期 | 2026-06-19 |
| 测试方式 | 只测不改 (黑盒 + 白盒探针), 不修改被测代码 |
| 测试脚本 | `F:/hyperframes/framepack-e2e-test/testB_backward_compat.py` |
| 机器可读结果 | `F:/hyperframes/framepack-e2e-test/testB_results.json` |

## 向后兼容契约 (被测)

v0.14 把旧版 `forbidden_motion` (list 格式, 开关式禁止) 升级为
`caution_motion` (dict 格式, 每项 0–1 谨慎度权重):

- 旧 `frame.md` 写 `forbidden_motion: [item]` → 解析时每项自动迁移为
  `caution_motion[item] = 0.9` (常量 `_FORBIDDEN_CAUTION`)
- 显式 `caution_motion` 值优先于 forbidden 的默认 0.9 (新格式胜出, `setdefault` 语义)
- 核心模块: `core/control_profile.py` (`from_frame_md`),
  `core/restraint_audit.py` (`audit_weight_consistency`),
  `hooks/on_post_tool_call.py` (`_build_weight_directive`)

## 3 轮测试设计

| 轮次 | 场景 | 目的 |
|---|---|---|
| R1 | 纯旧版 (v0.13-era) 项目, 只有 `forbidden_motion` 列表 | 验证旧项目在 v0.14 下能否无损解析、hook/audit 链路是否畅通 |
| R2 | 混合/迁移期项目, `forbidden_motion` + `caution_motion` 共存 | 验证新旧格式合并语义、`setdefault` 优先级、畸形输入鲁棒性 |
| R3 | 纯新版 v0.14-native 项目 + 版本迁移元数据探针 | 验证新版完整解析、clamp、版本号一致性、迁移工具/块名碰撞 |

## 结果总览

```
硬契约断言: 22/22 PASS
信息性探针: 0/7 PASS   (探针"失败"= 印证对应 finding, 非功能回归)
问题标记:   7 项
```

**22 条硬契约断言全部通过** —— 说明向后兼容的核心契约 (旧 list → 0.9 迁移、
新 dict 优先、混合合并、引号剥离、clamp、hook/audit 不崩溃) 功能正常。

但 7 条信息性探针全部命中问题, 暴露了**迁移链路的下游断层与若干脆弱设计**。

### 问题按轮次分布

| 轮次 | 问题数 |
|---|---|
| R1 纯旧版 forbidden_motion | 4 |
| R2 混合格式 (迁移期) | 1 |
| R3 v0.14-native + 版本元数据 | 2 |

### 问题按严重度分布

| 严重度 | 数量 | 含义 |
|---|---|---|
| BLOCK-COLLISION | 1 | 跨块名匹配导致数据误迁移 (功能性 bug) |
| SILENT-DATA-LOSS | 1 | 畸形输入静默丢弃整段数据 |
| DEFAULT-INCONSISTENCY | 1 | 同一代码两套默认语义 |
| INFO-LOSS | 1 | 迁移结果对下游 Agent 不可见 |
| AUDIT-GAP | 1 | 审计层不消费迁移数据 |
| MIGRATION-SILENCE | 1 | 缺乏弃用/迁移引导 |
| OBSERVATION | 1 | 设计观察 (非缺陷) |

---

## 问题清单 (7 项)

### [1] R1 · INFO-LOSS — 迁移结果对下游 Agent 完全不可见

**现象**: 纯旧版项目迁移出的 `caution_motion` (`{shake:0.9, spin:0.9,
flash:0.9, snap-zoom:0.9}`) 在 `ControlProfile.render_directive()` 输出中
完全不可见。`hooks/on_post_tool_call.py::_build_weight_directive` 注入给
Agent 的 weight directive 只含五行权重档位文案 (木金火水土), 不含任何
caution_motion 信息。

**根因**: `render_directive()` (control_profile.py L88–154) 只渲染
`_WEIGHT_KEYS` 五个标量权重的 high/medium/low 档文案, 完全没有遍历
`self.caution_motion` 字典。

**影响**: Agent 拿不到 "这些 motion 需要高谨慎度" 的信息, 迁移事实上对
实际产出无任何约束力——数据进了对象却在注入层断流。

**复现**:
```python
cp = ControlProfile.from_frame_md('control_profile:\n  forbidden_motion:\n    - shake\n')
# cp.caution_motion == {'shake': 0.9}
assert 'shake' not in cp.render_directive()   # 迁移结果在指令文本中不可见
```

---

### [2] R1 · AUDIT-GAP — 审计层不消费 caution_motion

**现象**: `audit_weight_consistency()` 只检查 `atmosphere_density` /
`weapon_reliance` / `restraint_force` 三个标量权重维度, 完全不审计
`caution_motion`。即使 `expanded-prompt` 里反复使用 caution_motion 中已声明
的高谨慎度 motion (shake/spin), 也不会产生任何 P2/P3 issue。

**根因**: `restraint_audit.py::audit_weight_consistency` (L30–82) 的三个
检查分支均针对 `cp.weights` 标量字段, 无任何针对 `cp.caution_motion` 的
分支。

**影响**: 与 [1] 叠加, 形成 "解析层有数据、注入层不输出、审计层不消费"
的完整断层。`caution_motion` 在 ControlProfile 上是一个**写后只读、且无任何
下游读者**的字段。

---

### [3] R1 · MIGRATION-SILENCE — 缺乏弃用/迁移引导

**现象**: 解析旧 `forbidden_motion` 时完全静默, logger 不打印任何弃用警告
或迁移提示 (DEBUG 级别也无输出)。

**影响**: 用户在 v0.14 下保留旧格式不会被引导迁移到 `caution_motion`,
也不被告知每项被默认设为 0.9。结合 [6] (无源文件迁移工具), 旧格式可能
长期滞留于项目源文件中。

**建议**: 在 `from_frame_md` 检测到 forbidden_motion 块时打印一条
`logger.info("forbidden_motion is deprecated, migrated to caution_motion
with default 0.9; consider upgrading your frame.md")`。

---

### [4] R1 · DEFAULT-INCONSISTENCY — 缺失权重的回退值两套语义不一致

**现象**: `from_frame_md` 对缺失权重统一回退到 `0.5`
(control_profile.py L185: `Weights(**{k: weight_vals.get(k, 0.5) ...})`),
但 `Weights` 数据类的原生默认是 `atmosphere_density=0.4` (L33)。

**实测**:
- 旧项目 (无 weights 块) 经 `from_frame_md` 解析:
  `atmosphere_density=0.5` → `atmosphere_layer_cap=3`
- 裸构造 `ControlProfile()`: `atmosphere_density=0.4` → `cap=2`

**影响**: 同一段代码两套默认语义, 导致氛围层数上限判断不一致。`audit_weight_consistency`
里 `cap = w.atmosphere_layer_cap()` 的判定结果会随 profile 来源不同而漂移。

**建议**: `from_frame_md` 改用 `Weights()` 默认实例再覆盖显式值, 即
`{**asdict(Weights()), **weight_vals}`, 让两套路径共享同一组默认。

---

### [5] R2 · SILENT-DATA-LOSS — forbidden_motion 误写为 dict 格式静默吞掉整个 profile

**现象**: 用户若把 `forbidden_motion` 误写为新版 dict 格式:

```yaml
control_profile:
  forbidden_motion:
    shake: 0.5
    spin: 0.8
```

`_parse_list_block` 只识别 `- item` 列表项, dict 内容被完全静默丢弃。
又因为 `caution_vals/weight_vals/assess_vals` 全空, `from_frame_md`
直接返回 `None`——**整个 control_profile 块被当作不存在**, 实测 `cp_e = None`。

**影响**: 用户得不到任何提示知道自己的 motion 约束完全失效, 且整个权重
系统被静默跳过。这是从 "用错语法" 直接降级到 "完全无 control_profile"
的悬崖式失败。

**建议**: 在 forbidden_motion 块解析到非列表内容 (检测到 `key: value` 行)
时打印警告, 或在 `from_frame_md` 检测到 control_profile 块存在但解析结果
全空时打印 "control_profile block found but produced empty profile"。

---

### [6] R3 · OBSERVATION — 迁移是零侵入的解析期行为, 无源文件升级工具

**现象**: `forbidden_motion → caution_motion` 的迁移完全是解析期 in-memory
行为, `scripts/` 下没有任何脚本会改写用户的 `frame.md` 源文件。

**性质**: 这是有意设计 (零侵入, 不动用户源文件), 本身**不是缺陷**。
但与 [3] (无弃用警告) 叠加后, 意味着旧项目的源文件永远不会被自动升级,
用户必须手动改写才能用上新语法, 且不会被提醒需要这么做。

**建议**: 在 doctor 报告里加一条 `deprecated field detected` 提示以引导
手动迁移。

---

### [7] R3 · BLOCK-COLLISION — 裸块名匹配导致跨块数据误迁移 (功能性 bug)

**现象**: `_extract_yaml_block(text, 'forbidden_motion')` 按裸块名全文匹配
**第一个**出现的 `forbidden_motion:` 行, 不绑定 `control_profile` 父 YAML
上下文。当 `frame.md` 同时含 `control_profile` 块和另一个父级 (如
`taste.visual_physics`) 下的同名 `forbidden_motion` 块时, 解析器会越过块
边界抓取先出现的那个, 把无关的 motion 列表**误迁移进**
`ControlProfile.caution_motion`。

**实测复现** (已独立验证):
```python
md = '''
control_profile:
  weights:
    restraint_force: 0.8
taste:
  visual_physics:
    forbidden_motion:
      - generic slide-in
      - random bounce
'''
cp = ControlProfile.from_frame_md(md)
# cp.caution_motion == {'generic slide-in': 0.9, 'random bounce': 0.9}
# ↑ taste 块的 motion 列表被误当作 control_profile 的 caution_motion
```

实测泄漏: `{'generic slide-in': 0.9, 'random bounce': 0.9}`

**为什么这是真实风险而非空想**: `skills/framepack-director/SKILL.md` 第 293 行
的官方示例恰好就是 `taste.visual_physics.forbidden_motion` 结构, 说明该
嵌套写法是文档化的合法用法。任何同时使用 taste 块和 control_profile 块的
项目都会触发。

**根因**: `control_profile.py::_extract_yaml_block` (L206–239) 用
`re.match(rf'^\s*{block_name}:\s*$', line)` 匹配块头, 不检查该块头是否
位于 `control_profile:` 的缩进范围内。对 `weights` / `self_assessment` /
`caution_motion` 同样存在此风险 (任何在 frame.md 中以这些裸名出现的外部
块都会被误抓)。

**建议**: 把解析约束在 `control_profile:` 块的缩进范围内——先定位
`control_profile:` 块头, 在其子树内再按缩进提取子块; 或改用真正的 YAML
解析器加载 `control_profile` 节点。

---

## 通过的硬契约断言 (22/22, 全 PASS)

### R1 纯旧版 (7 条)
- `from_frame_md` 不返回 None (向后兼容)
- 旧 forbidden_motion 全部迁移为 caution_motion (=0.9)
- `_FORBIDDEN_CAUTION == 0.9`
- 引号变体 (`"flash"` / `'snap-zoom'`) 引号被剥离
- 无 weights 块 → weights 字段存在且可读
- `_build_weight_directive` 不崩溃 (hook 路径)
- `audit_weight_consistency(cp_legacy, '')` 不崩溃且返回 `[]`

### R2 混合格式 (7 条)
- A 同名 key: 显式 caution 0.3 胜过 forbidden 默认 0.9
- B 不同名 key: caution 与 forbidden 各自填入, 互补合并
- C 部分权重: 声明项保留 0.9, 未声明项退回默认
- C caution_motion 合并保留两边
- D 畸形 caution 值 `'high'` 被丢弃不崩溃, profile 仍返回
- D 合法 caution `'shake: 0.5'` 保留
- D 非法 list 行不被当作 motion

### R3 v0.14-native (8 条)
- 新版 frame.md 解析成功
- caution_motion 任意 key (glow/shake/pulse) 完整保留
- 五个权重完整保留
- 越界 caution clamp: 1.5→1.0, -0.3→0.0, 边界保留
- 越界权重 clamp: 2.5→1.0, -1.0→0.0
- `_build_weight_directive(native)` 返回非空指令
- `audit_weight_consistency(native, consistent)` 无 issue
- `[元数据] plugin.yaml 与 compat/hyperframes-support.json 版本一致 (0.14.0)`

---

## 结论

**向后兼容的核心迁移契约成立**: 旧 `forbidden_motion` list 能被正确解析、
迁移为 `caution_motion` dict (0.9), 新格式优先级正确, 混合/畸形/clamp 场景
均不崩溃。22 条硬契约断言全 PASS。

但迁移链路存在**系统性的下游断层与一个功能性 bug**:

1. **最严重 — [7] BLOCK-COLLISION**: 跨块名误匹配会把无关 motion 泄漏进
   `ControlProfile.caution_motion`, 且该结构在官方 SKILL.md 中有文档化示例,
   非空想风险。建议优先修复。
2. **悬崖式失败 — [5] SILENT-DATA-LOSS**: forbidden_motion 误写为 dict 格式
   会静默吞掉整个 control_profile, 无任何提示。
3. **数据断层 — [1] + [2] + [3]**: caution_motion 进了对象却无注入、无审计、
   无弃用警告, 迁移事实上对产出无约束力。
4. **默认不一致 — [4]**: `from_frame_md` 与 `Weights()` 对 atmosphere_density
   的默认值分歧 (0.5 vs 0.4), 影响氛围层数上限判定。
5. **设计观察 — [6]**: 零侵入迁移无源文件升级工具, 需配合 doctor 提示引导。

修复优先级建议: [7] > [5] > [1]+[2]+[3] (一组) > [4] > [6]。
