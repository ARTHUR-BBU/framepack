# Aura / NOEMA 滚动网站 → HyperFrames 视频模板设计

日期：2026-06-20
状态：Draft for user review

## 0. 一句话结论

这个网站适合转换成 HyperFrames 视频模板。

它不是普通网页，而是一条已经被 GSAP ScrollTrigger 切好的“滚动分镜”：

- 每个 section 都像一个视频场景
- 每个 pinned scroll 段都像一个镜头段落
- scrub 进度可以直接映射成视频时间
- 大字、色块、卡片、图库、CTA 都天然适合视频化

第一阶段建议先做“导演版视频模板”：把交互滚动改成线性视频时间线。

后续开发设计中保留方向 C：模板引擎版，也就是把这次转换沉淀成更通用的“动态网站 → 视频模板”管线。

---

## 1. 产品目标

### 1.1 这次要验证什么

验证 HyperFrames / Framepack 是否能吃下这类动态网站：

```text
GSAP ScrollTrigger 滚动网站
  ↓
分解成场景、视觉身份、动画轨道、资产清单
  ↓
转换成可编辑、可复用、可渲染的视频模板
```

这件事如果跑通，意义不只是“做一个 NOEMA 视频”，而是证明：

> 动态网页可以成为视频模板的上游素材。

也就是把一个“用户用鼠标滚动的展览通道”，改造成一个“导演剪好的品牌影片”。

### 1.2 第一版目标

第一版不做自动引擎，先做高质量样板：

- 输入：用户提供的 NOEMA.ART HTML 源码
- 输出：一个 HyperFrames 60 秒线性视频模板
- 内容：完整覆盖从 loading intro 到最终 CREATE CTA 的滚动旅程
- 形式：不是录屏，而是可编辑的 HTML 视频 composition
- 验证：lint / validate / render / ffprobe / 视觉检查

### 1.3 后续目标：方向 C 模板引擎版

方向 C 作为后续开发设计保留：

```text
任意同类动态网站 HTML
  ↓
解析 sections / ScrollTrigger / assets / CSS tokens
  ↓
生成 scene ledger + time windows + asset manifest
  ↓
生成 HyperFrames seed composition 或 expanded-prompt
  ↓
人工导演润色 / Framepack 加厚
  ↓
渲染视频模板
```

第一版相当于“人工跑通一条金样板”。
方向 C 是把金样板背后的步骤沉淀成工具管线。

---

## 2. 源网站结构分析

源网站是一个 NOEMA.ART 艺术家 portfolio OS landing page。

核心视觉身份：

- 字体：Anton / Inter / Caveat
- 主色：
  - Indigo `#4F46E5`
  - Emerald `#10B981`
  - Rose `#F43F5E`
  - Black `#050505`
  - White `#ffffff`
  - Paper `#f4efe7`
- 风格：高对比、海报式、大字排版、brutalist grid、艺术家卡片、滚动海报叙事

网页本身分成 10 个主要段落：

| 编号 | section | 页面功能 | 视频含义 |
|---|---|---|---|
| 0 | loader | 品牌加载 intro | 开场 logo reveal |
| 1 | hero | NOEMA.ART + 三张卡 | 品牌主视觉 |
| 2 | interlude | Artists & Curators | 受众/愿景 |
| 3 | product | THE LINK + pass/phone | 产品形态 |
| 4 | manifesto | manifesto 文字聚合 | 品牌理念 |
| 5 | archive | 15 图 archive grid | 作品库能力 |
| 6 | builder | NOEMA PROFILE 模块 | 搭建系统 |
| 7 | board | community opportunity cards | 社区/机会 |
| 8 | support | support flow | 变现/支持路径 |
| 9 | cta-build | SEEN / SAVED / SUPPORTED | 情绪高潮 |
| 10 | join | CREATE / your card | 最终 CTA |

---

## 3. 转换原则

### 3.1 滚轮变时间

网页原逻辑：

```text
用户滚动
  ↓
ScrollTrigger progress 0 → 1
  ↓
GSAP scrub 动画
```

视频模板逻辑：

```text
视频时间 A → B
  ↓
scene progress 0 → 1
  ↓
GSAP timeline 动画
```

也就是说：

- `scrollTrigger.end: +=130%` 不再表示滚动距离
- 它变成该场景的相对时长权重
- `scrub` 动画改成确定性 timeline tween
- `pin` 改成 HyperFrames clip 时间窗口

### 3.2 网页功能降级为视频叙事

这些保留：

- 品牌大字
- 色块背景
- 艺术家卡片
- phone / wallet pass mockup
- archive grid
- builder modules
- board cards
- support notification
- final CTA

这些降级：

