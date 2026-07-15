# Framepack Codex 导演工作台 — 设计稿

## 摘要

Framepack 将重建为一个**面向编程式视频、以 Codex 为第一入口的导演层**。它的主要使用体验是从 Codex 打开的浏览器工作台：把用户需求和本地素材转化为可审阅的 HTML/CSS/GSAP 动画样片；用户确认后，再交给 HyperFrames 完成渲染、音频、配音、字幕和最终媒体质检。

第一版**只支持 Codex**。在 Codex 的真实项目闭环被验证稳定前，Hermes 与 Claude Code 明确不在范围内。核心能力以稳定的文件与 CLI 命令实现，未来其他宿主只需要包一层入口，不需要重写导演工作流。

现有 Hermes 插件只保留在 Git 历史中。新代码可以有选择地重新实现已经验证的规则、武器、模板和质量启发，但不得导入、复制或依赖旧插件运行时。

## 产品边界

Framepack 负责最终媒体生产之前的创意决策闭环：

```text
需求 + 素材 → 创意方向 → 分镜 → HTML 动画样片
→ 快照 + 品味审片 → 用户确认 / 明确豁免 → 交接给 HyperFrames
```

HyperFrames 负责交接之后的执行：lint/check/render、音频与 TTS、字幕、媒体检查、导出、发布和云渲染。

Framepack 承诺提供可审片的 HTML 动画样片和真实的交接包；在 HyperFrames 完成自身质检之前，不承诺最终 MP4。

## 架构

### Codex 导演工作台

`apps/director-workbench/` 是面向浏览器的应用，也是 Codex 中 Framepack 的默认入口。它包含五个连贯视图：

1. **需求**：目标、比例（16:9 或 9:16）、时长、素材，以及音频/字幕意图。
2. **导演方向**：视觉身份、动效节奏、反复出现的视觉母题、场景提纲和明确的避免事项。
3. **样片预览**：生成的 HTML 动画、时间线和关键证据帧。
4. **审片**：技术发现、品味结论、可执行的返工项、用户确认或明确豁免。
5. **交接**：已经确认的样片摘要，以及 HyperFrames 必须执行的准确工作清单。

工作台只负责启动和观察本地 Framepack CLI 任务，不保留第二套 pipeline 逻辑。

### 导演引擎与 CLI

`packages/director-engine/` 包含确定性的项目操作：读取和写入项目文件契约、调用本地构建/预览工具，并暴露以下命令：

```text
framepack director init <project> --aspect <16:9|9:16> --duration <seconds>
framepack director build <project>
framepack director serve <project>
framepack director snapshot <project>
framepack director audit <project>
framepack director handoff <project>
```

`packages/director-contracts/` 负责版本化 schema 和校验器。`packages/hyperframes-bridge/` 负责结构兼容性检查与交接包生成。工作台、CLI 与测试都只使用这一套包。

第一版不创建 `adapters/hermes/` 或 `adapters/claude-code/`。未来集成必须调用这套 CLI、消费这些文件，不能重新引入宿主专属业务逻辑。

## 项目文件契约

### 2026-07 修订：不可变 Build 与简约审片台

Framepack 不再直接写项目根目录的 `index.html`。每次 build 都是独立、可复核的导演样片：

```text
.framepack/builds/<build-id>/
  index.html
  public/
  storyboard.json
  weapon-call-receipt.json
  motion-coverage.json
  preview-snapshots/
  taste-audit.json
  approval.json
  manifest.json
```

`.framepack/current-build.json` 只是当前版本指针。它发生变化时，旧审批不会自动迁移到新版本；HyperFrames 只能从 handoff manifest 指向的已批准 build 读取样片。

Skill 采用五类职责：`director`（创意与分镜）、`producer`（素材和武器编排）、`motion`（动作与时间轴）、`review`（证据与审片）、`adapter`（HyperFrames 交接）。每个实际应用的 skill 必须留下 output path 和 output hash，不能只留下“加载过”的回执。

浏览器工作台收敛为三个区域：**Builds**（版本、来源、素材缺口）、**Preview**（样片、时间线、证据）、**Judgment**（技术结果、动态覆盖率、批准/豁免）。它是 Codex 的审片桌，不是第二个剪辑器；创意修改仍在 Codex 对话完成。

每个导演样片项目由 Framepack 生成并维护：

```text
project/
├── index.html
├── frame.md
├── public/
│   ├── assets/
│   ├── fonts/
│   └── vendor/gsap.min.js
├── .framepack/
│   ├── asset-intake.md
│   ├── storyboard.md
│   ├── html-build-report.md
│   ├── preview-report.md
│   ├── preview-snapshots/
│   ├── taste-audit.md
│   ├── approval.json
│   └── handoff-manifest.json
└── .hyperframes/render-plan.md
```

