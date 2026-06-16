# Framepack v0.11 — Kinetic Taste Engine

> 动态审美引擎：Reference DNA + Visual Physics + Kinetic Grammar + Director Taste Moves + Controlled Surprise

## 0. 设计状态

- Status: Draft for 老田 review
- Date: 2026-06-16
- Project: Framepack / HyperFrames Prompt Factory
- Target version: v0.11
- Scope: Framepack creative layer only. No HTML writing, no rendering, no replacement for HyperFrames.

## 1. Problem: 合格不等于惊艳

v0.10.x 把 Framepack 从“会写 prompt”推进到“可安全交付”：

- Guardrail Hydrator
- Arsenal Registry
- HyperFrames compatibility adapter
- Execution Manifest
- timeline manifest
- proof frames
- semantic quality audit
- font / visibility / NaN / proof path hardening
- test-team release workflow

这套系统解决的是：别炸、别漏、别漂、别把用户带沟里。

但 v0.10.x 仍然留下一个更高级的问题：

> 一个视频可以结构正确、lint 通过、manifest 完整、audit 全绿，但仍然像“装修公司样板间”。

传统 Aesthetic Benchmark / Rubric 能把指标揉碎，保证“不难看”：

- 色彩协调
- 字体统一
- 层次丰富
- 节奏清晰
- CTA 明确

但“惊艳”不是平均分堆出来的。

动画视频的本体不是静态画面，而是变化、能量、转场、动作接力、视觉母题和可控破格。

所以 v0.11 不应该只做一把审美尺子。

v0.11 要给 Framepack 装一个“导演小脑”：

- 能理解一支片子的内部物理；
- 能设计场景之间的动作接力；
- 能让图形、组件、mockup、转场共同服务一个视觉母题；
- 能主动加入 1-2 个可控惊喜；
- 能识别“工整但没性格”的 prompt；
- 能输出导演批注，而不是假精确总分。

一句话：

> v0.11 不是 Aesthetic Rubric，而是 Kinetic Taste Engine。

## 2. Product Thesis

Framepack v0.11 should make Director outputs feel less like “well-structured prompts” and more like “a directed motion world.”

The upgrade path:

```text
v0.10.x: Production Safety
    ↓
v0.11: Kinetic Taste
    ↓
Future: Reference-guided / proof-frame-informed taste loop
```

核心产品宣言：

> Benchmark 是燃料，不是方向盘。方向盘是 Visual Physics + Kinetic Grammar + Taste Moves + Controlled Surprise。

## 3. Non-goals

v0.11 不做：

1. 不写 HTML。
2. 不替代 HyperFrames lint / validate / render。
3. 不做“美学总分 87”这种假精确评分。
4. 不做大规模自动网页抓取 / 模板 ingestion 作为首版阻塞项。
5. 不做 CV 视觉评分或截图打分首版。
6. 不让 Framepack 变成模板库。
7. 不把惊喜变成随机发疯。
8. 不破坏 v0.10.6 Production Quality Layer。
9. 不把 Framepack 从 Prompt Factory 扩展成 HTML 生产器。

## 4. Core Concepts

### 4.1 Reference DNA — 参考标本，不是模板目录

旧想法：Benchmark Catalog，把 nexu / html-video / html-anything 的模板打标签。

新想法：Reference Specimen Library，把优秀案例拆成可迁移的“审美 DNA”。

每个 specimen 不只记录：

- luxury
- bold
- minimal
- kinetic

而是记录它为什么有劲：

- Hook DNA: 首屏如何抓人？
- Energy Arc: 能量如何上升 / 呼吸 / 爆发？
- Motion DNA: 动作是否有接力关系？
- Transition DNA: 场景如何互相变形，而不是普通 fade？
- Component DNA: UI / mockup / product 如何被“拍摄”？
- Motif DNA: 什么视觉母题贯穿全片？
- Surprise DNA: 哪个瞬间让人记住？
- Ending DNA: CTA 如何收束，而不是硬贴按钮？

示例 schema：

