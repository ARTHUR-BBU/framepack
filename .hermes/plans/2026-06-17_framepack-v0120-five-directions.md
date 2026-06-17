# Framepack v0.12.0 — 五大方向实现计划

> **For Hermes:** 按方向顺序执行，每个方向完成后 commit + 测试组验证。今天全部搞定。

**Goal:** 在 v0.11.0 Kinetic Taste Engine 基础上，解决五个产品方向：素材收集缺口、武器库单一引擎局限、Taste 泛化未验证、参数漂移根因、studio_edit_blocked 上游硬伤。

**版本目标:** v0.12.0

**五大方向及优先级（严格按此顺序）:**

| 序号 | 方向 | 类型 | 预估工作量 |
|------|------|------|-----------|
| 1 | Asset Intake 素材收集 | 新功能 | 重 |
| 2 | 武器库扩充 (anime.js + sprite sheet forge) | 能力扩展 | 重 |
| 3 | Taste Engine 广度验证 | 验证 | 中 |
| 4 | 参数漂移根治 | 质量加固 | 中 |
| 5 | gsap_studio_edit_blocked 标记 | 收尾 | 轻 |

---

## 方向 1: Asset Intake — Director Phase 0 素材收集

**设计文档:** `.hermes/designs/2026-06-17--framepack-asset-intake.md`（已审核通过）

### Task 1.1: 创建 asset-intake.md 模板文件

**Files:**
- Create: `framepack-plugin/skills/framepack-director/templates/asset-intake-template.md`

YAML frontmatter + markdown body 的素材清单模板。六类素材（品牌身份/产品/视频/文案/音频/参考），每类带 path/format/transparent/status 字段。

### Task 1.2: 创建 Asset Intake Checklist reference

**Files:**
- Create: `framepack-plugin/skills/framepack-director/references/asset-intake-checklist.md`

按视频类型的条件深度清单：
- brand_product_launch → 全六类
- educational → 文案+音频+参考
- social_teaser → 品牌+文案+产品+音频
- kinetic_type → 文案+音频

### Task 1.3: 创建透明通道检测逻辑

**Files:**
- Create: `framepack-plugin/core/asset_detector.py`
- Test: `framepack-plugin/tests/test_asset_detector.py`

Python 模块，用 PIL/Pillow 检测图片透明通道：
- SVG → 矢量天然透明
- PNG/WebP → 检测 alpha 通道是否存在且非全不透明
- JPG → 无透明通道

返回: `{path, format, transparent: bool, needs_processing: bool}`

TDD: 先写 4 个测试（SVG / PNG透明 / PNG不透明 / JPG），再实现。

### Task 1.4: 更新 Director SKILL.md 加入 Phase 0

**Files:**
- Modify: `framepack-plugin/skills/framepack-director/SKILL.md`

在 Phase 1 之前插入 Phase 0: Asset Intake 段落：
- Step 0.1: 判定视频类型
- Step 0.2: 按品类收集（条件深度）
- Step 0.3: 透明通道检测
- Step 0.4: 产出 asset-intake.md
- Step 0.5: 用户确认

引用 checklist 和模板文件。

### Task 1.5: 更新主 framepack SKILL.md

**Files:**
- Modify: `framepack-plugin/skills/framepack/SKILL.md`
- Modify: `F:/Hermes_windows/skills/software-development/framepack/SKILL.md`（独立 skill 同步）

Product Spine 图更新，加入 Phase 0：
```
Phase 0: 素材收集 → asset-intake.md (NEW)
Phase 1: 意图翻译 → frame.md
Phase 2: 创意细化 → expanded-prompt.md
```

新增 Asset Intake 能力描述段落。

### Task 1.6: 更新 AGENTS.md

**Files:**
- Modify: `framepack-plugin/guardrails.md`（Guardrail Hydrator 源头）
- Modify: `F:/hyperframes/AGENTS.md`（managed block）

Product Spine 图同步。Trigger 条件加入"用户需要提供素材引导"。

### Task 1.7: 更新 post_tool_call hook

**Files:**
- Modify: `framepack-plugin/hooks/on_post_tool_call.py`

asset-intake.md 写入后触发轻量验证：
- 品牌 logo 已提供但没注册到 manifest？
- needs_processing 的图片有没有被提醒？
- missing 列表里的关键素材有没有标注？

