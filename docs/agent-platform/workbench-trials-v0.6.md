# Framepack 0.6 Workbench Internal Trial Matrix

> ID: WORKBENCH-TRIALS-V0.6-01
> Version under test: 0.6.0-alpha.3
> Scope: product-grade internal testing before 0.6.0-beta.1

## Purpose

This document defines the three customer-style trials required before Framepack 0.6 can be treated as beta-ready. The trials prove that Framepack is not just a CLI that writes files; it is an agentic workflow harness for programmatic video work.

Plain-language summary: each trial starts from a normal fuzzy user request, then checks whether Framepack can turn it into a readable plan, a strong creative direction, a buildable HyperFrames workbench, and an auditable feedback loop.

## Shared Pass Criteria

Every trial must produce and inspect:

- `FRAMEPACK.md`
- `HUMAN.md`
- `ASSETS.md`
- `ASSET_GAPS.md`
- `STYLE.md`
- `DESIGN.md`
- `DESIGN_TOKENS.md`
- `DIRECTION.md`
- `COMPOSITION.md`
- `ITERATIONS.md`
- `index.html`
- `meta.json`
- `.framepack/preferences.json`
- `.framepack/interventions.jsonl` when a gate blocks or force is used
- `.framepack/friction.jsonl` when failures or bypass signals occur

Every trial must run:

```bash
npx framepack workbench brief --project-dir <project>
npx framepack workbench preferences --project-dir <project>
npx framepack workbench audit --phase all --project-dir <project> --json
npx framepack templates recommend --project-dir <project> --idea "<idea>" --style "<style>" --format 9:16 --json
npx framepack catalog recommend --project-dir <project> --template <template> --idea "<idea>" --style "<style>" --format 9:16 --json
npx framepack build --project-dir <project>
npx framepack preview --project-dir <project> --json
npx framepack workbench friction --project-dir <project> --json
npx framepack workbench learnings --project-dir <project> --json
```

## Trial A: SaaS Launch

User request:

```text
We need a premium 30 second vertical launch video for an AI workflow SaaS. It should feel business-grade, fast, confident, with large readable text and product screenshots.
```

Expected Framepack route:

- workflow template: `saas-launch`
- design references: Stripe, Linear, Vercel, OpenAI, or similar premium SaaS systems
- Catalog / scene candidates: product reveal, caption emphasis, CTA, UI screenshot movement
- field-force preferences: premium polish, business clarity, fast kinetic pacing, large focal text

Acceptance:

- `HUMAN.md` explains the idea in user language.
- `DIRECTION.md` translates "premium, business-grade, fast" into concrete visual and motion language.
- `COMPOSITION.md` includes scene rhythm, product screenshot roles, text hierarchy, Catalog candidates, and acceptance criteria.
- `index.html` and `meta.json` exist after build.
- `preview --json` returns `interventionContext`.

## Trial B: Course Promo

User request:

```text
I want a short course promo for founders. It should feel energetic and trustworthy, like a founder is directly inviting people, with high information density but no clutter.
```

Expected Framepack route:

- workflow template: `course-promo`
- prompt-template candidates: TikTok karaoke/talking-head, social overlay stack, founder story beats
- design references: Notion, Stripe, Linear, Apple, or creator-economy editorial systems
- field-force preferences: social clarity, trust, high density, big captions

Acceptance:

- `ASSET_GAPS.md` distinguishes optional talking-head footage from blocking course/brand assets.
- `DIRECTION.md` proposes a clear story arc: pain, promise, proof, invitation.
- `COMPOSITION.md` includes caption strategy, proof moments, CTA timing, and user confirmation point.
- `workbench preferences` reflects "energetic", "trustworthy", and "high density".

## Trial C: Data / News Explainer

User request:

```text
I have industry data and want a punchy explainer video. The first three seconds should hook the viewer, numbers should move, and the ending should make a strong point.
```

Expected Framepack route:

- workflow template: `data-shock` or `news-explainer`
- scene candidates: impact opening, counter cards, progress bars, radial chart, editorial emphasis
- capability recommendations: D3/Chart.js where appropriate, HyperFrames Catalog components, kinetic captions
- field-force preferences: impact, clarity, fast rhythm, strong thesis

Acceptance:

- `DIRECTION.md` defines the hook, thesis, data hierarchy, and emotional rhythm.
- `COMPOSITION.md` maps every data point to a visual role and timing beat.
- Audit catches missing or vague data as an asset/content gap.
- `friction/learnings` can explain whether the project is blocked by missing data, weak composition, or runtime issues.

## Beta Readiness Decision

Framepack 0.6 can enter beta only when all three trials satisfy:

- no unresolved P0 blockers
- no unresolved P1 `recurringRisks`
- `sandbox:benchmark` remains 100/100
- generated workbench files are readable by a non-technical user
- HyperFrames runtime files exist and follow the build contract
- feedback can be captured in `ITERATIONS.md`, `.framepack/friction.jsonl`, and `workbench learnings`

## Trial Report Template

```text
Trial:
Date:
Version:
Agent:
Score:
P0/P1:
Template route:
Catalog route:
Human readability:
Build/preview result:
Friction/learnings:
Decision:
Plain-language summary:
```
