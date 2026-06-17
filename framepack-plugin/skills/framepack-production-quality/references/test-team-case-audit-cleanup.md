# Test-Team Case Audit Cleanup

Use this when the test-team auto script reports `passed=5 failed=0 skipped=0` but the optional `case_quality_audit` JSON contains P1/P2 issues. The entrypoint is healthy, but the specific case still has semantic yellow lights.

## Reproduce the exact report

Run the same command the test group ran, including the same `--case-project` path. Do not substitute a simpler smoke command when checking their claim.

```bash
python scripts/test_team_v0106_auto_test.py \
  --repo F:/hyperframes \
  --deployed-plugin F:/Hermes_windows/plugins/framepack \
  --output-dir test-team-reports/v0.10.6 \
  --case-project <project>
```

Read `test-team-reports/v0.10.6/case-quality-audit.json` and classify each issue by code.

## Common fixes

### manifest_weapon_not_called

Meaning: the scene uses inline GSAP that resembles a registered weapon, but the Execution Manifest declares a canonical weapon contract.

Fix pattern:

1. Read `<project>/.framepack/arsenal.json` to get weapon id and code path.
2. Read `<project>/.hyperframes/expanded-prompt.md` Execution Manifest params.
3. Replace the scene call with the canonical function name from the builtin weapon catalog (`card-cascade-reveal` maps to `cardCascadeReveal`).
4. Pass manifest params in the function call so drift detection can match them.

Example:

```js
cardCascadeReveal(
  tl,
  document.querySelector("#s3-cards"),
  {
    container: "#s3-cards",
    card_count: 3,
    layout: "fan",
    stagger: 0.18,
    rotation_intensity: "subtle",
    depth_3d: true,
    entrance_direction: "center-spread",
  },
  11.32,
);
```

### timeline_manifest_missing

Meaning: the production ledger is absent.

Fix:

```bash
python framepack-plugin/scripts/framepack_timeline_manifest.py <project> --sync --format json
```

Then rerun `framepack_quality_audit.py`.

### low_visibility_risk

Meaning: static heuristics saw a dark palette plus dimming/black-overlay signals. This can be a real readability risk or a conservative warning on deliberate luxury-black art direction.

Review the details:

- `brightness`: look for `brightness(<0.5)`.
- `heavy_black_overlay`: look for `rgba(0,0,0,0.7+)` overlays.
- `dark_palette_low_contrast`: multiple low-luminance hex colors.

Prefer minimal art-preserving changes before broad redesign, e.g. `brightness(0.45)` → `brightness(0.55)` or black overlay alpha `0.72` → `0.64`. Then verify with HyperFrames `validate` and `inspect`.

## Verification gate

After fixing, run all three layers:

```bash
python framepack-plugin/scripts/framepack_quality_audit.py <project> --format json --output test-team-reports/v0.10.6/case-quality-audit.json
python scripts/test_team_v0106_auto_test.py --repo F:/hyperframes --deployed-plugin F:/Hermes_windows/plugins/framepack --output-dir test-team-reports/v0.10.6 --case-project <project>
cd <project> && npx hyperframes lint && npx hyperframes validate && npx hyperframes inspect --samples 10 --json
```

Success language requires evidence:

- auto script: `passed=5 failed=0 skipped=0`
- case audit: `P0=0/P1=0/P2=0/P3=0`, `issues=0`
- HyperFrames lint: `0 error(s)`
- validate: no console errors and text contrast pass
- inspect: `issueCount=0` / `totalIssueCount=0`
