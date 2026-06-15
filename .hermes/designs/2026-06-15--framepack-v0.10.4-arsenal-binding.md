# Framepack v0.10.4 Design — Arsenal Auto-Init + Weapon Binding

Date: 2026-06-15
Status: draft, awaiting 老田 approval
Branch: framepack-agent-platform
Base release: v0.10.3 / tag v0.10.3 / release commit 915623e

## 1. Why this release exists

v0.10.3 已经证明 Quality Beyond Lint 的方向成立：

- 自动测试 5/5 PASS
- whop 全新真实案例从 reference DNA 到 render 全链路绿灯
- HyperFrames lint 0 errors，validate 0 errors，snapshot 6/6，render exit_code=0
- Quality Audit 能抓到 lint 看不见的问题

但测试组给了两张“产品 gap 小票”：

1. P0 arsenal_missing ×1
   Fresh case 没有 `.framepack/arsenal.json`。说明收发室不是稳定自动初始化，而是依赖某些 hook 路径/Agent 写法刚好触发。

2. P1 manifest_weapon_not_called ×9
   Manifest 声明了武器，HTML 里实现了相同逻辑，但没有调用注册函数名。也就是 Agent 看了菜谱以后“凭记忆炒菜”，味道可能对，但没走厨房标准工序。

v0.10.4 目标不是扩大功能面，而是把 v0.10.3 检出的两个 gap 变成明确机制。

## 2. Product boundary

Framepack 仍然不接管 HyperFrames 的 HTML 制作。

Framepack 可以做：

- 创建/维护 `.framepack/arsenal.json` 项目武器账本
- 在 HyperFrames handoff 前 reconcile Manifest weapons
- 提供武器函数名映射、调用契约、审计证据
- 在 Quality Audit 中区分“没调用函数名”“允许 HANDWRITE”“可能是 pattern-equivalent inline”
- 给 Agent 明确、短促、可执行的安检小票

Framepack 不做：

- 自动重写 index.html
- 替代 `npx hyperframes lint/validate/snapshot/render`
- 把内联 GSAP 自动魔改成函数调用
- 让 Quality Audit 变成阻断门

比喻：v0.10.4 是把厨房的“出入库登记 + 菜谱编号 + 点菜单核对”补齐，不是让仓库管理员亲自下锅炒菜。

## 3. Design options

### Option A — Hotfix-only: pre_tool_call ensure arsenal

做法：

- 在所有 handoff-consuming HyperFrames 命令前，如果存在 `.hyperframes/expanded-prompt.md`，就无条件 `ensure_arsenal()` + `reconcile_manifest()`。
- Quality Audit 对 missing arsenal 降噪，因为 preflight 会自动创建。

优点：

- 改动小
- 能直接消灭 fresh project 的 arsenal_missing
- 风险低

缺点：

- 不解决 weapon function binding，只是把 P0 干掉
- Agent 仍可能内联 GSAP
- v0.10.4 太像补丁，不像产品闭环

### Option B — Contract-first: Arsenal + Binding Contract + Audit Smarter

做法：

- 明确 `.framepack/arsenal.json` 是项目必备账本。
- 增加 weapon binding contract：每个 builtin weapon 在 registry 中带 canonical function name，例如 `text-split-enter -> textSplitEnter`。
- Quality Audit 使用同一张映射表，不再散落在 `quality_audit.py`。
- Audit 输出更精确：
  - `manifest_weapon_not_called`: 没发现 canonical function 调用
  - `manifest_weapon_handwrite_allowed`: Manifest 显式 HANDWRITE，不计问题
  - `manifest_weapon_inline_pattern_detected`: 可能是内联等价实现，作为 P2/P3 或 info，提示改为函数调用
- pre_tool_call 和 post_tool_call 都走统一 sync 函数，避免“只有 write_file 触发才建 arsenal”。

优点：

- 正面解决两个测试组 gap
- 仍然不越界写 HTML
- 以后下载武器、hash 去重、使用审计都有稳定元数据入口
- 测试可写得很清楚

缺点：

