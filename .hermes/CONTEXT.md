# hyperframes 开发工程 — 工作交接台

> 新对话打开后，读完本文就能接上。
> 这不是历史日志，是当前手台；旧状态靠 Git 历史追溯。

## 当前状态

<!-- ⚠️ 此区块每次会话结束时整块替换。不要在上面追加。 -->

**阶段**: Framepack v0.12.0 五方向全部完成 + simplify + 版本收口 ✅。当前：测试组独立验收中（第二轮待回）。

**分支**: `framepack-agent-platform`
**正式源码版本**: plugin.yaml = **0.12.0** ✅
**最后提交**: `ea4f9dd` (`fix: relocate test_team script into plugin package, fix deploy version drift`)
**测试**: 源码 390 passed / 1 skipped ✅；部署 390 passed / 1 skipped ✅（双绿）
**GitHub**: origin/main = v0.11.0；tag v0.11.0 已推；v0.12.0 待 push（等测试组验收通过）

**方向完成状态**:
- 方向 1 (Asset Intake): `d9ad49f` — asset_detector.py + checklist + template
- 方向 2 (武器库扩充): `979a029` + `e799064` — 3 bug修复 + drift修复 + 上游 PR #48141
- 方向 3 (Taste 广度): `605d13e` — taste_audit.py 四项修正 (kinetic/fade/surprise/motif)
- 方向 4 (参数漂移): `1443b08` — param_guard.py + canonical snippet + hook 集成
- 方向 5 (Upstream Warning Bridge): `79c25b4` — warning_classifier.py + quality_audit 集成 + hooks 集成 + hermes_patches.json upstream_features

**额外产出**:
- Hermes PR #48141: https://github.com/NousResearch/hermes-agent/pull/48141 (skills_tool.py file_path bug)
- hermes_adapter.py: marker-based patch drift detection (core 完成, hooks 集成到 guardrails.py)

## v0.12.0 五方向计划

文件: `F:/hyperframes/.hermes/plans/2026-06-17_framepack-v0120-five-directions.md`

| 方向 | 描述 | 状态 |
|------|------|------|
| 1. Asset Intake | Phase 0 素材收集流程 | ✅ 源码+部署 296/296 全绿，端到端验证通过 |
| 2. 武器库扩充 | anime.js + sprite sheet forge | ✅ 3 bug 修复 (commit `979a029`) + Hermes file_path bug 修复 |
| 3. Taste 广度验证 | emerging/editorial 风格实例测试 | ✅ commit `605d13e` (kinetic/fade/surprise/motif) |
| 4. 参数漂移根治 | 源头堵 Manifest→HTML 参数偏差 | ✅ commit `1443b08` (param_guard + canonical snippet) |
| 5. Upstream Warning Bridge | HyperFrames lint warning 自动分类 | ✅ 待 commit — warning_classifier + hooks 集成 |

## 方向 1 部署修复记录（2026-06-17 已修复）

部署 12 失败的根因和修复：
1. **test_deploy_manifest.py** (1 failed) — 版本漂移：部署版查 v0.10.6，源码查 v0.11.0
   - 修复：覆盖源码版 + 加 `if not path.exists(): continue` 跳过（部署 REPO_ROOT 下无 README.md）
2. **test_environment_doctor.py** (7 failed) — 缺 v0.11.0 的 cwd fix + 支持 0.6.104
   - 修复：覆盖源码版（FakeRunner 加 cwd 参数 + 支持窗口 0.6.104）