`approval.json` 只允许两种状态：`approved`（通过）或 `waived`（明确豁免）。其中必须记录样片构建标识、用户理由和时间戳。没有它，不得交接；系统不能偷偷推断“用户应该同意了”。

`handoff-manifest.json` 使用 `1.0` 版本，包含源构建标识、比例、尺寸、时长、HTML 入口、预览状态、品味结论、音频/字幕/BGM 需求、HyperFrames 操作列表、已知风险和渲染说明。

## 预览与质量闸门

`build` 生成只使用本地素材、字体和 GSAP 的 HyperFrames 兼容 `index.html`。它必须明确声明根 composition 与每个场景的准确时间窗口。

Bridge 会拒绝违反下列任一规则的构建：

- 根节点必须有 `data-start="0"`、明确总时长，以及与所选比例一致的尺寸；
- 每个场景必须是带时间的 `.clip`，并有内部视觉 wrapper；
- 媒体必须是根节点子元素，具备 ID、时间、明确的位置；视频还必须有明确 z-index；
- 禁止把 opacity、filter 或 transform 动画直接施加在 clip 根节点上；
- 时间线必须注册到 `window.__timelines["main"]`，而且可确定、可 seek；
- 禁止 `repeat:-1`、运行时外部 CDN、CSS 变量作为 `font-family`、给非媒体元素手动添加 `data-hf-id`，以及 `tl.set(... opacity: 0 ...)` 作为初始隐藏态。

`snapshot` 会为每个场景抓取稳定帧、转场中点、高风险视频窗口和最终停留帧。`preview-report.md` 记录每一帧的时间、预期状态、实际观察与失败原因。

`audit` 分成两部分：

- **技术审计**是确定性的。缺素材、结构不合法、证据帧黑屏/空白、场景可见性不对、HyperFrames lint/check 失败，都会阻断交接。
- **品味审计**结合确定性信号与 LLM 评估。它必须输出 `pass`、`fail` 或 `needs_review`；并明确 PPT 感、动效质量、画面密度、素材使用、音频准备度、是否建议交接，以及具体返工项。

只有技术审计通过、预览证据完整、品味审计通过或被用户明确接受为 review、并且存在 `approval.json` 时，系统才可以自动交接。用户可以豁免品味失败，但豁免理由与未解决问题必须保留在 handoff manifest 中。技术失败不可豁免。

## 迁移策略

旧 Hermes 插件文件不移动到新工作树，Git 历史就是档案馆。

实现中维护 `docs/migration/legacy-inheritance.md`，逐条记录每一个被选择性复用的规则、模板、武器或资产：它来自哪个历史 Git 来源，以及在新系统中由谁负责。这是一份来源账本，不是旧代码副本。

允许继承：

- HyperFrames 的结构规则与 seek-safe 动效规则；
- 经过独立验证的可复用动效武器食谱；
- 素材 intake、故事板、兼容性和品味审计的思路；
- 来源与授权清楚的模板、视觉资产。

禁止继承：

- Hermes hooks、注入流程、部署脚本、插件元数据和运行时依赖；
- 行为依赖 Hermes 的旧控制闭环；
- 只证明 Hermes 集成的旧测试。

## 测试与验收

每项导演引擎行为先写测试，再编写实现。第一套 fixture 项目同时覆盖 1920×1080 与 1080×1920。

必须具备以下自动化覆盖：

1. intake、preview report、taste audit、approval、handoff manifest 的文件契约与 JSON schema 校验。
2. 全部 HTML 硬兼容规则的结构回归测试。
3. 本地资产/字体/vendor 约束与确定性时间线检查。
4. 每场景稳定帧、转场、视频窗口和最终停留帧的快照计划覆盖。
5. 闸门结果：有 waiver 也不能绕过技术失败；品味失败必须返工或明确豁免；确认后的样片可以生成交接包。
6. init、build、snapshot、audit、handoff 的 CLI 到工作台任务状态联动。
7. Codex 端到端 fixture：需求 → build → HyperFrames lint/check → snapshots → audit → approval → handoff。

只有当这套完整闭环能在 Codex 中跑通一个 30 秒 16:9 产品解释视频及其 9:16 变体，并且用户能在浏览器工作台审阅实际动态样片后再确认交接，第一版才算验收通过。

## 第一版明确不做

- Hermes 和 Claude Code 的插件、hooks、兼容测试与部署。
- 最终 MP4 渲染、编码、云渲染、发布、音频混音、配音、字幕烧录和 HyperFrames runtime 改动。
- 自动搬运全部历史 Framepack 资产或武器。
