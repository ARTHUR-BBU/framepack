# hyperframes 开发工程 — 工作交接台

> 新对话打开后，读完本文就能接上。
> 这不是历史日志，是当前手台；旧状态靠 Git 历史追溯。

## 当前状态

<!-- ⚠️ 此区块每次会话结束时整块替换。不要在上面追加。 -->

**阶段**: v0.19.0 / Commercial Video Quality Engine Phase 3A 已完成；准备在新 session 试做 Phase 3B `Taste Control Loop`。
**分支**: `main` 与 `origin/main` 对齐；handoff 前工作区无业务改动。
**源码版本**: `framepack-plugin/plugin.yaml = 0.19.0`。
**HyperFrames 窗口**: Framepack v0.19.0 描述仍以 HyperFrames 0.7.21 Director Workbench 为产品锚点；生产升级窗口另行 recon，不在本次 handoff 范围。
**最后功能提交**: `1eb888d` (`feat: add commercial taste audit signals`)。
**部署状态**: active plugin `F:/Hermes_windows/plugins/framepack/` 已在 Phase 3A 同步；关键文件 md5 已校验通过。
**测试**: Phase 3A 源码全量 `1033 passed in 68.07s`；部署目录全量 `1033 passed in 103.99s`；focused taste/quality bridge `50 passed in 5.30s`；ad-hoc `ADHOC_PHASE3_COMMERCIAL_TASTE_VERIFY_PASSED=True`。

### 上次做了什么

- ✅ Phase 2 完成并推送：`07e15bb feat: add weapon preset registry`。把武器系统从“推荐武器”升级到“推荐武器 + preset + scorecard + params_hint + post-write gate”。
- ✅ Phase 2 reviewer-mode 修复真实误报：`no caption or callout overlays` 不再误触发 `caption-clip-wipe` / captions skill。
- ✅ 战略 README 更新并推送：`d4b12f2 docs: refresh Framepack strategy readmes`。中英文 README 已写入 v0.19.0 产品定位、设计哲学、架构、功能模块关系、武器质量引擎。
- ✅ 发布 README 规则沉淀：创建 `framepack-release-readme-refresh` skill，并提交 `de37599 docs: require release README refresh`。以后每个 Framepack 版本发布必须更新英文 `README.md` 与中文 `docs/README.zh-CN.md`。
- ✅ Phase 3A 完成并推送：`1eb888d feat: add commercial taste audit signals`。`core/taste_audit.py` 新增商业视频廉价感信号：`text_dominance`、`product_absence`、`flat_background`、`weapon_preset_missing`、`bgm_unplanned`、`no_proof_frames`。
- ✅ Phase 3A 已接入 quality bridge：`text_dominance` 等 taste issue 能进入主 `quality_audit`，例如映射为 P1。
- ✅ 用户明确质疑：Taste 不能停留在“品味原则/会议稿”。Framepack 作为 Hermes 插件必须 Harness Agent：短规则 + 文件账本 + hook 注入 + gate + waiver + proof 小票。
- ✅ 已达成下一步判断：Phase 3A 只是“雷达”，不算真正产品化；新 session 要试做 Phase 3B：`Taste Control Loop`，让 P1 taste debt 不能被 Agent 静默忽略。

### 当前关键证据

```text
latest functional commit: 1eb888d feat: add commercial taste audit signals
README strategy commit: d4b12f2 docs: refresh Framepack strategy readmes
README release-rule commit: de37599 docs: require release README refresh
Phase 2 preset commit: 07e15bb feat: add weapon preset registry
source full: 1033 passed in 68.07s
deployed full: 1033 passed in 103.99s
focused taste/quality bridge: 50 passed in 5.30s
md5 sync: PHASE3_MD5_OK=True
ad-hoc: ADHOC_PHASE3_COMMERCIAL_TASTE_VERIFY_PASSED=True
git state before handoff: main == origin/main, no business changes
```

### 注意点 / 坑位

- 本 handoff 是用户要求“开新 session 前先交接”；不要继续在旧 session 开 Phase 3B。
- Phase 3A 的价值是发现廉价感，不是控制 Agent；不要在新 session 把它吹成最终产品化闭环。
- 用户的核心标准：如果 Phase 3B 只是继续加建议，就停，回去搞武器库；只有能形成 Harness Agent 的闭环才继续。
- Hermes 插件可用的控制杆：`ctx.inject_message` 上下文注入、`pre_tool_call` render/preview 前审计、`post_tool_call` 写后验收、`.framepack/*` 文件账本、waiver/proof 证据小票。
- Phase 3B 不应做“高级感圣经”。目标是：taste issue → action card → debt ledger → render 前 revise/proof/waiver 三选一 → 注入 Agent 下一步必须处理。
- 创意不能像编译器一样一刀切 block；但 Agent 不能装没看见。正确口径是“修 / 证明 / 签 waiver”，不是绝对禁止 render。
- 开工必须 TDD：先写 failing tests，证明 P1 taste debt 会落账、会被 pre-render hook 注入、修复/waiver 后能放行。
- 改 plugin 文件后必须同步到 `F:/Hermes_windows/plugins/framepack/`，并用 md5 校验，不能只比文件大小。