- nav link 不需要真实跳转
- Login 不需要真实功能
- Create Card 固定按钮可以变成视觉角标
- hover 反馈不需要保留
- 平滑滚动不需要保留

### 3.3 不是录屏

不能把网页原样录下来。

录屏的问题：

- 不可编辑
- 不可变量化
- 受浏览器/网络/滚动速度影响
- 无法进入 HyperFrames 模板体系

正确产物是：

```text
HTML composition + variables + local assets + deterministic timeline
```

---

## 4. 第一版：导演版视频模板设计

### 4.1 推荐总时长

建议第一版做 60 秒。

理由：

- 45 秒能做，但会太赶
- 75 秒更像品牌长片，但第一版验证成本更高
- 60 秒完整、稳、适合官网 hero / 社媒长版 / 产品演示

### 4.2 60 秒时间表

根据源代码中各 ScrollTrigger 的相对 end 权重估算：

| 时间 | 场景 | 内容 |
|---|---|---|
| 0.00 - 3.20 | Loader | NOEMA.ART 字母进场 + 彩色竖条 wipe |
| 3.20 - 7.98 | Hero | 三张 profile card 展开，hero word 推进 |
| 7.98 - 12.76 | Interlude | ARTISTS & CURATORS 横移，刷痕动效 |
| 12.76 - 19.01 | Product | wallet pass / phone mock 双侧入场 |
| 19.01 - 25.26 | Manifesto | 散乱单词聚合，finally 手写字出现 |
| 25.26 - 32.24 | Archive | 15 张图从中心扩散为 gallery grid |
| 32.24 - 38.86 | Builder | NOEMA PROFILE 卡片模块组装 |
| 38.86 - 45.11 | Board | opportunity cards 归位成 board |
| 45.11 - 51.36 | Support | 三步 support flow + 收款通知 |
| 51.36 - 57.24 | CTA Build-up | SEEN / SAVED / SUPPORTED 三连击 |
| 57.24 - 60.00 | Final | CREATE / your card / footer CTA |

### 4.3 HyperFrames 结构

根 composition：

```html
<div
  data-composition-id="main"
  data-width="1920"
  data-height="1080"
  data-duration="60"
>
```

每个场景使用：

```html
<section
  id="scene-hero"
  class="clip"
  data-start="3.20"
  data-duration="4.78"
  data-track-index="1"
>
  <div class="scene-inner">...</div>
</section>
```

注意：

- clip 根元素只做时间调度，不做 opacity / transform / filter 动画
- 动画作用在 `.scene-inner` 或内部元素上
- root 显式 `data-duration="60"`
- 不手动添加非媒体 `data-hf-id`
- `<img>` 装饰图尽量转成 `div + background-image`
- timeline 注册：`window.__timelines["main"] = tl`
- 不使用 `repeat: -1`

### 4.4 动画改写方式

原网站示例：

```js
const heroTimeline = gsap.timeline({
  scrollTrigger: {
    trigger: '#hero',
    start: 'top top',
    end: '+=130%',
    scrub: 1,
    pin: true
  }
});
```

视频模板改写为：

```js
// Hero scene: 3.20 - 7.98
const heroStart = 3.20;
const heroDur = 4.78;

tl.to('#card1', {
  x: '-16vw',
  y: '6vh',
  rotate: -16,
  duration: heroDur,
  ease: 'none'
}, heroStart);
```

也就是保留原 motion 意图，但移除 ScrollTrigger。

### 4.5 视觉节奏处理

第一版不能机械复刻网页滚动，要做轻微导演化：

- Loader 保留完整，因为它是品牌开场
- Hero 卡片可更有“拍摄感”，三张卡不是单纯漂移，而是像镜头推近
- Manifesto 要给足时间，让文字“从混乱到秩序”的感觉成立
- Archive 是视觉高潮之一，扩散要清晰
- CTA Build-up 是情绪峰值，SEEN / SAVED / SUPPORTED 要有节拍冲击
- Final 不要太短，至少留出 2.5 秒让 CTA 被看见

---

## 5. 模板变量设计

第一版应该做成可替换模板，而不是只服务 NOEMA 这一个品牌。

建议变量：

```json
{
  "brand_name": "NOEMA.ART",
  "tagline": "Where your practice lives",
  "cta_label": "Create Card",
  "email": "hello@noema.art",

  "colors": {
    "indigo": "#4F46E5",
    "emerald": "#10B981",
    "rose": "#F43F5E",
    "black": "#050505",
    "paper": "#f4efe7"
  },

  "featured_artist": {
    "name": "Leigh Witherell",
    "role": "Painter",
    "location": "London"
  },

  "support": {
    "amount": "$25",
    "supporter": "Maya Chen",
    "message": "For your studio practice"
  },

  "archive_images": [],
  "member_images": [],
  "board_cards": []
}
```

