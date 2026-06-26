# hyperframes 开发工程 — 工作交接台

> 新对话打开后，读完本文就能接上。
> 这不是历史日志，是当前手台；旧状态靠 Git 历史追溯。

## 当前状态

<!-- ⚠️ 此区块每次会话结束时整块替换。不要在上面追加。 -->

**阶段**: v0.16.0 release-prep 完成；准备 tag + GitHub Release + push。
**分支**: `main`（待提交：version bump 0.15.0→0.16.0 全量同步 + 真实样例全链路 smoke 验证 + recommend/UX 补全；release tag 尚未创建）
**源码版本**: `framepack-plugin/plugin.yaml = 0.16.0`
**正式发布**: GitHub Release `v0.15.0` 已发布（tag 固定 `4e6eead`）；v0.16.0 尚未 tag/release。
**HyperFrames CLI**: 项目依赖与本地 CLI 支持窗口为 `hyperframes@0.7.3`
**验证**: full plugin suite `868 passed`；version-sync test GREEN；worktree security scan `0 findings`；部署目录 27 files MD5 matched；真实样例全链路 smoke 8/8 GREEN。
**工作区**: 本地生成目录 `.hermes/backups/`、`.hermes/reports/`、`assets/` 已在 `.gitignore` 中，保留磁盘但不入库。

### 本轮做了什么

- ✅ **真实样例全链路 smoke**：F:/Framepack-01-test/cases/miara-style-template 走了 inspect → package → register → registered → recommend → select 全链路，8/8 GREEN。recommend 对 "产品发布品牌讲解视频" 命中 score=4（product launch + brand explainer）。
- ✅ **Template recommend 匹配 + CLI + director skill template-reuse flow** 已提交推送（a6c0b83）。
- ✅ **version bump 0.15.0 → 0.16.0 全量同步**：plugin.yaml、__init__.py、hooks、core constants、scripts、compat、templates、全部 8 个 skill frontmatter、README/AGENTS、test_deploy_manifest.py assertions、test fixtures — 共 24+ 文件 bumped；flattened v0150→v0160。
- ✅ **部署目录全量同步**：27 files MD5 matched；deployed plugin.yaml = 0.16.0。
- ✅ **独立 active skill 同步**：`F:/Hermes_windows/skills/software-development/framepack/SKILL.md` 也同步到 0.16.0。

### 下次要做什么

1. **等 glm-5-turbo 子代理回来** → 如果无 blocker，做 commit + annotated tag `v0.16.0` + GitHub Release + push。
2. **如果有 blocker** → 按 TDD 修复后重跑验证再发。

### 当前关键证据

```text
v0.15.0 release tag deref                        → 4e6eead (不移动)
当前源码版本                                     → plugin.yaml = 0.16.0
真实样例                                         → F:/Framepack-01-test/cases/miara-style-template
部署目录                                         → F:/Hermes_windows/plugins/framepack/ (27 files MD5 matched)
```

### 验证证据

```text
Full Framepack plugin suite                      → 868 passed
Version-sync test (test_deploy_manifest)         → 5 passed (GREEN)
Worktree added-line security scan                → 0 findings
Real sample full-chain smoke                     → 8/8 GREEN
Deploy sync                                      → 27/27 MD5 matched
Real sample recommend                            → miara-style-template score=4, matched=[product launch, brand explainer]
Real sample select                               → missing_params=[tagline], selection evidence written
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
