# hyperframes 开发工程 — 工作交接台

> 新对话打开后，读完本文就能接上。
> 这不是历史日志，是当前手台；旧状态靠 Git 历史追溯。

## 当前状态

<!-- ⚠️ 此区块每次会话结束时整块替换。不要在上面追加。 -->

**阶段**: v0.16.0；HyperFrames 兼容窗口已从 0.7.3 提升到 0.7.21（绿区升级，零代码适配）。Pipeline Visibility 设计文档已落盘待实现。
**分支**: `main` 领先 `origin/main` 1 commit（56fb214 docs sync + 待提交的 HF 升级）
**源码版本**: `framepack-plugin/plugin.yaml = 0.16.0`
**HyperFrames 窗口**: `supported_min=0.7.3` `supported_max_tested=0.7.21` `soft_max=0.7.x` `hard_block_below=0.7.0` `latest_supported_for_downgrade=0.7.21`
**部署状态**: active plugin `F:/Hermes_windows/plugins/framepack/` 已同步（8 实现文件 + 4 测试文件 md5 一致）；deployed smoke 39 passed。
**测试工作台**: `F:/Framepack-01-test`（guardrails hash 未变，无需重 hydrate）

### 上次做了什么

- ✅ **HyperFrames compat reconnaissance（A 路）**：
  - npm latest = 0.7.21（一周内 0.7.3→0.7.21 共 18 个版本），0.7.20 修了 video/audio render-correctness bug（id-less media 渲染空白），0.7.21 加了 `crossorigin` on media 的 lint error。
  - **判定绿区**：Framepack 源码 + 测试工作台实际产出 HTML 对 `crossorigin` 零命中；0.7.20 的 data-hf-id fix 与 Framepack 铁律（禁手写 data-hf-id）天然不冲突。适配清单 = 空。
  - 升级 `supported_max_tested` / `latest_supported_for_downgrade` → 0.7.21；`supported_min` 保持 0.7.3（最低支持线不变）。
  - 全量同步 12 处版本引用：compat json / case_scaffolder 默认值 / environment_doctor docstring / plugin.yaml / SKILL.md ×4 / miara-style package.json ×4 / TEMPLATE_GUIDE.md / hermes_patches.template.json ×2。
  - TDD：3 个测试文件的 window mock + 2 个版本断言（0.7.4→0.7.22 保持 newer_same_band 语义；recommend_downgrade_to 0.7.3→0.7.21）+ case_scaffolder 默认值断言。
  - 881 passed 零回归；deployed targeted 39 passed。
- ✅ **Pipeline Visibility 设计文档（B 路）**：`F:/hyperframes/.hermes/designs/2026-06-30--pipeline-visibility.md`。
  - 根因核实：7 个 gate 函数已存在且有测试，但运行时只在 `on_pre_tool_call` render 前调用 1 次；`on_post_tool_call` 对 frame.md / expanded-prompt 零命中——验证是"终审不是伴随"。
  - 三决策方向已定（贴合 simplify）：① 伴随式 gate 接 post_tool_call（不造新状态机）② 单文件 `.framepack/progress.md` 状态牌（不搞双通道）③ 模板 required_params 前置（不造 schema 引擎）。

### 当前关键证据

```text
git: main ahead of origin/main by 1 (待 commit HF 升级)
HF npm latest: 0.7.21 | Framepack tested window: 0.7.3–0.7.21
Framepack tests: 881 passed
Deployed targeted: 39 passed
crossorigin 命中: plugin 源码 0 处, 测试工作台产出 HTML 0 处
Pipeline Visibility 设计: .hermes/designs/2026-06-30--pipeline-visibility.md (待实现)
```

### 注意点 / 坑位

- 本轮 HF 升级是 post-release 配置/文案修正，不 bump plugin 版本号（仍 0.16.0），不移动 v0.16.0 tag。
- compat recon 子代理 `deleg_ed9aac24` 在 puppeteer smoke 阶段 600s 超时——决策不需要那部分（crossorigin 命中检查 + release notes 已够定绿区），未重派。
- Pipeline Visibility 实现时注意：gate 异常要降级不阻断（advisory）；progress.md 写入失败要静默（不因状态牌坏了卡创作）。
- `test_newer_patch_in_same_soft_band` 的版本号从 0.7.4 改成 0.7.22——以后再升 max_tested 时这个测试版本号要跟着换。

### 下次要做什么

1. **实现 Pipeline Visibility**（B 路，设计文档已就绪）：按 `plan` skill 出实现计划 → TDD `core/pipeline_progress.py` → post_tool_call 路由 → 模板 required_params → 全量回归 → 部署同步。
2. 用升级后的 0.7.21 窗口跑一次端到端 dogfood（miara-style-template），确认实际 render 链路无回归。
3. 为 Kanban 测试组配置专用 profiles（延续上一轮的 429 坑位）。

## 设计文档

- `F:/hyperframes/.hermes/designs/2026-06-19--v014-weight-control-system.md` — 权重控制系统设计
- `F:/hyperframes/.hermes/designs/2026-06-19--sprite-forge-integration.md` — Sprite Forge 集成设计
- `F:/hyperframes/.hermes/designs/2026-06-21--execution-contract-audit.md` — Execution Contract Audit 设计
- `F:/hyperframes/.hermes/designs/2026-06-30--pipeline-visibility.md` — 伴随式 Gate + 用户状态牌（待实现）

## 文件索引

- 源码: `F:/hyperframes/framepack-plugin/`
- 部署: `F:/Hermes_windows/plugins/framepack/`
- 权重核心: `core/control_profile.py` + `core/restraint_audit.py`
- Hook 穿透: `hooks/on_post_tool_call.py`（_build_weight_directive + _build_weight_consistency_report）
- HyperFrames 兼容: `core/hyperframes_adapter.py` + `core/hyperframes_support.py` + `core/environment_doctor.py` + `compat/hyperframes-support.json`
- Gate 引擎: `core/gates/registry.py`（evaluate_native_gates）+ `core/render_readiness.py`（build_readiness_board）
- 模板: `core/templates/` + `templates/bundles/miara-style-template/`
- 独立 skill: `F:/Hermes_windows/skills/software-development/framepack/SKILL.md`
- 测试报告: `F:/hyperframes/framepack-e2e-test/reports/`

## 开发铁律提醒

- TDD: RED → GREEN → 全量回归 → 部署同步(md5) → git commit
- 部署同步必须用 content hash（md5），不能只比 file size
- 改完 PLUGIN 文件必须同步到 `F:/Hermes_windows/plugins/framepack/`（包括测试文件）
- 修复 skill 用到问题应 patch skill_manage
