# hyperframes 开发工程 — 工作交接台

> 新对话打开后，读完本文就能接上。
> 这不是历史日志，是当前手台；旧状态靠 Git 历史追溯。

## 当前状态

<!-- ⚠️ 此区块每次会话结束时整块替换。不要在上面追加。 -->

**阶段**: v0.16.0 已发布；post-release 修复“Template Menu First 入口提醒未进入 AGENTS managed block / 同版本 guardrails hash 漂移不触发 hydrate”的问题。
**分支/worktree**: `fix/template-entry-reminder` at `F:/hyperframes-worktrees/template-entry-reminder`，准备合并回 main。
**源码版本**: `framepack-plugin/plugin.yaml = 0.16.0`（本轮不 bump 版本、不移动 v0.16.0 tag）
**部署状态**: 已同步 active plugin `F:/Hermes_windows/plugins/framepack/`，6 files MD5 matched。
**测试工作台**: 已用 deployed hydrator 刷新 `F:/Framepack-01-test`，修复前 `stale_count=8`，修复后 `project_context_current=true`、`stale_files=none`；根目录和 case AGENTS 都包含 `v0.16 Template Menu First`。

### 本轮根因

- 旧问题不是单纯 Director skill 文案不够，而是入口层级缺失：v0.16 模板菜单流程只进了 Director skill，没有进 `guardrails.md` / AGENTS managed block。
- 更深 bug：`context_hydrator.check_context_sync()` 只比较 managed block 的 `version`，不比较 guardrails hash/content；同为 `0.16.0` 时新增入口提醒不会刷新旧 AGENTS。

### 已完成修复

- ✅ `guardrails.md` 新增 `v0.16 Template Menu First` 门口招牌：模板/模版/视频模板/参考模板/内置模板/模板起步 → 先 builtins/install-builtin/menu/recommend/select，历史 case/mp4 只能做参考片。
- ✅ `intent_router.py` 扩展模板表达：`视频模版给我参考吗`、`内置模板`、`模板起步` 等路由到 `framepack-template-reuse`，framepack_role 明确 `template menu first`。
- ✅ `context_hydrator.py` 增加 same-version hash/content drift 检测：同版本但 managed block 内容不同也标 stale，并 `update_block`。
- ✅ repo `AGENTS.md` managed block 已刷新，包含 Template Menu First。
- ✅ deployed plugin 已刷新，deployed tests/smoke 通过。
- ✅ 测试工作台 root/case AGENTS 已刷新到新 hash。

### 验证证据

```text
RED tests before fix:
- guardrails Template Menu First contract failed
- intent router human template phrases failed
- same-version changed guardrails hash was not stale

GREEN after fix:
- targeted contract/router/hydrator        → 43 passed
- full Framepack plugin suite              → 881 passed
- deployed targeted suite                  → 43 passed
- deployed route smoke                     → framepack-template-reuse, role_has_menu=True
- deployed guardrails payload smoke         → block_has_menu=True, block_has_cli=True
- workbench hydrate smoke                  → before stale_count=8; after stale_count=0
- added-line security scan                 → 0 findings
- git diff --check                         → clean
```

### 下一步

1. 等 `deleg_7b8919d3` 独立 review/test 回来。
2. 若无 blocker：commit → merge/cherry-pick 到 main → push。
3. 若有 blocker：补 RED regression → fix → targeted/full/deployed/workbench verify → follow-up commit。

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
