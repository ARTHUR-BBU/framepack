# hyperframes 开发工程 — 工作交接台

> 新对话打开后，读完本文就能接上。
> 这不是历史日志，是当前手台；旧状态靠 Git 历史追溯。

## 当前状态

<!-- ⚠️ 此区块每次会话结束时整块替换。不要在上面追加。 -->

**阶段**: v0.16.0 已发布；post-release 模板入口 / AGENTS 更新场景 / Kanban 验收流程已闭环。
**分支**: `main` == `origin/main`
**源码版本**: `framepack-plugin/plugin.yaml = 0.16.0`（本轮 post-release 修复不 bump、不移动 v0.16.0 tag）
**最后提交**: `1c0e937 handoff: record template entrypoint and kanban acceptance`
**部署状态**: active plugin `F:/Hermes_windows/plugins/framepack/` 已同步关键文件并通过 deployed smoke（plugin.yaml 源码/部署 md5 一致 = `d2bae8846f3b70200c2ecb40ec32e5a6`）。
**测试工作台**: `F:/Framepack-01-test` 已刷新到新 guardrails hash；`project_context_current=true`、`stale_files=none`。

### 上次做了什么

- ✅ 发布后补齐 `v0.16 Template Menu First` 入口：`guardrails.md` + repo `AGENTS.md` managed block 都写入"模板/模版/视频模板/参考模板/内置模板 → 先走 Template Arsenal 菜单，不只搜历史 mp4/case"。
- ✅ 修复 `intent_router.py`：`视频模版给我参考吗`、`内置模板`、`模板起步` 等人话表达路由到 `framepack-template-reuse`，且 `framepack_role` 包含 `template menu first`；"提炼成可复用模板"仍优先 `framepack-reference-extraction`。
- ✅ 修复 `context_hydrator.py` 根因：同版本 `0.16.0` 但 managed block hash/content 不一致也会标 stale 并 `update_block`，避免旧工作台因版本号相同错过新入口提醒。
- ✅ 用 deployed hydrator 刷新测试工作台：修复前 `stale_count=8`，修复后 `stale_count=0`；root/case `AGENTS.md` 均包含 `v0.16 Template Menu First`。
- ✅ 主模型 + 子代理验证完成：targeted 43 passed、full plugin suite 881 passed、deployed targeted 43 passed、security scan 0、子代理 `deleg_7b8919d3` PASS。
- ✅ 试跑 Hermes Kanban 测试组 board `framepack-update-acceptance`：4 张卡全部 done（新用户 doorplate、旧工作台 hydration、模板入口 routing、synthesis）。
- ✅ 新增本地正式 skill `framepack-update-acceptance-kanban`（路径 `F:/Hermes_windows/skills/devops/framepack-update-acceptance-kanban/SKILL.md`），用于以后"跑 Framepack 更新验收"。
- ✅ 提交 `1c0e937` 把本轮模板入口修复 + Kanban 验收成果固化进交接台（上一版交接台漏记此 commit，本版补正）。

### 当前关键证据

```text
git: main == origin/main, HEAD=1c0e937
plugin.yaml source/deployed md5: d2bae8846f3b70200c2ecb40ec32e5a6 (match)
Framepack tests: 881 passed
Deployed focused tests: 43 passed
Workbench context: current=true, stale_files=0
Kanban board: framepack-update-acceptance → done=4, blocked=0, running=0
New skill validation: exists=True, frontmatter_ok=True, chars=12049
```

### 注意点 / 坑位

- Kanban 试跑证明模式可用，但当前机器只有 `default` profile，且 `glm-5.1` 并发 worker 会撞 Z.ai/GLM HTTP 429。两个 worker 是"验收已 PASS，但 final comment/complete 阶段 429 崩溃"，已按日志证据人工恢复。
- 以后正式 Framepack 更新验收建议：加载 `kanban` + `framepack-update-acceptance-kanban`，先 `hermes profile list` / `hermes kanban assignees`，若只有 default 则 `dispatch --max 1`，或配置专用 tester/reviewer/synthesizer profiles。
- `framepack-update-acceptance-kanban` 是 user-local skill，已写入 `F:/Hermes_windows/skills/...`，不在 Framepack repo 里；当前 session 可 `skill_view` 读到。
- 本轮不移动 v0.16.0 tag；post-release 修复在 `main` HEAD。测试组如问"正式版本"需区分：源码版本仍 `0.16.0`，post-release 修复 commit 是 `1c0e937`。

### 下次要做什么

1. 如继续 GLM5.1 的"Framepack v0.16 发布视频"dogfood，先确认它现在会被 `Template Menu First` 触发：用户问"有没有视频模版参考"时必须先跑 builtins/install-builtin/menu/recommend/select，而不是只搜历史 mp4。
2. 为 Kanban 测试组配置专用 profiles（建议 `framepack-tester-fast` / `framepack-reviewer` / `framepack-synthesizer`），或默认低并发 `--max 1`。
3. 下一次 Framepack 更新/发版后，直接用 `framepack-update-acceptance-kanban` skill 创建/运行 acceptance board，不再临时派散兵。

## 设计文档

- `F:/hyperframes/.hermes/designs/2026-06-19--v014-weight-control-system.md` — 权重控制系统设计
- `F:/hyperframes/.hermes/designs/2026-06-19--sprite-forge-integration.md` — Sprite Forge 集成设计
- `F:/hyperframes/.hermes/designs/2026-06-21--execution-contract-audit.md` — Execution Contract Audit 设计

## 文件索引

- 源码: `F:/hyperframes/framepack-plugin/`
- 部署: `F:/Hermes_windows/plugins/framepack/`
- 权重核心: `core/control_profile.py` + `core/restraint_audit.py`
- Hook 穿透: `hooks/on_post_tool_call.py`（_build_weight_directive + _build_weight_consistency_report）
- HyperFrames 兼容: `core/hyperframes_adapter.py`（命令分类）+ `core/hyperframes_support.py`（版本窗口）+ `core/environment_doctor.py`（doctor）+ `compat/hyperframes-support.json`（矩阵）
- Sprite Forge: `skills/framepack-sprite-forge/`
- 独立 skill: `F:/Hermes_windows/skills/software-development/framepack/SKILL.md`
- 测试报告: `F:/hyperframes/framepack-e2e-test/reports/`

## 开发铁律提醒

- TDD: RED → GREEN → 全量回归 → 部署同步(md5) → git commit
- 部署同步必须用 content hash（md5），不能只比 file size
- 改完 PLUGIN 文件必须同步到 `F:/Hermes_windows/plugins/framepack/`
- 修复 skill 用到问题应 patch skill_manage
