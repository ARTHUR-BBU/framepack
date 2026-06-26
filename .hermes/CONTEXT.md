# hyperframes 开发工程 — 工作交接台

> 新对话打开后，读完本文就能接上。
> 这不是历史日志，是当前手台；旧状态靠 Git 历史追溯。

## 当前状态

<!-- ⚠️ 此区块每次会话结束时整块替换。不要在上面追加。 -->

**阶段**: v0.15.0 已正式发布；main 处于 post-release / Unreleased 开发线，Template Arsenal MVP + Gate Engine 已落地并本地验证，尚未推远端。
**分支**: `main`（功能/整理 HEAD = `9036460 chore: refresh Framepack guardrails context`；本 CONTEXT 提交是 handoff-only；本地相对 `origin/main` ahead，需 push 才到远端）
**源码版本**: `framepack-plugin/plugin.yaml = 0.15.0`（正式源码版本未 bump；以下是 Unreleased 开发成果）
**正式发布**: GitHub Release `v0.15.0` 已发布；tag 固定指向 `4e6eead`，后续 commits 不属于 release artifact，除非另行发新版。
**HyperFrames CLI**: 项目依赖与本地 CLI 支持窗口为 `hyperframes@0.7.3`
**验证**: 最新 full plugin suite `852 passed`；Template Arsenal targeted suite `29 passed`；新增/变更 plugin 文件已同步到 `F:/Hermes_windows/plugins/framepack/` 并 MD5 匹配；deployed parent-conflict smoke 通过。
**工作区**: 代码/docs 已提交；`.hermes/backups/`、`.hermes/reports/`、`assets/` 是本地生成/旧现场，已加入 `.gitignore`，保留在磁盘但不入库。

### 本轮做了什么

- ✅ **Gate Engine 开发线已落地**：`d6b3e61 feat: add Framepack gate engine` + `fc1f83a fix: tighten Framepack gate readiness output`。
- ✅ **Template Arsenal MVP 已落地**：`ff4c42b feat: add Framepack template arsenal MVP`，新增 `core/templates/` 与 `scripts/framepack_template.py`，支持 template card inspect/list/scaffold/package。
- ✅ **Template productization hardening 已完成**：`8b039cb fix: harden template bundle productization`，补 source/target 防护、symlink skip、selected-copy 与 reference artifacts 保留。
- ✅ **独立 reviewer 两轮 blocker 已修**：`c78b0b7 fix: address template arsenal review blockers` + `2cb466d fix: preflight template package parent conflicts`。CLI missing path 现在 exit 2；package 预检会在写入前拦截 planned file/parent dir 冲突，不留半成品。
- ✅ **Framepack guardrails managed block 已刷新**：`9036460 chore: refresh Framepack guardrails context`，AGENTS.md 的 managed block 带 version/hash/source；本地生成现场加入 `.gitignore`，避免误提交报告/素材/备份。
- ✅ **部署目录同步已核验**：Template Arsenal changed files 拷贝到 `F:/Hermes_windows/plugins/framepack/`；MD5 匹配；deployed smoke 确认 parent conflict 抛 `FileExistsError` 且不写 `TEMPLATE_CARD.md`。

### 下次要做什么

1. **先决定是否 push**：当前 `main` 本地 ahead origin（包含 Gate Engine、Template Arsenal、reviewer fixes、guardrails refresh、handoff）。若要共享给其他 agent/机器，执行 `git push origin main`。
2. **如果继续 Template Arsenal**：下一层建议做 `arsenal.json` 注册桥（template_suite weapon registration），再做 Template Use UX（列表 → 选模板 → 参数/素材共创 → 标准 frame.md/expanded-prompt.md）。
3. **如果准备发新版**：不要移动 `v0.15.0` tag；先做 version bump 设计/计划，区分 “0.15.0 release artifact” 与 “Unreleased commits”。
4. **如果继续 housekeeping**：保持 `.hermes/reports/` 与 `assets/` 不入库；它们已经被 `.gitignore` 忽略，除非明确要产品化为正式样例资产。

### 当前关键证据

```text
正式 release tag deref                         → 4e6eead (v0.15.0 artifact，不移动)
当前功能/整理 HEAD                            → 9036460 chore: refresh Framepack guardrails context
Template Arsenal MVP                           → ff4c42b feat: add Framepack template arsenal MVP
Template Arsenal hardening                     → 8b039cb fix: harden template bundle productization
Reviewer blocker fixes                         → c78b0b7; 2cb466d
部署目录                                       → F:/Hermes_windows/plugins/framepack/
真实样例                                       → F:/Framepack-01-test/cases/miara-style-template
```

### 验证证据

```text
Template Arsenal targeted suite                → 29 passed
Full Framepack plugin suite                     → 852 passed
Added-line security scan                        → 0 findings
Real sample inspect                             → exit 0; status=incomplete; issue=missing_template_card
Missing inspect/list path contract              → exit 2
Temp package smoke                              → status=complete; issue_count=0
Deploy sync                                     → MD5 matched for changed plugin files
Deployed parent-conflict smoke                  → FileExistsError; TEMPLATE_CARD.md not created
AGENTS/.gitignore housekeeping verification      → tests/test_template_*.py 29 passed; generated local dirs ignored
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
