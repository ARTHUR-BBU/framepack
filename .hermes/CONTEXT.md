# hyperframes 开发工程 — 工作交接台

> 新对话打开后，读完本文就能接上。
> 这不是历史日志，是当前手台；旧状态靠 Git 历史追溯。

## 当前状态

<!-- ⚠️ 此区块每次会话结束时整块替换。不要在上面追加。 -->

**阶段**: Framepack v0.11-dev Kinetic Taste Engine 已完成 feature commit、部署同步与测试组真人实例测试；尚未 bump/tag/release，正式 manifest 版本仍是 v0.10.6。
**分支**: `framepack-agent-platform`
**正式源码版本**: v0.10.6（`framepack-plugin/plugin.yaml` 仍为 `0.10.6`；Kinetic Taste Engine 属于 Unreleased / v0.11-dev 成果）
**最后提交**: `234fb11` (`feat: add framepack kinetic taste engine`)
**部署状态**: 已同步关键 Framepack plugin 文件到 `F:/Hermes_windows/plugins/framepack/`；source/deployed key files 在测试组 Case C 中 cmp 全 OK。
**测试**: 源码 full suite `282 passed`; deployed Taste Audit smoke 通过；自动实例三线通过；测试组 live instance case PASS；环境仍为 GUARDED（HyperFrames package script 0.6.99，direct npx 解析到 0.6.104）。

### 本轮做了什么

- ✅ 提交 Kinetic Taste Engine feature commit：`234fb11 feat: add framepack kinetic taste engine`。
- ✅ `.hermes/designs/2026-06-16--framepack-v0.11-kinetic-taste-engine.md` 与 `.hermes/plans/2026-06-16_121719-framepack-v011-kinetic-taste-engine.md` 已随 feature commit 入库。
- ✅ 提交前门禁完成：security scan clean；independent reviewer 最终 `passed=true`；parser edge cases 已按 TDD 修复。
- ✅ 源码测试：`cd F:/hyperframes/framepack-plugin && python -m pytest tests/ -q -o "addopts="` → `282 passed in 12.27s`。
- ✅ 部署同步：`F:/hyperframes/framepack-plugin` 关键文件同步到 `F:/Hermes_windows/plugins/framepack`；deployed CLI smoke 输出 `risk=0/suggestion=0/note=0`。
- ✅ 自动实例三线保留在 `F:/hyperframes/test-team-runs/kinetic-taste-engine/`（保留现场，不提交）：
  - Case A positive：`risk=0/suggestion=0/note=0`。
  - Case B negative：命中 `generic_fade_stack`、`static_mockup_risk`、`surprise_without_intent`、`motif_not_transformed`。
  - Case C CLI/deploy：help/json/markdown/cmp 全通过。
- ✅ 测试组真人实例测试完成，case：`F:/Framepack-01-test/cases/pearl-celestial-memory-20s`。
  - `npm run check` 成功：lint `0 errors, 3 warnings`；validate 通过；inspect `0 layout issues`。
  - `npm run render` 成功。
  - Framepack semantic quality audit：`P0=0, P1=0, P2=0, P3=0`。
  - `ffprobe`：`1920x1080`, `30fps`, `20.000000s`, `600` frames。
  - Taste Generation / HyperFrames Handoff Fidelity / Rendered Deliverable 均 PASS。
  - Environment 判定为 GUARDED：package script 0.6.99，direct npx 0.6.104。
- ✅ 测试组补正 canonical weapon calls：`textSplitEnter(...)`、`cardCascadeReveal(...)`，避免“内联复刻但审计不认武器”的老毛病。

### 注意点 / 风险

- ⚠️ HyperFrames 版本口径漂移仍在：case package script 使用 `hyperframes@0.6.99`，direct `npx hyperframes` 当前解析到 `0.6.104`。
- ⚠️ Framepack doctor 对高于 tested max 的 HyperFrames 仍会进入 guarded；测试组已证明 0.6.104 环境可完成 live case，但尚未把 tested max 正式上调。
- ⚠️ Golden case 仍有 3 个非阻塞 warnings：`overlapping_gsap_tweens`、`gsap_studio_edit_blocked`、`caption_exit_missing_hard_kill`。若要作为基准样片，应单独清洁。
- ⚠️ `F:/Framepack-01-test` 不是 git repo；case 产物属于测试工作台现场，不要误以为已入主仓。
- ⚠️ `F:/hyperframes/test-team-runs/` 是自动实例测试现场，目前未跟踪；保留现场但不要混入 release commit，除非用户明确要求归档。

### 下次要做什么

1. 清理 `F:/Framepack-01-test/cases/pearl-celestial-memory-20s` 的 3 个 HyperFrames warnings，目标是让它成为 golden baseline；边界：不改创意方向、不改总时长、不换武器。
2. 专门验证 HyperFrames `0.6.104` 兼容性：blank smoke + live case check/render + 与 0.6.99 口径对照；确认后再决定是否更新 doctor tested max。
3. 准备 v0.11.0 release-prep：全面同步版本面（plugin.yaml、README、AGENTS/guardrails、CHANGELOG、skill frontmatter、logger/文案、测试组入口等），不要只改版本号。

## 关键路径

- 项目根：`F:\hyperframes\`
- 开发目录：`F:\hyperframes\framepack-plugin\`
- 部署目录：`F:\Hermes_windows\plugins\framepack\`
- Active independent framepack skill：`F:\Hermes_windows\skills\software-development\framepack\`
- 当前 smoke 现场：`F:\hyperframes\tmp\taste-audit-smoke\`（保留现场，不提交）
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
- v0.10.4：Arsenal Binding Contract；arsenal 自动创建/同步、canonical weapon function、inline GSAP hint、sync opt-in。
- v0.10.5：Production Quality Layer；timeline manifest、proof frames/contact sheet、scene spec、production quality audit、lightweight hook sync。
- v0.10.6：Production Hardening Patch；external font dependency、本地字体资产缺失、低可见性风险、NaN/Infinity、proof path project-local 审计。
- v0.11-dev：Kinetic Taste Engine；Reference DNA、Visual Physics、Kinetic Grammar、Director Taste Moves、Controlled Surprise、Taste Audit CLI。

## 待办 / 想法池

- [x] v0.11 Kinetic Taste Engine 设计文档落盘并获确认。
- [x] v0.11 Kinetic Taste Engine 实施计划落盘。
- [x] Kinetic Taste Engine MVP 源码实现 + 测试 + 部署同步。
- [x] commit 前 simplify + 审核。
- [x] commit 本轮 feature：`234fb11 feat: add framepack kinetic taste engine`。
- [x] 测试组 live instance case 通过：`F:/Framepack-01-test/cases/pearl-celestial-memory-20s`。
- [ ] 清理 pearl-celestial-memory-20s 的 3 个 HyperFrames warnings，沉淀为 golden baseline。
- [ ] 验证 HyperFrames 0.6.104 兼容性并决定是否上调 doctor tested max。
- [ ] 后续 release-prep 时再 bump v0.11 版本与 release surfaces。

## 笔记

- 测试组和开发组分工：测试由测试组测，开发侧不要抢跑；开发侧负责修复、交接台、版本/部署/路径口径核验。
- 老田提交前偏好：先做 “simplify + 审核”，最后再 commit。
- 交接台更新原则：replace not append；阶段切换/发布/准备开新 session 前必须更新 `.hermes/CONTEXT.md` 并单独提交 handoff。
- Framepack 边界不变：Framepack 不写 HTML、不替代 HyperFrames lint/render；Taste Audit 是导演批注，不是审美总分。
