# Framepack Commercial Video Quality Engine

**Date**: 2026-07-05
**Status**: Product development design / awaiting implementation plan
**Context**: Framepack v0.18 has built the discipline layer: Weapon Matching Pass, Post-write Weapon Enforcement Gate, HF 0.7.33 compat, Figma/capture/keyframes source awareness. This document turns that discipline into direct creative output quality.

---

## 1. Plain-language verdict

Framepack 现在像一家厨房：

- v0.18 做的是 **不许厨师裸手炒菜**：必须用登记过的锅、刀、调料。
- 但用户要的不是“厨师守规矩”，而是 **菜端出来真香**。
- 下一阶段要做的是 **试菜台 + 招牌菜谱 + 出片品控**：验证每件武器的真实效果，沉淀高分参数，端到端跑商业片样板。

所以本阶段目标不是再造更多卡点，而是让武器库从“可调用”升级为“可交付惊艳商业视频”。

---

## 2. Product goal

Build a productized quality layer that answers three questions before Framepack claims a video is good:

1. **武器好不好？**
   每件 weapon 是否真的有高级感？默认参数、推荐参数、禁用参数分别是什么？

2. **武器用得对不对？**
   Agent 不只要调用 `numberCountUp()`，还要传入适合商业视频的节奏、层级、颜色、镜头关系。

3. **整支片像不像商业作品？**
   不是 PPT 大字切换，而是有产品主角、节奏曲线、真实素材、视觉层次、音乐/转场闭环。

---

## 3. Product principles

### 3.1 From gate to taste

Gate 的职责是防守：别裸奔、别骗自己、别绕过武器。

Taste Engine 的职责是进攻：告诉 Agent “这样更像一支好广告”。

**Rule**: gate 可以阻断低级错误；taste engine 负责提高上限。

### 3.2 Rendered evidence over declared intent

Manifest、plan、函数调用都只是“厨师说他用了刀”。真正可信的是：

- HTML 能跑
- keyframes/snapshot 能看
- 关键帧有视觉证据
- weapon 实际效果被打分
- 端到端 case 通过人工/自动 taste audit

### 3.3 Fewer weapons, better weapons

21 件 weapon 不等于 21 件好 weapon。下一阶段允许：

- 升级强武器
- 降级弱武器
- 废弃廉价武器
- 合并重复武器
- 为高价值武器做 preset pack

目标不是“大而全”，而是“商业片能打”。

---

## 4. Product components

### 4.1 Weapon Bench — 武器试菜台

**Purpose**: 对每件 weapon 做可重复的视觉验证。

**Inputs**:
- weapon registry / builtin weapon list
- reference JS file
- canonical function name
- 2–3 commercial demo scenarios

**Outputs**:
- `.framepack/weapon-bench/<weapon-id>/demo.html`
- `.framepack/weapon-bench/<weapon-id>/snapshots/*.png`
- `.framepack/weapon-bench/<weapon-id>/report.json`
- `.framepack/weapon-bench/<weapon-id>/scorecard.md`

**Score dimensions**:

| Dimension | Meaning |
|---|---|
| impact | 是否一眼有视觉冲击 |
| polish | 是否高级，不廉价 |
| commercial_fit | 是否适合商业广告，而不是玩具 demo |
| parameter_safety | 默认参数是否安全，是否容易被 Agent 调坏 |
| hyperframes_safety | 是否符合 HF 结构铁律，不污染 clip root / data-hf-id |
| composability | 是否能和其他武器组合，不抢戏 |

**Result classes**:

| Class | Meaning | Product action |
|---|---|---|
| A | 招牌武器 | 默认优先推荐，沉淀 preset |
| B | 可用武器 | 可推荐，但需参数约束 |
| C | 勉强可用 | 只在明确场景使用 |
| D | 廉价/危险 | 降级或废弃 |

---

### 4.2 Weapon Preset Pack — 高分参数包

**Problem**: Post-write gate 只能检查 Agent 有没有调用函数，不能检查参数好不好。

