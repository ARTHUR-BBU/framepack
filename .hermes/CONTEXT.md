# hyperframes 开发工程 — 工作交接台

> 新对话打开后，读完本文就能接上。
> 这不是历史日志，是当前手台；旧状态靠 Git 历史追溯。

## 当前状态

<!-- ⚠️ 此区块每次会话结束时整块替换。不要在上面追加。 -->

**阶段**: Framepack v0.12.0 五方向开发已启动。v0.11.0 全链路发布完毕（GitHub Release + tag v0.11.0 + main 改名）。方向1（Asset Intake）已 commit 但部署插件有 12 个测试失败待修复。

**分支**: `framepack-agent-platform`
**正式源码版本**: plugin.yaml = 0.11.0（v0.12.0 尚未 bump）
**最后提交**: `d9ad49f` (`feat: add framepack asset intake phase 0`)
**测试**: 源码 296 passed；部署插件 280 passed / 12 failed（详见下方）
**GitHub**: origin/main = v0.11.0；tag v0.11.0 已推；Release 已创建

## v0.12.0 五方向计划

文件: `F:/hyperframes/.hermes/plans/2026-06-17_framepack-v0120-five-directions.md`

| 方向 | 描述 | 状态 |
|------|------|------|
| 1. Asset Intake | Phase 0 素材收集流程 | ✅ 已 commit `d9ad49f`，⚠️ 部署测试 12 失败 |
| 2. 武器库扩充 | anime.js + sprite sheet forge | 🔄 builtin_weapons.py 已加 3 武器，未测试未 commit，未走 brainstorming |
| 3. Taste 广度验证 | emerging/editorial 风格实例测试 | 待开始 |
| 4. 参数漂移根治 | 源头堵 Manifest→HTML 参数偏差 | 待开始 |
| 5. studio_edit_blocked | 标记已知限制 + 推上游 | 待开始 |

## 方向 1 部署测试失败详情

源码 `F:/hyperframes/framepack-plugin/` 全绿（296 passed）。
但部署目录 `F:/Hermes_windows/plugins/framepack/tests/` 有 12 failed：

- **test_deploy_manifest.py** (1 failed): `test_0106_release_version` → FileNotFoundError: `test_team_v0106_auto_test.py`
  - 原因: v0.11.0 发布时脚本重命名为 `test_team_v0110_auto_test.py`，但部署的 test_deploy_manifest.py 还在找 v0106
- **test_environment_doctor.py** (7 failed): 包括 `test_doctor_falls_back_to_npx_no_install_without_installing_latest` 等
  - 原因: 可能部署的 cwd fix 未生效，或部署目录缺少某个 patch
- **test_test_team_auto_script.py** (4 failed): 也在找 v0106 脚本

**根因**: 部署同步不完整——v0.11.0 release-prep 的某些文件变更没有部署到 `F:/Hermes_windows/plugins/framepack/`。需要：
1. 重新完整部署 plugins/framepack/（含 tests/test_deploy_manifest.py + tests/test_test_team_auto_script.py + scripts/test_team_v0110_auto_test.py）
2. 重跑部署测试确认全绿
3. 然后方向 1 才算真正完成

## 方向 2 当前状态（违规）

`builtin_weapons.py` 已加入 3 个新武器（anime-text-split / svg-morph-transition / sprite-animation），**但**：
- ❌ 未按开发流程走 brainstorming 做设计
- ❌ 未写测试
- ❌ 未 commit
- ❌ 三个武器的 JS 和 .md 文件虽然在 animation-library 里，但未同步到部署目录

**下一步必须先补**：方向 1 部署问题修复 → 方向 2 brainstorming 设计。

## 关键路径

1. 修复部署测试 12 失败 → 方向 1 真正完成
2. 方向 2 brainstorming → 设计武器库 schema 扩展
3. 方向 2 实现（anime.js + sprite sheet weapons + arsenal schema update）
4. 方向 3-5 依次推进

## 文件索引

- 源码: `F:/hyperframes/framepack-plugin/`
- 部署: `F:/Hermes_windows/plugins/framepack/`
- 独立 skill: `F:/Hermes_windows/skills/software-development/framepack/SKILL.md`
- 设计文档: `F:/hyperframes/.hermes/designs/2026-06-17--framepack-asset-intake.md`
- 五方向计划: `F:/hyperframes/.hermes/plans/2026-06-17_framepack-v0120-five-directions.md`
- Golden case: `F:/Framepack-01-test/cases/pearl-celestial-memory-20s/`
