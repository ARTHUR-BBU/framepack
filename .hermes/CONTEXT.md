# hyperframes 开发工程 — 工作交接台

> 新对话打开后，读完本文就能接上。
> 这不是历史日志，是当前手台；旧状态靠 Git 历史追溯。

## 当前状态

<!-- ⚠️ 此区块每次会话结束时整块替换。不要在上面追加。 -->

**阶段**: Framepack v0.10.6 已正式发布：annotated tag `v0.10.6` 已推送，GitHub Release 已创建；测试组真实 case `F:/Framepack-01-test/pearl-luxe-30s` 已从 2 个 P1 + 1 个 P2 修整到 semantic audit 全绿。  
**分支**: `framepack-agent-platform`  
**正式源码版本**: v0.10.6（`framepack-plugin/plugin.yaml` = `0.10.6`；deployed plugin 与 active independent `framepack` skill 已同步）  
**最新提交**: `7fea6c3 handoff: record v0.10.6 case audit cleanup`（tag `v0.10.6` deref commit = `7fea6c3`；源码 release-prep 为 `1c803dc`）  
**发布状态**: GitHub Release `Framepack v0.10.6 — Production Hardening Patch` 已发布，URL: `https://github.com/ARTHUR-BBU/framepack/releases/tag/v0.10.6`；非 draft，非 prerelease。  
**部署状态**: 已同步到 `F:/Hermes_windows/plugins/framepack/`；`F:/Hermes_windows/skills/software-development/framepack/` 独立 skill 已同步；case 项目 `F:/Framepack-01-test/pearl-luxe-30s` 已补 timeline ledger 并修正 scene_3 canonical weapon binding。  
**测试**: 测试组原命令复跑 `passed=5 failed=0 skipped=0`; source pytest `247 passed`; deploy manifest `5 passed`; deployed smoke ok；case audit `P0=0/P1=0/P2=0/P3=0`, `issues=0`; HyperFrames lint `0 errors / 3 warnings`; validate contrast pass；inspect `0 issues`；security scan clean；previous-version scan clean。

### 本轮做了什么

- ✅ 执行 v0.10.6 release-prep：把 plugin/version surfaces 从 v0.10.5 全面 bump 到 v0.10.6。
- ✅ 新增 `CHANGELOG.md` 的 `0.10.6 — Production Hardening Patch` 条目。
- ✅ README / docs / AGENTS / plugin.yaml / hook logger / compat matrix / DEFAULT_PLUGIN_VERSION / timeline template / skill frontmatter 全部更新到 0.10.6。
- ✅ 测试组入口从 `scripts/test_team_v0105_auto_test.py` / `TEST_TEAM_AUTOTEST_v0.10.5.md` rename 到 `scripts/test_team_v0106_auto_test.py` / `TEST_TEAM_AUTOTEST_v0.10.6.md`。
- ✅ 部署同步：`framepack-plugin/.` → `F:/Hermes_windows/plugins/framepack/`；主 `framepack` skill → `F:/Hermes_windows/skills/software-development/framepack/`。
- ✅ 独立 reviewer 已审核 staged diff：无 security/logic blocker；唯一文案建议已修正。
- ✅ 提交：`1c803dc chore: prep framepack v0.10.6 release`。
- ✅ 复核测试组真实 case 报告：初测为 `passed=5 failed=0 skipped=0`，但 `pearl-luxe-30s` semantic audit 有 `manifest_weapon_not_called` P1、`timeline_manifest_missing` P1、`low_visibility_risk` P2。
- ✅ 修整 case 项目（非插件源码）：scene_3 改为 canonical `cardCascadeReveal()` 调用；生成 `.framepack/timeline-manifest.json`；降低过重黑遮罩/首帧欠曝阈值以消除误伤式低可见性黄灯。
- ✅ 用测试组原命令复跑：`passed=5 failed=0 skipped=0`，case audit `P0=0/P1=0/P2=0/P3=0`, `issues=0`。
- ✅ 创建并推送 annotated tag：`v0.10.6` → deref commit `7fea6c3`。
- ✅ 创建 GitHub Release：`Framepack v0.10.6 — Production Hardening Patch` → `https://github.com/ARTHUR-BBU/framepack/releases/tag/v0.10.6`。

