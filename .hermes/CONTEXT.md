# hyperframes 开发工程 — 工作交接台

> 新对话打开后，读完本文就能接上。
> 这不是历史日志，是当前手台；旧状态靠 Git 历史追溯。

## 当前状态

<!-- ⚠️ 此区块每次会话结束时整块替换。不要在上面追加。 -->

**阶段**: v0.15.0 已正式发布；main 处于 post-release / Unreleased 开发线，Template Arsenal registration/use UX 已本地完成并准备提交/推送。
**分支**: `main`（当前待提交变更：Template Arsenal 注册桥 + select/use UX；正式 release tag 不移动）
**源码版本**: `framepack-plugin/plugin.yaml = 0.15.0`（正式源码版本未 bump；本轮是 Unreleased 开发成果）
**正式发布**: GitHub Release `v0.15.0` 已发布；tag 固定指向 `4e6eead`，后续 commits 不属于 release artifact，除非另行发新版。
**HyperFrames CLI**: 项目依赖与本地 CLI 支持窗口为 `hyperframes@0.7.3`
**验证**: 最新 full plugin suite `863 passed`；Template Arsenal targeted suite `40 passed`；新增/变更 plugin 文件已同步到 `F:/Hermes_windows/plugins/framepack/` 并 MD5 匹配；deployed register/select smoke 通过。
**工作区**: 本地生成目录 `.hermes/backups/`、`.hermes/reports/`、`assets/` 已在 `.gitignore` 中，保留磁盘但不入库。

### 本轮做了什么

- ✅ **Template Arsenal 注册桥完成**：新增 `core/templates/arsenal.py`，支持把完整 template bundle 注册进 `.framepack/arsenal.json`，entry 为 `kind=template_suite`、`source=local`、带 `sha256:` bundle hash、参数/适用范围/路径等元数据。
- ✅ **Template Use UX 完成**：新增 `select_template()`，写 `.framepack/template-selection.md`，记录选中的模板、brief、参数、素材、缺失参数问题；仍回到标准 Framepack 共创，不创建新 runtime。
- ✅ **CLI 补齐**：`scripts/framepack_template.py` 新增 `register`、`registered`、`select` 三个命令；保留 `inspect/list/scaffold/package`。
- ✅ **幂等与安全性补强**：重复注册未变化 bundle 返回 `changed=False`，不反复写 registry；missing project/template/select id 保持 exit 2 合约。
- ✅ **设计/计划落盘**：`.hermes/designs/2026-06-26--template-arsenal-registration-and-use.md` 与 `.hermes/plans/2026-06-26_091500-template-arsenal-registration-use.md`。
- ✅ **部署目录同步已核验**：`core/templates/arsenal.py`、`scripts/framepack_template.py`、相关 tests 已同步到 `F:/Hermes_windows/plugins/framepack/`；MD5 匹配；deployed smoke 验证 register/select/idempotent。

### 下次要做什么

1. **如需正式发版**：先做 version bump 设计/计划；不要移动 `v0.15.0` tag。
2. **如果继续 Template Arsenal**：下一层可以把注册/选择流程接进 Framepack 创意技能文档，让 Agent 在“模板视频”请求里自动展示 registered templates 并生成 co-creation checklist。
3. **如果做真实样例**：可把 `F:/Framepack-01-test/cases/miara-style-template` package 成正式模板 bundle，再 register/select 走一遍真实工作台验收。

### 当前关键证据

```text
正式 release tag deref                         → 4e6eead (v0.15.0 artifact，不移动)
Template Arsenal registration/use design        → .hermes/designs/2026-06-26--template-arsenal-registration-and-use.md
Template Arsenal registration/use plan          → .hermes/plans/2026-06-26_091500-template-arsenal-registration-use.md
新增核心模块                                   → framepack-plugin/core/templates/arsenal.py
部署目录                                       → F:/Hermes_windows/plugins/framepack/
```

### 验证证据

```text
Template Arsenal targeted suite                → 40 passed
Full Framepack plugin suite                     → 863 passed
Worktree added-line security scan               → 0 findings
CLI smoke                                       → scaffold → register → registered → select OK
Deploy sync                                     → MD5 matched for changed plugin files
Deployed smoke                                  → register id=demo; second register changed=False; missing_params=tagline; selection exists=True
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
