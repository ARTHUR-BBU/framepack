# hyperframes 开发工程 — 工作交接台

> 新对话打开后，读完本文就能接上。
> 这不是历史日志，是当前手台；旧状态靠 Git 历史追溯。

## 当前状态

<!-- ⚠️ 此区块每次会话结束时整块替换。不要在上面追加。 -->

**阶段**: v0.14.2 正式发布后开发线（Unreleased）— NOEMA 视频模板金样板 + Execution Contract Audit 已本地提交
**分支**: `main`
**源码版本**: plugin.yaml = 0.14.2（正式源码版本仍是 v0.14.2）
**正式发布**: `v0.14.2` tag → `52a2ab1`（release artifact，以 tag 为准）
**GitHub Release**: https://github.com/ARTHUR-BBU/framepack/releases/tag/v0.14.2 ✅
**最新本地提交**: `4ed4b6f` — `[verified] fix: add execution contract audit for manifest weapon calls`
**未发版开发成果**: `8647ed1` NOEMA scroll video template；`4ed4b6f` Execution Contract Audit
**测试**: 556 passed / 1 skipped ✅（framepack-plugin full suite，2026-06-21）
**部署同步**: `execution_manifest.py` + `quality_audit.py` 已同步到 `F:\Hermes_windows\plugins\framepack\`，md5 一致；deployed runtime smoke 通过
**工作区**: 仅 `assets/` 未跟踪（Sprite Forge 真实验证产物，保留现场，不纳入本轮提交）

### 上次做了什么

- ✅ **NOEMA 动态网站 → 60 秒视频模板金样板**（commit `8647ed1`）：
  - 路线是“视频导演版”，不是网页录屏；不保留 ScrollTrigger，不使用 `repeat:-1`。
  - 11 个 HyperFrames `clip`，root 显式 `data-duration="60"`。
  - 33 个远程资产冻结到本地，GSAP runtime 改为本地 vendored。
  - `lint` 0 errors / 0 warnings；`inspect` 0 layout issues；render 1920×1080、30fps、60s、1800 frames；visual QA PASS；独立 reviewer 三轮通过。
  - 项目路径：`F:\hyperframes\aura-noema-scroll-video-template\`
- ✅ **Execution Contract Audit 系统修复**（commit `4ed4b6f`）：
  - 解决测试组 P1：Manifest 声明武器但 HTML 实际裸写、旧 audit 漏检。
  - 集成到现有 `core/quality_audit.py`，不另起审计孤岛。
  - Manifest weapon 即使无 params，也必须调用 canonical function；否则报 `manifest_weapon_not_called` P0。
  - `HANDWRITE` 是合法豁免；`binding/mode: reference_only` 是视觉参考豁免；普通 `reference` 不豁免。
  - 注释、字符串、函数定义、对象方法、class 方法不能冒充真实调用；注释/字符串里的“正确参数”不能掩盖真实参数漂移。
  - 新增设计文档：`.hermes/designs/2026-06-21--execution-contract-audit.md`
- ✅ **TDD + review + 部署验证**：
  - 新增/扩展 `tests/test_quality_audit.py` 回归测试。
  - full suite：556 passed / 1 skipped。
  - 最终独立 reviewer：passed=true，security_concerns=[]，logic_errors=[]。
  - 部署目录 md5 校验 + runtime smoke 通过。
- ✅ **路径坑已处理**：
  - Windows Python 中不能用 `/f/Hermes_windows/...` 当部署路径；会误建 `F:\f\Hermes_windows`。
  - 已改用原生 `F:\Hermes_windows\...` 并删除误建空目录。

### 下次要做什么

1. **按需 push 当前 main**：当前 `4ed4b6f` 是本地提交；如要共享给测试组/远端，需要执行 `git push` 并读回 `origin/main`。
2. **测试组复测 P1**：重点验证 Manifest 声明武器但 HTML 未调用时是否报 `manifest_weapon_not_called` P0；HANDWRITE/reference_only 是否不误报；参数漂移是否能抓住。
3. **视频模板用户端激活/使用路径产品化**：把 `aura-noema-scroll-video-template` 从金样板整理成可复用入口（README/命令/变量替换/复制模板/渲染流程）。
4. **处理测试组 P2/P3**：P2 垃圾资产（Caveat.ttf 404、未引用 phone-thumb 图片）和 P3 arsenal 策略/方法论文档表述。
5. **后续 Sprite Forge 实战验证**：爆炸/烟花（一次性粒子爆发）、速度线（漫画风格化图形）。

### 近期 commit 链

```
4ed4b6f [verified] fix: add execution contract audit for manifest weapon calls
8647ed1 [verified] feat: add NOEMA scroll video template
1a18b75 handoff: v0.14.2 GitHub Release 已正式发布
52a2ab1 fix(sprite-forge): alpha erosion for glow-fringe cleanup on effect/spell sprites  ← v0.14.2 tag
068b2f0 release: bump v0.14.1 → v0.14.2
103b255 fix(sprite-forge): adaptive chroma key for off-magenta backgrounds
```

### 关键路径补充

- NOEMA 视频模板金样板：`F:\hyperframes\aura-noema-scroll-video-template\`
- 模板变量：`aura-noema-scroll-video-template\variables.json`
- 模板视觉身份：`aura-noema-scroll-video-template\frame.md`
- 模板生产 brief：`aura-noema-scroll-video-template\.hyperframes\expanded-prompt.md`
- 模板 HTML：`aura-noema-scroll-video-template\index.html`
- 本地资产清单：`aura-noema-scroll-video-template\assets\manifest.json`
- 本地 GSAP：`aura-noema-scroll-video-template\assets\vendor\gsap-3.14.2.min.js`
- Execution Contract Audit 设计：`.hermes\designs\2026-06-21--execution-contract-audit.md`

## 设计文档

- `F:/hyperframes/.hermes/designs/2026-06-19--v014-weight-control-system.md` — 权重控制系统设计
- `F:/hyperframes/.hermes/designs/2026-06-19--sprite-forge-integration.md` — Sprite Forge 集成设计

## 文件索引

- 源码: `F:/hyperframes/framepack-plugin/`
- 部署: `F:/Hermes_windows/plugins/framepack/`
- 权重核心: `core/control_profile.py` + `core/restraint_audit.py`
- Hook 穿透: `hooks/on_post_tool_call.py`（_build_weight_directive + _build_weight_consistency_report）
- Sprite Forge: `skills/framepack-sprite-forge/`
- 独立 skill: `F:/Hermes_windows/skills/software-development/framepack/SKILL.md`
- 测试报告: `F:/hyperframes/framepack-e2e-test/reports/`

## 开发铁律提醒

- TDD: RED → GREEN → 全量回归 → 部署同步(md5) → git commit
- 部署同步必须用 content hash（md5），不能只比 file size
- 改完 PLUGIN 文件必须同步到 `F:/Hermes_windows/plugins/framepack/`
- 修复 skill 用到问题应 patch skill_manage