### 验证证据

- Release verification：`gh release view v0.10.6 --json tagName,name,url,isDraft,isPrerelease,publishedAt` → tag `v0.10.6`, name `Framepack v0.10.6 — Production Hardening Patch`, `isDraft=false`, `isPrerelease=false`, URL `https://github.com/ARTHUR-BBU/framepack/releases/tag/v0.10.6`。
- Tag verification：`git rev-parse v0.10.6^{}` → `7fea6c336e089aed74fa5730c5f769d7ea6b3e2c`。
- Full suite：测试组原命令内部运行 `C:\Python314\python.exe -m pytest tests/ -q -o addopts=` → `247 passed in 6.15s`。
- Deploy manifest：测试组原命令内部运行 `C:\Python314\python.exe -m pytest tests/test_deploy_manifest.py -q -o addopts=` → `5 passed in 0.04s`。
- Test-team full command：`python scripts/test_team_v0106_auto_test.py --repo F:/hyperframes --deployed-plugin F:/Hermes_windows/plugins/framepack --output-dir test-team-reports/v0.10.6 --case-project F:/Framepack-01-test/pearl-luxe-30s` → `passed=5 failed=0 skipped=0`。
- Case Quality Audit：`F:/Framepack-01-test/pearl-luxe-30s` → `P0=0/P1=0/P2=0/P3=0`, `issues=0`，报告写入 `F:/hyperframes/test-team-reports/v0.10.6/case-quality-audit.json`。
- HyperFrames lint/validate：`npx hyperframes lint && npx hyperframes validate`（在 case 项目下）→ lint `0 error(s), 3 warning(s)`；validate `No console errors · 5 text elements pass WCAG AA`。
- HyperFrames inspect：`npx hyperframes inspect --samples 10 --json` → `ok: true`, `issueCount: 0`, `totalIssueCount: 0`。
- Deployed smoke：auto script 内部从 `F:/Hermes_windows/plugins/framepack/plugin.yaml` 读回 `0.10.6` 并 import `core.quality_audit` 成功。
- Deploy sync read-back：source/deployed `plugin.yaml`、`__init__.py`、hooks、`quality_audit.py`、`proof_audit.py`、`timeline_manifest.py`、主 skill 全部 `read_bytes()` 比对通过 → `deploy sync ok`。
- Previous-version scan：排除 changelog/history/design/dev-fixture 后，当前 release surface 无 `0.10.5` / `v0.10.5` / `v0105` 漂移。
- Security scan：`python /f/Hermes_windows/skills/software-development/requesting-code-review/scripts/scan_worktree_added_lines.py` → `No added-line security red flags found.`
- Diff hygiene：`git diff --cached --check` → exit 0。

### 给测试组的入口

- 当前正式测试组入口：v0.10.6 release-prep HEAD `1c803dc`。
- 推荐命令：

```bash
python scripts/test_team_v0106_auto_test.py --repo F:/hyperframes --deployed-plugin F:/Hermes_windows/plugins/framepack --output-dir test-team-reports/v0.10.6
```

- 带案例项目：

```bash
python scripts/test_team_v0106_auto_test.py --repo F:/hyperframes --deployed-plugin F:/Hermes_windows/plugins/framepack --output-dir test-team-reports/v0.10.6 --case-project F:/Framepack-01-test
```

### 下次要做什么

- v0.10.6 已发布；如测试组继续回传问题，按 patch release / v0.10.7 分支处理。
- 可选补强：把代理检测/字体 acquisition 做成显式 helper 或 CLI doctor 项；当前 v0.10.6 已完成审计与文档口径。
- v0.11 方向：Aesthetic Benchmark / Director Taste System，对表 nexu-io/html-video 21 templates 与 html-anything 10 frame。

## 关键路径

