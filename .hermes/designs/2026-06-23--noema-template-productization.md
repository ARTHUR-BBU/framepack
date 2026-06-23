# NOEMA 模板产品化设计

日期: 2026-06-23
状态: 待老田确认后执行

## 1. 一句话目标

把 `aura-noema-scroll-video-template` 从“金样板”升级成“Agent 能稳定复用的模板包”。

类比：现在它是一道名厨样菜，味道证明了；产品化要把它变成厨房 SOP：菜单、备料表、换菜规则、出餐验收单都齐。

## 2. 现状判断

当前模板已经具备：

- 60s / 1920x1080 / 30fps / 11 scene 的稳定舞台调度。
- 本地 fonts / GSAP / frozen image assets。
- `frame.md`、`variables.json`、`expanded-prompt.md`、`index.html`。
- 真实 gold sample render 与 contact sheet。

测试组复用验证暴露的产品化缺口：

1. 用户知道“能改文字”，但不知道“必须换道具/布景”。
2. `variables.json` 只是数据模型种子，不会自动驱动 HTML，容易被误解成模板引擎。
3. 默认 `npx hyperframes` 会漂到 latest；模板应该明确使用 `0.6.121`。
4. 海报式叠层需要模板级 layout allow 标注规范，否则 inspect 会吓新手。
5. 缺少正式复用入口文档：用户给一个主题/推文/品牌后，Agent 到底怎么照模板改。
6. 缺少复用验收清单：除了 lint/render，还要查 stale props、ffprobe、contact sheet。

## 3. 产品化等级

本轮不做“一键 CLI 模板引擎”。原因：那相当于从样菜直接开中央厨房，工作量会膨胀到 parser/generator/asset freezer。

本轮做“Agent-managed template”。也就是：

- 人/Agent 复制模板目录。
- 按模板内文档填 `variables.json` 和 `frame.md`。
- 按 scene map 替换文字和素材。
- 运行固定校验命令。

这是正确的中间层：比 gold sample 可用，比 CLI 产品轻，但不欠 AI 债，因为它把未来 CLI 需要的契约先定下来。

## 4. 本轮交付物

### 4.1 README 升级

重写 `aura-noema-scroll-video-template/README.md`，从“项目说明”升级为“用户使用入口”。

新增内容：

- 模板定位：60s landscape brutalist poster video。
- 适合场景：产品发布、工具链介绍、创作者/社区/方法论推广。
- 不适合场景：逐屏教程、长字幕讲课、竖屏短视频。
- 三档复用方式：
  1. 文案替换：最快，风险是素材灵魂没换。
  2. 文案 + 程式化素材：推荐默认。
  3. 文案 + 真实品牌资产/截图/SVG：产品 demo 级。
- 精确命令，固定 `npx hyperframes@0.6.121`。
- 验收标准：lint / validate / inspect / render / ffprobe / stale asset grep。

### 4.2 新增 `TEMPLATE-USAGE.md`

这是给 Agent 和用户看的“换菜说明书”。

内容：

- 如何复制模板，包含 `.hyperframes/` 隐藏目录，且不要复制旧 `dist/` 输出。
- `frame.md` 改什么：视觉身份。
- `variables.json` 改什么：内容合同。
- `index.html` 改什么：当前阶段仍需静态绑定。
- scene-by-scene mapping table：
  - loader: brand boot
  - hero: 3 anchor cards
  - interlude: audience/world statement
  - product: core product pair
  - manifesto: one-sentence thesis
  - archive: 15-slot capability/gallery grid
  - builder: profile/system assembly
  - board: 7 cards/pillars/opportunities
  - support: validation/result flow
  - cta-build: 3 payoff words
  - join: final CTA
- 素材替换规则：不只换台词，还要换道具。
- 程式化素材 pattern：terminal panes / node graph / capability tiles / code diff / dashboard / geometric avatars。

### 4.3 扩展 `variables.json` 成正式 schema seed

不把 HTML 改成自动模板引擎，但把变量结构补全，让它成为未来生成器的契约。

