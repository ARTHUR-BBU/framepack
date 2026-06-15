# hyperframes 开发工程 — 工作交接台

> 新对话打开后，读完本文就能接上。
> 这不是历史日志，是当前手台；旧状态靠 Git 历史追溯。

## 当前状态

<!-- ⚠️ 此区块每次会话结束时整块替换。不要在上面追加。 -->

**阶段**: Framepack v0.10.5 已正式发布。测试组报告已收到并复核；自动测试与实测 render 全链路通过。已创建并推送 `v0.10.5` annotated tag，GitHub Release 已发布。  
**分支**: `framepack-agent-platform`  
**正式源码版本**: v0.10.5（`framepack-plugin/plugin.yaml` = `0.10.5`；部署目录和独立 skills 已同步到 0.10.5）  
**最新远端状态**: `origin/framepack-agent-platform` 已包含 v0.10.5 release 后交接台更新；release tag `v0.10.5` 指向 `dca6ba1` 发布状态；插件修复提交为 `be318b5`，release-prep 功能基准为 `fdf6102` (`[verified] release prep framepack v0.10.5`)  
**GitHub Release**: v0.10.5 已发布：https://github.com/ARTHUR-BBU/framepack/releases/tag/v0.10.5

### 本轮做了什么

- ✅ 继续 v0.10.5 测试组准备：确认测试组反馈的“agent.md”实际应为项目级 `AGENTS.md`，由 Framepack Guardrail Hydrator 创建/更新 managed block。
- ✅ 复现并定位根因：测试组/Agent 常用 `cd F:/Framepack-01-test && npx hyperframes lint`，但 hook 在 shell 执行前运行，旧逻辑只使用 `args["workdir"]` 或 `os.getcwd()`，导致 hydrate/audit 写到调用 cwd，而不是 `cd` 后的测试项目。
- ✅ 按 TDD 修复：新增回归测试 `TestPreToolCallHandoff::test_hydrates_project_from_cd_prefix_before_hyperframes_command`，先看到失败，再实现 `_resolve_effective_workdir()` 解析 `cd <project> &&` / `cd <project>;` 前缀。
- ✅ 修复 `hooks/on_pre_tool_call.py`：HyperFrames handoff 前统一解析 effective workdir，再 hydrate guardrails、sync arsenal、sync timeline、quality audit。
- ✅ 更新 `framepack` skill pitfalls，记录 shell `cd project && npx hyperframes ...` 目录解析坑位。
- ✅ 同步部署目录：`framepack-plugin/hooks/on_pre_tool_call.py` → `F:/Hermes_windows/plugins/framepack/hooks/on_pre_tool_call.py`；`framepack-plugin/skills/framepack/SKILL.md` → plugin skill + 独立 skill。
- ✅ 手动修复测试项目账本：`F:/Framepack-01-test/AGENTS.md` 已创建；`.framepack/arsenal.json` 和 `.framepack/timeline-manifest.json` 已同步。
- ✅ 提交并 push：`be318b5 fix: hydrate framepack project after shell cd`。
- ✅ 读取测试组 Obsidian 报告：`C:/Users/LENOVO/Documents/AI-Coach-Vault/Windows/2026-06-15-Framepack-v0.10.5-测试报告.md`。结论：自动测试全部通过，实测 `Framepack Director → HyperFrames HTML → render` 产出 `video.mp4` 39s/1170 frames；报告列出 P0/P1/P2 hardening 项。
- ✅ 用当前 HEAD + 已部署插件复跑带 case 自动测试：`passed=5, failed=0, skipped=0`，`case_quality_audit` summary 为 `P0=0/P1=0/P2=0/P3=0`。
- ✅ 发布 v0.10.5：创建 annotated tag `v0.10.5`，推送到 origin，并创建 GitHub Release：`https://github.com/ARTHUR-BBU/framepack/releases/tag/v0.10.5`。

### 验证证据

