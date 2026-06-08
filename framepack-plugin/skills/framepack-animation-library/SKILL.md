---
name: weapon-import
title: "武器入库流程 · Weapon Import Skill"
type: skill
purpose: >
  当 Agent 发现敌人（需求）超出当前武器库覆盖范围时，
  到外部源找武器 → 评估 → HyperFrames 改写 → 注册入库。
  这不是"翻译"，是对外部效果的 HyperFrames 安全封装。
---

# Weapon Import Skill

> **什么时候触发**：Agent 写完一个场景发现"这个效果库里没有" → 别硬写，去外部源找 → 遵循本流程。

## 四步入库流程

### Step 1: 找矿源

```yaml
find:
  -
    engine: "需要什么引擎的效果？"
    check:
      gsap:
        sources:
          - "HyperFrames Catalog → https://hyperframes.mintlify.app/llms.txt"
          - "GSAP Codepen → https://codepen.io/collection search"
          - "GSAP Skills → https://github.com/greensock/gsap-skills"
      anime:
        sources:
          - "anime.js demos → https://freefrontend.com/anime-js-examples/"
          - "anime.js 官方 docs → https://animejs.com/documentation"
  -
    keywords: "用什么关键词搜？"
    example: |
      我要一个"卡片翻转 + 阴影抬起"的效果：
      → 搜 Codepen: "gsap card flip shadow lift"
      → 搜 anime.js demos: "anime card rotation stagger"
```

### Step 2: 挖矿——评估效果

把外部效果拉下来，问这三个问题：

```yaml
evaluate:
  q1_render_safe: "这个效果能在 HyperFrames 中渲染吗？"
  checks:
    - "有 Math.random()？ → 用预设数组替"
    - "有 repeat: -1 / loop: true？ → 改为固定次数"
    - "有 autoplay？ → 改为 autoplay:false + seek()"
    - "有 ScrollTrigger？ → 删除，写纯 timeline"
    - "有交互事件（hover/click）？ → 改为自动播放序列"

  q2_worth_it: "值得入库还是直接当场写完扔掉？"
  rule: "如果 3 个以上场景可能用到 → 入库。如果只是这个视频的特化需求 → 直接写代码不入库。"

  q3_engine_choice: "保持原引擎还是换？"
  rule: "GSAP 效果保持 GSAP，anime.js 效果保持 anime.js。不翻译引擎。"
```

### Step 3: 锻造——HyperFrames 安全改写

```yaml
forge:
  gsap_effects:
    - "去除 Math.random() → 预设 pattern 数组"
    - "去除 repeat:-1 → repeat: 固定次数"
    - "去除 ScrollTrigger → 纯 timeline"
    - "去除 hover/click → auto sequence"
    - "确保 paused:true + window.__timelines 注册"

  anime_effects:
    - "去除 Math.random() → 预设 stagger grid"
    - "去除 loop: true → loop: 0"
    - "确保 autoplay: false"
    - "注册到 window.__timelines: { seek: (t) => anim.seek(t) }"

  code_extraction:
    - "核心逻辑 → references/<weapon-name>.js"
    - "不要复制粘贴整个 CodePen 的 HTML/CSS"
    - "只保留可参数化的动画逻辑"
```

### Step 4: 注册——写入武器库

```yaml
register:
  steps:
    - "判断武器类型：Template / Block / Part / Library"
    - "写 SKILL.md 说明书：frontmatter YAML + `## 参数` + 核心代码片段"
    - "写 `references/<weapon-name>.js`：完整实现"
    - "更新 MOC.md 注册新武器"
    - "更新引用关系图"
```

## 武器说明书模板

```markdown
---
name: <weapon-name>
title: "<中文名> · <英文名>"
type: <block|part|template|library>
category: <text|background|transition|entrance|showcase|environment>
gsap_version|anime_version: "<version>"
depends_on: ["[[parts/xxx]]"]
used_by: ["[[blocks/xxx]]"]
---

# <标题>

> **一句话**：<15 字描述效果 + 视觉感受>

## 参数
<!-- YAML 格式参数列表 -->

## 代码
<!-- 核心调用接口 + 代码 -->

## HyperFrames 注意
<!-- 三禁检查 + 已知坑 -->
```

## 外部源优先级

按可靠性排序：

| 源 | 可靠性 | 说明 |
|---|--------|------|
| HyperFrames Catalog | ★★★★★ | 官方认证，HyperFrames 原生支持 |
| GSAP Skills | ★★★★☆ | GreenSock 官方维护 |
| anime.js 官方 docs | ★★★★☆ | 官方文档 + demos |
| GSAP CodePen | ★★★☆☆ | 社区作品，需评估质量 |
| freefrontend anime.js | ★★★☆☆ | 社区整理，质量参差不齐 |

> 详细外部源索引：`EXTERNAL_SOURCES.md`
