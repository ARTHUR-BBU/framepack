# hyperframes 开发工程 — 工作交接台

> 新对话打开后，读完本文就能接上。
> 这不是历史日志，是当前手台；旧状态靠 Git 历史追溯。

## 当前状态

<!-- ⚠️ 此区块每次会话结束时整块替换。不要在上面追加。 -->

**阶段**: v0.16.0 post-release / Unreleased；HyperFrames 0.7.24 recon 完成（YELLOW），golden lint debt 已定位，hook classification 已补 validate，Framepack capability radar 已更新全部 0.7.24 skills pack。
**分支**: `main` 领先 `origin/main` 14 个提交（未 push）。
**源码版本**: `framepack-plugin/plugin.yaml = 0.16.0`（未 bump）。
**HyperFrames 窗口**: production support 仍为 `0.7.3 – 0.7.21`；recon target `0.7.24` 判定 YELLOW。
**最新开发提交**: `adebafa` (`fix: classify HyperFrames validate command`)。
**部署状态**: active plugin `F:/Hermes_windows/plugins/framepack/` 已同步；独立 skill 已同步；md5 全绿。
**测试**: 源码 `915 passed in 18.95s`；部署目录 `915 passed in 18.12s`；md5 sync OK。

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
- ✅ dogfood 黄灯闭环：Script Lanes 支持 `director_decision: true` + `decision_reason` 作为自主导演证据；不再伪造 user confirmation。
- ✅ Scene Continuity 证据货架：timeline sync 现在为每个 scene scaffold `continuity`，并在 `proofs.required` 自动登记 scene boundary proof 位；没有真实 proof 仍保持 yellow，不造假。
- ✅ Context Sync 卫生修复：workbench hydrate 同步写 case-level `.framepack/context-sync.md` receipt，case readiness 可直接读到 GREEN。
- ✅ HyperFrames Capability Radar：新增 `core/hyperframes_capabilities.py` + `scripts/framepack_hyperframes_capabilities.py`，并新增 `HyperFrames Capability Alignment` gate；遇到 URL/website/capture/registry/logo wall/sponsor/parallax/skills-pack 信号，会要求记录 used/waived，避免 Framepack 重造 HyperFrames 官方能力。
- ✅ HyperFrames 0.7.24 recon：blank smoke 全链路通过（lint/validate/inspect/render/ffprobe 0 error）；catalog JSON 可解析但 stderr 有 registry timeout skip；doctor ok=false（缺 Docker + whisper-cpp + MusicGen，均为 optional）。
- ✅ Golden project recon：aura-noema 模板 render 成功（60s/1800frames/1920x1080/30fps）；lint 0.7.24 新增 2 个 `gsap_css_transform_conflict` error（loader-scanline / loader-strip），是 lint 规则升级暴露的模板旧债，非渲染阻断。
- ✅ Hook classification 补 `validate`：0.7.24 命令面全覆盖（32 个命令全部显式分类，0 unknown fallback）。
- ✅ Capability radar 更新：新增 music-to-video / talking-head-recut / slideshow / general-video；记录 20 个 0.7.24 observed skills。

### 当前关键证据

```text
feature commit: 60112be feat: align pipeline progress with non-template flow
follow-up commit: 1391c32 fix: update template selection progress
source targeted: 19 passed in 0.25s
source full: 915 passed in 18.95s
deployed full: 915 passed in 18.12s
dogfood: python .hermes/dogfood/non_template_template_pipeline_smoke.py → all checks True
md5 sync: on_post_tool_call.py + test_post_tool_gate_routing.py OK
git diff --check: clean
strict secret scan: clean
```

### 注意点 / 坑位

- 本轮不 bump `plugin.yaml`，不移动 v0.16.0 tag；这是 post-release / Unreleased 开发成果。
- `Script Lanes` 现在支持用户确认、导演自主决策、waiver 三种 green 证据；但没有真实确认/决策/豁免时仍应 yellow。
- `Scene Continuity` 会 scaffold boundary proof 位，但不会自动 green；必须有真实 boundary_proofs 才算证据闭环。
- HyperFrames Capability Alignment 是路由雷达，不是安装器；发现官方能力信号后要求记录 used/waived，不自动安装 latest 或 skills pack。
- HyperFrames 0.7.24 判定 YELLOW：runtime 可用，但 doctor 缺 Docker/whisper-cpp/MusicGen（optional），catalog stderr 有 timeout skip，golden template 有 2 个 gsap_css_transform_conflict lint error（旧债）；不升生产窗口。
- `validate` 命令必须走 requires_handoff 分类；0.7.24 之前 Framepack 漏分类，已修。
- 非模板“创作小票”只在没有 `.framepack/template-selection.md` 时注入；模板项目继续走模板参数卡。
- `asset-intake.md` / `template-selection.md` 的项目根解析已修：都回到 project root，不再误写到 `.framepack/.framepack/progress.md`。
- 简化原则：没有新增 schema engine / 状态机 / 数据库；仍是 artifact evidence + existing gates。
- `.hermes/dogfood/non_template_template_pipeline_smoke.py` 依赖部署路径 `F:/Hermes_windows/plugins/framepack`，用于 runtime smoke，不是通用 pytest。

### 下次要做什么

1. 如果要发版：走 Framepack release/version bump 流程，把 Unreleased 成果整理进正式版本号、README、plugin.yaml、changelog 和部署包。
2. HyperFrames 0.7.24 recon 已完成（YELLOW）；如需升生产窗口，需先修 golden template 的 gsap_css_transform_conflict lint debt。
3. 继续真实项目 dogfood：要求填写 `.framepack/hyperframes-capability-alignment.md` 的 used/waived，专门观察 Framepack 是否正确调用 website-to-video/capture/catalog/skills-pack，而不是重造轮子。
4. 如需推远端：先确认是否要 push 当前 `main` ahead 14 commits。

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
