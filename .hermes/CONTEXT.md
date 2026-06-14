# hyperframes 开发工程 — 工作交接台

> 新对话打开后，读完本文就能接上。
> 这不是历史日志，是当前手台；旧状态靠 Git 历史追溯。

## 当前状态

<!-- ⚠️ 此区块每次会话结束时整块替换。不要在上面追加。 -->

**阶段**: Framepack v0.10.2 — Environment & Upgrade Manager groundwork，已 bump + 已部署，等待测试组验证  
**分支**: framepack-agent-platform  
**测试**: 测试组正在安排；本轮不由开发侧重复跑测试。CHANGELOG 记录 v0.10.2 full plugin suite: 182 passed。  
**最后提交**: edd61d0 (Bump Framepack to v0.10.2)  
**工作区**: clean（0 个未提交改动，更新本交接台前确认）

### 上次做了什么

- ✅ Framepack 已升级到 v0.10.2：Environment & Upgrade Manager groundwork。
- ✅ 源码版本确认：`F:\hyperframes\framepack-plugin\plugin.yaml` 为 `version: "0.10.2"`。
- ✅ 部署版本确认：`F:\Hermes_windows\plugins\framepack\plugin.yaml` 为 `version: "0.10.2"`。
- ✅ v0.10.2 release surfaces 已对齐：plugin.yaml、__init__.py logger、pre/post hooks logger/docstring、compat/hyperframes-support.json、core/arsenal_registry.py、scripts/apply_skill_overlays.py、5 个 plugin skills、README/docs/AGENTS/CHANGELOG。
- ✅ v0.10.2 新增能力主线：Environment Doctor、Skill Install Manager、Skill Overlay Planner/Apply Planner、Skill Upgrade Manager、Framepack Upgrade Report、HyperFrames support-window policy、guarded newer-version mode。
- ✅ 测试项目 `F:\Framepack-01-test\` 已清理成干净起跑线：保留 AGENTS.md、.framepack registry/capability/upstream reports、测试素材、反向解析参考；清掉上轮 frame.md/index.html/.hyperframes/renders/snapshots/.hermes 等施工残留。
- ✅ 测试组审计报告显示：部署版 12+ 处版本号全部 0.10.2，dev source 同步确认 0.10.2。

### 测试组反馈 / 注意点

- ⚠️ 测试项目 AGENTS.md managed block 标记仍是 `version=0.10.0`，但 hash 与部署版 guardrails 匹配。当前判断：非运行 bug，Hydrator 按内容 hash 判等不重写；但会造成“旧标签贴新箱子”的认知噪音。后续可考虑让 Hydrator 在 hash 相同但 plugin version 更新时刷新 metadata。
- ⚠️ 测试组发现 `framepack-plugin/README.md` 和 `framepack-plugin/docs/README.zh-CN.md` 不存在，但 `test_deploy_manifest.py` 里有期望检查。实际 README 位于仓库根 `F:\hyperframes\README.md` 与 `F:\hyperframes\docs\README.zh-CN.md`。下一轮 simplify/review 时要确认：是测试路径口径错了，还是需要在 plugin 目录补 README 镜像。
- ⚠️ `.hermes/CONTEXT.md` 原先还停在 v0.8.0，已在本次更新为 v0.10.2 状态，避免新 session 被旧白板带偏。

### 下次要做什么

- 等测试组执行 v0.10.2 测试并回传问题；开发侧不要抢跑测试。
- 收到测试反馈后，按问题类型加载对应 skill：bug → `systematic-debugging`；改 Python/项目文件 → `test-driven-development`；完成前 → `verification-before-completion`；提交前 → `requesting-code-review`。
- 进入提交/发版前，做一轮老田要求的 “simplify + 审核”：瘦身逻辑、审查潜在问题、确认 README 路径口径、确认 Hydrator metadata version 是否需要刷新。

## 新对话打开后

1. 读 AGENTS.md，确认 Framepack 开发铁律和当前版本。
2. 读本文件 `## 当前状态`，不要再按 v0.8.0 旧状态行动。
3. `git status --short`，确认工作区是否干净。
4. `grep '^version:' framepack-plugin/plugin.yaml` 和 `grep '^version:' /f/Hermes_windows/plugins/framepack/plugin.yaml`，确认源码/部署是否仍同步。
5. 看测试组有没有新反馈；没有反馈就候着，不主动改代码。

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

## 待办 / 想法池

- [ ] 等测试组 v0.10.2 反馈；按真实问题修，不闭门造车。
- [ ] simplify + 审核：检查 v0.10.2 新增 manager/report/doctor 逻辑是否可瘦身，是否有重复抽象或路径口径漂移。
- [ ] 确认 README 路径口径：修 `test_deploy_manifest.py` 期待根 README，或补 `framepack-plugin/README.md` 镜像。
- [ ] 评估 Guardrail Hydrator：hash 相同但插件版本更新时，是否也应刷新 managed block metadata version，降低测试组误读。
- [ ] 更新/补齐 framepack-plugin-engineering skill，使其覆盖 v0.10.x 的插件开发、部署、版本同步、Environment & Upgrade Manager 流程。
- [ ] 后续真实视频端到端验证继续交给测试组；开发侧只根据反馈修正产品/插件。

## 笔记

- 测试组和开发组分工：测试由测试组测，开发侧不要抢跑；开发侧负责修复、交接台、版本/部署/路径口径核验。
- 老田提交前偏好：先做 “simplify + 审核”，最后再 commit。
- 交接台更新原则：replace not append；不要让 v0.8.0 旧状态继续污染新 session。