3. **test_test_team_auto_script.py** (4 failed) — 引用 v0106 脚本
   - 修复：覆盖源码版（引用 v0110）+ 脚本复制到 `F:\Hermes_windows\plugins\scripts\`
4. **test_hyperframes_support.py + test_taste_audit.py** — 潜在漂移，一并覆盖

结果：源码 296 passed + 部署 296 passed，双位置全绿。

## 上游 PR

- **PR #48141**: fix(skills): plugin skill_view ignores file_path, returns linked_files=None
  - https://github.com/NousResearch/hermes-agent/pull/48141
  - 状态：已提交，等待 NousResearch 审核
  - 本地 patch：F:\Hermes_windows\hermes-agent\tools\skills_tool.py
  - PR 目录：F:\Hermes_windows\hermes-agent-pr\ (分支 fix/plugin-skill-file-path)


3 个 bug 修复（接口看起来通了但实际漏电）：
1. **svg-morph-transition 函数名漂移** — 注册 `svgMorphTransition`，.js 实际 `svgMorph` → quality_audit 永远找不到 canonical 调用 → 修复：对齐为 `svgMorph`
2. **sprite-animation engine 撒谎** — 标记 `"CSS sprite sheet"`，实际 .js 用 GSAP `tl.to()` → 修复：标记 `"GSAP+CSS sprite sheet"`
3. **inline_hint 对 anime.js 盲区** — `_inline_gsap_hint` 只检测 `gsap.(to|from|fromTo|timeline)` → 修复：增加 `anime()`/`animate()`+stagger 检测

测试：8 个新单元测试 RED→GREEN + 3 个端到端场景 + 全量 303/1skipped 双绿（源码+部署）

Hermes 框架 bug（方向 2 附带修复）：
- `skills_tool.py` `_serve_plugin_skill` 不支持 file_path 参数 → 已修复（调用点 + 函数体）
- 3 个新测试覆盖 plugin skill 的 file_path / linked_files / not_found
- 上游 PR 待提

## 关键路径

1. ~~修复部署测试 12 失败 → 方向 1 真正完成~~ ✅
2. ~~方向 2 brainstorming → 设计武器库 schema 扩展~~ ✅
3. ~~方向 2 实现（anime.js + sprite sheet weapons + arsenal schema update）~~ ✅
4. ~~Drift 修复（4 孤儿注册 + card-cascade-reveal 路径）~~ ✅
5. ~~上游 PR #48141 提交~~ ✅
6. ~~hermes_adapter（修补追踪 + 告警）~~ ✅
7. ~~方向 3（Taste 广度验证）~~ ✅
8. ~~方向 4（参数漂移根治）~~ ✅
9. ~~方向 5（Upstream Warning Bridge）~~ ✅
10. 版本收口（plugin.yaml bump 0.11.1→0.11.2 + 全量同步 + release） ← 下一步

## 方向 5: Upstream Warning Bridge (`79c25b4`)

设计文档: `F:/hyperframes/.hermes/designs/2026-06-18--direction5-upstream-warning-bridge.md`

核心：让 quality_audit 合并 HyperFrames lint 的 warning，自动分类为 quality_issue（必须修）和 upstream_limit（不用管），提供一站式质量报告。

数据流：Agent 跑 `npx hyperframes lint --json > .framepack/lint-output.json` → post_tool_call hook 检测 → warning_classifier 分类 → 写 `.framepack/hyperframes-findings.json` → quality_audit 读缓存 → 统一报告。

新增文件：
- `core/warning_classifier.py` (277 lines) — 数据驱动分类表（5 个已知 code）+ 缓存读写 + 未知兜底 upstream_limit
- `tests/test_warning_classifier.py` (302 lines, 26 tests) — 分类逻辑 + 缓存 + 未知兜底
- `tests/test_quality_audit_lint_bridge.py` (171 lines, 8 tests) — quality_audit 读缓存集成
- `tests/test_lint_bridge_hooks.py` (287 lines, 9 tests) — pre/post hook 集成
- `templates/hermes_patches.template.json` — 新增 upstream_features 字段

修改文件：
- `core/quality_audit.py` — `_audit_lint_cache()` 读分类缓存，报告分开展示 upstream_limit
- `core/hermes_adapter.py` — `load_patch_registry()` 默认返回含 upstream_features + last_known_hyperframes_version
- `hooks/on_pre_tool_call.py` — `_remind_lint_json_if_needed()` 检测无 --json 时提醒
- `hooks/on_post_tool_call.py` — `_handle_lint_cache_bridge()` 检测 lint --json 命令并触发分类
- `guardrails.md` — Known Limitations 段落（上游限制表 + Agent 行为指引）
- `skills/framepack/SKILL.md` — Upstream Warning Bridge 工作流说明

测试：源码 390 passed / 1 skipped；部署 390 passed / 1 skipped；部署 smoke 5/5 OK

## hermes_adapter 模块 (commit 待补)

- `core/hermes_adapter.py` — 版本门控的 patch 追踪系统（marker-based）
- 触发链：`hydrate_guardrails() → run_patch_audit_if_needed() → patch_audit_report()`
- 版本门控：`should_check_patches()` 检测 Hermes 版本变化，没变跳过
- 注册的首个 patch：`skills_tool_file_path`（PR #48141）
- `.framepack/hermes_patches.json` — patch 注册表
- 17 测试（14 核心 + 3 集成），双绿 327/327

## 文件索引

- 源码: `F:/hyperframes/framepack-plugin/`
- 部署: `F:/Hermes_windows/plugins/framepack/`
- 独立 skill: `F:/Hermes_windows/skills/software-development/framepack/SKILL.md`
- 设计文档: `F:/hyperframes/.hermes/designs/2026-06-17--framepack-asset-intake.md`
- 方向5设计: `F:/hyperframes/.hermes/designs/2026-06-18--direction5-upstream-warning-bridge.md`
- 五方向计划: `F:/hyperframes/.hermes/plans/2026-06-17_framepack-v0120-five-directions.md`
- Golden case: `F:/Framepack-01-test/cases/pearl-celestial-memory-20s/`