**Solution**: 每件 A/B 级 weapon 产出 presets。

Example:

```json
{
  "weapon_id": "number-count-up",
  "presets": {
    "luxury_metric": {
      "duration": 1.4,
      "ease": "power3.out",
      "separator": ",",
      "prefix": "",
      "suffix": "%",
      "motion_role": "hero-proof"
    },
    "startup_kpi": {
      "duration": 0.9,
      "ease": "expo.out",
      "motion_role": "punch-card"
    }
  }
}
```

Framepack 不只说“用 number-count-up”，而是说：

> 这里是 hero proof 数据，使用 `number-count-up/luxury_metric` preset。

---

### 4.3 Taste Audit — 商业片口味审计

Current quality audit catches contract violations. Taste audit catches creative cheapness.

**Signals**:

| Signal | Bad smell |
|---|---|
| text_dominance | 大段文字当主角，像 PPT |
| product_absence | 产品/真实素材不是主角 |
| flat_background | 纯色背景 + 大字切换 |
| weak_motion_hierarchy | 所有元素一样动，没有主次 |
| transition_randomness | 转场像随机特效包 |
| no_proof_frames | 关键帧没有视觉证据 |
| weapon_preset_missing | 调了 weapon 但没用经过验证的 preset |
| bgm_unplanned | 没有音乐/节奏计划 |

**Output**:
- P0: 廉价商业片风险，必须修
- P1: 品质弱点，建议修
- P2: polish 建议

This audit should be report-first, not block-first. Render 前给导演建议，最终用户决定。

---

### 4.4 Commercial Case Harness — 端到端样板间

**Purpose**: 用真实商业视频任务验证 Framepack，不靠 isolated unit tests 自嗨。

Minimum cases:

1. **Product launch** — 产品官网/URL → 30s launch video
2. **Website-to-video** — 网站视觉 DNA → 15–30s promo
3. **Faceless explainer** — 文案/文章 → 45s explainer
4. **Reference replica** — 参考视频前 20 秒 → 风格复刻
5. **Figma brand kit** — Figma frames/tokens/motion → brand video

Each case must produce:
- `frame.md`
- `.hyperframes/expanded-prompt.md`
- `.framepack/weapon-load-plan.json`
- `index.html`
- keyframes/snapshot evidence
- taste audit report
- rendered mp4 when feasible

---

### 4.5 SDK Editing Affordance Bridge — SDK 编辑性桥

HF 0.7.22 的 `resolveEditingAffordances` 是关键。

Framepack 应该把“Studio 能不能编辑”从 vague warning 变成 metadata：

```json
{
  "weapon_id": "text-split-enter",
  "studio_editable": false,
  "editing_affordance": {
    "source": "hyperframes-sdk/resolveEditingAffordances",
    "editable_properties": [],
    "reason": "GSAP owns transform/opacity timeline"
  }
}
```

**Product value**:
- Agent 不再误以为 Studio warning 是 bug
- Studio/SDK 可以知道哪些元素可拖、哪些只读
- Weapon plan 能提前告诉用户：这段动画是代码控制，不适合 Studio 拖拽

This is the “chemical reaction” between Framepack and HyperFrames SDK.

---

### 4.6 Figma Motion Weapon Source

HF 0.7.29 already turns Figma Motion timelines into seekable GSAP.

Framepack should treat Figma Motion as a first-class weapon source:

- If prompt mentions Figma / brand frame / motion prototype → route to `hyperframes figma`
- If imported Figma timeline exists → register as project-local weapon
- If weapon matching sees similar scene need → recommend Figma-derived motion before handwrite

This turns designer-authored motion into reusable Framepack weapons.

---

## 5. Data artifacts

### 5.1 `weapon-scorecard.json`