- 需要小幅重构 builtin weapon metadata 和 quality audit
- 需要新增测试，避免误把 HANDWRITE/unknown/pattern-equivalent 搞混

### Option C — Runtime injector: 自动把 weapon 函数注入 HTML

做法：

- Framepack 根据 arsenal/Manifest 生成 JS helper 或 patch index.html，让 HTML 里有 canonical function call。

优点：

- 表面上能让审计全绿
- Agent 不调用函数也能被“补课”

缺点：

- 越过 Framepack 边界，开始替 HyperFrames/Agent 写 HTML
- 容易制造“表面全绿，实际逻辑被二次包装”的假安全
- 后续 bug 会变成 Framepack/HyperFrames 互相甩锅

不推荐。这个像保安发现厨师没按流程，直接冲进厨房替他炒两铲，最后锅糊了没人负责。

## 4. Recommendation

推荐 Option B。

v0.10.4 应该叫：Arsenal Binding Contract。

一句话目标：

> Manifest 里声明的每个武器，都必须能在 `.framepack/arsenal.json` 中找到登记、函数名、来源和 used_by；HTML 不一定由 Framepack 写，但 Quality Audit 能判断它有没有按登记函数调用。

## 5. Proposed architecture

### 5.1 Single source of truth: builtin weapon metadata

现状：

- `core/builtin_weapons.py` 有 builtin weapon catalog，但只包含 id/source/kind/skill/file/code/engine。
- `core/quality_audit.py` 另有 `WEAPON_TO_FUNCTION` 字典。

问题：

- 同一份事实散落两处。
- 新增 weapon 时容易忘记补 function mapping。

设计：

- 在 `core/builtin_weapons.py` 的每个 weapon entry 中增加：
  - `function`: canonical JS function name
  - 可选 `aliases`: 兼容旧函数名或大小写差异
  - 可选 `pattern_hints`: 用于未来 inline pattern 检测，不在 v0.10.4 第一刀强依赖

示例：

```python
"text-split-enter": _part("text-split-enter", function="textSplitEnter")
```

Quality Audit 从 builtin catalog 读取 function，而不是自己维护 `WEAPON_TO_FUNCTION`。

### 5.2 Arsenal auto-init: hook path independent

现状：

- `ensure_arsenal()` 本身已经会创建 registry。
- post_tool_call 写 `.hyperframes/expanded-prompt.md` 会调用 `_sync_arsenal_for_expanded_prompt()`。
- pre_tool_call HyperFrames handoff 命令也会 `_audit_arsenal_for_hyperframes()`。
- 但真实 fresh case 仍然 missing，说明某些路径没有触发，或测试组是直接跑 audit CLI 而不是先跑触发 hook 的 HyperFrames command。

设计：

新增 core 层函数：

```python
def sync_arsenal_from_project(project_dir: Path, plugin_dir: Path | None = None) -> ArsenalSyncResult
```

职责：

1. 如果存在 `.hyperframes/expanded-prompt.md`：
   - ensure `.framepack/arsenal.json`
   - parse Execution Manifest
   - reconcile_manifest
   - save
2. 如果没有 expanded-prompt：
   - 不创建 arsenal，避免空项目被污染
3. 不依赖 hook 类型。

调用点：

- post_tool_call expanded-prompt write
- pre_tool_call handoff-consuming HyperFrames command
- `scripts/framepack_quality_audit.py` / `audit_project()` 在读取 arsenal 前可选择 report-first sync？

关键决策：

Quality Audit 是否应该自动创建 arsenal？

推荐：CLI 默认不 mutate，新增 `--sync-arsenal` 选项；hook 路径会 sync。

理由：

- 报告工具默认不应该偷偷写文件。
- 测试组如果直接跑 audit CLI，missing arsenal 是真实发现。
- 但用户路径通过 HyperFrames command 会自动补齐。

v0.10.4 可以把测试组脚本改为先跑 `framepack_quality_audit.py --sync-arsenal` 或在 auto-test 中显式验证 sync 行为。

### 5.3 Weapon binding audit

现状：

