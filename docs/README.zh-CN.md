# Framepack

> **HyperFrames 的 Prompt Factory。**
> 把模糊的视频想法变成 HyperFrames 能渲染的精准创意简报。

Framepack 是一个 Hermes Agent 插件，挂载到 Agent 循环中。它只做两件事，做好：

1. **frame.md** — 视觉身份（配色、字体、动效参数、氛围）
2. **expanded-prompt.md** — 场景级创意分解（beat、节奏、转场）

这两个文件写完，**HyperFrames 接管。** Framepack 停在 HyperFrames 开始的地方。

## 比喻

HyperFrames 是设备齐全的摄影棚。Framepack 是知道什么时候开哪盏灯的导演——不是给摄影棚布线的电工。

## 工作流程

```text
用户："帮我做个珍珠品牌 30 秒视频"
  │
  ▼
Framepack Phase 1：意图 → frame.md
  "珍珠品牌" → Velvet Standard 风格 → frame.md
  配色：深海蓝 + 珍珠金 + 丝绸黑
  动效：calm, power2.out, 0.8-1.5s
  用户确认视觉方向 ✓
  │
  ▼
Framepack Phase 2：创意 → expanded-prompt.md
  节奏：hook → PUNCH → breathe → CTA
  4 个场景完整 beat、转场、动画动词
  用户确认创意方向 ✓
  │
  ▼
HyperFrames 接管：
  hyperframes init --example blank
  → 官方 registry 可用时再拉更丰富组件
  → 读 frame.md + expanded-prompt.md
  → 写 HTML + GSAP timeline
  → hyperframes lint && render
  │
  ▼
成片 🎬
```

## 安装

```bash
# 1. 克隆
git clone https://github.com/ARTHUR-BBU/framepack --branch framepack-agent-platform --depth 1

# 2. 复制到 Hermes 插件目录
# Linux/macOS:
cp -r framepack/framepack-plugin ~/.hermes/plugins/framepack
# Windows:
xcopy /E /I framepack\framepack-plugin %HERMES_HOME%\plugins\framepack

# 3. 启用
hermes plugins enable framepack

# 4. 验证
hermes plugins list
# 你应该看到 `framepack` 状态为 **enabled**，版本为 **0.14.2**。

# 5. 项目 AGENTS.md 由 Guardrail Hydrator 自动维护 managed block；不要手工覆盖项目自有规则。
```

## 许可

MIT

---

**v0.14.2** 修复 Sprite Forge 色键断流：生图工具画出的“magenta”常是偏暗洋红（如 `230,45,183` 而非 `255,0,255`），硬编码纯品红键控完全失效——0% 透明，管线断流。新增 `detect_background_color()` 从图像边缘采样实际背景色自适应键控，对所有生图工具健壮，向后兼容纯品红。+10 回归测试（531->541）。

**v0.14.1** 是生产加固版。多角度端到端测试暴露 9 个瑕疵，本版全部修复：权重注入守卫（LLM 质检与权重插入解耦，避免质检跳过时权重静默丢失）、restraint 正则加固（handwrite 比例不再跨行误匹配、不再误抓 `obscene1:` 这类词首前缀）、caution_motion 渲染与审计覆盖、Sprite Forge QC 报告输出与非方形单元缩放、YAML 块名迁移守卫、五行 Weights docstring 明确"相生相克是创意方向隐喻而非数学约束"，另 +20 回归测试锁定修复（511→531）。