后续可以通过 `data-composition-variables` 接入 HyperFrames 变量系统。

第一版如果变量系统成本较高，可以先把变量抽到 JS 常量区，但结构上要为正式 variables 留口。

---

## 6. 资产冻结方案

源网站依赖：

- Google Fonts
- Tailwind CDN
- GSAP CDN
- Lucide CDN
- pravatar 随机头像
- picsum 随机图
- Supabase QR 图片

视频模板必须 deterministic。

处理方案：

1. 字体
   - Anton / Inter / Caveat 使用 HyperFrames 可识别字体或下载 woff2 到 `fonts/`
   - CSS 中 font-family 必须写字面字体名，不能用 CSS var

2. 图片
   - 下载头像、archive、artwork、QR 到本地 `assets/`
   - 不使用每次随机变化的 picsum/pravatar URL
   - 记录 asset manifest

3. 图标
   - lucide 图标转 inline SVG 或本地 sprite
   - 不依赖 unpkg

4. CSS
   - 不使用 Tailwind CDN
   - 把用到的 class 收敛为静态 CSS

5. GSAP
   - 使用项目允许的 GSAP 引入方式
   - 不使用 ScrollTrigger

---

## 7. 验证标准

完成前必须验证：

1. `npx hyperframes lint`
2. `npx hyperframes validate`
3. `npx hyperframes render`
4. `ffprobe` 检查：
   - 时长约 60 秒
   - 分辨率正确
   - fps 正确
   - 文件大小非 0
5. 截图/视觉检查：
   - 无黑屏
   - 无元素莫名消失
   - 每个场景都有主体
   - archive grid 完整
   - final CTA 可读
6. 检查禁止项：
   - 无 `repeat: -1`
   - 无非媒体 `data-hf-id`
   - 无 `Math.random()`
   - 无外部随机图片依赖
   - clip 根元素不做 opacity/transform/filter 动画
   - font-family 不使用 CSS 变量

---

## 8. 第一版明确不做什么

第一版不做：

- 不做网页录屏
- 不做真实 Login / Create Card 交互
- 不做 hover 状态
- 不做通用自动解析器
- 不做所有网站类型支持
- 不做 ScrollTrigger 自动 AST 转换
- 不做一键“任意网页转视频”

第一版要做的是：

> 选一个高质量动态网站，人工拆解，做成一条正确、漂亮、可验证的视频模板金样板。

---

## 9. 后续开发设计：方向 C 模板引擎版

方向 C 是后续产品化方向，建议拆成 5 个阶段。

### C1. Site Intake / 网站收件

输入：

- HTML 源码
- 可选线上 URL
- 可选截图/录屏

输出：

```text
.site-intake/site-summary.json
.site-intake/source.html
.site-intake/assets/raw/
```

要做的事：

- 保存原始 HTML
- 抽取 title / meta / section id
- 抽取外部 CSS / JS / image / font 依赖
- 标记不确定资源
- 记录是否存在 GSAP / ScrollTrigger / Framer Motion / Lenis / CSS animation

### C2. Scroll Story Parser / 滚动叙事解析器

目标：识别页面是不是“滚动分镜型网站”。

要抽取：

- section 列表
- section 高度 / pin / sticky 信息
- ScrollTrigger 配置
- trigger selector
- start / end / scrub / pin
- timeline 里涉及的 selector 和目标属性

第一版解析可以支持 GSAP ScrollTrigger：

```js
scrollTrigger: {
  trigger: '#hero',
  start: 'top top',
  end: '+=130%',
  scrub: 1,
  pin: true
}
```

输出：

```json
{
  "sections": [
    {
      "id": "hero",
      "scroll_weight": 130,
      "pin": true,
      "scrub": true,
      "selectors": ["#card1", "#card2", "#heroWord"]
    }
  ]
}
```

### C3. Scene Ledger Generator / 场景账本生成器

把滚动结构转成视频结构。

输入：

- scroll story JSON
- 目标视频时长，例如 60 秒
- intro / outro 策略

输出：

```json
{
  "duration": 60,
  "scenes": [
    {
      "id": "hero",
      "start": 3.2,
      "duration": 4.78,
      "source_scroll_weight": 130,
      "role": "brand_hero"
    }
  ]
}
```

这里要有“导演规则”，不能只是数学分配。

例如：

- intro 至少 2.5 秒
- final CTA 至少 2.5 秒
- gallery/archive 类场景不低于 5 秒
- product demo 类场景不低于 5 秒
- sweep/transition 类场景可以短一些

### C4. Asset Registry / 资产收发室

这一步非常重要，不能欠 AI 债。

要做：

