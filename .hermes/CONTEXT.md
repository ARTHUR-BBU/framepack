# hyperframes 开发工程 — 工作交接台

> 新对话打开后，读完本文就能接上。
> 这不是历史日志，是当前手台；旧状态靠 Git 历史追溯。

## 当前状态

<!-- ⚠️ 此区块每次会话结束时整块替换。不要在上面追加。 -->

**阶段**: v0.16.0 post-release；HyperFrames 0.7.21 官方材料已落库；Pipeline Visibility 已完成非模板优先校准（模板/非模板双入口一等公民）。
**分支**: `main` 领先 `origin/main`（未 push；feature commit 后 ahead 7，handoff commit 后会 +1）
**源码版本**: `framepack-plugin/plugin.yaml = 0.16.0`（未 bump；本轮是 Unreleased 开发成果）
**HyperFrames 窗口**: `0.7.3 – 0.7.21`（supported_min 不变）
**最后功能提交**: `60112be` (`feat: align pipeline progress with non-template flow`)
**部署状态**: active plugin `F:/Hermes_windows/plugins/framepack/` 已同步；独立 skill `F:/Hermes_windows/skills/software-development/framepack/` 已同步；关键 8 文件 md5 全一致。
**测试**: 源码 `899 passed in 17.72s`；部署目录 `899 passed in 18.28s`；targeted `18 passed`；`git diff --check` clean；严格 secret scan clean。

### 上次做了什么

- ✅ 摸底排查：确认旧 `pipeline_progress.py` 是模板轴（空项目/模板选择都落到“已选模板”心智），`asset-intake.md` 只 inject 素材检查、不写 progress。
- ✅ 官方材料落库：`hyperframes.heygen.com` Prompting / Pipeline / Common Mistakes / 4K / HDR / HTML-in-Canvas / Keyframes / llms.txt 存到 `.hermes/research/hyperframes-0.7.21-official/`。
- ✅ 设计与计划：新增 `.hermes/designs/2026-07-01--official-prompt-pipeline-alignment.md` 与 `.hermes/plans/2026-07-01_203809-non-template-pipeline-alignment.md`。
- ✅ 代码校准：将 progress spine 从模板轴改为官方 pipeline 轴：素材准备 → 视觉身份 → 文案脚本 → 分镜导演稿 → 配音/节奏 → 制作中 → 验片交付。
- ✅ 非模板入口补齐：`.framepack/asset-intake.md` 写入后现在会跑 `core.gates.asset_intake.check_asset_depth` 并写 `.framepack/progress.md`；非模板项目会注入“创作小票”（时长/画幅/风格/关键元素/音频/输出目标）。
- ✅ 模板入口保留但降级为 evidence：`template-selection.md` 仍会触发模板参数卡；但不再定义全局 pipeline skeleton。
- ✅ skill 规则沉淀：`framepack` skill 新增“非模板与模板一等公民”规则，并新增 `references/non-template-first-pipeline-alignment.md`；三副本 md5 已同步。
- ✅ TDD + simplify/code-review：先 RED 后 GREEN；静态安全扫描 clean；未引入复杂状态机，仍是文件证据检测 + 伴随式 gates。

### 当前关键证据

```text
feature commit: 60112be feat: align pipeline progress with non-template flow
source targeted: 18 passed in 0.24s
source full: 899 passed in 17.72s
deployed full: 899 passed in 18.28s
md5 sync: pipeline_progress / on_post_tool_call / two tests / SKILL.md / non-template reference all OK
git diff --check: clean
strict secret scan: clean
```

### 注意点 / 坑位

- 本轮不 bump `plugin.yaml`，不移动 v0.16.0 tag；这是 post-release / Unreleased 开发成果。
- `PipelineStage.SCRIPT` 与 `PipelineStage.TIMING` 目前是官方 pipeline 轴上的用户可见阶段，但没有独立 artifact detector；它们通过整体进度位置表达，不要误读成已有单独文件。
- 非模板“创作小票”只在没有 `.framepack/template-selection.md` 时注入；模板项目继续走模板参数卡。
- `asset-intake.md` 的项目根解析已修：`.framepack/asset-intake.md` / `.framepack/template-selection.md` 都回到 project root，不再误写到 `.framepack/.framepack/progress.md`。
- 简化原则：没有新增 schema engine / 状态机 / 数据库；仍是 artifact evidence + existing gates。

### 下次要做什么

1. 用新非模板轴跑一次端到端 dogfood：模糊想法/URL/素材 → asset-intake → frame.md → expanded-prompt，确认 progress.md 和创作小票真实可用。
2. 用模板项目复测：template-selection → 模板参数卡仍触发，且 progress.md 显示“素材准备（template-selection.md）”而不是“已选模板”。
3. 若 dogfood 发现 Script/Timing 阶段容易误解，再决定是否增加轻量 evidence detector（不要先造系统）。

## 设计文档

- `F:/hyperframes/.hermes/designs/2026-07-01--official-prompt-pipeline-alignment.md` — 官方 Prompt/Pipeline + 模板/非模板双入口校准（已实现）
- `F:/hyperframes/.hermes/plans/2026-07-01_203809-non-template-pipeline-alignment.md` — 非模板优先 Pipeline Alignment TDD 计划（已完成）
- `F:/hyperframes/.hermes/research/hyperframes-0.7.21-official/` — HyperFrames 0.7.21 官方资料本地镜像
- `F:/hyperframes/.hermes/designs/2026-06-30--pipeline-visibility.md` — 伴随式 Gate + 用户状态牌（已实现）
- `F:/hyperframes/.hermes/plans/2026-06-30_220000-pipeline-visibility.md` — 实现计划（已完成）
- `F:/hyperframes/.hermes/designs/2026-06-19--v014-weight-control-system.md` — 权重控制系统设计
- `F:/hyperframes/.hermes/designs/2026-06-19--sprite-forge-integration.md` — Sprite Forge 集成设计
- `F:/hyperframes/.hermes/designs/2026-06-21--execution-contract-audit.md` — Execution Contract Audit 设计

## 文件索引

- 源码: `F:/hyperframes/framepack-plugin/`
- 部署: `F:/Hermes_windows/plugins/framepack/`
- Pipeline 核心: `core/pipeline_progress.py`（detect + render progress）
- Hook 路由: `hooks/on_post_tool_call.py`（_run_pipeline_gates_and_update + _handle_template_param_card）
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