### Task 1.8: 测试 + 部署同步

- `pytest tests/ -q -o "addopts="` — 全套通过
- 部署到 `F:/Hermes_windows/plugins/framepack/`
- 部署独立 skill 到 `F:/Hermes_windows/skills/software-development/framepack/`

### Task 1.9: Commit

```bash
git add -A
git commit -m "feat: add framepack asset intake phase 0"
```

---

## 方向 2: 武器库扩充 — anime.js + Sprite Sheet Forge

**设计:** 需要先 brainstorming，然后实现。核心问题是 arsenal schema 只认 GSAP 函数签名绑定。

### Task 2.1: 设计 — 武器引擎多态 schema

brainstorming session 确认：
- arsenal.json 的 weapon entry 增加 `engine` 字段: `gsap | anime | sprite_sheet | css`
- 不同 engine 的 `code` 路径指向不同的代码模板格式
- Execution Manifest 的 weapon entry 也增加 `engine` 字段

### Task 2.2: 扩展 arsenal_registry.py 支持 engine 字段

**Files:**
- Modify: `framepack-plugin/core/arsenal_registry.py`
- Test: `framepack-plugin/tests/test_arsenal_registry.py`

builtin weapon 元数据增加 `engine` 字段。reconcile 逻辑识别不同引擎。

### Task 2.3: 创建 anime.js 武器模板

**Files:**
- Create: `framepack-plugin/skills/framepack-animation-library/weapons/anime/references/` 目录

至少 2-3 个 anime.js 武器：
- `svg-path-draw.js` — SVG path 描边动画（anime.js 的 SVG.drawLine 模式）
- `stagger-reveal.js` — 轻量级元素错位入场
- `morph-blob.js` — SVG 形态变形

### Task 2.4: 创建 Sprite Sheet Forge 武器模板

**Files:**
- Create: `framepack-plugin/skills/framepack-animation-library/weapons/spritesheet/references/` 目录

至少 2 个 sprite sheet 武器：
- `css-steps-walk.js` — CSS steps() 帧序列播放（角色行走循环）
- `canvas-frame-sequence.js` — canvas 帧序列播放（精确帧控制）

### Task 2.5: 更新 framepack-gsap skill 或创建 framepack-animation skill

评估是否需要把 framepack-gsap 改名为 framepack-animation（覆盖三种引擎），还是保持 gsap skill + 新增 anime/spritesheet reference。

倾向于：保持 framepack-gsap 名字不变（向后兼容），在 references 里加 anime.js 和 sprite sheet 的使用指南。

### Task 2.6: 更新 AGENTS.md 武器铁律

铁律从"禁止裸写 GSAP"升级为"禁止裸写动画"（GSAP/anime.js/sprite sheet 统一管理）。

### Task 2.7: 测试 + Commit

```bash
git commit -m "feat: expand weapon arsenal with anime.js and sprite sheet engines"
```

---

## 方向 3: Taste Engine 广度验证

**目标:** 验证 taste audit 在 emerging / editorial 风格上的泛化能力，不只靠 luxury pearl 一个 case。

### Task 3.1: 创建 emerging 风格测试 case

在 golden case 旁边创建一个 emerging 风格的视频项目：
- 风格参考：Neon Grid 或 Data Drift
- 包含 frame.md + expanded-prompt.md + Execution Manifest
- 跑 taste audit + quality audit

### Task 3.2: 创建 editorial 风格测试 case

创建一个 editorial 风格的视频项目：
- 风格参考：Monochrome Luxe
- 同样跑 taste + quality

### Task 3.3: 分析 taste audit 结果

对比三种风格的 taste audit 输出：
- fade-stack 检测是否准确
- surprise operator 密度阈值是否合理
- kinetic grammar 连贯性判定是否有风格偏差

### Task 3.4: 如发现 taste specimen 阈值偏差，修正 taste_specimens.py

**Files:**
- Modify: `framepack-plugin/core/taste_specimens.py`

### Task 3.5: Commit

```bash
git commit -m "test: validate taste engine across luxury/emerging/editorial styles"
```

---

## 方向 4: 参数漂移根治

**问题:** Agent 写 HTML 时凭记忆翻译 Execution Manifest 的参数值，实际值常偏离设计（0.85→0.5, subtle→medium, 60px→120px）。现有 quality_audit 是事后检测，要从源头堵。