```yaml
id: luxury-object-emergence
source: internal
best_for:
  - luxury
  - product-reveal
  - brand-film
hook_dna:
  type: object_emergence
  description: "A hero object emerges from darkness before copy appears."
  timing: "0.4s–1.6s"
energy_arc:
  type: slow_burn_to_editorial_punch
motifs:
  - circular_highlight
  - black_void
  - soft_specular_edge
kinetic_grammar:
  - tension_release
  - mask_portal
taste_moves:
  - object_worship
  - silence_before_drop
surprise_operators:
  - scale_violation
component_patterns:
  - product_as_sculpture
transition_patterns:
  - highlight_expands_to_wipe
anti_patterns:
  - generic fade stack
  - random particle decoration
```

首版不要求自动 ingest 31 个外部模板。
先内置 6-8 个 high-signal specimen，保证系统跑通。

### 4.2 Visual Physics — 每支片子的内部物理

好视频不是很多漂亮元素相加。

好视频像一个有内部物理的世界。

每支片应该有自己的视觉物理：

- 重力是什么？
- 材质是什么？
- 动作规律是什么？
- 元素如何变形？
- 哪些运动被禁止？
- 画面如何呼吸？

示例：珍珠品牌

```yaml
visual_physics:
  gravity: low
  materials:
    - pearl
    - silk
    - shadow
    - soft gold light
  motion_law:
    - slow drift
    - orbital reveal
    - sudden light cut
  transformation_rule:
    - circles become halos
    - halos become portals
    - light streaks become text underlines
  forbidden_motion:
    - generic slide-in
    - random bounce
    - unrelated particle bursts
```

作用：

- 把“高端、柔和、有质感”这种形容词变成可执行规则；
- 约束场景、转场、动效、组件如何共同属于同一个世界；
- 防止 expanded-prompt 变成“PPT 元素依次进场”。

### 4.3 Kinetic Grammar — 动态视觉语法

Framepack 现在有 animation verbs：SLAM、CASCADE、float、drift、wipe。

但孤立动词不够。

真正的动画审美来自句法：一个动作如何导致、呼应、变形、释放另一个动作。

首版 kinetic grammar：

1. Cause → Reveal
   - 一个元素造成另一个元素出现。
   - 例：光线扫过 → 文字显形。

2. Echo → Transform
   - 上一幕形状在下一幕变形。
   - 例：珍珠圆点 → 数据节点 → CTA 按钮。

3. Mask → Portal
   - 转场不是切换，而是开门。
   - 例：产品边缘高光扩张成全屏 wipe。

4. Tension → Release
   - 前面克制，后面突然释放。
   - 例：前 4 秒几乎静止，第 5 秒大字 SLAM。

5. Scatter → Assemble
   - 碎片先散，再组成品牌 / 产品 / 观点。

6. Follow-through
   - 一个运动结束后的惯性带出下一个元素。

7. Breath → Punch → Silence
   - 吸气、出拳、停顿。

目标：让场景之间有“动作接力”，而不是每个场景都独立 entrance。

### 4.4 Director Taste Moves — 导演招式库

Rubric 问“这个视频几分”。

Taste Moves 问“导演准备用什么手法让它有性格”。

首版 taste moves 建议 12 个：

1. Object Worship
   - 像拍奢侈品一样拍产品，把产品当雕塑。

2. Editorial Punch
   - 大号字体像杂志封面一样压进来。

3. Silence Before Drop
   - 先留白 / 低能量，再突然释放。

4. Motif Reincarnation
   - 一个视觉母题在不同场景反复转生。

5. Interface Ballet
   - UI / mockup 不只是展示，而是编舞。

6. Data Cathedral
   - 把数据做成空间 / 建筑，而不是图表。

7. Liquid Brand
   - 品牌元素像液体 / 丝带 / 光线贯穿全片。

8. Cold Open
   - 先不给信息，只给强视觉谜面。

9. Kinetic Typography Attack
   - 文字作为运动主体，不只是字幕。

10. Product Reveal Ritual
    - 产品出现像仪式，而不是普通弹出。

11. System Awakening
    - 科技产品从黑屏 / 网格 / 信号中逐步唤醒。

12. Human Imperfection
    - 微小非机械误差带来手感：轻微延迟、手写线、非均匀错位。

这些不是模板，而是导演技法。

### 4.5 Controlled Surprise — 可控惊喜算子

惊艳往往来自一个“偏离”。

但偏离不能乱来，要是有控制的冒险。

首版 surprise operators 建议 10 个：

1. Scale Violation
   - 元素巨大到不合理。
   - 例：珍珠不是首饰，而是一颗月亮。