新增字段方向：

- `template_meta`: template name, version, hyperframes version, duration, aspect ratio。
- `brand`: name, tagline, CTA, email, url。
- `scene_copy`: 11 scene 的可替换文字。
- `prop_strategy`: `frozen_assets | programmatic | user_assets | mixed`。
- `asset_slots`: hero cards / product pair / archive grid / builder thumbs / join avatars。
- `validation`: expected duration/fps/resolution/frames。

重要措辞：README 必须明确 `variables.json` 现在是“合同/备料表”，不是自动渲染引擎。

### 4.4 新增 `TEMPLATE-QA.md`

这是“出餐验收单”。

包含：

- 固定版本命令：`npx hyperframes@0.6.121 ...`
- lint / validate / inspect / render / ffprobe。
- stale asset grep：检查是否残留旧领域图片引用。
- `data-layout-allow-*` 标注检查。
- contact sheet / snapshots 视觉检查。
- 报告模板：PASS / WARN / FAIL。

### 4.5 修正模板 inspect 标注（小范围）

如果复跑 gold sample 的 inspect 发现 intentional poster overlap 报错，本轮只做模板级标注修正，不改视觉设计、不重写动画。

原则：

- 只给明显 intentional poster text / overlay card / decorative overlap 加 `data-layout-allow-occlusion` / `data-layout-allow-overlap`。
- 不用 allow 标注掩盖真实排版错误。
- 改完必须复跑 inspect。

## 5. 不做什么

### 不做 CLI 命令

不新增 `framepack template use noema`。

原因：这相当于开收银台和后厨自动化，现在连菜单和备料表还没稳定。先把 SOP 写实，下一轮 CLI 才有坚实契约。

### 不做自动 HTML 生成器

不把 `variables.json` 立刻接成完整 HTML 渲染引擎。

原因：NOEMA 的动画 targets/class/DOM 很密，硬接变量容易引入一堆脆弱替换逻辑。当前更稳的是“变量合同 + Agent 按合同编辑”。

### 不做泛化 ScrollTrigger 网站转换器

Direction C 继续保留为后续。

原因：那是另一条产品线：网站 intake、scroll parser、asset freezer、scene ledger generator。本轮目标只是把已验证样板变成可复用模板。

## 6. 验证计划

执行后必须跑：

```bash
cd /f/hyperframes/aura-noema-scroll-video-template
npx hyperframes@0.6.121 lint
npx hyperframes@0.6.121 validate
npx hyperframes@0.6.121 inspect --samples 15
npx hyperframes@0.6.121 render --output dist/noema-scroll-template.mp4
ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate,avg_frame_rate,nb_frames,duration -show_entries format=duration,size -of json dist/noema-scroll-template.mp4
rg "assets/(portraits|archive|artwork|qr).*\.(jpg|jpeg|png)" index.html
```

注意：最后一条对原 NOEMA gold sample 会有命中，因为它本来就是 NOEMA 资产。对复用 case 才要求无旧领域残留。所以 QA 文档要区分：

- gold sample: asset refs expected
- repurposed output: stale source-domain refs should be reviewed or zero

## 7. 成功标准

- 用户打开 README 能知道这是什么模板、适合什么、怎么用。
- Agent 接到“用 NOEMA 模板做 X”时，不会从零 brainstorm，而是按模板复用流程走。
- 变量、素材槽、场景语义、验收命令都有明确文档。
- HyperFrames 版本不漂移。
- 模板仍能 lint / validate / inspect / render。
- 文档明确：当前是 Agent-managed template，不冒充一键 CLI 产品。

## 8. 执行顺序

1. 读并记录当前 gold sample lint/validate/inspect 基线。
2. 更新 README。
3. 新增 TEMPLATE-USAGE.md。
4. 新增 TEMPLATE-QA.md。
5. 扩展 variables.json。
6. 视 inspect 结果做最小 layout allow 标注。
7. 跑完整验证。
8. 更新 CONTEXT.md 手台。
9. 若通过，再进入 review / commit 流程。