### 下次要做什么

1. 新 session 第一动作：读本 `CONTEXT.md`，再跑 `git status --short --branch && git log --oneline -5` 现场复核。
2. 加载技能：`brainstorming`、`test-driven-development`、`verification-before-completion`、`framepack-plugin-engineering`、必要时 `hermes-agent`。
3. 试做 Phase 3B 最小闭环，不扩写哲学：
   - `TasteActionCard` / `required_action` / `acceptance` / `repair_target` schema；
   - `.framepack/taste-audit.json` + `.framepack/taste-debt.md` ledger；
   - pre-render/preview hook 注入 `Framepack Taste Control` 消息；
   - P1 open debt 要求 revise / proof / waiver 三选一；
   - waiver 落账后放行但保留记录。
4. 建议第一组 RED 测试：
   - `text_dominance` 生成 action card 与 open debt；
   - `npx hyperframes render` 前 hook 注入 Taste Control，不只是 advisory；
   - 存在 `.framepack/taste-waivers.json` 时同一 issue 变为 waived/放行；
   - 修改 expanded-prompt 后同一 issue 能从 open 变 resolved。
5. 若 Phase 3B 做不出可验证控制闭环：停止 taste，回到武器库扩充 presets/scorecards/真实 commercial case harness。

## 设计文档

- `F:/hyperframes/.hermes/designs/2026-07-01--official-prompt-pipeline-alignment.md` — 官方 Prompt/Pipeline + 模板/非模板双入口校准（已实现）
- `F:/hyperframes/.hermes/plans/2026-07-01_203809-non-template-pipeline-alignment.md` — 非模板优先 Pipeline Alignment TDD 计划（已完成）
- `F:/hyperframes/.hermes/research/hyperframes-0.7.21-official/` — HyperFrames 0.7.21 官方资料本地镜像
- `F:/hyperframes/.hermes/designs/2026-07-02--dogfood-yellow-gates-and-capability-radar.md` — 非模板 dogfood 黄灯修复 + HyperFrames Capability Radar 设计（已实现）
- `F:/hyperframes/.hermes/plans/2026-07-02_092009-non-template-dogfood-next-steps.md` — 测试报告后续执行计划
- `.hermes/dogfood/non_template_template_pipeline_smoke.py` — 部署插件 dogfood smoke（非模板 + 模板双入口）
- `F:/hyperframes/.hermes/designs/2026-06-30--pipeline-visibility.md` — 伴随式 Gate + 用户状态牌（已实现）
- `F:/hyperframes/.hermes/plans/2026-06-30_220000-pipeline-visibility.md` — 实现计划（已完成）
- `F:/hyperframes/.hermes/designs/2026-06-19--v014-weight-control-system.md` — 权重控制系统设计
- `F:/hyperframes/.hermes/designs/2026-06-19--sprite-forge-integration.md` — Sprite Forge 集成设计
- `F:/hyperframes/.hermes/designs/2026-06-21--execution-contract-audit.md` — Execution Contract Audit 设计

## 文件索引

- 源码: `F:/hyperframes/framepack-plugin/`
- 部署: `F:/Hermes_windows/plugins/framepack/`
- Pipeline 核心: `core/pipeline_progress.py`（detect + render progress）
- Hook 路由: `hooks/on_post_tool_call.py`（_run_pipeline_gates_and_update + template/asset intake write hooks）
- Gate 引擎: `core/gates/registry.py` + `core/render_readiness.py`
- 权重核心: `core/control_profile.py` + `core/restraint_audit.py`
- HyperFrames 兼容: `core/hyperframes_adapter.py` + `core/hyperframes_support.py` + `core/environment_doctor.py` + `compat/hyperframes-support.json`
- 模板: `core/templates/` + `templates/bundles/miara-style-template/`
- 独立 skill: `F:/Hermes_windows/skills/software-development/framepack/SKILL.md`（必须与 plugin 副本 md5 一致）
- 测试报告: `F:/hyperframes/framepack-e2e-test/reports/`

## 开发铁律提醒

- TDD: RED → GREEN → 全量回归 → 部署同步(md5) → git commit
- 部署同步必须用 content hash（md5），不能只比 file size
- 改完 PLUGIN 文件必须同步到 `F:/Hermes_windows/plugins/framepack/`（包括测试文件）
- SKILL.md 有三处副本（plugin 源码 / plugin 部署 / 独立 skill），必须三处一致
- 修复 skill 用到问题应 patch skill_manage
