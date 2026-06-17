# hyperframes 开发工程 — 工作交接台

> 新对话打开后，读完本文就能接上。
> 这不是历史日志，是当前手台；旧状态靠 Git 历史追溯。

## 当前状态

<!-- ⚠️ 此区块每次会话结束时整块替换。不要在上面追加。 -->

**阶段**: Framepack v0.12.0 五方向开发进行中。方向1（Asset Intake）源码+部署全绿（296/296），端到端验证通过，测试组验收 PASS。方向 2-5 待推进。

**分支**: `framepack-agent-platform`
**正式源码版本**: plugin.yaml = 0.11.1（Asset Intake 小版本基准；每完成一个方向 bump patch）
**最后提交**: `3cecbcd` (`bump: v0.11.0 → v0.11.1`)
**测试**: 源码 296 passed ✅；部署 296 passed ✅
**GitHub**: origin/main = v0.11.0；tag v0.11.0 已推；v0.11.1 尚未 push

## v0.12.0 五方向计划

文件: `F:/hyperframes/.hermes/plans/2026-06-17_framepack-v0120-five-directions.md`

| 方向 | 描述 | 状态 |
|------|------|------|
|| 1. Asset Intake | Phase 0 素材收集流程 | ✅ 源码+部署 296/296 全绿，端到端验证通过 ||
| 2. 武器库扩充 | anime.js + sprite sheet forge | 🔄 builtin_weapons.py 已加 3 武器，未测试未 commit，未走 brainstorming |
| 3. Taste 广度验证 | emerging/editorial 风格实例测试 | 待开始 |
| 4. 参数漂移根治 | 源头堵 Manifest→HTML 参数偏差 | 待开始 |
| 5. studio_edit_blocked | 标记已知限制 + 推上游 | 待开始 |

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
