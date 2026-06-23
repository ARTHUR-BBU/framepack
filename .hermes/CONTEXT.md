# hyperframes 开发工程 — 工作交接台

> 新对话打开后，读完本文就能接上。
> 这不是历史日志，是当前手台；旧状态靠 Git 历史追溯。

## 当前状态

<!-- ⚠️ 此区块每次会话结束时整块替换。不要在上面追加。 -->

**阶段**: v0.15.0 release-prep — Framepack 全面转向 HyperFrames 0.7.3 Director Workbench
**分支**: `main`（release-prep commit 已完成；`assets/` 与 `.hermes/reports/` 旧现场仍未跟踪，不入库）
**源码版本**: plugin.yaml = 0.15.0
**正式发布**: 尚未 tag / 尚未 GitHub Release；release artifact 应指向 review-fix 后的最新功能 commit（见 git log 顶部），不要 tag 到旧的 `7c44713`。
**HyperFrames CLI**: 项目依赖与实际本地 CLI 已升级到 `hyperframes@0.7.3`
**验证**: source pytest 586 passed / 1 skipped；deployed pytest 586 passed / 1 skipped；test_team_auto_test passed=4 failed=0 skipped=1；HyperFrames 0.7.3 blank init + lint = 0 errors / 0 warnings；source→deploy 212 files md5 match；deployed smoke pass
**注意**: 已补人工独立 review；发现并修复一个黄灯：`hyperframes_adapter` 仍把 0.6 时代 `validate/layout/play` 当当前 0.7.3 命令表。现在由 unknown-command conservative fallback 兜底。

### 本轮做了什么

- ✅ **版本升级**：Framepack 从 v0.14.2 升到 v0.15.0，README / 中文 README / AGENTS / plugin.yaml / skills / hooks / tests / templates / package pin 全面同步。
- ✅ **HyperFrames 0.7.3 支持窗口**：`compat/hyperframes-support.json` 设为 supported_min=0.7.3、supported_max_tested=0.7.3、soft_max=0.7.x、hard_block_below=0.7.0。
- ✅ **Director Workbench MVP**：新增 `core/intent_router.py`、`core/handoff_manifest.py`、`core/pre_render_audit.py`，覆盖分诊、交接单、渲染前口味审计。
- ✅ **Hook 接线**：`pre_tool_call` 在 preview/render/publish/cloud 这类用户可见生产表面注入 Pre-render Taste Audit；lint 仍只做技术检查，不触发口味审片。
- ✅ **文案转向**：门脸文档不再把 Framepack 描述成旧版 Prompt Factory，而是明确“Framepack 管导演；HyperFrames 0.7.3 管制作”。
- ✅ **标准部署**：完整同步 `framepack-plugin/` 到 `F:/Hermes_windows/plugins/framepack/`，排除缓存，逐文件 MD5 验证。
- ✅ **Review fix**：移除 0.7.3 当前命令表中不存在的 `validate/layout/play` happy-path 断言；保留 unknown command 保守 handoff fallback。

### 下次要做什么

1. 如用户要求正式发布 GitHub：先读 `git log --oneline -5`，用最新的 review-fix 功能 commit 作为 `v0.15.0` tag 目标；不要 tag 到旧的 `7c44713`。
2. push branch + tag，并用 `gh release create` 发布 GitHub Release。
3. 发布后再次更新本交接台，明确 tag 指向哪个 commit；后续 handoff commit 只是手台记录，不属于 release artifact。

### 当前关键证据

```text
base commit                                                       → 7c44713 feat: upgrade Framepack for HyperFrames 0.7.3 director workflow
review fix                                                        → 移除旧 HyperFrames validate/layout/play 当前命令表残留
```

### 验证证据

```text
python -m pytest tests/ -q -o "addopts="                       → 586 passed, 1 skipped
部署目录同命令                                                   → 586 passed, 1 skipped
python scripts/test_team_auto_test.py --output-dir ...          → passed=4 failed=0 skipped=1
npx hyperframes@0.7.3 --version                                  → 0.7.3
npx hyperframes@0.7.3 init --example blank && lint               → 0 errors, 0 warnings
source→deploy sync                                               → copied=212, md5_mismatches=0
deployed runtime smoke                                           → deployed_smoke=pass version=0.15.0 hyperframes_supported=0.7.3
targeted review-fix tests                                        → 31 passed, 1 skipped
full source pytest after review fix                              → 586 passed, 1 skipped
deployed command smoke after review fix                          → 19 passed; deployed_command_smoke=pass
```

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
