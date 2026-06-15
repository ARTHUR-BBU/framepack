# hyperframes 开发工程 — 工作交接台

> 新对话打开后，读完本文就能接上。
> 这不是历史日志，是当前手台；旧状态靠 Git 历史追溯。

## 当前状态

<!-- ⚠️ 此区块每次会话结束时整块替换。不要在上面追加。 -->

**阶段**: Framepack v0.10.6 hardening 开发已完成首批实现；正式源码版本仍是 v0.10.5，尚未 bump/tag/release。  
**分支**: `framepack-agent-platform`  
**正式源码版本**: v0.10.5（`framepack-plugin/plugin.yaml` = `0.10.5`；v0.10.6 hardening 是 HEAD 上的 unreleased 变更）  
**最新提交**: `e928a42 feat: harden framepack quality audit`  
**部署状态**: 已同步到 `F:/Hermes_windows/plugins/framepack/`；`framepack` 独立 skill 也已同步。  
**测试**: full pytest `247 passed`; 带 case 自动测试 `passed=5 failed=0 skipped=0`; case audit `P0=0/P1=0/P2=0/P3=0`。

### 本轮做了什么

- ✅ 读取并延续 v0.10.5 release 后交接台，按用户确认的 v0.10.6 “补短板硬化版”方案开工。
- ✅ 建立设计文档：`.hermes/designs/2026-06-15--framepack-v0106-hardening.md`；明确先在 unreleased HEAD 做 hardening，release-prep 时再 bump v0.10.6。
- ✅ 按 TDD 增加并先看到 RED：Google Fonts 外部依赖、本地字体资产缺失/存在、暗底低可见性风险、NaN/Infinity 数值拒绝、proof path 越界。
- ✅ 实现 Quality Audit hardening：`external_font_dependency`、`font_face_missing_local_asset`、`low_visibility_risk`、NaN/Infinity finite-number 拒绝。
- ✅ 实现 Proof Audit hardening：proof directory/contact-sheet 必须 project-local，越界报 `proof_path_outside_project` P1。
- ✅ 更新字体/VPN 口径：国内用户可用本地 VPN/代理获取 catalog/registry/fonts，但最终生产 HTML 应 vendor 到 `assets/fonts/` + `@font-face`，不依赖 live Google Fonts。
- ✅ 同步部署目录：core 三文件、guardrails、plugin skills、独立 `framepack` skill。
- ✅ 提交：`e928a42 feat: harden framepack quality audit`。

### 验证证据

- RED targeted：新增 4 个关键测试首次运行失败（缺 external font、visibility、finite numeric、proof path 审计）。
- GREEN targeted：`python -m pytest tests/test_quality_audit.py::test_quality_audit_reports_external_google_font_dependency tests/test_quality_audit.py::test_quality_audit_allows_existing_local_font_face_asset tests/test_quality_audit.py::test_quality_audit_reports_missing_local_font_face_asset tests/test_quality_audit.py::test_quality_audit_reports_low_visibility_risk_from_dark_background_and_brightness_filter tests/test_production_quality_audit.py::test_quality_audit_rejects_nan_and_infinity_numeric_fields tests/test_production_quality_audit.py::test_quality_audit_reports_proof_paths_outside_project tests/test_production_quality_audit.py::test_quality_audit_allows_project_local_proof_paths -q -o "addopts="` → `7 passed in 0.43s`。
- Quality/production targeted：`python -m pytest tests/test_quality_audit.py tests/test_production_quality_audit.py -q -o "addopts="` → `26 passed in 0.92s`。
- Full suite：`cd framepack-plugin && python -m pytest tests/ -q -o "addopts="` → `247 passed in 20.62s`。
- Deploy manifest：`python -m pytest tests/test_deploy_manifest.py -q -o "addopts="` → `5 passed in 0.11s`。
- Security scan：`python /f/Hermes_windows/skills/software-development/requesting-code-review/scripts/scan_worktree_added_lines.py` → `No added-line security red flags found.`
- Deploy sync read-back：source/deployed `quality_audit.py`、`proof_audit.py`、`timeline_manifest.py`、`guardrails.md`、`framepack/SKILL.md`、`framepack-director/SKILL.md` 全部 `cmp -s` 通过 → `deploy sync ok`。
- Test-team auto smoke：`python scripts/test_team_v0105_auto_test.py --repo F:/hyperframes --deployed-plugin F:/Hermes_windows/plugins/framepack --output-dir test-team-reports/v0.10.6-hardening-dev --case-project F:/Framepack-01-test` → `passed=5 failed=0 skipped=0`; `case_quality_audit` → `P0=0/P1=0/P2=0/P3=0`。

### 给测试组的入口

- 当前可给测试组的是 v0.10.6 hardening 开发版 HEAD：`e928a42`。
- 注意：`plugin.yaml` 仍是 `0.10.5`，这是按计划“功能绿后再 release-prep bump”；测试组若要求正式版本号，需要先做 v0.10.6 bump/tag/release。
- 自动测试脚本仍是：`scripts/test_team_v0105_auto_test.py`（版本口径还没 bump；可在 release-prep 时复制/改名为 v0106）。
- 当前 deployed plugin 已包含 hardening 变更，可直接做开发版 smoke。

### 下次要做什么

- 如要交正式测试组：执行 v0.10.6 release-prep（全面 bump 版本号/文档/测试脚本口径），再跑 full pytest + auto-test + deploy sync。
- push 当前分支到 origin（若本轮尚未 push）并根据老田决定是否立即创建 v0.10.6 tag/release。
- 可选补强：把代理检测/字体 acquisition 做成显式 helper 或 CLI doctor 项，目前本轮只完成审计与文档口径。

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

## 待办 / 想法池

- [x] 测试组 v0.10.5 手动项目测试报告已收到并复核。
- [x] v0.10.5 tag + GitHub Release 已发布。
- [x] v0.10.6 hardening 首批：Google Fonts 本地化提示、暗底可见性审计、NaN/Infinity 数值拒绝、proof path project-local 审计已实现；weapon binding 强制已有 P1 `manifest_weapon_not_called` 基础，后续可继续升级。
- [x] Hardening：数值解析拒绝 NaN/Infinity。
- [x] Hardening：proof path 限定在 project-local 并报 `proof_path_outside_project` P1。
- [ ] v0.10.6 release-prep：全面 bump 版本号/测试脚本/文档口径，确认正式测试组入口。
- [ ] 文档：hook 会非阻断创建/同步 `.framepack` ledger；CLI 默认 report-first，只在显式 sync/output flags 下写文件。
- [ ] v0.11 方向：Aesthetic Benchmark / Director Taste System，对表 nexu-io/html-video 21 templates 与 html-anything 10 frame。

## 笔记

- 测试组和开发组分工：测试由测试组测，开发侧不要抢跑；开发侧负责修复、交接台、版本/部署/路径口径核验。
- 老田提交前偏好：先做 “simplify + 审核”，最后再 commit。
- 交接台更新原则：replace not append；阶段切换/发布/准备开新 session 前必须更新 `.hermes/CONTEXT.md` 并单独提交 handoff。
- v0.10.5 是“场记层/制片 QA”，不是 HTML 生产器：Framepack 仍不写/patch/render 用户 HTML，只做 prompt、ledger、audit、proof workflow。