```json
{
  "weapon_id": "caption-clip-wipe",
  "class": "A",
  "scores": {
    "impact": 4,
    "polish": 5,
    "commercial_fit": 5,
    "parameter_safety": 4,
    "hyperframes_safety": 5,
    "composability": 4
  },
  "recommended_presets": ["editorial_lower_third", "premium_product_callout"],
  "avoid": ["long_body_copy", "three_lines_plus"],
  "evidence": {
    "demo_html": ".framepack/weapon-bench/caption-clip-wipe/demo.html",
    "snapshots": [".framepack/weapon-bench/caption-clip-wipe/snapshots/hero.png"]
  }
}
```

### 5.2 `taste-audit.json`

```json
{
  "verdict": "REVISE",
  "commercial_score": 72,
  "issues": [
    {
      "severity": "P0",
      "code": "text_dominance",
      "message": "Scene 2 is text-led; product visual is absent.",
      "suggestion": "Use product screenshot as hero layer; move text to caption-clip-wipe callout."
    }
  ]
}
```

### 5.3 weapon-load-plan extension

```json
{
  "selected": {
    "weapon_id": "number-count-up",
    "preset_id": "luxury_metric",
    "studio_editable": false,
    "score_class": "A"
  }
}
```

---

## 6. Development roadmap

### Phase 1 — Bench one weapon end-to-end

Goal: prove the bench loop on one high-value weapon.

Candidate: `number-count-up` or `caption-clip-wipe`.

Deliverables:
- bench CLI skeleton
- demo HTML generator
- snapshot/keyframes runbook
- scorecard schema
- one real scorecard

Success: one weapon has visual evidence + rating + recommended preset.

### Phase 2 — Bench top 5 commercial weapons

Candidate weapons:
- `number-count-up`
- `caption-clip-wipe`
- `text-split-enter`
- `data-chart-editorial`
- `card-cascade`

Success: weapon matcher can prefer A/B weapons and presets.

### Phase 3 — Weapon preset enforcement

Extend post-write gate:

- Current: checks function call exists
- Next: checks selected preset metadata exists or waiver explains why not

Success: Agent can’t pass by calling empty/default weapon function.

### Phase 4 — Taste Audit v1

Implement commercial cheapness signals:
- text dominance
- product absence
- no proof frames
- missing weapon preset
- bgm unplanned

Success: audit catches “PPT-style video” even if technical gates pass.

### Phase 5 — SDK + Figma chemical reaction

- Add `studio_editable` metadata to weapon-load-plan
- Add Figma Motion import as project-local weapon source
- Add SDK affordance hints to quality/taste reports

Success: Framepack can explain what is Studio-editable and reuse designer motion.

### Phase 6 — End-to-end commercial case harness

Run 3 real cases:
- product launch
- website-to-video
- Figma brand video

Success: rendered videos are reviewed against real-world commercial references, not just tests.

---

## 7. Non-goals

### Not more gates for their own sake

We already have enough defensive gates. More gates without visual evidence only makes the kitchen bureaucracy heavier.

### Not automatic aesthetic scoring by fake certainty

No pretending an LLM can perfectly judge “beautiful”. Taste audit should produce concrete, inspectable signals: product absent, text too dominant, no proof frames, missing presets.

### Not replacing HyperFrames

Framepack remains the director / taste layer. HyperFrames remains the studio / renderer / SDK.

---

## 8. Success metrics

| Metric | Target |
|---|---|
| A/B-rated weapons with rendered evidence | 5 in first iteration |
| weapon matcher selections using presets | 80%+ for supported scenes |
| post-write pass with empty weapon calls | 0 |
| taste audit catches PPT-like scenes | yes, in fixture tests |
| end-to-end sample commercial videos | 3 |
| user-visible improvement | fewer cheap text-only scenes, more product-led frames |

---

## 9. Recommended next step

Do **Phase 1** only first: bench one weapon end-to-end.

Recommended weapon: `caption-clip-wipe`.

Why:
- It directly fights PPT syndrome: text becomes a premium editorial callout, not the main dish.
- It is common in commercial videos.
- It is easier to visually judge than abstract background effects.

After Phase 1 proves the loop, scale to top 5 weapons.
