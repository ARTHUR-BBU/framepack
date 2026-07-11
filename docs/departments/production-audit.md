# Production Audit Department

> Role: the pass-inspection floor. You promised X on the menu; the plate better have X.
>
> Plain-English job: Production Audit is the quality controller. It does not redesign the dish or rewrite the recipe. It checks whether what was promised in the Director Bible and weapon-load-plan is actually present in the HTML, proof frames, and lint output.

## 1. Department boundary

Production Audit owns **promise-vs-artifact verification**:

- Check whether frame.md, expanded-prompt.md, weapon-load-plan, HTML, and proof frames are mutually consistent.
- Distinguish fixable quality issues from known HyperFrames upstream limits.
- Detect stale props, timeline/proof drift, asset gaps, semantic mismatches.
- Convert findings into reports, not rewrites.

Production Audit does **not** own:

- creative direction — Director Bible owns that
- weapon selection — Weapon Production owns that
- commercial taste judgment — Taste Intelligence owns that
- the final render decision — the user owns that

## 2. Input contracts

| Input | Why it matters |
|---|---|
| `frame.md` | visual identity and control profile |
| `.hyperframes/expanded-prompt.md` | scene beats, time windows, execution manifest |
| `.framepack/weapon-load-plan.json` | promised weapons |
| `index.html` | actual implementation |
| `.framepack/proof-frames/*.png` | visual evidence |
| HyperFrames lint JSON (`--json`) | structural warnings to classify |

## 3. Output contracts

| Artifact | Purpose |
|---|---|
| `QualityAuditReport` | structured issue list with code/severity/path/scene |
| `PreRenderAuditReport` | pre-render findings with verdict (READY/WARN/NEEDS_USER_DECISION) |
| `warning_classifier` cache | HyperFrames warnings split into quality_issue vs upstream_limit |
| `InterventionEvent(department="audit")` | reusable railguard events (Phase 5 bridge) |

## 4. Severity policy

Audit uses P0-P3, now mapped to Intervention severity:

| Audit severity | Intervention severity | Meaning |
|---|---|---|
| P0 | `hard_stop` | structural failure (manifest/HTML mismatch, empty HTML) |
| P1 | `decision_required` | promise not kept (stale props, missing acceptance contract) |
| P2 | `advisory` | quality improvement (missing BGM plan, unclassified assets) |
| P3 | `advisory` | FYI / minor naming |

## 5. Warning classification

Production Audit classifies HyperFrames lint warnings into two buckets:

| Bucket | Meaning | Action |
|---|---|---|
| `quality_issue` | fixable by the Agent | surface as Audit finding |
| `upstream_limit` | HyperFrames architectural constraint | report separately, do not attempt fix |

Known upstream limits:

| Warning code | Description | Status |
|---|---|---|
| `gsap_studio_edit_blocked` | GSAP-registered timeline elements not draggable in Studio | HF 0.7.22+ SDK partially mitigates; do not fix |

**Agent rule**: seeing `upstream_limit` classified warnings, do NOT attempt to fix. Only spend time on `quality_issue`.

## 6. Pre-render audit checklist

Before `hyperframes render` / `preview` / `publish`, Production Audit checks:

| Check | Severity | Code |
|---|---|---|
| expanded-prompt.md exists | P1 | `missing_director_story_bible` |
| asset-intake manifest exists | P2 | `missing_asset_intake` |
| no stale domain props in HTML | P1 | `stale_source_domain_props` |
| hero/proof frame acceptance contract | P1 | `missing_hero_frame_acceptance_contract` |
| asset roles classified | P2 | `asset_roles_missing` |
| motion footage quality evidence | P2 | `motion_footage_quality_unrecorded` |
| BGM/audio plan for brand/product | P2 | `optional_bgm_missing` |

## 7. Anti-conflict rules

### 7.1 Audit does not redesign

Audit may say: "expanded-prompt says product reveal, but HTML has no product visual."

Audit must NOT say: "Replace scene 3 with a device spin." That's Director Bible's job.

### 7.2 Audit does not judge taste

Audit may say: "weapon-load-plan promises card-cascade-reveal but HTML doesn't call it."

Audit must NOT say: "This animation feels cheap." That's Taste Intelligence's job.

### 7.3 Audit reports, Intervention pulls back

After Phase 5, Audit findings flow through `intervention_events_for_pre_render()` and `intervention_events_for_quality_audit()`. Audit no longer injects corrective messages directly.

## 8. Current status

Implemented:

- quality audit with semantic mismatch detection
- pre-render audit with 7 checks
- warning classifier with upstream_limit bucketing
- proof-frame / contact-sheet tooling
- Audit → Intervention events bridge (Phase 5)
- quality_audit + taste_audit severity coordination

Next priority:

1. ensure `on_pre_tool_call.py` pre-render path routes through Intervention bridge instead of direct injection
2. expand pre-render checks: timeline/proof drift quantification
3. structured audit receipt persistence (`.framepack/audit-receipt.json`)
