# Framepack 摩擦感知型 Agent Harness 控制论

日期：2026-06-02
状态：产品方法论草案
关联设计：`docs/superpowers/specs/2026-06-01-framepack-active-intervention-layer-design.zh-CN.md`

## 一句话定义

Framepack 不控制 Agent 的权限，而控制 Agent 的成本结构：让专业视频 workflow 成为最省力、最清楚、最少返工的路径。

这就是 Framepack 的 Harness 身份：**摩擦感知型 Agent Harness**。

## 为什么不是物理强制型 Harness

Framepack 是外挂，不是宿主。

Codex、Claude Code 或其他 coding agent 拥有：

- 终端
- 文件系统
- 环境变量
- 代码生成能力
- 直接调用 HyperFrames、ffmpeg、Canvas、HTML/CSS/JS 的能力

所以 Framepack 不能像 iron-proxy 那样掐网络、控容器、管凭据、限制所有出站请求。那是基础设施控制型 Harness 的权力结构。

Framepack 的真实结构是：

```text
Codex / Claude Code
  -> owns terminal, files, environment, code generation
  -> can build video paths without Framepack

Framepack
  -> add-on Harness
  -> appears through CLI, MCP, skills, workbench files, templates, audits
  -> must make its route more attractive than improvisation
```

这意味着 Framepack 不能靠“强制你走我这条路”成功。它必须靠“走我这条路更省力、更专业、更少返工”成功。

## 核心公式

```text
Framepack 控制力 = Harness 规则 x 低摩擦路径 x 可见反馈 x 项目记忆
```

四个因子缺一不可：

- Harness 规则：让 Agent 知道专业视频制作的流程边界。
- 低摩擦路径：让正确动作比手工乱写更快。
- 可见反馈：让 Agent 和用户及时知道哪里偏离了专业流程。
- 项目记忆：让每轮创意、素材、偏好、失败和修正都留在工作台里。

这不是铁轨思维，而是场域引导。Framepack 塑造的是一个视频生产引力场。

## 与其他 Harness 的区别

| 类型 | 代表 | 控制方式 | 适用条件 | Framepack 是否适用 |
| --- | --- | --- | --- | --- |
| 物理强制型 Harness | iron-proxy | 控网络、容器、凭据、请求边界 | Harness 拥有基础设施 | 不适用 |
| 知识脑层型 Harness | GBrain | 结构化记忆、校准、梦循环、自维护 | Harness 管理长期知识系统 | 可借鉴 |
| 摩擦感知型 Harness | Framepack | 低摩擦 workflow、成本闸门、创意工作台、项目记忆 | Harness 是外挂和专业搭档 | 核心定位 |

Framepack 应该学习 GBrain 的主动介入、信号捕获、摩擦反馈和自维护思想，但不能照搬它的长期知识脑层定位。Framepack 的主题不是“让 Agent 记住世界”，而是“让 Agent 做出更专业的视频项目”。

## 网球双打模型

Framepack 和 Codex 的关系不是“主人和仆人”，也不是“收费站和车辆”，而是临时组队的网球双打。

- Codex 是技术更强的选手：能跑全场、能自己写代码、能临场救球。
- Framepack 是战术搭档：知道视频结构、素材缺口、模板路线、HyperFrames 陷阱和审美语言。
- Framepack 不能命令 Codex，但可以提前站位、递出轻拍子、提示下一拍。

优秀的 Framepack 不会让 Codex 感到被锁住，而会让 Codex 感到：

> 照这个打法确实更容易赢。

## 五个控制变量

### 1. 规则密度

规则密度不是文档字数，而是规则出现的位置。

低价值规则：

```text
AGENTS.md 里写：请先跑 audit。
```

高价值规则：

```text
build 自动检查 preflight/design/composition。
P0 不通过就解释成本并阻止继续。
```

规则越靠近动作边界，越有控制力。

### 2. 摩擦差

Framepack 路径必须比绕开 Framepack 更省步骤。

如果 Agent 自己写 HTML 只要 5 步，而 Framepack 要 12 步，它会绕开。

