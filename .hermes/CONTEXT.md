# Framepack — 工作交接台

> 新对话打开后，读完本文就能接上。每次会话结束时更新"当前状态"区块。
> 这是动态文档，不要提交到 Git 后就不管了——下次会话前手动更新，或让 agent 帮你更新。

## 当前阶段

v0.7.5 完成，质量打磨完成，下一步：**头脑风暴 v0.7.6 方向**。

## 上次结束位置 (2026-06-08)

### 做了什么

- ✅ v0.7.0–0.7.5 全部交付：6 个触手（pre_tool_call + 5 post_tool_call）、6 个 Skill
- ✅ 质量打磨：5 个 P0 + 4 个 P1 全部修复
  - Issue count 造假（header 被计数）
  - max_tokens=512 截断 JSON → 1024
  - core/ 死代码复活（arsenal + trusted_sources）
  - Prompt 注入消毒（_sanitize_message）
  - inject_message 全部加 try/except 保护
- ✅ 三路 subagent 并行评审（Prompt 质量、代码架构、测试覆盖）
- ✅ Git 已推送至 framepack-agent-platform 分支 (commit 33b4c13)
- ✅ README.md / CHANGELOG.md / AGENTS.md / docs/README.zh-CN.md 全部更新

### 当前状态

- 测试: 127/127 通过 (pytest, 0.53s)
- Hook 文件: on_post_tool_call.py 1130 行, on_pre_tool_call.py 97 行
- 部署到 Hermes 后**需要重启**才能激活更新

### Plugin 阵容

```
🚨 pre_tool_call          index.html 写前拦截
📋 post_tool_call          STORYBOARD.md LLM 分析
🎬 post_tool_call          COMPOSITION.md LLM 审查
🔍 post_tool_call          index.html 正则审计
🔫 post_tool_call          arsenal.json 武器验证
🧬 post_tool_call          VIDEO_DNA.md / TEMPLATE_BLUEPRINT.md 结构检查

📖 framepack-director
🧩 framepack-template-fuser
🏗️ framepack-hyperframes-builder
🔫 framepack-arsenal
⚡ framepack-gsap
🧬 framepack-reference-miner
```

## 新对话打开后

1. `cd F:\hyperframes`
2. 确认 Plugin 已激活: `hermes plugins list | grep framepack`
3. 确认 Git 状态: `git status --short`
4. 如果需要测试: `cd framepack-plugin && python -m pytest tests/ -q`
5. **回到本文更新状态**

## 关键路径

| 用途 | 路径 |
|------|------|
| 项目根 | `F:\hyperframes` |
| Plugin 开发 | `F:\hyperframes\framepack-plugin` |
| Plugin 部署 | `F:\Hermes_windows\hermes-agent\plugins\framepack` |
| 测试工作台 | `F:\hyperframes\test-workbench` |
| Git 分支 | `framepack-agent-platform` |
| 远程 | `https://github.com/ARTHUR-BBU/framepack` |

## 待办 / 想法池

- [ ] 头脑风暴 v0.7.6 方向（参考视频实际提取？comfyui 集成？cron 定时武器更新？多 agent 协作？）
- [ ] 重新设计 prompt 注入消毒——当前简单粗暴的 pattern matching，考虑升级到 LLM 判断
- [ ] 考虑拆分包：framepack-plugin 独立 repo 还是 mono-repo？
- [ ] `framepack-plugin-engineering` Skill 需要更新（多了参考反推触手和消毒层）

## 笔记

- 老田喜欢"器官移植 vs 外卖电话"这类架构隐喻
- 老田对"OpenAI 标准格式"敏感——说"chat messages 格式"而非"OpenAI 格式"
- 开发到部署的同步命令: `cp` 四个文件 (hooks ×2, __init__, tests)
- LLM 钩子偶发超时（COMPOSITION.md 超时过一次），正则钩子零风险