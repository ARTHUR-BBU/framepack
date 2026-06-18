# v0.13.0 方向 P0：武器架构重构

> 状态：设计完成，待批准
> 日期：2026-06-18
> 来源：v0.12.0 测试报告 + 根因调查 + 全库盘点
> 原则："地基一定要打牢固"——武器库是 Framepack 的根基

## 1. 问题全貌

### 1.1 核心发现

Framepack 武器库共 21 件武器，按 DOM 创建方式分两类：

| 类型 | 数量 | 特征 | Agent 使用率 |
|------|------|------|-------------|
| 元素注入型 | 11 | 函数只操作已存在的元素（0 createElement） | 5/5 正确调用 |
| 自建 DOM 型 | 9 | 函数内部 createElement 造元素 | 0/2 被跳过 |
| 废弃 | 1 | transitions-pack | — |

"自建 DOM 型"武器与 HyperFrames "静态结构优先"铁律存在结构性冲突：HyperFrames 编译器做静态解析，运行时 createElement 出来的元素看不到 → 黑屏。Agent 面对矛盾，理性选择保"不黑屏"，放弃"调武器"，自己手写等价动画。

### 1.2 自建 DOM 型武器清单（9 件，按改造难度分三档）

**简单（1 件）**：
- bg-blur-mask — 本身已是防御型（先 querySelector，缺了才建），几乎零成本转纯注入

**中等（5 件）**：
- macos-notification — 1 张通知卡片，结构固定
- typewriter-cursor — 打字机文本 + 光标 + shimmer，逐字 span 数量随文本变
- anime-text-split — **最危险**：innerHTML='' 先抹掉静态内容再重建
- light-leak-cinema — 黑边 + grain + 漏光层，漏光数量变量化
- card-cascade-reveal — 卡片扇形展开，卡片数量 3-6
- hero-3d-device-spin — 设备外壳（macbook/iphone/ipad），结构确定

**复杂（3 件，数据驱动，纯手工预写不现实）**：
- particle-blob-bg — 120 个 SVG circle
- sticky-flowchart — 由 nodes[]+edges[] 数据驱动的流程图
- data-chart-editorial — 由 data[] 驱动的折线图

### 1.3 附带发现

- 3 个活跃 block 未注册到 builtin_weapons.py（data-chart-editorial、sticky-flowchart、hero-3d-device-spin）——即使重构，Agent 也无法经 arsenal 调用
- SKILL.md 里只有 text-split-enter 一件武器配有完整"静态 HTML 预处理块"范本

## 2. 重构方案：武器架构契约

### 2.1 统一契约（所有武器必须遵守）

```
武器函数签名：function(tl, elements, opts)
- tl：GSAP timeline（动画引擎）
- elements：已存在的 DOM 元素（Agent 预写在 HTML 里）
- opts：参数对象（stagger、duration、ease 等）

禁止行为：
- ❌ 函数内部 createElement
- ❌ 函数内部 innerHTML 清空/重建
- ❌ 函数假设容器为空然后填充

允许行为：
- ✅ querySelector / querySelectorAll 获取已存在元素
- ✅ 修改已存在元素的 style/textContent/classList
- ✅ 读 opts 里的参数做动画
```

### 2.2 数据驱动武器的混合方案

复杂武器（particle-blob-bg、sticky-flowchart、data-chart-editorial）的 DOM 结构由数据驱动（120 个 circle、贝塞尔连线坐标），纯手工预写不现实。

方案：**setup + animate 拆分**

```
setup(opts) → 返回 HTML 字符串（Agent 写进 index.html 的静态结构）
animate(tl, elements, opts) → 操作已写入的元素做动画
```

Agent 使用流程：
1. 调 setup(opts) 获得 HTML 字串
2. 把 HTML 字串写进 index.html 的对应容器
3. 调 animate(tl, container.querySelector(...), opts) 做动画

这保持了"静态结构优先"——DOM 在 HTML 写入时就确定，编译器能看到。只是生成过程由 setup 函数辅助完成，不是 Agent 手写 120 个 circle。

### 2.3 SKILL.md 文档策略

每件重构后的武器必须配：
1. **静态 HTML 预处理块** — Agent 复制到 index.html 的确切 HTML（含 class、style 占位符）
2. **函数调用示例** — 复制函数定义 + 调用一行
3. **参数说明** — opts 里每个参数的含义和默认值

text-split-enter 是范本，其他武器按它的格式补充。

## 3. 分期实施计划

### Phase 1：止血 + 范本（先做，证明模式可行）

**目标**：建立重构范式，用最简单的武器证明"setup+animate"模式有效。

- [ ] bg-blur-mask → 纯注入型（已有防御逻辑，改 3 行）
- [ ] 给 bg-blur-mask 配 SKILL.md 静态 HTML 块
- [ ] 验证：在测试实例里替换 v0.12.0 的内联实现，确认功能等价

### Phase 2：中等难度武器批量重构

**目标**：消除测试报告暴露的两件武器 + 其余中等难度武器。

按危险程度排序：
- [ ] anime-text-split → 纯注入型（最危险，innerHTML='' 必须消除）
- [ ] typewriter-cursor → setup+animate（逐字 span 拆分）
- [ ] card-cascade-reveal → setup+animate（卡片模板生成）
- [ ] macos-notification → 纯注入型（整张卡片预写）
- [ ] hero-3d-device-spin → setup+animate（设备外壳模板）
- [ ] light-leak-cinema → setup+animate（漏光层模板生成）

### Phase 3：数据驱动武器

**目标**：解决 3 件纯手工预写不现实的武器。

- [ ] particle-blob-bg → setup 生成 SVG circle 字串
- [ ] sticky-flowchart → setup 生成 SVG+DOM 字串
- [ ] data-chart-editorial → setup 生成 SVG chart 字串

### Phase 4：注册表补全 + 文档收口

- [ ] 补登 3 个 block 到 builtin_weapons.py
- [ ] 每件重构武器配 SKILL.md 静态 HTML 块
- [ ] SKILL.md manifest 示例路径修正（weapons/ 前缀错误）
- [ ] 验证：全库武器可被 Agent 正确调用

### Phase 5：门禁升级（配套兜底）

- [ ] manifest_weapon_not_called 从 advisory 升级为 P0 阻断（在重构完成后）
- [ ] 或新增 lint 规则检测 HTML 里的 createElement 调用

## 4. 测试策略

每件重构武器需要：
1. **单元测试**：setup() 返回的 HTML 包含预期元素、animate() 操作正确的元素
2. **回归测试**：原武器的动画效果不变（视觉等价）
3. **集成测试**：Agent 使用重构后的武器能正确渲染（snapshot 验证）

## 5. 风险

- **行为变化风险**：重构改变函数签名，现有测试实例可能不兼容。需要保留旧签名的兼容层或明确标注 breaking change。
- **工作量**：9 件武器 × (代码重构 + HTML 块 + 测试) 是大工程，建议分期交付。
- **数据驱动武器的 setup 函数**：本质上是个"HTML 生成器"，和"纯静态"有哲学冲突——需要明确 setup 只在"写 HTML 阶段"调用，不在运行时调用。