2. Tempo Break
   - 突然改变节奏。
   - 例：前面慢，突然 0.4 秒连打三张大字。

3. Material Shift
   - 材质意外转换。
   - 例：丝绸文字变成液态金属。

4. Spatial Flip
   - 二维界面突然变成三维空间。

5. Negative Space Shock
   - 画面忽然极空，只留一个小元素。

6. Misdirection
   - 先让观众以为是 A，转场后变成 B。

7. Motif Mutation
   - 母题每次出现都变一点，最后完成意义闭环。

8. Abrupt Stillness
   - 高能后突然完全静止 0.6–1.2 秒。

9. Imperfect Human Touch
   - 加入微小非机械感。

10. Impossible Transition
    - 上一幕元素“物理上不可能”地变成下一幕主体。

约束：

- 每支视频最多 1-2 个 surprise operators。
- 必须服务品牌 / 主题。
- 必须写明 intent。
- 必须能被 HyperFrames / GSAP 实现。
- 不能牺牲可读性和 CTA。

> 惊喜是辣椒，不是主食。

## 5. Output Changes

### 5.1 frame.md 新增 taste block

当前 frame.md 主要描述视觉身份：colors、typography、motion、atmosphere。

v0.11 增加 taste block：

```yaml
taste:
  reference_dna:
    - luxury-object-emergence
    - editorial-punch
  visual_physics:
    gravity: low
    materials: [pearl, silk, shadow, soft gold light]
    motion_law: [slow drift, orbital reveal, sudden light cut]
    transformation_rule:
      - circles become halos
      - halos become portals
      - light streaks become text underlines
    forbidden_motion:
      - generic slide-in
      - random bounce
  energy_arc: slow_burn_to_punch
  motif: pearl_as_moon
  taste_moves:
    - object_worship
    - silence_before_drop
  surprise_operator:
    type: scale_violation
    intent: "Make the pearl feel celestial, not decorative."
```

Purpose:

- 在 Phase 1 就确定“这支片子的世界物理”；
- 给 Phase 2 的 scene beats 提供约束；
- 给 Taste Audit 提供检查依据。

### 5.2 expanded-prompt.md 新增 Kinetic Continuity

每个 scene beat 增加：

```markdown
#### Kinetic Continuity

- Incoming energy: inherits the previous scene's pearl orbit.
- Action relay: orbit line becomes title underline.
- Outgoing transition seed: underline expands into a gold wipe.
- Motif state: pearl → halo → portal.
```

Purpose:

- 防止场景孤岛；
- 强制导演描述场景之间的能量传递；
- 让转场不再只是 crossfade / cut。

### 5.3 Execution Manifest 扩展 motion semantics

当前 Execution Manifest 偏向 weapon binding。

v0.11 增加 motion role / grammar / taste move / surprise 字段：

```yaml
scene_1:
  motion_role: hook_mystery
  grammar: tension_release
  taste_move: cold_open
  surprise: scale_violation
  weapon: bg-blur-mask
  code: weapons/parts/references/bg-blur-mask.js
  params: {...}
  handwrite: false
```

Purpose:

- 武器不只是动画小零件，而是服务导演语法；
- 让后续 audit 能检查 manifest 是否支持 taste intent；
- 不改变 v0.10.x 的 weapon registry 语义，新增字段应向后兼容。

### 5.4 新增 Taste Audit report

Taste Audit 与 Quality Audit 分开。

Quality Audit 问：

- 有没有错？
- 有没有漏？
- 有没有危险？
- 有没有结构风险？

Taste Audit 问：

- 有没有记忆点？
- 场景之间有没有动作接力？
- 动效是不是流水账？
- 有没有至少一个可控惊喜？
- 图形母题是否贯穿？
- mockup / 组件是不是只是摆在那里？
- 转场是不是默认 fade 滥用？
- energy arc 有没有起伏？
- 有没有太平均、太安全、太样板间？

输出不是总分，而是导演批注：

```text
Taste Audit

Strong points:
- Visual physics is coherent: pearl/silk/shadow rules appear in all scenes.
- Motif has a clear transformation path: pearl → halo → CTA ring.

Risks:
- Scene rhythm is too even; every scene uses similar reveal energy.
- Mockup appears as a static card, not a choreographed object.

Suggestions:
- Add one Tempo Break before CTA.
- Convert scene_2 fade transition into Mask → Portal using the pearl halo.
- Use Interface Ballet for the product UI reveal.
```

