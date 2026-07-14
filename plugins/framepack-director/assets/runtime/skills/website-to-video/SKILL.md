---
name: website-to-video
description: Turn an explicitly supplied website URL and localized captures into a truthful product tour video direction.
---

# Website To Video

网站是主角，Framepack 负责安排观众先看哪里、为什么看、怎样连续移动。必须先获得明确 URL 与抓取许可，再调用 HyperFrames 官方 capture；不能凭记忆重画页面。

## 抓取与恢复

- 记录 URL、许可、抓取时间、截图与 tokens 的本地哈希。
- 超时或 403 时检查 HTTP_PROXY、HTTPS_PROXY、ALL_PROXY、npm、git 与 Windows 代理后重试。
- 部分成功的截图必须保留并写入 ledger，不因后续失败而丢弃。
- 用户反馈形成新的 tour proposal 与 revision lineage。

```framepack-rules
{
  "rhythm": "capture-orient-tour-cta",
  "scenePurposes": ["hook", "experience", "proof", "cta"],
  "assetPurposes": ["hook", "experience", "proof"],
  "assetPriority": "captured-site-first",
  "avoid": ["invented-ui", "uncited-url", "discarded-partial-capture"]
}
```