- `_audit_parameter_drift()` 找不到 function call 时直接报 P1 `manifest_weapon_not_called`。
- 它不会识别 inline pattern，也不会给 Agent 清楚的修复建议。

设计：

重命名/扩展概念：

- `manifest_weapon_not_called`：canonical function 没调用。P1。
- `weapon_parameter_drift`：canonical function 调了，但参数漂移。P1。
- `manifest_weapon_unknown_function`：builtin catalog 没有 function metadata。P2/P3，开发侧元数据缺失。
- 可选 `manifest_weapon_inline_pattern_detected`：发现 `gsap.fromTo` 等疑似内联实现。P2 或 info，message 明确“逻辑可能对，但请改为 canonical function call”。

v0.10.4 第一版不需要做复杂 AST。只做轻量 heuristics：

- 如果 weapon 未调用函数，但 scene HTML/JS 中有 `gsap.to|gsap.from|gsap.fromTo`，且 weapon id 出现在 Manifest params 附近或对应 scene selector 附近，则加 details：`inline_gsap_detected: true`。
- 不把它降成 PASS；因为铁律是“武器优先，禁止裸写 GSAP”。

### 5.4 Test strategy

必须走 TDD。

新增/调整测试：

1. Arsenal sync core
   - expanded-prompt 存在 + no arsenal → sync creates registry and registers builtin weapons
   - no expanded-prompt → sync does not create empty arsenal
   - existing registry → preserve user entries + update used_by

2. Hook integration
   - pre_tool_call HyperFrames lint/render 在 no arsenal but expanded-prompt exists 时创建 registry
   - discovery commands 仍不创建 registry

3. Quality Audit
   - function mapping 从 builtin catalog 读取
   - missing canonical call 报 `manifest_weapon_not_called`
   - HANDWRITE 不报 missing function
   - parameter drift 仍能报
   - no arsenal + no sync 保持 `arsenal_missing`
   - `--sync-arsenal` 后不再报 `arsenal_missing`

4. CLI
   - `framepack_quality_audit.py --sync-arsenal --format json` 写 registry 并输出 clean/expected issues
   - `--output` 嵌套目录仍创建父目录（防止 v0.10.3 regression）

### 5.5 Deployment/versioning

如果实现完成并决定发 v0.10.4，必须全面同步：

- `plugin.yaml`
- `__init__.py` logger
- hooks docstring/logger
- `core/arsenal_registry.py DEFAULT_PLUGIN_VERSION`
- `compat/hyperframes-support.json`
- plugin skills frontmatter
- standalone `framepack` skill
- README / docs / CHANGELOG / AGENTS.md
- 部署目录 `F:\Hermes_windows\plugins\framepack`

但实现阶段不要先 bump 版本。先以 Unreleased/v0.10.4-dev 开发，测试通过后再全面 bump。

## 6. Open questions for 老田

1. Quality Audit CLI 是否允许 `--sync-arsenal` 这种显式写入模式？
   我的建议：允许，但默认只读。

2. `manifest_weapon_not_called` 是否保持 P1？
   我的建议：保持 P1。因为这不是审计器误报，而是“厨房没按登记菜谱出菜”。即使画面看起来对，也违反武器铁律。

3. v0.10.4 是否只解决这两个 gap？
   我的建议：是。不要顺手把 Timing Gate / Asset Gate / Render Integrity 都塞进来。那是 v0.10.5+，否则一锅乱炖。

## 7. Non-goals

- 不做自动 HTML patcher
- 不做 JS AST parser
- 不做 render/snapshot 视觉判断
- 不做第三方 weapon 下载器升级
- 不做 Timing/Asset/Render Integrity 第二层大扩展

## 8. Spec self-review

- 没有 placeholder/TODO。
- 没有要求 Framepack 写 HTML，边界清楚。
- 方案聚焦测试组发现的两个 gap。
- `--sync-arsenal` 默认只读/显式写入的边界明确。
- 最大风险：inline pattern detection 容易变成半吊子 AST。已限制为轻量 details，不作为 pass/fail 依据。
