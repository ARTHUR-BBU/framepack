# hyperframes 开发工程 — 工作交接台

> 新对话打开后，读完本文就能接上。
> 这不是历史日志，是当前手台；旧状态靠 Git 历史追溯。

## 当前状态

<!-- ⚠️ 此区块每次会话结束时整块替换。不要在上面追加。 -->

**阶段**: v0.14.2 正式发布后开发线（Unreleased）— NOEMA 模板产品化进行中/已完成实现验证，等待独立 reviewer 回传
**分支**: `main`（与 `origin/main` 对齐；当前有未提交工作区改动）
**源码版本**: plugin.yaml = 0.14.2（正式源码版本仍是 v0.14.2）
**正式发布**: `v0.14.2` tag → `52a2ab1`（release artifact，以 tag 为准）
**最新提交**: `ac9bf84` — `[verified] feat: align Framepack with HyperFrames 0.6.121 support window, CLI commands, and standalone hyperframes-cli skill`
**本轮未提交改动**: NOEMA agent-managed template 产品化文档/schema/inspect 标注
**HyperFrames CLI**: 产品化验收命令固定使用 `npx hyperframes@0.6.121`，避免 bare npx 漂到 0.7.x
**验证**: variables.json JSON OK；lint 0 errors / 1 known GSAP Studio warning；inspect 0 layout issues；validate 0 errors / 225 contrast warnings；render + ffprobe 通过（60.000000s / 1920x1080 / 30fps / 1800 frames / 21025268 bytes）
**注意**: 独立 reviewer `deleg_d8aa60b1` 已派发，最终提交前需读取回传结论；本轮尚未 commit/push
**工作区**: `.hermes/CONTEXT.md`、NOEMA 模板文件、设计/计划文档有改动；`.hermes/reports/` 与 `assets/` 仍为既有未跟踪现场，保留不动

### 上次做了什么

- ✅ **NOEMA 模板产品化设计**：新增 `.hermes/designs/2026-06-23--noema-template-productization.md`，明确本轮做 Agent-managed template，不冒充一键 CLI 模板引擎。
- ✅ **新增实施计划**：`.hermes/plans/2026-06-23_000000-noema-template-productization.md`。
- ✅ **README 升级为用户入口**：说明适用/不适用场景、三档复用模式、scene map、固定 0.6.121 验收命令、props rule。
- ✅ **新增 `TEMPLATE-USAGE.md`**：写明 copy 流程、11 场景映射、prop replacement map、programmatic prop recipes、stale prop audit。
- ✅ **新增 `TEMPLATE-QA.md`**：沉淀 lint/validate/inspect/render/ffprobe、stale asset audit、contact sheet 降级视觉验证、PASS/WARN/FAIL 报告模板。
- ✅ **扩展 `variables.json`**：从小样例升级为 schema seed/content contract，含 template_meta、brand、visual_identity、prop_strategy、scene_copy、asset_slots、validation。
- ✅ **修模板 inspect 噪声**：在 11 个 `.scene-inner` wrapper 上标注 `data-layout-allow-occlusion/overlap`，把海报式 intentional layering 从 inspect error 洪流变成模板级约定；复跑 inspect 为 0 layout issues。
- ✅ **完整媒体验证**：`npx hyperframes@0.6.121 render --output dist/noema-scroll-template.mp4` 成功，ffprobe 精确吻合 60s/1800 frames。

### 下次要做什么

1. **等待/读取独立 reviewer 回传**：若有 blocker，先修再复验；若通过，准备提交。
2. **提交前最后检查**：`git diff` 确认不把 `.hermes/reports/`、`assets/` 既有现场误混入；必要时只 add 本轮 NOEMA/设计/计划/CONTEXT 文件。
3. **按用户意图决定是否 commit**：建议 commit message：`[verified] feat: productize NOEMA scroll video template activation`。
4. **后续产品线候选**：把 `variables.json` schema 接入真正生成器/CLI（`framepack template use noema`）作为下一阶段，不在本轮硬塞。

### 近期 commit 链

```
ac9bf84 [verified] feat: align Framepack with HyperFrames 0.6.121 support window, CLI commands, and standalone hyperframes-cli skill
cb50de9 handoff: record unreleased video template and execution audit work
4ed4b6f [verified] fix: add execution contract audit for manifest weapon calls
8647ed1 [verified] feat: add NOEMA scroll video template
1a18b75 handoff: v0.14.2 GitHub Release 已正式发布
52a2ab1 fix(sprite-forge): alpha erosion for glow-fringe cleanup  ← v0.14.2 tag
```

### 关键路径补充

- NOEMA 视频模板产品化入口：`F:\hyperframes\aura-noema-scroll-video-template\README.md`
- NOEMA 复用说明：`F:\hyperframes\aura-noema-scroll-video-template\TEMPLATE-USAGE.md`
- NOEMA QA 清单：`F:\hyperframes\aura-noema-scroll-video-template\TEMPLATE-QA.md`
- NOEMA schema seed：`F:\hyperframes\aura-noema-scroll-video-template\variables.json`
- 产品化设计：`F:\hyperframes\.hermes\designs\2026-06-23--noema-template-productization.md`
- 产品化计划：`F:\hyperframes\.hermes\plans\2026-06-23_000000-noema-template-productization.md`
- NOEMA gold sample render：`F:\hyperframes\aura-noema-scroll-video-template\dist\noema-scroll-template.mp4`

## 设计文档

- `F:/hyperframes/.hermes/designs/2026-06-19--v014-weight-control-system.md` — 权重控制系统设计
- `F:/hyperframes/.hermes/designs/2026-06-19--sprite-forge-integration.md` — Sprite Forge 集成设计
- `F:/hyperframes/.hermes/designs/2026-06-21--execution-contract-audit.md` — Execution Contract Audit 设计

## 文件索引

- 源码: `F:/hyperframes/framepack-plugin/`
- 部署: `F:/Hermes_windows/plugins/framepack/`
- 权重核心: `core/control_profile.py` + `core/restraint_audit.py`
- Hook 穿透: `hooks/on_post_tool_call.py`（_build_weight_directive + _build_weight_consistency_report）
- HyperFrames 兼容: `core/hyperframes_adapter.py`（命令分类）+ `core/hyperframes_support.py`（版本窗口）+ `core/environment_doctor.py`（doctor）+ `compat/hyperframes-support.json`（矩阵）
- Sprite Forge: `skills/framepack-sprite-forge/`
- 独立 skill: `F:/Hermes_windows/skills/software-development/framepack/SKILL.md`
- 测试报告: `F:/hyperframes/framepack-e2e-test/reports/`

## 开发铁律提醒

- TDD: RED → GREEN → 全量回归 → 部署同步(md5) → git commit
- 部署同步必须用 content hash（md5），不能只比 file size
- 改完 PLUGIN 文件必须同步到 `F:/Hermes_windows/plugins/framepack/`
- 修复 skill 用到问题应 patch skill_manage
