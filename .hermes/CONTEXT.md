# hyperframes 开发工程 — 工作交接台

> 新对话打开后，读完本文就能接上。
> 这不是历史日志，是当前手台；旧状态靠 Git 历史追溯。

## 当前状态

<!-- ⚠️ 此区块每次会话结束时整块替换。不要在上面追加。 -->

**阶段**: Framepack v0.10.5 已完成 release-prep bump、部署同步、验证、测试组自动测试报告生成，并已 push 到 `origin/framepack-agent-platform`；测试组已开始准备/手动项目测试。尚未创建 v0.10.5 tag/GitHub Release。  
**分支**: `framepack-agent-platform`  
**正式源码版本**: v0.10.5（`framepack-plugin/plugin.yaml` = `0.10.5`；部署目录和独立 skills 已同步到 0.10.5）  
**最新远端提交**: `1cd4827` (`docs: clarify v0.10.5 test-team case modes`)；功能基准仍为 `fdf6102` (`[verified] release prep framepack v0.10.5`)  
**GitHub Release**: 当前公开 release 仍是 v0.10.3：https://github.com/ARTHUR-BBU/framepack/releases/tag/v0.10.3

### 本轮做了什么

- ✅ 先 push 了上一轮已验证功能提交和 handoff：`6a63be4` / `17a9455` / `14c5dd9` → `origin/framepack-agent-platform`。
- ✅ 全面 bump 到 v0.10.5：`plugin.yaml`、compat matrix、runtime constants、hooks logger/docstring、README、docs、AGENTS、skill frontmatter、timeline manifest template、test-team script/report 名称、deploy manifest tests。
- ✅ 将测试组脚本/说明从 v0103/v0.10.3 升级为 v0105/v0.10.5：`scripts/test_team_v0105_auto_test.py`、`TEST_TEAM_AUTOTEST_v0.10.5.md`。
- ✅ 增加 `test-team-reports/` 到 `.gitignore`，避免测试报告产物误入仓库。
- ✅ 同步部署目录：`F:\hyperframes\framepack-plugin` → `F:\Hermes_windows\plugins\framepack`；同步独立 skills 到 `F:\Hermes_windows\skills\software-development\framepack*`（含 `framepack-production-quality`）。
- ✅ Independent pre-commit review 通过；reviewer 无 security/logic blocker，建议补 timeline/template version drift 测试，已补进 `test_deploy_manifest.py`。
- ✅ 提交并 push：`fdf6102 [verified] release prep framepack v0.10.5`。
- ✅ 根据测试组二道关回传，修正文档口径错位：`TEST_TEAM_AUTOTEST_v0.10.5.md` 默认推荐命令改为不带 `--case-project` 的 A 档插件基准验收，并新增 B/C 档完整 case 项目审计说明；明确 `F:/Framepack-01-test` 当前不是完整命题视频 case，只适合缺件输入测试。提交并 push：`1cd4827 docs: clarify v0.10.5 test-team case modes`。

### 验证证据

- `cd framepack-plugin && python -m pytest tests/ -q -o "addopts="` → `239 passed in 14.54s`（另一次 full suite：`239 passed in 11.94s`）。
- `python /f/Hermes_windows/skills/software-development/requesting-code-review/scripts/scan_worktree_added_lines.py` → `No added-line security red flags found.`
- `python scripts/test_team_v0105_auto_test.py --output-dir test-team-reports/v0.10.5` → summary `passed=4, failed=0, skipped=1`（case project 未提供所以跳过）。
- `python scripts/test_team_v0105_auto_test.py --repo F:/hyperframes --deployed-plugin F:/Hermes_windows/plugins/framepack --output-dir test-team-reports/v0.10.5` → summary `passed=4, failed=0, skipped=1`；full suite `239 passed in 13.65s`，deploy smoke `deployed import/version ok`。
- Deployed smoke（由 auto-test 执行）→ `deployed import/version ok`，并断言部署目录 `plugin.yaml` 含 `0.10.5`。
- Read-back：`F:\Hermes_windows\plugins\framepack\plugin.yaml` = `version: "0.10.5"`；`timeline-manifest.example.json` 的 `plugin_version_created/updated` 均为 `0.10.5`。

### 给测试组的入口

- 分支：`framepack-agent-platform`
- 功能基准提交：`fdf6102`
- 当前远端 HEAD：`1cd4827`（只修测试说明文档，不改插件功能）
- 自动测试脚本：`scripts/test_team_v0105_auto_test.py`
- 测试说明：`TEST_TEAM_AUTOTEST_v0.10.5.md`
- A 档插件基准命令（不带 case）：`python scripts/test_team_v0105_auto_test.py --repo F:/hyperframes --deployed-plugin F:/Hermes_windows/plugins/framepack --output-dir test-team-reports/v0.10.5`
- A 档预期：`passed=4, failed=0, skipped=1`
- B/C 档完整 case 审计：只有测试组准备好包含 `frame.md`、`.hyperframes/expanded-prompt.md`、`.framepack/arsenal.json`、`index.html` 的真实项目后，才添加 `--case-project <完整case路径>`；此时通常是 `passed=5, failed=0, skipped=0`，但 Quality Audit 内部 P0/P1 代表案例风险，不等同于脚本失败。
- 本地已生成报告（未提交，产物被 gitignore）：`test-team-reports/v0.10.5/framepack-v0105-auto-test-report.{json,md}`

### 下次要做什么

- 等测试组基于 `fdf6102`/当前 HEAD 回传手动命题视频测试报告；若有 P0/P1，先复现再修。
- 若老田决定发布正式版：创建 `v0.10.5` tag + GitHub Release，并把 release URL 写回交接台。
- 继续 hardening backlog：NaN/Infinity 数值拒绝、proof path project-local 限定/审计 warning。

## 关键路径

- 项目根：`F:\hyperframes\`
- 开发目录：`F:\hyperframes\framepack-plugin\`
- 部署目录：`F:\Hermes_windows\plugins\framepack\`
- 测试项目：`F:\Framepack-01-test\`（当前不是完整命题视频 case；只适合缺件输入测试）
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
- v0.10.5：Production Quality Layer；timeline manifest、proof frames/contact sheet、scene spec、production quality audit、lightweight hook sync。本地 commit: `17a9455`。

## 待办 / 想法池

- [ ] 等测试组基于 `fdf6102`/当前 HEAD 回传 v0.10.5 手动项目测试报告。
- [ ] 视老田决定：创建 v0.10.5 tag/GitHub Release，或仅交测试组先测。
- [ ] Hardening：数值解析拒绝 NaN/Infinity。
- [ ] Hardening：proof path 限定在 project-local 或至少 audit warning。
- [ ] 文档：hook 会非阻断创建/同步 `.framepack` ledger；CLI 默认 report-first，只在显式 sync/output flags 下写文件。
- [ ] v0.11 方向：Aesthetic Benchmark / Director Taste System，对表 nexu-io/html-video 21 templates 与 html-anything 10 frame。

## 笔记

- 测试组和开发组分工：测试由测试组测，开发侧不要抢跑；开发侧负责修复、交接台、版本/部署/路径口径核验。
- 老田提交前偏好：先做 “simplify + 审核”，最后再 commit。
- 交接台更新原则：replace not append；阶段切换/发布/准备开新 session 前必须更新 `.hermes/CONTEXT.md` 并单独提交 handoff。
- v0.10.5 是“场记层/制片 QA”，不是 HTML 生产器：Framepack 仍不写/patch/render 用户 HTML，只做 prompt、ledger、audit、proof workflow。
