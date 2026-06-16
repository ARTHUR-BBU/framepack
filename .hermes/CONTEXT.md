# hyperframes 开发工程 — 工作交接台

> 新对话打开后，读完本文就能接上。
> 这不是历史日志，是当前手台；旧状态靠 Git 历史追溯。

## 当前状态

<!-- ⚠️ 此区块每次会话结束时整块替换。不要在上面追加。 -->

**阶段**: Framepack v0.11.0 release-prep 完成。Kinetic Taste Engine feature + 兼容性验证 + 版本面同步全部入库。待安排测试组在 0.11.0 上做实例测试。
**分支**: `framepack-agent-platform`
**正式源码版本**: v0.11.0（`framepack-plugin/plugin.yaml` = `0.11.0`）
**最后提交**: `efcbbff` (`release: bump to v0.11.0`)
**部署状态**: 已同步全部改动的 Framepack plugin 文件到 `F:/Hermes_windows/plugins/framepack/`；独立 skill 也已同步。
**测试**: 源码 full suite `284 passed`；golden case taste+quality audit 全绿；HyperFrames 0.6.104 lint/validate/inspect/render/ffprobe 全通过。

### Commit 链（0.11.0 全程）

1. `234fb11 feat: add framepack kinetic taste engine` — 核心功能（taste_audit + taste_specimens + Director taste references）
2. `295410a handoff: record kinetic taste live test pass` — 测试结论记录
3. `b814f5e fix: ignore empty manifest surprise markers` — taste audit bugfix（`surprise: none` 不再误报 `too_many_surprises`）
4. `aa72cec chore: validate hyperframes 0.6.104 compatibility` — support window 0.6.97→0.6.104 + doctor cwd fix
5. `efcbbff release: bump to v0.11.0` — 24 文件版本面同步（plugin.yaml/hooks/core/7 SKILL.md/README/CHANGELOG/AGENTS/compat/templates/tests + test_team 脚本重命名）

### 本轮做了什么

- ✅ Golden case 清理：`pearl-celestial-memory-20s` warning 从 3 降到 1。
  - `overlapping_gsap_tweens` ✅ 修掉（`overwrite: 'auto'`）。
  - `caption_exit_missing_hard_kill` ✅ 修掉（`tl.set` hard kill）。
  - `gsap_studio_edit_blocked` ⚠️ 保留为结构性限制（0.6.99/0.6.104 无 suppress 机制，不假清洁）。
- ✅ Taste audit bugfix：`surprise: none` 空标记不再计入 surprise 计数（TDD：红→绿，15 passed）。
- ✅ Golden case transition 语言修正：generic fade stack → motif-driven transition 表述，taste audit 全绿。
- ✅ HyperFrames 0.6.104 兼容性验证：
  - blank smoke 通过。
  - golden case lint/validate/inspect/render/ffprobe 全通过（inspect 新增 `text_occluded` 规则，用 `data-layout-allow-occlusion` 显式声明解决）。
  - support window 从 0.6.97 提到 0.6.104。
- ✅ Environment doctor cwd fix：project-local HyperFrames 探测现在在 `project_dir` 运行，不再被 caller-cwd node_modules 污染。
  - 修复前：doctor 在 repo 根跑 → 检测到 0.6.88（旧全局依赖）→ GUARDED。
  - 修复后：doctor 在 case 目录跑 → 检测到 0.6.104 → READY。
- ✅ 0.11.0 版本面同步：24 个文件，100 insertions / 72 deletions。
  - plugin.yaml version + description（加 v0.11.0 adds 行）。
  - 7 个 SKILL.md frontmatter version。
  - CHANGELOG 新增 0.11.0 条目。
  - README + docs/README.zh-CN.md。
  - AGENTS.md managed block。
  - hooks logger 文案、core 模块 DEFAULT_PLUGIN_VERSION、compat framepack_version。
  - templates timeline-manifest.example.json。
  - test_team 脚本/文档重命名 v0106 → v0110。
  - 测试断言全面更新。

### 注意点 / 风险

- ⚠️ Golden case `gsap_studio_edit_blocked` warning 保留为结构性限制，不是假清洁。
- ⚠️ `F:/Framepack-01-test` 不是 git repo；case 产物属于测试工作台现场。
- ⚠️ `F:/hyperframes/test-team-runs/` 是自动实例测试现场，未跟踪；保留现场但不混入 release commit。
- ⚠️ 尚未 git tag v0.11.0；待测试组确认后打 tag。

### 下次要做什么

1. 安排测试组在 v0.11.0 上做实例测试（可用 `scripts/test_team_v0110_auto_test.py` 自动验收脚本）。
2. 测试组确认后打 git tag `v0.11.0`。
3. 如需合并到 main 分支，用 finishing-a-development-branch skill。

### 文件索引

- 源码: `F:/hyperframes/framepack-plugin/`
- 部署: `F:/Hermes_windows/plugins/framepack/`
- 独立 skill: `F:/Hermes_windows/skills/software-development/framepack/SKILL.md`
- Golden case: `F:/Framepack-01-test/cases/pearl-celestial-memory-20s/`
- 测试自动验收: `F:/hyperframes/scripts/test_team_v0110_auto_test.py`
- 测试说明: `F:/hyperframes/TEST_TEAM_AUTOTEST_v0.11.0.md`
