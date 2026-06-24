# hyperframes 开发工程 — 工作交接台

> 新对话打开后，读完本文就能接上。
> 这不是历史日志，是当前手台；旧状态靠 Git 历史追溯。

## 当前状态

<!-- ⚠️ 此区块每次会话结束时整块替换。不要在上面追加。 -->

**阶段**: v0.15.0 已正式发布；main 继续包含 post-release hardening；准备切 TUI 新 session
**分支**: `main`（HEAD = origin/main = `9b882e3`；`.hermes/reports/` 与 `assets/` 仍是旧未跟踪现场，不入库）
**源码版本**: `framepack-plugin/plugin.yaml = 0.15.0`
**正式发布**: GitHub Release `v0.15.0` 已发布；tag 固定指向 `4e6eead`，后续 handoff/follow-up commit 不属于 release artifact。
**HyperFrames CLI**: 项目依赖与本地 CLI 支持窗口为 `hyperframes@0.7.3`
**验证**: 最新 Framepack full plugin suite `769 passed`；部署目录 MD5 同步；真实 `F:/Framepack-01-test` root AGENTS 保养为 noop/MD5 不变；Hermes GBK subprocess 热修测试 `18 passed, 1 skipped`。
**注意**: 当前 Hermes 进程尚未吃到最后的 GBK 热修；开 TUI 前请真正退出旧 CLI 进程后重新启动 Hermes，不是 `/new` 或 `/reset`。

### 本轮做了什么

- ✅ **Framepack v0.15.0 正式发布**：完成 GitHub Release；release tag 仍固定在 `4e6eead`。
- ✅ **P0/P1/P2 Director Workbench 主脊梁落地**：readiness gates、placeholder audit、tone/rhythm presets、audio cue ledger、catalog decision、deliverable bundle、beat analyzer、catalog discovery、promotion candidates、cross-case mining。
- ✅ **post-release simplify follow-up**：`ed0401b refactor: address simplify reviewer follow-ups`，补 OSError 护栏、非空 render helper、markdown 表格 escape、waived component 校验、beat analyzer 瘦身等；main 已推，不改 tag。
- ✅ **workbench root AGENTS 自动保养缺口已补**：`9b882e3 [verified] fix: maintain workbench root Framepack context block`。Framepack 被召唤时会维护 workbench 根 `AGENTS.md` 的 `FRAMEPACK MANAGED BLOCK`；没变化不写；没文件就创建；用户内容不动。main 已推。
- ✅ **真实测试项目验证**：`F:/Framepack-01-test` 当前 root `AGENTS.md` 已健康；ensure 结果 `action=noop`，MD5 前后不变。
- ✅ **Hermes Windows GBK readerthread 错误已热修**：在 `F:/Hermes_windows/hermes-agent/hermes_bootstrap.py` 增加 Windows-only subprocess text defaults 保险丝：`text=True` 且未显式指定时自动补 `encoding="utf-8", errors="replace"`；显式 call-site 不覆盖；POSIX 不受影响。
- ✅ **Hermes skill 已补坑位说明**：`hermes-agent` skill 的 Windows quirk 增加 subprocess `_readerthread` / GBK `UnicodeDecodeError` 说明。

### 下次要做什么

1. **开 TUI 第一刀**：重启 Hermes 进程后启动 TUI；新 session 先读本文件，再跑 `cd F:/hyperframes && git status --short`。
2. **如果继续 Framepack 开发**：从 `main@9b882e3` 开始；不要移动 `v0.15.0` tag；`.hermes/reports/` 与 `assets/` 未跟踪现场继续不要误提交。
3. **如果处理 Hermes GBK 热修**：注意 `F:/Hermes_windows/hermes-agent` 是 active source 但当前 git 状态显示全仓未跟踪（像源码拷贝/非正常 git clone），不要按普通 repo 直接 `git add .`。只核验/迁移这两个改动文件：`hermes_bootstrap.py`、`tests/test_hermes_bootstrap.py`。
4. **如果 GBK 报错还出现**：先确认新入口是否 import 了 `hermes_bootstrap`；再用坏字节 smoke 复测，不要追杀 400+ 个 subprocess call-site。

### 当前关键证据

```text
Framepack main HEAD / origin/main              → 9b882e3 [verified] fix: maintain workbench root Framepack context block
post-release simplify follow-up                → ed0401b refactor: address simplify reviewer follow-ups
v0.15.0 tag deref                               → 4e6eead (release artifact，不移动)
Hermes active source                            → F:/Hermes_windows/hermes-agent
Hermes GBK hotfix files                         → hermes_bootstrap.py; tests/test_hermes_bootstrap.py
```

### 验证证据

```text
Framepack targeted hook/context tests           → 47 passed
Framepack full plugin suite after root upkeep   → 769 passed
Framepack static scan / AST review              → no findings
Framepack deploy sync                           → 5/5 MD5 matched; deployed smoke passed
F:/Framepack-01-test ensure                     → action=noop; changed=False; before_md5 == after_md5
Hermes RED reproduction                         → readerthread UnicodeDecodeError reproduced in failing test before fix
Hermes bootstrap tests after fix                → 18 passed, 1 skipped
Hermes bad-byte subprocess smoke                → stdout 'hello-�-world', no readerthread crash
Hermes entry smoke                              → `hermes --version`, `hermes --help`, `hermes chat --help` OK
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
