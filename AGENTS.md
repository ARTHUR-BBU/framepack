# Framepack Codex 开发指南

Framepack 是 Codex-first 的编程式视频导演工作台。它负责意图、素材确认、视觉方向、分镜、HTML 样片、审片和交接；HyperFrames 负责 lint、check、render、音频、字幕、导出与发布。

## 开发规则

- 只支持 Codex；Hermes 与 Claude Code 保留未来扩展方向，不在当前运行时实现。
- 旧 Hermes 代码只存在于 Git 历史，不复制到新工作树。
- 修改功能前先写失败测试，再实现最小改动。
- 声称完成前必须运行 `npm run verify`，并提供实际输出。
- 修改插件源码后必须运行 `npm run plugin:build`，确认 `plugins/framepack-director/` 与源码同步。
- 视频动画必须使用本地字体、vendor GSAP、paused timeline 和 `window.__timelines` 注册；禁止随机、无限循环、ScrollTrigger 离线视频主轴和 clip 根节点动画。
- 武器必须来自 registry，并经过双画幅 lint/check/snapshot 与具名审片后才能标记 `proven`。
- 设计样片必须使用中文文案、本地 Noto Sans SC 和真实截图证据，不用网络字体或 CDN。

## 常用命令

```powershell
npm run typecheck
npm test
npm run plugin:validate
npm run migration:validate
npm run plugin:build
```

## 工作边界

Framepack advises; user decides。审美问题可返工或由用户留下明确豁免，结构、运行时和安全问题不可豁免。