### Task 4.1: 分析现有参数漂移检测机制

**Files:**
- Read: `framepack-plugin/core/quality_audit.py` — 现有的 `manifest_parameter_drift` 检测

确认检测逻辑：它读 Execution Manifest 的 params，再扫 HTML 里的函数调用实参，做值比对。

### Task 4.2: 设计前端拦截方案

brainstorming 确认方案：
- **方案: pre-write guard** — 在 Agent 写 HTML 之前（hyperframes init 之后、第一次 write_file index.html 之前），强制注入一个"参数对照卡"到 Agent 上下文
- 对照卡从 Execution Manifest 提取，列出每个武器的精确参数值
- Agent 写 HTML 时，对照卡就在眼前，不需要凭记忆

### Task 4.3: 实现 pre-write guard 逻辑

**Files:**
- Create: `framepack-plugin/core/param_guard.py`
- Test: `framepack-plugin/tests/test_param_guard.py`

从 expanded-prompt.md 解析 Execution Manifest → 提取每个 weapon 的 params → 生成参数对照卡文本 → 通过 ctx.inject_message 注入。

### Task 4.4: 集成到 pre_tool_call hook

**Files:**
- Modify: `framepack-plugin/hooks/on_pre_tool_call.py`

当检测到 `hyperframes init` 命令完成后、`write_file index.html` 之前，注入参数对照卡。

### Task 4.5: 测试 + Commit

```bash
git commit -m "feat: add manifest param guard to prevent parameter drift at source"
```

---

## 方向 5: gsap_studio_edit_blocked — 标记已知限制

**问题:** HyperFrames 0.6.99/0.6.104 无 suppress 机制，Studio 不能编辑某些 GSAP 写法，inspect 永远报 warning。

### Task 5.1: 在 guardrails / SKILL.md 中记录已知限制

**Files:**
- Modify: `framepack-plugin/guardrails.md`
- Modify: `framepack-plugin/skills/framepack/SKILL.md`

在 Known Limitations 段落加入：
- `gsap_studio_edit_blocked` 是 HyperFrames 上游功能缺失，不是 Framepack bug
- 当前状态：保留为结构性限制，不假清洁
- 长期方案：等上游加 suppress 标记

### Task 5.2: 在 quality_audit 报告中标注为 upstream_limit

**Files:**
- Modify: `framepack-plugin/core/quality_audit.py`

当检测到 `gsap_studio_edit_blocked` warning 时，标注 `category: upstream_limit` 而非 `quality_issue`。

### Task 5.3: Commit

```bash
git commit -m "docs: mark gsap_studio_edit_blocked as upstream limitation"
```

---

## 版本收口

### Task 6.1: 版本面同步 v0.12.0

所有 release surface 从 0.11.0 → 0.12.0：
- plugin.yaml version + description
- __init__.py logger
- hooks docstring + logger
- 7 个 SKILL.md frontmatter
- AGENTS.md version comment
- guardrails.md version
- README + docs/README.zh-CN.md
- CHANGELOG.md 新增 0.12.0 条目
- compat/hyperframes-support.json framepack_version
- core 模块 DEFAULT_PLUGIN_VERSION
- test 断言更新

### Task 6.2: 全套测试 + 部署同步

```bash
pytest tests/ -q -o "addopts="
# 部署到 F:/Hermes_windows/plugins/framepack/
# 部署独立 skill
```

### Task 6.3: Release commit

```bash
git commit -m "release: bump to v0.12.0"
```

### Task 6.4: 推送 GitHub + tag + release

```bash
git push origin framepack-agent-platform
git push origin framepack-agent-platform:main
git tag -a v0.12.0 -m "v0.12.0 — Asset Intake + Arsenal Expansion + Taste Validation + Param Guard"
git push origin v0.12.0
gh release create v0.12.0 ...
```

### Task 6.5: 交接台更新

更新 `.hermes/CONTEXT.md`。

### Task 6.6: 安排测试组实例测试

---

## 验证检查清单

每个方向完成后检查：
- [ ] pytest 全套通过（无新增 fail）
- [ ] 部署目录同步
- [ ] 独立 skill 同步
- [ ] 无版本漂移（grep 旧版本号）
- [ ] commit message 清晰

全部完成后：
- [ ] GitHub tag + release
- [ ] 交接台更新
- [ ] 测试组验收脚本准备