- 下载白名单资源
- 本地化图片/font/svg
- 去重 hash
- 记录原始 URL
- 标记随机源：picsum / pravatar 等
- 生成替换建议

输出：

```json
{
  "assets": [
    {
      "id": "portrait_leigh",
      "source_url": "https://i.pravatar.cc/300?img=47",
      "local_path": "assets/portraits/leigh.jpg",
      "hash": "...",
      "risk": "random_provider"
    }
  ]
}
```

方向 C 不能只会下载。
它必须有完整生命周期：

```text
查找 → 获取 → 注册 → 去重 → 使用审计 → 垃圾清理 → 归档
```

### C5. HyperFrames Seed Generator / 视频模板种子生成器

生成两类产物之一：

方案 1：生成 `.hyperframes/expanded-prompt.md`

适合让 Framepack / HyperFrames 后续导演化加厚。

方案 2：生成初始 `index.html`

适合工程自动化，但需要更多规则和校验。

建议路线：

第一阶段先生成 expanded-prompt + scene ledger。
第二阶段再生成 skeleton HTML。
第三阶段再尝试迁移动画 tween。

原因：

- 直接生成完整 HTML 风险高
- 先生成 ledger/prompt 更稳定
- 人工导演能保留审美判断

---

## 10. 方向 C 的边界

方向 C 第一批只支持：

- 单页 landing page
- section 明确
- GSAP ScrollTrigger 明确
- 以展示/品牌/作品集为主
- 无复杂表单状态
- 无 canvas/WebGL 作为核心内容

暂不支持：

- 电商复杂流程
- 后台 dashboard
- 登录态页面
- 多路由应用
- 大量用户输入
- WebGL shader 主导页面
- iframe-heavy 页面

以后可以扩展，但第一版模板引擎不要吃太大。

---

## 11. 第一版实施计划草案

正式实施前还要另写 plan，这里只放设计级草案。

1. 建项目目录
   - `aura-noema-scroll-video-template/`
   - 初始化 HyperFrames blank composition

2. 建视觉身份
   - 写 `frame.md`
   - 固化色彩、字体、motion energy

3. 资产本地化
   - 下载头像 / archive / QR / artwork
   - 建 asset manifest
   - 替换随机外链

4. 写 expanded-prompt
   - 10 场结构
   - 60 秒时间窗
   - 每场 motion choreography

5. 写 HTML skeleton
   - root composition
   - clip scenes
   - static layout first

6. 迁移动画
   - 移除 ScrollTrigger
   - 把 scrub progress 改成 timeline duration
   - repeat -1 改有限 repeat

7. 验证
   - lint / validate
   - render / ffprobe
   - 视觉截图检查

8. 复盘方向 C
   - 把人工步骤整理成 parser / ledger / registry / generator 四块需求

---

## 12. 风险与应对

### 风险 1：网页动画照搬后像录屏

应对：做导演版节奏，不做逐像素录屏。

### 风险 2：外部图片随机变化

应对：本地化资产 + manifest。

### 风险 3：HyperFrames `<img>` 自动 clip 管理导致元素消失

应对：装饰图使用 `div + background-image`。

### 风险 4：原网站用 Tailwind CDN，模板不可离线

应对：收敛成静态 CSS。

### 风险 5：ScrollTrigger 动画里用了运行时布局计算

例如 archive grid 里根据 `getBoundingClientRect()` 算中心偏移。

应对：在视频模板里改成确定性布局参数，或者在同步 timeline 构造时一次性读取布局，不引入异步和随机。

### 风险 6：方向 C 过早自动化导致质量下降

应对：先金样板，后工具化。不要一上来做“万能网页转视频”。

---

## 13. 验收口径

第一版成功的标准不是“像网页”。

成功标准是：

1. 用户能看出这是 NOEMA.ART 的完整滚动旅程
2. 视频有明确开场、发展、高潮、CTA
3. 所有场景主体都清楚
4. 60 秒节奏自然
5. 模板内容可替换
6. 渲染确定，不依赖随机网络图
7. HyperFrames 验证通过
8. 后续方向 C 能从这次过程抽象出 parser / ledger / asset registry / seed generator

---

## 14. 推荐决策

推荐采用：

```text
当前版本：路线 B / 视频导演版
后续路线：路线 C / 模板引擎版
```

不要先做路线 A 的逐像素复刻，也不要直接跳路线 C。

原因：

- 逐像素复刻证明不了产品能力，只证明能抄网页
- 直接做模板引擎容易欠 AI 债，规则没跑通就抽象
- 先做导演版金样板，再抽象引擎，是最稳的产品路线

这条路的产品含金量在于：

> Framepack / HyperFrames 不只是从 prompt 生成视频，还能把已有动态网页吸收为视频叙事资产。