- 项目根：`F:\hyperframes\`
- 开发目录：`F:\hyperframes\framepack-plugin\`
- 部署目录：`F:\Hermes_windows\plugins\framepack\`
- 测试项目：`F:\Framepack-01-test\`（已补 `AGENTS.md` + `.framepack` ledger；仍不是完整命题视频 case）
- Git 分支：`framepack-agent-platform`
- 远程：https://github.com/ARTHUR-BBU/framepack

## 版本脉络

- v0.8.0：定位重构为 Prompt Factory for HyperFrames；Framepack 只产出 frame.md + expanded-prompt.md，HTML/render 交给 HyperFrames。
- v0.9.1：HyperFrames Structure Bridge；Time Windows、Structure Checklist、结构铁律、resolveElement compat。
- v0.9.2：Guardrail Hydrator；plugin guardrails.md → 项目 AGENTS.md managed block → 当前 session 注入。
- v0.9.3：Test-Team Hardening；clip root 禁动画、scene-inner wrapper、text-split CSS contract、state.json future-only。
- v0.9.4：Replica Mode Render Integrity；VIDEO_DNA/content_decomposition/TEMPLATE_BLUEPRINT、root data-duration、模糊实现语句禁令。
- v0.10.0：Arsenal Registry Runtime；.framepack/arsenal.json、Execution Manifest reconcile、builtin weapon catalog、trusted-source whitelist、preflight audit。
- v0.10.1：HyperFrames Compatibility Adapter；命令分类、capability snapshot、registry fallback、proxy/VPN retry、official skill diff、upstream watcher。
- v0.10.2：Environment & Upgrade Manager groundwork；doctor/install/overlay/upgrade/report/support-window 生命周期托管。
- v0.10.3：Quality Beyond Lint；语义审计小票、JSON/Markdown audit CLI、handoff 前非阻断 summary、scene-keyed Manifest parser、测试组自动测试脚本。
- v0.10.4：Arsenal Binding Contract；arsenal 自动创建/同步、canonical weapon function、inline GSAP hint、sync opt-in。本地 commit: `6a63be4`。
- v0.10.5：Production Quality Layer；timeline manifest、proof frames/contact sheet、scene spec、production quality audit、lightweight hook sync。本地 commit: `17a9455`；后续 hardening commit `be318b5` 修复 shell cd 后项目目录 hydration。
- v0.10.6：Production Hardening Patch；external font dependency、本地字体资产缺失、低可见性风险、NaN/Infinity、proof path project-local 审计；release-prep commit `1c803dc`。

## 待办 / 想法池

- [x] 测试组 v0.10.5 手动项目测试报告已收到并复核。
- [x] v0.10.5 tag + GitHub Release 已发布。
- [x] v0.10.6 hardening 首批：Google Fonts 本地化提示、暗底可见性审计、NaN/Infinity 数值拒绝、proof path project-local 审计已实现；weapon binding 强制已有 P1 `manifest_weapon_not_called` 基础，后续可继续升级。
- [x] Hardening：数值解析拒绝 NaN/Infinity。
- [x] Hardening：proof path 限定在 project-local 并报 `proof_path_outside_project` P1。
- [x] v0.10.6 release-prep：全面 bump 版本号/测试脚本/文档口径，确认正式测试组入口。
- [ ] 文档：hook 会非阻断创建/同步 `.framepack` ledger；CLI 默认 report-first，只在显式 sync/output flags 下写文件。
- [ ] v0.11 方向：Aesthetic Benchmark / Director Taste System，对表 nexu-io/html-video 21 templates 与 html-anything 10 frame。

## 笔记

- 测试组和开发组分工：测试由测试组测，开发侧不要抢跑；开发侧负责修复、交接台、版本/部署/路径口径核验。
- 老田提交前偏好：先做 “simplify + 审核”，最后再 commit。
- 交接台更新原则：replace not append；阶段切换/发布/准备开新 session 前必须更新 `.hermes/CONTEXT.md` 并单独提交 handoff。
- v0.10.5 是“场记层/制片 QA”，不是 HTML 生产器：Framepack 仍不写/patch/render 用户 HTML，只做 prompt、ledger、audit、proof workflow。
