# hyperframes 开发工程 — 工作交接台

> 新对话打开后，读完本文就能接上。
> 这不是历史日志，是当前手台；旧状态靠 Git 历史追溯。

## 当前状态

<!-- ⚠️ 此区块每次会话结束时整块替换。不要在上面追加。 -->

**阶段**: v0.16.0 post-release；HyperFrames 0.7.21 官方材料已落库；Pipeline Visibility 已完成非模板优先校准，并完成模板/非模板隔离 dogfood smoke。
**分支**: `main` 领先 `origin/main`（未 push；本轮最新功能提交 `1391c32`，handoff commit 后会再 +1）
**源码版本**: `framepack-plugin/plugin.yaml = 0.16.0`（未 bump；本轮是 Unreleased 开发成果）
**HyperFrames 窗口**: `0.7.3 – 0.7.21`（supported_min 不变）
**最后功能提交**: `1391c32` (`fix: update template selection progress`)
**部署状态**: active plugin `F:/Hermes_windows/plugins/framepack/` 已同步；独立 skill `F:/Hermes_windows/skills/software-development/framepack/` 已同步；最新 hook/test md5 一致。
**测试**: 源码 `900 passed in 20.55s`；部署目录 `900 passed in 20.42s`；targeted `19 passed`；dogfood smoke 通过；`git diff --check` clean；严格 secret scan clean。

### 上次做了什么

- ✅ 摸底排查：确认旧 `pipeline_progress.py` 是模板轴（空项目/模板选择都落到“已选模板”心智），`asset-intake.md` 只 inject 素材检查、不写 progress。
- ✅ 官方材料落库：`hyperframes.heygen.com` Prompting / Pipeline / Common Mistakes / 4K / HDR / HTML-in-Canvas / Keyframes / llms.txt 存到 `.hermes/research/hyperframes-0.7.21-official/`。
- ✅ 设计与计划：新增 `.hermes/designs/2026-07-01--official-prompt-pipeline-alignment.md` 与 `.hermes/plans/2026-07-01_203809-non-template-pipeline-alignment.md`。
- ✅ 代码校准：将 progress spine 从模板轴改为官方 pipeline 轴：素材准备 → 视觉身份 → 文案脚本 → 分镜导演稿 → 配音/节奏 → 制作中 → 验片交付。
- ✅ 非模板入口补齐：`.framepack/asset-intake.md` 写入后现在会跑 `core.gates.asset_intake.check_asset_depth` 并写 `.framepack/progress.md`；非模板项目会注入“创作小票”（时长/画幅/风格/关键元素/音频/输出目标）。
- ✅ 模板入口补齐：`template-selection.md` 写入后现在同时注入模板参数卡并写 `.framepack/progress.md`，显示“素材准备（template-selection.md）”，不再回到“已选模板”轴。
- ✅ dogfood smoke：新增 `.hermes/dogfood/non_template_template_pipeline_smoke.py`，用部署插件真实 hook 跑非模板 asset-intake → frame.md → expanded-prompt，以及模板 template-selection → 参数卡 → progress。
- ✅ skill 规则沉淀：`framepack` skill 新增“非模板与模板一等公民”规则，并新增 `references/non-template-first-pipeline-alignment.md`；三副本 md5 已同步。
- ✅ TDD + simplify/code-review：先 RED 后 GREEN；静态安全扫描 clean；未引入复杂状态机，仍是文件证据检测 + 伴随式 gates。

### 当前关键证据

```text
feature commit: 60112be feat: align pipeline progress with non-template flow
follow-up commit: 1391c32 fix: update template selection progress
source targeted: 19 passed in 0.25s
source full: 900 passed in 20.55s
deployed full: 900 passed in 20.42s
dogfood: python .hermes/dogfood/non_template_template_pipeline_smoke.py → all checks True
md5 sync: on_post_tool_call.py + test_post_tool_gate_routing.py OK
git diff --check: clean
strict secret scan: clean
```

### 注意点 / 坑位

- 本轮不 bump `plugin.yaml`，不移动 v0.16.0 tag；这是 post-release / Unreleased 开发成果。
- `PipelineStage.SCRIPT` 与 `PipelineStage.TIMING` 目前是官方 pipeline 轴上的用户可见阶段，但没有独立 artifact detector；它们通过整体进度位置表达，不要误读成已有单独文件。
- 非模板“创作小票”只在没有 `.framepack/template-selection.md` 时注入；模板项目继续走模板参数卡。
- `asset-intake.md` / `template-selection.md` 的项目根解析已修：都回到 project root，不再误写到 `.framepack/.framepack/progress.md`。
- 简化原则：没有新增 schema engine / 状态机 / 数据库；仍是 artifact evidence + existing gates。
- `.hermes/dogfood/non_template_template_pipeline_smoke.py` 依赖部署路径 `F:/Hermes_windows/plugins/framepack`，用于 runtime smoke，不是通用 pytest。

### 下次要做什么

1. 如果要发版：走 Framepack release/version bump 流程，把 Unreleased 成果整理进正式版本号、README、plugin.yaml、changelog 和部署包。
2. 继续真实项目 dogfood：用一个完整非模板创意案从素材到 Studio 预览，观察 Script/Timing 两个阶段是否需要轻量 evidence detector。
3. 如需推远端：先确认是否要 push 当前 `main` ahead commits。

## 设计文档

- `F:/hyperframes/.hermes/designs/2026-07-01--official-prompt-pipeline-alignment.md` — 官方 Prompt/Pipeline + 模板/非模板双入口校准（已实现）
- `F:/hyperframes/.hermes/plans/2026-07-01_203809-non-template-pipeline-alignment.md` — 非模板优先 Pipeline Alignment TDD 计划（已完成）
- `F:/hyperframes/.hermes/research/hyperframes-0.7.21-official/` — HyperFrames 0.7.21 官方资料本地镜像
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