所以每个命令都要问：

- 是否给出下一步？
- 是否减少搜索？
- 是否减少猜测？
- 是否减少返工？
- 是否让模板/Catalog/设计令牌更容易使用？

### 3. 成本可见性

门禁不能只说“不允许”。它要说“继续会损失什么”。

例如：

```text
DESIGN_TOKENS.md missing.
Continuing now usually causes inconsistent typography and repeated preview fixes.
```

这让 Agent 明白：Framepack 不是挡路，而是在帮它减少后面更大的成本。

### 4. 摩擦记忆

失败和绕路都应该进入项目记忆。

典型摩擦信号：

- Agent 手工重写 HTML。
- Agent 不跑 audit 直接 render。
- build 输出无法表达用户意图。
- 用户说“这些文件我看不懂”。
- 测试报告说“workflow 没接通”。
- render 出空视频。
- 同一个 blocker 反复出现。

这些信号不是脏日志，而是产品优化燃料。

### 5. 场力偏好

用户的模糊审美语言不是闲聊，而是场域约束。

例如：

- 高级感
- 商务
- 动感
- 大字
- 快节奏
- 留白
- 像某个参考视频
- 不要太花

Framepack 应该把这些写成项目内的 `fieldForces`，让它们影响 template selection、composition、caption、pacing、visual style。

示例：

```json
{
  "fieldForces": [
    {
      "id": "large-focal-text",
      "strength": "high",
      "source": "explicit-user-style",
      "appliesTo": ["composition", "template-selection", "caption-design"]
    }
  ]
}
```

这样“场论工程”就不是口号，而是数据结构。

## Framepack 的 4+1 工程路线

### 0.6.x：四个当前阶段

1. **低摩擦介入上下文**
   每个关键命令返回下一步、原因、应读文件、阻塞项、skill 提醒和更省事的 shortcut。

2. **生命周期成本闸门**
   P0 默认阻止 build/preview/render 的危险推进；P1/P2 强提醒并记录。

3. **摩擦捕获**
   记录失败、绕过、反复 blocker、手工重写、render 异常和 workflow 断裂。

4. **项目级场力偏好**
   把用户的模糊审美愿望转成 `.framepack/preferences.json` 和 `fieldForces`。

### 0.7.0：场域自维护循环

0.7.0 再做长期循环：

- 跨项目偏好记忆
- 模板使用挖掘
- skill benchmark scoring
- skill 改进建议
- 摩擦驱动的模板更新
- 绕路热点分析
- 场力强度校准

这不应该塞进 0.6.x。0.6.x 的任务是先把数据写干净，把路径做顺。

## 产品语言原则

Framepack 的语言要避免“命令宿主 Agent”的口气。

少说：

```text
You must use Framepack.
This is forbidden.
```

多说：

```text
This path avoids repeated preview fixes.
Run this audit before editing index.html manually.
This blocker usually causes empty renders.
This preference should shape captions and pacing.
```

这是外挂型 Harness 的语气：不是权力压制，而是专业搭档。

## 评估指标

Framepack 的主动介入是否成功，不只看命令是否通过，还要看 Agent 是否更愿意留在 Framepack 路径里。

建议指标：

- Agent 是否读取 `HUMAN.md` / `DIRECTION.md` / `COMPOSITION.md`
- Agent 是否按阶段运行 audit
- Agent 是否减少手工重写 HTML
- Agent 是否减少 render 空视频
- P0 blocker 是否减少复发
- 用户是否更容易看懂当前视频方案
- template/Catalog/design tokens 是否真正进入 build 输出
- sandbox benchmark 是否记录 friction 和 intervention evidence

## 小白总结

Framepack 不是要把 Agent 锁起来。它锁不住，也不该锁。

Framepack 要做的是把专业视频制作这条路修得更顺：路牌清楚、工具顺手、坑提前标出来、摔倒会记录、用户说的审美愿望会变成项目里的约束。

这样 Agent 仍然自由，但它会自然觉得：走 Framepack 这条路，比自己乱写更快、更稳、更专业。
