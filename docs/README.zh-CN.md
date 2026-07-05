# Framepack

> **HyperFrames 导演工作台 — v0.18.0**
>
> Framepack 把模糊的视频想法，变成可以交给 HyperFrames 正式制作的商业视频生产简报：先分诊、问素材、定创意方向、选择 workflow 和武器、清晰交接，再在渲染前做口味审片。

Framepack 是 Hermes Agent 插件，服务于 HyperFrames。它不是另一个渲染器，也不是另一个 HTML 生成器。它是夹在“人的模糊创意”和“HyperFrames 制作机器”之间的 **导演层**。

厨房比喻：**HyperFrames 是专业厨房，Framepack 是主厨。** 厨房有炉灶、刀具、工位和出餐系统；主厨定菜单、看食材、选菜谱、检查摆盘，并决定这道菜是否值得端出去。

## 产品定位

Framepack 的目标，是让 AI 生成的商业视频更像一条真正的品牌片，而不是“会动的 PPT”。

它优化的是：

- **先导演，后制作** — 先决定这条片子的气质、结构和重点，再碰摄影机。
- **真实素材压过通用装饰** — 产品图、截图、logo、证明点、参考片 DNA、品牌质感要当主角。
- **武器优先执行** — 有成熟动画武器和 preset，就不要裸写一坨 GSAP 冒充高级。
- **把审美变成生产门槛** — 渲染前报告模板味、旧素材残留、素材缺口、节奏漂移、证据不足。
- **关键节点让用户决策** — Framepack 给专业建议；用户决定修改、补素材，还是继续 render anyway。

## 设计哲学

Framepack 遵守五条产品规则：

1. **导演，不是摄影机操作员** — Framepack 管意图、故事、素材意识、创意约束、武器建议和口味审片；HyperFrames 管 HTML、Studio、lint、render、publish、catalog、media、cloud。
2. **审美相关的事必须共创** — 视觉风格、素材、旁白、比例、节奏、渲染决策，都不能让 Agent 擅自签字。
3. **不欠 AI 债** — 不允许用裸 GSAP、泛泛动画、缺素材硬编、无记录捷径，制造“看起来做完了”的假高级。
4. **凭小票，不凭感觉** — 每次交接都要留下证据：`frame.md`、`expanded-prompt.md`、weapon load plan、arsenal registry、scorecard、lint/audit findings。
5. **把好东西产品化** — 好模板、好 preset、好武器、好 scorecard、好 audit，都要沉淀成稳定生产资产，不做一次性魔法。

## 最新架构一览

```text
用户想法 / URL / 参考片 / 产品 brief
  ↓
Framepack Intent Router
  ├── product-launch-video
  ├── website-to-video
  ├── faceless-explainer
  ├── pr-to-video
  ├── embedded-captions
  ├── motion-graphics / graphic-overlays
  ├── template reuse
  └── reference/template extraction
  ↓
素材收集 + 共创确认
  ↓
frame.md
  └── 视觉身份 + control profile
  ↓
.hyperframes/expanded-prompt.md
  └── Director Story Bible：场景、节奏、时间窗、视觉母题、negative prompt
  ↓
Weapon Matching Pass
  ├── source search：官方 catalog → Framepack arsenal → specialist skills → 项目本地武器
  ├── weapon-load-plan.json / .md
  ├── preset metadata：preset_id、params_hint、score_class、studio_editable
  └── 只有没有合适武器时，才允许 HANDWRITE waiver
  ↓
Handoff Manifest
  └── workflow、素材、约束、QA 红线、武器义务
  ↓
HyperFrames 官方 workflow + Studio preview
  ↓
Framepack Pre-render Taste Audit
  ├── quality issues：旧 props、素材缺口、模板味、timeline/proof 漂移
  ├── upstream limits：HyperFrames 已知上游限制单独分类
  └── advisory output：修改 / 补素材 / render anyway
  ↓
HyperFrames render / publish / cloud
```

## 功能模块逻辑关系

| 模块 | 作用 | 产物 / 契约 |
|---|---|---|
| Intent Router | 把模糊需求分诊到正确视频路线 | 产品发布、网站巡游、解释视频、PR 视频、字幕、叠加图形、模板、参考片挖掘 |
| Asset Intake | 制作前先问真实素材 | logo、截图、产品页、源视频、BGM、证明点、品牌色、参考片 |
| `frame.md` | 锁定视觉身份和控制权重 | 配色、字体、氛围、动效能量、创意自主度、克制力、武器依赖 |
| Director Story Bible | 把想法扩成可制作分镜 | `.hyperframes/expanded-prompt.md`：beats、层次、动画编排、时间窗、execution manifest |
| Weapon Matching Pass | 把场景意图翻译成必须加载的动画资源 | `.framepack/weapon-load-plan.json` 和 `.md` |
| Arsenal Registry | 管理内置 / 下载 / 项目本地武器 | `.framepack/arsenal.json`、路径、hash、来源、闲置告警 |
| Preset Registry | 让武器有命名菜谱，而不是只有裸代码 | `weapon-presets/*.json`：适用场景、避免场景、参数、duration/ease |
| Weapon Scorecards | 给武器的商业可用性和风险打分 | `weapon-scorecards/*.json`：score class、理由、可编辑性说明 |
| Post-write Weapon Gate | HTML 写完后抓假调用 | 拒绝空调用、fake shim、注释假调用、缺 preset 质量参数 |
| Guardrail Hydrator | 保持项目 `AGENTS.md` 和 Framepack 铁律同步 | 只更新 managed block，不覆盖项目自己的规则 |
| Pre-render Taste Audit | 渲染前审片，但不剥夺用户决策权 | report-first findings + 修改/补素材/render-anyway 建议 |

