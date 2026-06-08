# Framepack — 工作交接台

> **这不是日志，是手台**——每次会话结束时 **替换** `## 当前状态` 区块，
> 不是追加。换下来的旧内容不需要保留（Git 历史里有）。

## 当前状态

<!-- ⚠️ 此区块每次会话结束时整块替换。不要在上面追加。 -->

**阶段**: v0.7.6 头脑风暴
**分支**: framepack-agent-platform
**测试**: 127/127 (pytest), 221/221 (legacy CLI)
**最后提交**: b210db9 (工作交接台建立)

### 上次做了什么

- ✅ v0.7.0–0.7.5 全部交付：6 触手 + 6 Skill
- ✅ 质量打磨：5 P0 + 4 P1 全部修复
- ✅ 三路 subagent 并行评审
- ✅ 工作交接台 `.hermes/CONTEXT.md` 建立
- ✅ 所有文档（README/CHANGELOG/AGENTS/中文）更新并推送

### 下次要做什么

- 头脑风暴 v0.7.6 方向
- 参考视频实际提取？ComfyUI 集成？cron 定时武器更新？多 agent 协作？

## 新对话启动清单

1. `cd F:\hyperframes`
2. 确认 Plugin 激活: `grep -i framepack <Hermes日志> | head -3`
3. 确认 Git 状态: `git status --short`
4. 如需测试: `cd framepack-plugin && python -m pytest tests/ -q`
5. **回到本文**，读完 `## 当前状态` 就知道做到哪了

## 关键路径

<!-- 项目结构变化时更新 -->

| 用途 | 路径 |
|------|------|
| 项目根 | `F:\hyperframes` |
| Plugin 开发 | `F:\hyperframes\framepack-plugin` |
| Plugin 部署 | `F:\Hermes_windows\hermes-agent\plugins\framepack` |
| 测试工作台 | `F:\hyperframes\test-workbench` |
| Git 分支 | `framepack-agent-platform` |
| 远程 | `https://github.com/ARTHUR-BBU/framepack` |

## 待办 / 想法池

<!-- 新想法加进来，完成或否决时删掉 -->

- [ ] 头脑风暴 v0.7.6 方向
- [ ] 考虑拆分包：framepack-plugin 独立 repo vs mono-repo？
- [ ] `framepack-plugin-engineering` Skill 需更新（多了参考反推 + 消毒层）
- [ ] prompt 注入消毒升级——当前简单 pattern matching，后续考虑 LLM 判断

## 笔记

<!-- 用户偏好、约定、踩坑——缓慢增长，手动维护 -->

- 老田喜欢"器官移植 vs 外卖电话"架构隐喻
- 老田对"OpenAI 标准格式"敏感——说"chat messages 格式"
- LLM 钩子偶发超时（COMPOSITION 超时过一次），正则钩子零风险
- 部署同步到 Hermes: `cp` 四个文件（hooks×2 + `__init__` + tests）
- 老田自称"老田"