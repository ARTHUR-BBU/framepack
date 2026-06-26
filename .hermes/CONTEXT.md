# hyperframes 开发工程 — 工作交接台

> 新对话打开后，读完本文就能接上。
> 这不是历史日志，是当前手台；旧状态靠 Git 历史追溯。

## 当前状态

<!-- ⚠️ 此区块每次会话结束时整块替换。不要在上面追加。 -->

**阶段**: v0.16.0 已发布；main post-release 开发线新增“内置模板菜单体验”功能，准备提交/推送。
**分支**: `main`（本轮待提交：template menu CLI + built-in miara template installer + bundled miara template）
**源码版本**: `framepack-plugin/plugin.yaml = 0.16.0`（本轮不 bump 版本、不移动 v0.16.0 tag）
**HyperFrames CLI**: 项目依赖与本地 CLI 支持窗口为 `hyperframes@0.7.3`
**验证**: template targeted `52 passed`；focused reviewer-mode `30 passed`；full plugin suite `875 passed`；deployed smoke 通过；安全扫描 `0 findings`；bundle inspect complete、issue_count=0、mp4_count=0、old_version_hits=0；部署目录同步 72 files MD5 matched。
**子代理**: 已派 `deleg_44fb2a18` 做独立测试；超过等待窗口未返回，已执行主模型 reviewer-mode fallback。若异步返回 blocker，需补 follow-up commit，不改已发布 tag。

### 本轮做了什么

- ✅ 新增用户可读模板菜单：`format_template_menu(project, intent)` + CLI `framepack_template.py menu --project <dir> --intent "..."`。
- ✅ 新增内置模板安装：`core/templates/builtin.py` + CLI `install-builtin miara-style-template --project <dir>`。
- ✅ 新增内置 Miara 模板 bundle：`framepack-plugin/templates/bundles/miara-style-template/`，包含 HTML、local fonts/vendor JS、mascot frames、snapshots；明确不包含 render mp4，也不包含旧工作台 source provenance（避免 0.15.0 版本漂移）。
- ✅ Director skill 的 Template-Reuse Flow 补上 `install-builtin` 和 `menu`，Agent 命中 `framepack-template-reuse` 后能先装模板、再展示菜单。
- ✅ 真实 smoke：temp project install-builtin → menu → recommend → select，top=miara-style-template，score=4，selection evidence 写入，mp4_count=0。

### 老田实测命令

```bash
cd F:/hyperframes/framepack-plugin
python scripts/framepack_template.py install-builtin miara-style-template --project <测试项目目录>
python scripts/framepack_template.py menu --project <测试项目目录> --intent "帮我做一个产品发布品牌讲解视频"
python scripts/framepack_template.py select miara-style-template --project <测试项目目录> --brief "..." --param brand_name=Miara
```

### 当前关键证据

```text
Template targeted tests                         → 52 passed
Focused reviewer-mode tests                      → 30 passed
Full Framepack plugin suite                      → 875 passed
Builtin bundle inspect                           → complete, issue_count=0
Builtin bundle mp4 scan                          → 0
Builtin bundle old-version scan                  → 0
Smoke top recommendation                         → miara-style-template score=4
Deploy sync                                      → 72 files MD5 matched
Deployed smoke                                   → source=builtin, top=miara-style-template, score=4, mp4_count=0, old_version_hits=0
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