## 6. MVP Scope

### 6.1 In scope for v0.11 MVP

1. Reference specimen schema.
2. 6-8 built-in reference specimens.
3. Visual Physics schema and prompt integration.
4. Kinetic Grammar list and prompt integration.
5. 12 Director Taste Moves.
6. 10 Controlled Surprise Operators.
7. Director skill update to generate taste block and kinetic continuity.
8. expanded-prompt template update.
9. Execution Manifest backward-compatible extension.
10. Taste Audit as report-first pure Python helper / script.
11. Tests for schema, prompt output, audit detection, and backward compatibility.
12. Docs / README / AGENTS / skill updates.
13. Deploy sync to `F:/Hermes_windows/plugins/framepack/` and active independent skill if touched.

### 6.2 Out of scope for MVP

1. Automatic web crawling of nexu / html-video / html-anything.
2. Screenshot / video CV scoring.
3. Rendering-based aesthetic comparison.
4. Full integration with proof-frame contact sheets.
5. Automatic rewrite of user HTML.
6. New HyperFrames commands.
7. Large external template database.

### 6.3 Future after MVP

1. Ingest nexu-io/html-video 21 templates as reference specimens.
2. Ingest html-anything 10 frame as reference specimens.
3. Link reference-miner output to specimen schema.
4. Taste Audit over proof frames / contact sheets.
5. Director can recommend specimen matches during Phase 1.
6. Interactive Design Picker can expose taste moves / visual physics presets.

## 7. Architecture Sketch

Potential files:

```text
framepack-plugin/
├── core/
│   ├── taste_specimens.py          # built-in Reference Specimen Library
│   ├── taste_grammar.py            # kinetic grammar / moves / surprise operators
│   └── taste_audit.py              # report-first director critique
├── scripts/
│   └── framepack_taste_audit.py    # CLI wrapper
├── skills/
│   └── framepack-director/
│       ├── SKILL.md                # updated Phase 1/2 instructions
│       └── references/
│           ├── kinetic-taste-engine.md
│           ├── reference-specimens.md
│           ├── kinetic-grammar.md
│           ├── taste-moves.md
│           └── surprise-operators.md
└── tests/
    ├── test_taste_specimens.py
    ├── test_taste_audit.py
    └── test_director_taste_prompt_contract.py
```

Potential user-facing command:

```bash
python framepack-plugin/scripts/framepack_taste_audit.py <project> --format markdown
```

Potential hook integration:

- Do not block production commands.
- Optional non-blocking summary when `frame.md` / `expanded-prompt.md` exists.
- Keep separate from `quality_audit.py` to avoid mixing safety with taste.

## 8. Data Contracts

### 8.1 Reference Specimen

```python
ReferenceSpecimen = {
    "id": str,
    "name": str,
    "source": str,
    "best_for": list[str],
    "hook_dna": dict,
    "energy_arc": dict,
    "motifs": list[str],
    "kinetic_grammar": list[str],
    "taste_moves": list[str],
    "surprise_operators": list[str],
    "component_patterns": list[str],
    "transition_patterns": list[str],
    "anti_patterns": list[str],
}
```

### 8.2 Taste Block

```python
TasteBlock = {
    "reference_dna": list[str],
    "visual_physics": {
        "gravity": str,
        "materials": list[str],
        "motion_law": list[str],
        "transformation_rule": list[str],
        "forbidden_motion": list[str],
    },
    "energy_arc": str,
    "motif": str,
    "taste_moves": list[str],
    "surprise_operator": dict | None,
}
```

### 8.3 Kinetic Continuity

```python
KineticContinuity = {
    "incoming_energy": str,
    "action_relay": str,
    "outgoing_transition_seed": str,
    "motif_state": str,
}
```

### 8.4 Taste Audit Issue

```python
TasteAuditIssue = {
    "severity": "note" | "suggestion" | "risk",
    "code": str,
    "message": str,
    "suggestion": str | None,
    "scene": str | None,
}
```

Potential issue codes:

