# hyperframes 开发工程 — 工作交接台

> 新对话打开后，读完本文就能接上。
> 这不是历史日志，是当前手台；旧状态靠 Git 历史追溯。

## 当前状态

<!-- ⚠️ 此区块每次会话结束时整块替换。不要在上面追加。 -->

**阶段**: v0.15.0 已正式发布；main 处于 post-release / Unreleased 开发线；Template Arsenal 全链路（scaffold/package/register/select/recommend + director skill template-reuse 流程）已本地完成并准备提交/推送。
**分支**: `main`（待提交变更：recommend 匹配打分 + CLI recommend + director skill template-reuse flow + simplify 死代码清理；正式 release tag 不移动）
**源码版本**: `framepack-plugin/plugin.yaml = 0.15.0`（正式源码版本未 bump；本轮是 Unreleased 开发成果）
**正式发布**: GitHub Release `v0.15.0` 已发布；tag 固定指向 `4e6eead`，后续 commits 不属于 release artifact，除非另行发新版。
**HyperFrames CLI**: 项目依赖与本地 CLI 支持窗口为 `hyperframes@0.7.3`
**验证**: 最新 full plugin suite `868 passed`；Template Arsenal targeted suite `45 passed`；worktree added-line security scan `0 findings`；新增/变更 plugin 文件已同步到 `F:/Hermes_windows/plugins/framepack/` 并 MD5 匹配；deployed recommend smoke 通过。
**独立 reviewer**: 本轮独立 reviewer 子代理因 provider HTTP 403 全部失败（基础设施故障，非 review 发现问题）；已按 verification-before-completion 规则做本地 reviewer-mode pass + 最强 gates，不带 `[verified]` 前缀正常提交。
**工作区**: 本地生成目录 `.hermes/backups/`、`.hermes/reports/`、`assets/` 已在 `.gitignore` 中，保留磁盘但不入库。

### 本轮做了什么

- ✅ **Template recommend 匹配打分完成**：新增 `recommend_templates(project_dir, user_intent)`，按 suitable_for/not_suitable_for tag 重叠打分（+2/-3），支持中英文别名 + longest-first span-claim 防 CJK 短词误匹配。
- ✅ **CLI `recommend` 命令完成**：`framepack_template.py recommend --project <dir> --intent <text> --format json`，返回 scored recommendations。
- ✅ **Director skill template-reuse 流程补全**：`skills/framepack-director/SKILL.md` 新增 Template-Reuse Flow 段落（T0 列表推荐 → T1 选择 → T2 收集参数 → T3 标准 Phase1/2 → T4 交接），让 Agent 知道 intent router 命中 `framepack-template-reuse` 后走完整模板链路。
- ✅ **simplify 清理**：删除 `_normalize_tags` 和 `_INTENT_TAGS` 死代码（recommend 重构后不再使用）。
- ✅ **部署目录同步已核验**：changed files 已同步到 `F:/Hermes_windows/plugins/framepack/`；MD5 匹配；deployed smoke 验证 recommend 打分正确。

### 下次要做什么

1. **如果继续**：把 `miara-style-template` 真实样例 package 成正式模板 bundle，走 register → recommend → select → 共创全链路验收。
2. **如果发新版**：先做 version bump 设计/计划；不要移动 `v0.15.0` tag。
3. **如果做真实工作台**：在 `F:/Framepack-01-test` 里注册模板，验证 director skill template-reuse flow 在真实项目里跑通。

### 当前关键证据

```text
正式 release tag deref                         → 4e6eead (v0.15.0 artifact，不移动)
recommend 设计/计划                            → .hermes/designs/2026-06-26--template-arsenal-registration-and-use.md
新增核心                                       → framepack-plugin/core/templates/arsenal.py (recommend_templates)
Director skill template-reuse flow             → framepack-plugin/skills/framepack-director/SKILL.md
部署目录                                       → F:/Hermes_windows/plugins/framepack/
```

### 验证证据

```text
Template Arsenal targeted suite                → 45 passed
Full Framepack plugin suite                     → 868 passed
Worktree added-line security scan               → 0 findings
CLI smoke (recommend)                           → demo template score=2, matched=[product launch], exit=0
Deploy sync                                     → MD5 matched for 5 changed plugin files
Deployed smoke (recommend)                      → top_id=demo, top_score=2, top_matched=[product launch], unrelated_score=0
Independent reviewer                            → UNAVAILABLE (provider HTTP 403); local reviewer-mode pass completed
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
