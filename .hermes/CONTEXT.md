# hyperframes 开发工程 — 工作交接台

> 新对话打开后，读完本文就能接上。
> 这不是历史日志，是当前手台；旧状态靠 Git 历史追溯。

## 当前状态

<!-- ⚠️ 此区块每次会话结束时整块替换。不要在上面追加。 -->

**阶段**: Framepack v0.10.3 — Quality Beyond Lint 已发布，进入测试组自动测试 + 真实案例测试阶段  
**分支**: framepack-agent-platform  
**正式版本**: v0.10.3  
**GitHub Release**: https://github.com/ARTHUR-BBU/framepack/releases/tag/v0.10.3  
**发布提交**: 915623e ([verified] release framepack v0.10.3)  
**Tag**: v0.10.3  
**测试**: 发布前全量 pytest `198 passed in 8.59s`；测试组自动脚本 `5 passed / 0 failed / 0 skipped`；真实测试项目 Quality Audit 检出 P0=15 / P1=13 / total=28（这是检测能力验证，不是脚本失败）。  
**部署**: 源码 `F:\hyperframes\framepack-plugin` 已同步到活跃部署目录 `F:\Hermes_windows\plugins\framepack`；部署版 `plugin.yaml` 为 `version: "0.10.3"`。  
**工作区**: v0.10.3 发布后干净；本交接台更新需单独提交。

### 上次做了什么

- ✅ 完成 Framepack v0.10.3 全面版本升级：plugin.yaml、README/docs、AGENTS、CHANGELOG、hooks logger/docstring、compat matrix、core 默认版本、apply_skill_overlays、plugin skills frontmatter 全部同步到 0.10.3。
- ✅ 正式发布 Quality Beyond Lint：`core/quality_audit.py`、`scripts/framepack_quality_audit.py`、pre_tool_call 非阻断 Quality Audit summary、scene-keyed Execution Manifest parser、builtin weapon catalog coverage。
- ✅ 修复 Quality Audit CLI：`--output` 指向嵌套路径时会自动创建父目录，避免测试组脚本写报告失败。
- ✅ 新增测试组自动测试脚本 `scripts/test_team_v0103_auto_test.py`，覆盖 source_pytest、release_version_sync、quality_audit_cli、deployed_smoke、case_quality_audit。
- ✅ 新增测试组说明 `TEST_TEAM_AUTOTEST_v0.10.3.md`，给出自动测试命令、输出文件、真实案例测试接收标准。
- ✅ 根据独立 reviewer 建议加固：测试组脚本从生成的 `case-quality-audit.json` 读取 summary，不从可能截断的 stdout 解析；deployed_smoke 检查部署版 plugin.yaml 版本为 0.10.3。
- ✅ 跑完发布前验证：`python -m pytest tests/ -q -o "addopts="` → 198 passed；测试组自动脚本 → 5/5 passed；真实项目 audit → P0=15/P1=13/28 issues；安全扫描无 secrets/private keys/shell=True/eval/pickle/yaml.load；独立 pre-commit review 放行。
- ✅ Git 操作完成：commit `915623e`，annotated tag `v0.10.3`，push 分支和 tag 到 GitHub，并创建正式 GitHub Release。
- ✅ 已把“阶段切换/发布后必须更新交接台并提交 handoff”写入用户长期偏好。

### 测试组下一步

- 让测试组按 `TEST_TEAM_AUTOTEST_v0.10.3.md` 跑自动测试：
  `python scripts/test_team_v0103_auto_test.py --repo F:/hyperframes --case-project F:/Framepack-01-test --deployed-plugin F:/Hermes_windows/plugins/framepack --output-dir F:/Framepack-01-test/test-team-v0103-report`
- 收集并回传：`framepack-v0103-auto-test-report.json`、`framepack-v0103-auto-test-report.md`、`case-quality-audit.json`。
- 继续安排真实案例测试：新案例或反向复刻案例，跑 `npx hyperframes lint/validate/snapshot/render`，再跑 `framepack_quality_audit.py` 输出 markdown/json。
- 注意：case Quality Audit 出现 P0/P1 不代表自动脚本失败；它是为了验证 v0.10.3 能识别 lint 看不见的语义风险。

### 下次要做什么

- 新 session 第一件事：读本交接台 + `AGENTS.md` + `TEST_TEAM_AUTOTEST_v0.10.3.md`，确认 release/tag 状态，不要回到 v0.10.2 旧任务。
- 等测试组回传自动测试和真实案例测试结果；按实际反馈决定 v0.10.4 或 hotfix。
- 若测试组发现新 bug：bug → `systematic-debugging`；改 Python → `test-driven-development`；完成声明 → `verification-before-completion`；提交前 → `requesting-code-review`。
- 后续如果进入 v0.10.4，先做 brainstorming，明确 Quality Beyond Lint 第二层：Timing / Asset / Render Integrity / docs ergonomics。

## 新对话打开后

1. 读 AGENTS.md，确认 Framepack 开发铁律和当前版本。
2. 读本文件 `## 当前状态`，不要再按 v0.10.2 旧状态行动。
3. `git status --short`，确认工作区是否干净。
4. `grep '^version:' framepack-plugin/plugin.yaml` 和 `grep '^version:' /f/Hermes_windows/plugins/framepack/plugin.yaml`，确认源码/部署是否仍为 0.10.3。
5. `gh release view v0.10.3 --json tagName,name,url,isDraft,isPrerelease,targetCommitish,publishedAt`，确认 GitHub Release 状态。
6. 看测试组有没有 v0.10.3 自动测试/真实案例测试反馈；没有反馈就候着，不主动闭门改代码。

## 关键路径

- 项目根：`F:\hyperframes\`
- 开发目录：`F:\hyperframes\framepack-plugin\`
- 部署目录：`F:\Hermes_windows\plugins\framepack\`
- 测试项目：`F:\Framepack-01-test\`
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

## 待办 / 想法池

- [ ] 等测试组 v0.10.3 自动测试报告；先看 `summary.failed`，再看 case_quality_audit 的 P0/P1 详情。
- [ ] 等测试组真实案例测试报告；重点确认 lint 通过但 Quality Audit 抓到的问题是否符合预期，是否有误报/漏报。
- [ ] 如果进入 v0.10.4，优先评估 Quality Beyond Lint 第二层：Timing Gate、Asset Gate、Render Integrity、docs/test ergonomics。
- [ ] 评估 Guardrail Hydrator：hash 相同但插件版本更新时，是否也应刷新 managed block metadata version，降低测试组误读。
- [ ] 更新/补齐 framepack-plugin-engineering skill，使其覆盖 v0.10.x 的插件开发、部署、版本同步、Environment & Upgrade Manager、Quality Audit 发布流程。

## 笔记

- 测试组和开发组分工：测试由测试组测，开发侧不要抢跑；开发侧负责修复、交接台、版本/部署/路径口径核验。
- 老田提交前偏好：先做 “simplify + 审核”，最后再 commit。
- 交接台更新原则：replace not append；阶段切换/发布/准备开新 session 前必须更新 `.hermes/CONTEXT.md` 并单独提交 handoff。
- v0.10.3 测试组脚本会写报告到 `--output-dir`；不要把测试组输出报告误提交，除非用户明确要求归档。
