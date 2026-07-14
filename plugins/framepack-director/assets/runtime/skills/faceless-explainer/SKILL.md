---
name: faceless-explainer
description: Turn supplied facts or text into a visual explanation without inventing footage, speakers, quotes, or unsupported claims.
---

# Faceless Explainer

把复杂内容讲成观众能跟上的视觉推理，而不是把段落贴到卡片上。先提出问题，再建立上下文，用可核对证据推进，最后收束为一句可复述的结论。

## 素材纪律

- 原文、数据、图表和用户确认的事实才是证据。
- 没有真人素材时不伪造人物或采访。
- 抽象概念用空间关系、尺度、路径和对比表达。
- 用户反馈必须形成新版本并记录 revisionOf / revisionReason。

```framepack-rules
{
  "rhythm": "question-context-proof-synthesis",
  "scenePurposes": ["hook", "experience", "proof", "cta"],
  "assetPurposes": ["experience", "proof"],
  "assetPriority": "evidence-first",
  "avoid": ["paragraph-cards", "invented-footage", "unsupported-claims"]
}
```
