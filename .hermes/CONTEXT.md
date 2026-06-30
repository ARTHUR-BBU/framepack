# hyperframes 开发工程 — 工作交接台

> 新对话打开后，读完本文就能接上。
> 这不是历史日志，是当前手台；旧状态靠 Git 历史追溯。

## 当前状态

<!-- ⚠️ 此区块每次会话结束时整块替换。不要在上面追加。 -->

**阶段**: v0.16.0；HF 窗口升 0.7.21（绿区）；Pipeline Visibility 已实现（3 commits，TDD，零回归）。
**分支**: `main` 领先 `origin/main`（未 push）
**源码版本**: `framepack-plugin/plugin.yaml = 0.16.0`
**HyperFrames 窗口**: `0.7.3 – 0.7.21`（supported_min 不变）
**部署状态**: active plugin `F:/Hermes_windows/plugins/framepack/` 已同步（含 pipeline_progress + 测试）；deployed 894 passed；三处 SKILL.md md5 一致。
**测试工作台**: `F:/Framepack-01-test`（guardrails hash 未变，无需重 hydrate）

### 上次做了什么

**A 路 — HF 升级（绿区，已完成）**：
- 0.7.3 → 0.7.21（18 版本侦察）；crossorigin 零命中 + data-hf-id fix 与铁律不冲突 → 零适配。
- 12 处版本引用同步；881→881 passed；deployed 39 passed。commit `264336f`。
- 修复 SKILL.md 第三副本（独立 skill）漂移，被 `test_deployed_bare_framepack_skill_alias_is_present_and_synced` 抓到。

**B 路 — Pipeline Visibility（已完成，3 commits）**：
- 根因核实：7 个 gate 函数已存在但有测试覆盖，运行时只在 `on_pre_tool_call` render 前调用 1 次 → "终审不是伴随"。
- 设计文档 `.hermes/designs/2026-06-30--pipeline-visibility.md`；实现计划 `.hermes/plans/2026-06-30_220000-pipeline-visibility.md`。
- Task 1 `84e2c6f` — `core/pipeline_progress.py`：PipelineStage 枚举（6 阶段）+ detect_pipeline_stage + render_progress_markdown + write_progress_file。7 测试。
- Task 2 `1412bae` — `_run_pipeline_gates_and_update` 接进 `_handle_frame_md` / `_handle_expanded_prompt`：写完 frame.md → control_profile gate；写完 expanded-prompt → scene_continuity + storyboard gate。lazy importlib 解析（兼容 test patch）。gate 异常 + progress 写失败均静默降级。4 测试。
- Task 3 `f9679ed` — `_handle_template_param_card`：select 后注入必填参数卡（解析 template-selection.md 的 `params:` 行）。无 params 行 → no-op（向后兼容）。2 测试。
- 全程 TDD：每个 Task 都先写失败测试看 RED，再写实现看 GREEN。894 passed 零回归。

### 当前关键证据

```text
git: main ahead of origin/main (未 push，5 commits since 92138f1)
HF window: 0.7.3 – 0.7.21 (green zone, zero adaptation)
Framepack tests: 894 passed (源码)
Deployed tests: 894 passed (md5 一致)
Pipeline Visibility: implemented + deployed
  - core/pipeline_progress.py (新)
  - hooks/on_post_tool_call.py (+3 路由: frame.md gate, expanded-prompt gate, template param card)
  - tests: test_pipeline_progress.py (7) + test_post_tool_gate_routing.py (6)
```

### 注意点 / 坑位

- 本轮 HF 升级 + Pipeline Visibility 都是 post-release，不 bump plugin 版本号（仍 0.16.0），不移动 v0.16.0 tag。
- `_run_pipeline_gates_and_update` 用 lazy importlib 解析 gate 函数路径——这是为了让 `unittest.mock.patch` 能拦截。改 gate 路径时要同步改调用点的字符串。
- gate 只在 LLM 质检成功路径跑（`_handle_frame_md` / `_handle_expanded_prompt` 的 `analysis is None → return` 之后）。如果 LLM 挂了 gate 不跑、progress 不更新——可接受（LLM 挂是异常态），但如果要"LLM 挂也照样跑 gate"，需要把 gate 调用移到 return 之前。
- Pipeline Visibility 的 6 阶段判定靠"检测文件存在"，不是显式状态机。没有 RENDER_READY 的独立判定（它复用 render readiness board 的全绿判定，但 progress.md 不直接跑那个——progress 只到 HTML_GENERATED 阶段，RENDER_READY 靠 pre_tool_call 的 readiness board）。

### 下次要做什么

1. 用升级后的 0.7.21 窗口 + Pipeline Visibility 跑一次端到端 dogfood（miara-style-template），确认：实际写 frame.md 后 progress.md 自动生成、gate 结果可见、参数卡弹出。
2. 验收测试：用 `framepack-update-acceptance-kanban` skill 跑一轮 acceptance board（覆盖新用户冷启动 + 旧项目更新 + Pipeline Visibility 感知）。
3. 为 Kanban 测试组配置专用 profiles（延续 429 坑位）。
4. 考虑：LLM 挂时 gate 也跑（把 gate 调用移到 return 之前）——看 dogfood 是否暴露这个需求。

## 设计文档

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
