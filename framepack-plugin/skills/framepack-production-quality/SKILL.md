---
name: framepack-production-quality
description: Operate Framepack v0.14.1 Production Quality Layer: timeline manifest, scene specs, proof frames, contact sheets, and report-first audit workflow.
version: 0.14.1
---

# Framepack Production Quality Layer

Use this when a HyperFrames/Framepack project is moving from creative plan to production QA: timings, scene locks, proof frames, carryover continuity, or surgical change requests.

Framepack does not patch HTML, render video, or replace HyperFrames compiler checks. It keeps the production ledger and reports issues before the studio burns another render hour.

## Workflow

1. Create or sync the timeline ledger.

```bash
python framepack-plugin/scripts/framepack_timeline_manifest.py <project> --sync --format markdown
```

2. For each important scene, use `templates/scene-spec.md` as the construction sheet:
   - exact time window
   - beat timeline
   - continuity/carryover contract
   - proof-frame list
   - surgical change log

3. After HyperFrames render, probe media metadata.

```bash
python framepack-plugin/scripts/framepack_probe_media.py <project>/renders/final.mp4 --json
```

4. Extract required proof frames from `.framepack/timeline-manifest.json`.

```bash
python framepack-plugin/scripts/framepack_extract_proof_frames.py \
  <project>/renders/final.mp4 \
  --manifest <project>/.framepack/timeline-manifest.json \
  --output-dir <project>/.framepack/proofs
```

5. Build a proof contact sheet.

```bash
python framepack-plugin/scripts/framepack_make_contact_sheet.py \
  <project>/.framepack/proofs/proof-*.png \
  --output <project>/.framepack/proofs/contact-sheet.jpg
```

6. Run the semantic quality gate.

```bash
python framepack-plugin/scripts/framepack_quality_audit.py <project> \
  --sync-arsenal \
  --sync-timeline \
  --format markdown \
  --output <project>/.framepack/quality-audit.md \
  --fail-on P1
```

## Severity Expectations

- P0: invalid ledger/registry; stop immediately.
- P1: production contract broken: duration mismatch, overlap, missing boundary proof, weapon drift.
- P2: missing ordinary proof frame; fix before external review.
- P3: convenience/reporting gap such as missing contact sheet.

## Surgical Changes

When a scene is locked, do not rewrite the whole video. Add a `change_requests[]` entry to `.framepack/timeline-manifest.json` and keep the changed scope explicit.

Good request:

```json
{
  "id": "CR-002",
  "status": "open",
  "locked_scope": ["scene_03"],
  "request": "Replace CTA copy only; preserve timing, weapons, and proof points.",
  "allowed_files": ["index.html"]
}
```

Bad request:

```text
Make the whole thing punchier.
```

That is a new creative brief, not a surgical edit.

## Pitfalls

- Do not treat timeline manifest as the renderer. HyperFrames still owns compile/lint/render.
- Do not use `--sync-*` flags silently in read-only audits unless the caller asked for mutation.
- Proof frame names are matched by label + timestamp. Keep labels stable.
- Boundary proof is stricter than normal proof: it protects scene continuity, so missing boundary proof is P1.