## v0.18.0：武器质量引擎

v0.18.0 的核心变化，是 Framepack 从“用了武器吗？”升级为“有没有用对武器、有没有按菜谱用”。

关键变化：

```text
以前：
  场景说“字幕揭示” → Agent 可能随便 captionClipWipe(...)

现在：
  场景说“高级 lower-third 字幕”
    → matcher 选择 caption-clip-wipe
    → load plan 记录 preset_id = editorial_lower_third
    → scorecard 标明 B 级武器和 Studio 可编辑性
    → params_hint 给出 target/duration/direction/stagger
    → post-write gate 拒绝只有 target+duration 的松散调用
```

这一步的意义：武器不再是一堆 JS 片段，而是带菜谱、评级、契约和验货小票的 **生产资产**。

## Framepack 做什么

- 写东西前先分诊，不盲写。
- 主动问素材和参考，不靠通用 filler 硬凑。
- 产出 `frame.md` 和 `.hyperframes/expanded-prompt.md` 作为创意源头。
- 产出 weapon load plan，让写 HTML 的 Agent 知道必须加载什么、怎么用。
- 管理 arsenal 生命周期：查找 → 获取 → 注册 → 去重 → 使用审计 → 垃圾清理 → 归档。
- 把 HyperFrames warning 分成可修质量问题和已知上游限制，避免乱修。
- 做 lint 看不见的口味检查：模板味、素材缺口、旧域名残留、节奏和证据漂移。

## Framepack 不做什么

- 不写、不修、不接管 HyperFrames HTML。
- 不替代 `hyperframes lint`、Studio preview、render、publish、media、catalog、cloud。
- 不把 Taste Audit 当硬拦门。Framepack advises; user decides。
- 不奖励“有武器不用、裸写 GSAP”的坏习惯。

## Plugin Hooks

```text
pre_tool_call:
  ├── classify HyperFrames command intent
  ├── handoff/production commands → Guardrail Hydrator + Arsenal preflight + Quality Audit context
  ├── post-write / pre-render surfaces → weapon/taste advisory checks
  └── discovery/catalog/media/scaffold commands → no false handoff warning

post_tool_call:
  ├── Framepack skill_view → Guardrail Hydrator sync + current-session injection
  ├── frame.md write → 视觉 / control-profile 质量检查
  ├── expanded-prompt.md write → Arsenal reconcile + Director Story Bible 质量检查
  ├── weapon matching output → load-plan / preset / scorecard 小票
  └── lint JSON output → upstream warning classification cache
```

## Skills

| Skill | 作用 |
|---|---|
| `framepack` | 主入口：Director Workbench 总纲 |
| `framepack-director` | Intent → `frame.md` + Director Story Bible |
| `framepack-animation-library` | 动画武器目录和参考代码 |
| `framepack-gsap` | HyperFrames-safe GSAP 菜谱 |
| `framepack-arsenal` | 武器注册表生命周期 |
| `framepack-reference-miner` | 参考视频 / 网页 → motion DNA / template extraction |
| `framepack-production-quality` | timeline / proof / semantic quality checks |
| `framepack-sprite-forge` | sprite sheet 和 chroma-key 工作台 |

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
# 你应该看到 `framepack` 状态为 enabled，版本为 **0.18.0**。
```

## 兼容性

Framepack v0.18.0 面向 HyperFrames 0.7 生产线。

- baseline production target：`HyperFrames 0.7.3+`
- current workbench target：插件 manifest 声明的 `HyperFrames 0.7.21`
- supported band：`0.7.x`，更新版本必须先 probe 再信任
- 低于 `0.7.3` 的版本应先升级，再进入 Framepack handoff

## 试一下

在任意项目目录的 Hermes chat 里输入：

```text
帮我做一个 30 秒的科技品牌发布视频。你自己判断路线，但先问我要不要提供素材。
```

预期行为：Framepack 先分诊，问素材，建立创意方向，写 Story Bible 和交接小票，指导武器 / preset 使用，交给 HyperFrames 制作，并在最终 render 前给出 Pre-render Taste Audit。

## 更新

```bash
cd framepack
git pull
cp -r framepack-plugin <hermes-home>/plugins/framepack
# 重启 Hermes
```

项目里的 `AGENTS.md` 会在下一次 Framepack 调用时由 Guardrail Hydrator 自动修复。Hydrator 只更新 `FRAMEPACK MANAGED BLOCK`，不会覆盖项目自己的规则。

## 许可

MIT
