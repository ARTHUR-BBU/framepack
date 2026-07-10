# HyperFrames 0.7.3 → 0.7.33 Compatibility Assessment

**Date**: 2026-07-04
**Assessor**: Framepack v0.19.0 against HyperFrames v0.7.33
**Scope**: 30 versions of upstream changes, classified into 3 tiers.

---

## Tier 1: 必须适配（不改会出问题）

### 1.1 Compat matrix 命令清单清理
- **Status**: `layout` 和 `play` 在我们 compat 表里但 0.7.33 `--help` 没列出
- **Action**: 移除 `layout`、`play`（可能是旧版残留或别名），确认是否有 alias
- **Risk**: 低 — 可能只是 help 未列出但命令仍可用

### 1.2 data-duration 铁律精化
- **HF v0.7.23**: CSS/WAAPI/Lottie composition 的 `data-duration` 现在可选（自动推断）
- **Framepack 铁律**: "root composition 必须显式写 data-duration"
- **Action**: 铁律不放松（GSAP timeline 仍需显式），但补注"纯 CSS/WAAPI/Lottie 可选"
- **Risk**: 不改也不出错，只是铁律比上游更严格

### 1.3 Lint 规则变化映射
- v0.7.22: `font_family_without_font_face` 不再对 `system-ui` 和 `var()` 报错
- v0.7.22: lint 识别 Three.js ESM URL 导入
- v0.7.27: scene-exit hard-kill 不再与 `gsap_animates_clip_element` 矛盾
- v0.7.23: lint 识别 computed-key `window.__timelines` 注册
- v0.7.21: 新 lint error — `crossorigin` on media breaks preview
- **Action**: 更新 quality_audit 的 warning_classifier 映射表
- **Risk**: 低 — 新 lint 规则是增量，不破坏现有映射

---

## Tier 2: 合作加分（做了更好，不做也能跑）

### 2.1 Keyframes 命令集成
- **HF v0.7.25**: `hyperframes keyframes` 检查 GSAP/CSS/Anime.js 关键帧 + 3D onion-skin
- **Framepack 机会**: pre-render audit 里建议 Agent 跑 `keyframes` 做视觉验证
- **Action**: 在 `_is_pre_render_review_command` 和 `_audit_pre_render_for_hyperframes` 里注入 keyframes 建议

### 2.2 Capture 新类别纳入 weapon_sources
- **HF v0.7.23+0.7.27**: capture 新增提取 gradient washes、glass panels、nav CTAs、chips/stat-cells/tabs
- **Framepack 机会**: weapon_sources.py 的 HyperFrames official source keywords 扩展
- **Action**: 补充 capture 新类别的关键词到 `list_hyperframes_official_sources()`

### 2.3 Figma Motion→GSAP 作为 weapon source
- **HF v0.7.29**: Figma Motion timelines 可转成 seekable GSAP
- **Framepack 机会**: 作为 specialist_skill weapon source
- **Action**: weapon_sources.py 新增 figma-motion-to-gsap source

### 2.4 `--public` publish flag + feedback command
- **HF v0.7.22**: publish 支持 `--public` flag
- **HF v0.7.21**: skills 指导 Agent render 后跑 `hyperframes feedback`
- **Action**: SKILL.md handoff 文档补充

---

## Tier 3: 化学反应（深度整合，产生 1+1>2）

### 3.1 SDK resolveEditingAffordances 整合
- **HF v0.7.22**: `@hyperframes/sdk` 的 `resolveEditingAffordances` API
- **Framepack 机会**: 这解决了 `gsap_studio_edit_blocked` upstream_limit 的根源！
  - 当前 Framepack 把"GSAP 管的元素 Studio 里不能拖拽编辑"列为 upstream_limit
  - SDK 现在告诉外部编辑器哪些元素可编辑
  - Framepack 可以在 weapon-load-plan 里标注 `studio_editable: false` 并在 quality audit 里建议用 SDK adapter
- **Action**: 
  1. weapon-load-plan schema 加 `studio_editable` 字段
  2. quality_audit 的 upstream_limit 表更新 `gsap_studio_edit_blocked` 状态
  3. SKILL.md 补充 SDK 整合指南

### 3.2 Figma 资产统一管线
- **HF v0.7.29+0.7.31**: `hyperframes figma` CLI + media-use interop
- **Framepack 机会**: weapon matching pass 检测到 Figma 导入资产时，自动推荐 figma-motion-to-gsap 武器
- **Action**: weapon_sources 新增 figma asset detection

### 3.3 渲染可靠性遥测对接
- **HF v0.7.26**: render_preflight_rejected + render-reliability telemetry
- **Framepack 机会**: pre-render audit 读取这些遥测做"渲染成功率"预测
- **Action**: 后续版本 — 需要更多遥测数据样本

---

## Implementation Priority

| 优先级 | 项目 | 工作量 |
|---|---|---|
| P0 | 1.1 compat 命令清单清理 | 10 min |
| P0 | 1.3 lint 规则映射更新 | 30 min |
| P1 | 2.1 keyframes 集成 | 30 min |
| P1 | 3.1 SDK upstream_limit 更新 | 20 min |
| P1 | 1.2 data-duration 铁律精化 | 15 min |
| P2 | 2.2 capture 关键词扩展 | 15 min |
| P2 | 2.3 figma-motion weapon source | 20 min |
| P2 | 2.4 publish/feedback 文档 | 10 min |
| P3 | 3.2 figma 资产统一管线 | 后续版本 |
| P3 | 3.3 渲染遥测对接 | 后续版本 |