- `missing_visual_physics`
- `missing_kinetic_continuity`
- `flat_energy_arc`
- `generic_fade_stack`
- `static_mockup_risk`
- `motif_not_transformed`
- `no_controlled_surprise`
- `too_many_surprises`
- `surprise_without_intent`
- `taste_move_not_reflected_in_scenes`
- `forbidden_motion_used`

## 9. Testing Strategy

Mandatory development constraints:

- Any Python code change must follow TDD.
- Any debugging must follow systematic-debugging.
- Completion requires verification-before-completion.
- Pre-commit requires requesting-code-review.
- Plugin files must sync to deployed directory.

Tests:

1. Specimen registry tests
   - all built-in specimens have required fields;
   - referenced grammar / moves / surprise IDs exist;
   - no duplicate IDs.

2. Taste grammar tests
   - grammar / moves / surprise operators have stable IDs;
   - docs and registry align.

3. Taste audit tests
   - detects missing `taste` block in frame.md;
   - detects missing Kinetic Continuity in expanded-prompt.md;
   - detects generic fade stack;
   - detects too many surprise operators;
   - detects surprise without intent;
   - detects static mockup language;
   - produces markdown and JSON output.

4. Backward compatibility tests
   - existing v0.10.6 projects without taste block should get non-blocking suggestions, not P0/P1 failure;
   - existing quality audit tests remain unchanged;
   - Execution Manifest parser tolerates new motion semantic fields.

5. Director prompt contract tests
   - generated / template expanded-prompt examples include Visual Physics and Kinetic Continuity;
   - taste block examples are present in skill references;
   - no instruction suggests Framepack writes HTML.

## 10. Risks and Mitigations

### Risk: Taste system becomes fake precision

Mitigation:

- No overall numeric score in MVP.
- Use director critique: strong points, risks, suggestions.
- Prefer qualitative issue codes over rankings.

### Risk: Surprise becomes random chaos

Mitigation:

- 1-2 surprise operators max.
- Require intent.
- Require brand fit.
- Audit too many surprises.

### Risk: Added schema bloats director output

Mitigation:

- Keep taste block compact.
- Use references for detailed catalogs.
- In user-facing summary, show only rhythm + taste moves + surprise.

### Risk: Violates Framepack boundary

Mitigation:

- No HTML writing.
- No render control.
- Execution Manifest extension remains descriptive / handoff oriented.

### Risk: Too much infrastructure before value

Mitigation:

- Start with 6-8 built-in specimens.
- Implement Taste Audit on existing text artifacts.
- Defer external ingestion.

## 11. User Experience

When user says:

> 做个珍珠品牌 30 秒视频，要高级、梦幻、有记忆点。

Framepack should not only say:

- Style: Velvet Standard
- Colors: black / pearl gold
- Motion: calm

It should say something like:

```text
我建议这支片子的视觉物理是：低重力、珍珠/月亮、丝绸阴影、光线切割。
导演招式用 Object Worship + Silence Before Drop。
可控惊喜用 Scale Violation：第一幕让珍珠像月亮一样从黑暗中升起，而不是普通首饰特写。
场景之间用 Motif Reincarnation：珍珠 → 光环 → 门 → CTA 按钮。
```

Then frame.md / expanded-prompt.md encode that direction.

## 12. Open Questions for 老田

1. v0.11 MVP 是否接受“不先完整抓取外部 31 个模板”，而是先做 6-8 个高质量内置 specimen？
2. Taste Audit 首版要不要接入 hook 非阻断 summary，还是先只做 CLI/script？
3. `frame.md` 增加 taste block 是否太重？还是把 taste 放在 expanded-prompt 里更合适？
4. Surprise Operator 是否应该默认必须有 1 个，还是“建议有，不强制”？
5. Director Taste Moves 的中文命名是否要保留英文 ID + 中文解释，方便未来代码稳定？

## 13. Spec Self-review

- No placeholders like TBD remain except intentional open questions.
- Scope is constrained to Framepack creative artifacts and report-first audit.
- Non-goals explicitly prevent HTML/render scope creep.
- Design distinguishes Quality Audit from Taste Audit.
- MVP avoids external ingestion dependency.
- Testing plan includes backward compatibility and non-blocking behavior.
- Plugin deployment rule is acknowledged but implementation not started.

## 14. Proposed Next Step After Approval

If approved, load `plan` skill and write an implementation plan under `.hermes/plans/`.

Do not implement before approval.
