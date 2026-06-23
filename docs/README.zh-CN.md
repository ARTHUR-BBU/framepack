# Framepack

> **HyperFrames 0.7.3 导演工作台。**
> Framepack 把模糊的视频想法，变成 HyperFrames 0.7.3 能正式执行的工作流：先分诊、问素材、写导演稿、清晰交接，再在渲染前做口味审片。

Framepack 是 Hermes Agent 插件。新版边界很明确：

- **Framepack 管导演：** Intent Router、素材询问、`frame.md`、作为 Director Story Bible 的 `expanded-prompt.md`、Handoff Manifest、动态武器库建议、Pre-render Taste Audit。
- **HyperFrames 管制作：** 官方 workflows、Studio preview、catalog、variables、media tools、HTML/GSAP composition、lint、render、publish、cloud。

比喻：HyperFrames 是专业厨房，Framepack 是主厨。主厨定菜单、看食材、出餐前尝味；厨房用自己的设备把菜做出来。

## HyperFrames 0.7.3 工作流

```text
用户想法
  ↓
Framepack Intent Router
  ├── product-launch-video
  ├── website-to-video
  ├── faceless-explainer
  ├── pr-to-video
  ├── embedded-captions
  ├── graphic-overlays
  ├── motion-graphics
  ├── template reuse
  └── reference/template extraction
  ↓
ask for assets + 共创确认
  ↓
frame.md = 视觉身份
expanded-prompt.md = Director Story Bible
  ↓
Handoff Manifest
  ↓
HyperFrames 0.7.3 官方 workflow + Studio preview
  ↓
Framepack Pre-render Taste Audit
  ↓
用户决定：修改 / 补素材 / 继续 render anyway
  ↓
HyperFrames render / publish / cloud
```

## Framepack 做什么

- 先用 Intent Router 分诊，不盲写。
- 主动问素材：logo、截图、BGM、源视频、DESIGN.md、mood board、品牌色、参考视频、HTML/动画代码、证明点。
- 产出 `frame.md` 和 `.hyperframes/expanded-prompt.md`，作为创意源头。
- 用 Handoff Manifest 把 workflow、素材缺口、创意约束、catalog/arsenal 候选、QA 红线交给 HyperFrames 0.7.3。
- 在 Studio preview 后做 Pre-render Taste Audit：提醒模板味、旧素材残留、缺素材、审美漂移等问题。

## Framepack 不做什么

- 不写、不修、不接管 HyperFrames HTML。
- 不替代 `hyperframes lint`、Studio preview、render、publish、cloud。
- 不在 taste audit 阶段拦门。Framepack advises; user decides。

## 安装

```bash
# 1. 克隆
git clone https://github.com/ARTHUR-BBU/framepack --depth 1

# 2. 复制到 Hermes 插件目录
# Linux/macOS:
cp -r framepack/framepack-plugin ~/.hermes/plugins/framepack
# Windows:
xcopy /E /I framepack\framepack-plugin %HERMES_HOME%\plugins\framepack

# 3. 启用
hermes plugins enable framepack

# 4. 验证
hermes plugins list
# 你应该看到 `framepack` 状态为 enabled，版本为 **0.15.0**。
```

## 兼容性

Framepack v0.15.0 正式支持 **HyperFrames 0.7.3**。

- supported_min: `0.7.3`
- supported_max_tested: `0.7.3`
- supported band: `0.7.x`，更新版本必须先 probe 再信任
- 低于 `0.7.3` 的版本需要先升级，再进入 Framepack 交接

## 许可

MIT
