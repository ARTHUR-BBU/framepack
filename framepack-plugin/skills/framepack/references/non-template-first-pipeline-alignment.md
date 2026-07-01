# Non-template-first Pipeline Alignment

Use this reference when Framepack work happens after template-heavy sessions or when upstream HyperFrames prompt/pipeline guidance is being folded into Framepack.

## Core lesson

Do not let template work become the hidden default model for Framepack.

Templates are a **套餐** path: pick a known structure, fill required parameters, replace assets, validate the contract.

Non-template work is the **私厨点菜** path: the user brings a fuzzy idea, URL, PDF, CSV, transcript, brand material, or reference video; Framepack must diagnose the input, collect real context, shape a story, then hand off to HyperFrames.

Both are first-class. The non-template path is often where Framepack delivers the most director value.

## Two first-class entry points

| Entry | Typical input | Framepack responsibility |
|---|---|---|
| Non-template | Fuzzy idea, URL, PDF, CSV, transcript, deck, repo, brand assets, reference video | Route intent, gather assets/context, choose creative direction, build frame.md + expanded-prompt.md, decide whether 4K/HDR/HTML-in-Canvas/Arc Motion is appropriate |
| Template | Existing template, template-selection.md, required params | Install/select template, collect required params, map new assets/copy into slots, verify template contract, then rejoin the same official pipeline |

## Official HyperFrames pipeline mapping

When building progress or readiness UX, use the official artifact pipeline as the backbone, not the template-specific sequence.

| User-facing state | Official artifact | Non-template evidence | Template evidence |
|---|---|---|---|
| 素材准备 | Capture | `.framepack/asset-intake.md`, capture artifacts, provided URL/docs/media | template installed + selected, plus replacement assets |
| 视觉身份 | Design | `frame.md` / design sheet | template design base + overrides |
| 文案脚本 | Script | narration/script/CTA decisions | template copy params |
| 分镜导演稿 | Storyboard | `.hyperframes/expanded-prompt.md` | template slots + adapted expanded-prompt |
| 配音/节奏 | VO + Timing | BGM/TTS/transcript/timing cues | template audio/timing overrides |
| 制作中 | Build | `index.html`, compositions | materialized template HTML |
| 验片交付 | Validate | lint/validate/snapshot/render evidence | same |

## Prompt completeness cards

Non-template projects should get a **creation completeness card**, not a template params card:

- duration
- aspect ratio
- mood/style
- key elements/assets
- audio/BGM/TTS/captions
- CTA / final message
- available warm-start context: URL, doc, CSV, transcript, repo, reference video

Template projects should get a **template params card**:

- template id
- required params from template definition
- required assets for slots
- optional overrides

## Capability guidance for HyperFrames 0.7.21+

Enable advanced output/effect capabilities by director purpose, not by default:

- **4K** — recommend for big-screen, website hero, premium brand output, or vector/DOM-heavy videos. Do not imply it improves low-resolution bitmap/video sources.
- **HDR** — recommend only with real HDR sources or explicit HDR delivery need. HDR is a delivery pipeline, not a generic “quality boost”.
- **HTML-in-Canvas** — use for 1–3 hero beats where live UI/dashboard/web/app content needs 3D/shader/cinematic treatment. Do not blanket every scene with it.
- **Keyframes & Arc Motion** — treat as Studio/director refinement for physical motion (throw, attach, orbit, logo aggregation), not a substitute for a clean storyboard and HTML structure.

## Pitfalls and code smells

After a template-focused debugging session, agents tend to describe Framepack as if every project begins with `template-selection.md`. That is wrong. Template-selection is evidence for one route; it is not the pipeline skeleton.

Watch for these concrete implementation smells:

1. **Empty project starts at a template stage.** If `detect_pipeline_stage()` maps an empty project to `TEMPLATE_SELECTED` or the progress UI says “已选模板” before a template exists, the progress spine is template-biased.
2. **Template-specific enum names define the global pipeline.** Stages like `TEMPLATE_SELECTED → PARAMS_FILLED → FRAME_MD` are useful for a template branch but wrong as the class-level Framepack pipeline. Prefer official pipeline semantics: Capture/Design/Script/Storyboard/VO+Timing/Build/Validate, surfaced in Chinese.
3. **`asset-intake.md` injects advice but does not update progress.** Non-template warm-start begins when real materials/context enter `.framepack/asset-intake.md`; Pipeline Visibility must see that artifact and write `.framepack/progress.md`.
4. **Template params card becomes the only completeness card.** Keep template params cards, but add/maintain a non-template creation completeness card covering duration, aspect ratio, style, key elements, audio, CTA, and warm-start context.

When correcting this class of bug, TDD should cover: empty project not showing “已选模板”; `.framepack/asset-intake.md` mapping to “素材准备”; `frame.md` mapping to “视觉身份”; `.hyperframes/expanded-prompt.md` mapping to “分镜导演稿”; template selection appearing as evidence, not as the global first stage.
