# hyperframes 开发工程 — 工作交接台

> 新对话打开后，读完本文就能接上。
> 这不是历史日志，是当前手台；旧状态靠 Git 历史追溯。

## 当前状态

<!-- ⚠️ 此区块每次会话结束时整块替换。不要在上面追加。 -->

**阶段**: Framepack v0.10.3 — 测试组自动测试 + whop 真实案例测试已完成，全链路绿灯；进入 v0.10.4 产品 gap 设计准备阶段  
**分支**: framepack-agent-platform  
**正式版本**: v0.10.3  
**GitHub Release**: https://github.com/ARTHUR-BBU/framepack/releases/tag/v0.10.3  
**发布提交**: 915623e ([verified] release framepack v0.10.3)  
**最新 handoff 提交**: 00fc76f (handoff: update framepack v0.10.3 release status)  
**Tag**: v0.10.3  
**测试**: 发布前全量 pytest `198 passed`；测试组自动测试 `passed=5, failed=0, skipped=0`；whop 新案例 HyperFrames lint `0 errors, 7 warnings`、validate `0 errors`、snapshot `6/6`、render `1280x720, 35s, 30fps, 1050 frames, 1.3 MB MP4, exit_code=0`；Quality Audit `P0=1, P1=9, P2=0, P3=0, total=10`。  
**部署**: 源码 `F:\hyperframes\framepack-plugin` 已同步到活跃部署目录 `F:\Hermes_windows\plugins\framepack`；源码/部署版 `plugin.yaml` 均为 `version: "0.10.3"`。  
**工作区**: 测试报告已接收；本交接台更新需单独提交。

### 上次做了什么

- ✅ 接收并核验测试组 v0.10.3 完整报告：`F:/Framepack-01-test/TEST-REPORT-v0.10.3.md` 与 Obsidian 归档报告内容一致。
- ✅ 自动测试全绿：`source_pytest`、`release_version_sync`、`quality_audit_cli`、`deployed_smoke`、`case_quality_audit` 共 5/5 PASS；部署版版本号确认 0.10.3。
- ✅ whop “Get a Bag” 全新复刻案例跑通完整链路：参考 DNA → frame.md → expanded-prompt.md（12 场景）→ index.html（336 行）→ lint/validate/snapshot/render。
- ✅ 出片成功：`F:/Framepack-whop-case/renders/Framepack-whop-case_2026-06-15_11-54-42.mp4`，35s / 1280x720 / 30fps / 1050 frames / 1.3 MB。
- ✅ Quality Audit 在新案例检出 10 个产品 gap：P0 `arsenal_missing` ×1，P1 `manifest_weapon_not_called` ×9；这是安检门生效，不是工具链失败。
- ✅ 相比旧案例 28 issues 明显改善：手动 `data-hf-id` 从 85 降到 0，武器参数漂移从 10 降到 0，P0 从 15 降到 1。
- ✅ 明确 v0.10.4 候选方向：arsenal 自动初始化、武器函数名到 HTML 调用绑定、审计器对 HANDWRITE/可接受偏离的语义处理。

### 测试组结论

- v0.10.3 自动测试通过：5/5 PASS，0 failed。
- v0.10.3 实际案例测试通过：Framepack 创意流程 + HyperFrames 制作流水线端到端绿灯。
- 10 个 Quality Audit 问题均为产品层 gap，不阻塞 v0.10.3；应转入 v0.10.4 设计。
- 报告文件：
  - `F:/Framepack-01-test/TEST-REPORT-v0.10.3.md`
  - `C:/Users/LENOVO/Documents/AI-Coach-Vault/Windows/2026-06-15 Framepack v0.10.3 完整测试报告.md`
  - `F:/Framepack-whop-case/framepack-quality-audit.md`

### 下次要做什么

- 如果继续开发，先加载 `brainstorming`，设计 v0.10.4：arsenal 自动初始化 + weapon binding runtime/adapter + Quality Audit 语义降噪。
- 进入修复前不要直接写代码；先决定产品边界：Framepack 负责生成/绑定武器函数到什么程度，HyperFrames 仍只负责 HTML/lint/render。
- 若改 Python：加载 `test-driven-development`，先为 arsenal 初始化和 weapon call detection/binding 写失败测试。
- 完成声明前加载 `verification-before-completion`；提交前按老田偏好先做 simplify + 审核，再加载 `requesting-code-review`。


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

- [ ] v0.10.4 头脑风暴：arsenal 自动初始化机制（新项目何时创建 `.framepack/arsenal.json`、默认 schema、空 registry 是否算 P0）。
- [ ] v0.10.4 头脑风暴：武器函数名绑定机制（Manifest weapon → registered function → HTML 调用），避免 Agent 继续内联 GSAP。
- [ ] v0.10.4 头脑风暴：Quality Audit 对 `HANDWRITE`、可接受偏离、pattern-equivalent inline GSAP 的判定策略，降低误报但不放松铁律。
- [ ] 评估 Guardrail Hydrator：hash 相同但插件版本更新时，是否也应刷新 managed block metadata version，降低测试组误读。
- [ ] 更新/补齐 framepack-plugin-engineering skill，使其覆盖 v0.10.x 的插件开发、部署、版本同步、Environment & Upgrade Manager、Quality Audit 发布流程。


## 笔记

- 测试组和开发组分工：测试由测试组测，开发侧不要抢跑；开发侧负责修复、交接台、版本/部署/路径口径核验。
- 老田提交前偏好：先做 “simplify + 审核”，最后再 commit。
- 交接台更新原则：replace not append；阶段切换/发布/准备开新 session 前必须更新 `.hermes/CONTEXT.md` 并单独提交 handoff。
- v0.10.3 测试组脚本会写报告到 `--output-dir`；不要把测试组输出报告误提交，除非用户明确要求归档。