- RED：新增测试首次运行失败，断言 `case-project/AGENTS.md` 不存在，证明旧 hook 会把 hydration 写错位置。
- GREEN targeted：`cd framepack-plugin && python -m pytest tests/test_storyboard_hook.py::TestPreToolCallHandoff::test_hydrates_project_from_cd_prefix_before_hyperframes_command -q -o "addopts="` → `1 passed in 0.26s`。
- Hook/Guardrails targeted：`python -m pytest tests/test_storyboard_hook.py tests/test_guardrails_hydrator.py -q -o "addopts="` → `61 passed in 0.95s`。
- Full suite：`cd framepack-plugin && python -m pytest tests/ -q -o "addopts="` → `240 passed in 12.03s`。
- Deploy manifest：`python -m pytest tests/test_deploy_manifest.py -q -o "addopts="` → `5 passed in 0.06s`。
- Security scan：`python /f/Hermes_windows/skills/software-development/requesting-code-review/scripts/scan_worktree_added_lines.py` → `No added-line security red flags found.`
- Deploy sync read-back：`cmp -s` source/deployed `on_pre_tool_call.py` + source/deployed/independent `framepack/SKILL.md` → `deploy sync ok`。
- Test project repair：`sync_project_agents(F:/Framepack-01-test)` → `{'changed': True, 'action': 'created', 'path': 'F:\\Framepack-01-test\\AGENTS.md', 'version': '0.10.5', 'error': None}`。
- Test project ledger sync：arsenal → `action='synced'`, path `F:\Framepack-01-test\.framepack\arsenal.json`, warning `handwrite_weapon`；timeline → `action='synced'`, path `F:\Framepack-01-test\.framepack\timeline-manifest.json`。
- Release verification full suite：`cd framepack-plugin && python -m pytest tests/ -q -o "addopts="` → `240 passed in 16.74s`。
- Release auto-test：`python scripts/test_team_v0105_auto_test.py --repo F:/hyperframes --deployed-plugin F:/Hermes_windows/plugins/framepack --output-dir test-team-reports/v0.10.5-release --case-project F:/Framepack-01-test` → `passed=5, failed=0, skipped=0`; `case_quality_audit` → `P0=0/P1=0/P2=0/P3=0`。
- GitHub Release verify：`gh release view v0.10.5 --json tagName,name,url,isDraft,isPrerelease,targetCommitish,publishedAt` → `isDraft=false`, `isPrerelease=false`, URL `https://github.com/ARTHUR-BBU/framepack/releases/tag/v0.10.5`。

### 给测试组的入口

- 分支：`framepack-agent-platform`
- 当前远端 HEAD：`dca6ba1`（发布前交接台 triage；release tag `v0.10.5` 已创建）
- 功能基准提交：`fdf6102`
- 自动测试脚本：`scripts/test_team_v0105_auto_test.py`
- 测试说明：`TEST_TEAM_AUTOTEST_v0.10.5.md`
- A 档插件基准命令（不带 case）：`python scripts/test_team_v0105_auto_test.py --repo F:/hyperframes --deployed-plugin F:/Hermes_windows/plugins/framepack --output-dir test-team-reports/v0.10.5`
- A 档预期：`passed=4, failed=0, skipped=1`
- B/C 档完整 case 审计：只有测试组准备好包含 `frame.md`、`.hyperframes/expanded-prompt.md`、`.framepack/arsenal.json`、`index.html` 的真实项目后，才添加 `--case-project <完整case路径>`；此时通常是 `passed=5, failed=0, skipped=0`，但 Quality Audit 内部 P0/P1 代表案例风险，不等同于脚本失败。
- 当前 `F:/Framepack-01-test` 已补齐 `AGENTS.md` + `.framepack` 账本，但它仍不是完整命题视频 case；若没有合格 `index.html`，仍只适合缺件/半成品输入测试。

### 下次要做什么

- v0.10.5 已发布；下一步进入 v0.10.6/v0.11 hardening。
- 优先 hardening backlog：Manifest → HTML weapon binding 强制/审计、Google Fonts 本地化提示、暗底可见性审计、NaN/Infinity 数值拒绝、proof path project-local 限定/审计 warning。

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
- [ ] v0.10.6/v0.11 hardening：Manifest → HTML weapon binding 强制/审计、Google Fonts 本地化提示、暗底可见性审计、timeline 在 frame.md/expanded-prompt.md 中结构化表达口径。
- [ ] Hardening：数值解析拒绝 NaN/Infinity。
- [ ] Hardening：proof path 限定在 project-local 或至少 audit warning。
- [ ] 文档：hook 会非阻断创建/同步 `.framepack` ledger；CLI 默认 report-first，只在显式 sync/output flags 下写文件。
- [ ] v0.11 方向：Aesthetic Benchmark / Director Taste System，对表 nexu-io/html-video 21 templates 与 html-anything 10 frame。

## 笔记

- 测试组和开发组分工：测试由测试组测，开发侧不要抢跑；开发侧负责修复、交接台、版本/部署/路径口径核验。
- 老田提交前偏好：先做 “simplify + 审核”，最后再 commit。
- 交接台更新原则：replace not append；阶段切换/发布/准备开新 session 前必须更新 `.hermes/CONTEXT.md` 并单独提交 handoff。
- v0.10.5 是“场记层/制片 QA”，不是 HTML 生产器：Framepack 仍不写/patch/render 用户 HTML，只做 prompt、ledger、audit、proof workflow。
