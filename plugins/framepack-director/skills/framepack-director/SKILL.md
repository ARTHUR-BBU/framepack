---
name: framepack-director
description: 用 Codex 把中文视频想法、素材与反馈转成可审片的 Framepack 动态样片，并交接给 HyperFrames。
---

# Framepack 导演台

把用户当成第一次使用：先用中文说明当前阶段、缺少的素材和下一步，再执行命令。

## 执行入口

先解析本 SKILL.md 所在目录，再调用相邻脚本：

```powershell
node <本技能目录>/scripts/framepack-director.mjs <命令> <项目目录> [参数]
```

## 最小命令表

```powershell
# 环境检查
node <脚本> doctor <项目目录>
# 创建项目
node <脚本> init <项目目录> --title "片名" --aspect 16:9 --duration 30
# 写入需求
node <脚本> brief <项目目录> --goal "目标" --audience "受众"
# 添加素材（可多个路径）
node <脚本> assets <项目目录> add <素材路径...>
# 应用 Codex 产出的 UTF-8 导演提案 JSON
node <脚本> direct <项目目录> --proposal-file <proposal.json>
# 根据反馈修订；反馈和提案文件都必填
node <脚本> revise <项目目录> --feedback "修改意见" --proposal-file <proposal.json>
# 构建、打开工作台
node <脚本> build <项目目录>
node <脚本> serve <项目目录> --port 0
# 抽帧与审片；review 需要带身份和证据帧的评分卡
node <脚本> snapshot <项目目录>
node <脚本> review <项目目录> --scorecard <scorecard.json>
node <脚本> audit <项目目录>
# 命令行决定必须给出用户的真实理由
node <脚本> approve <项目目录> --reason "批准理由"
node <脚本> waive <项目目录> --reason "风险放行理由"
node <脚本> handoff <项目目录>
```

规则：创意修改在当前 Codex 对话完成；浏览器只执行构建、证据、审片、取消和决定等确定性操作。批准或风险放行必须记录用户的真实理由。不要声称插件安装后存在全局 `framepack` 命令。
