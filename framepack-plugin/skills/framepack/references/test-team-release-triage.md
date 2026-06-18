# Test-team release triage for Framepack

Use when a test-team report comes back after release-prep and before tagging a Framepack version.

## Core pattern

Do not treat every reported P0/P1 as an automatic tag blocker. First classify each finding against the current branch state:

1. Read the report from the vault or provided path.
2. Identify the exact baseline commit used by the tester.
3. Compare against current HEAD and deployed plugin state.
4. Re-run the relevant test-team command on current HEAD with the same case project.
5. Classify findings:
   - **Already fixed / stale baseline**: report is valid historically, but current HEAD no longer reproduces it.
   - **Release blocker**: current HEAD still fails an advertised vX.Y.Z contract or breaks the tested happy path.
   - **Hardening backlog**: real limitation, but outside this release's blocking contract.

## Commands / evidence to collect

Typical current-head re-verification:

```bash
python scripts/test_team_v0105_auto_test.py \
  --repo F:/hyperframes \
  --deployed-plugin F:/Hermes_windows/plugins/framepack \
  --output-dir test-team-reports/vX.Y.Z-postreport \
  --case-project F:/Framepack-01-test
```

Evidence to quote before saying "release candidate":

- auto-test summary: `passed`, `failed`, `skipped`
- `case_quality_audit` P0/P1/P2/P3 counts
- source full suite count
- deployed smoke/import/version check
- real render evidence if present: duration, resolution, frame count

## v0.10.5 example classification

A report based on `fdf6102` found:

- P0 `arsenal_missing`
- missing project-level `AGENTS.md` / `.framepack` ledger during handoff
- A/B/C test doc expectation drift

Current HEAD later included shell-`cd` hydration fix (`be318b5`) and handoff updates. Re-running on current HEAD with the case project produced:

- `passed=5, failed=0, skipped=0`
- `case_quality_audit`: `P0=0/P1=0/P2=0/P3=0`

So those P0s were not tag blockers anymore. They were valid test findings against the earlier baseline, but current HEAD had closed the release-blocking path.

Hardening items that should not automatically block v0.10.5 but should enter v0.10.6/v0.11 backlog:

- Manifest → HTML weapon binding enforcement / audit
- Google Fonts domestic-network fallback guidance and local font strategy
- dark-background visibility audit
- visual black-screen / font-network / weapon-parameter-drift semantic detection
- clearer structured timeline-manifest expression in prompt artifacts

## Reporting style for Lao Tian

Use the car-inspection metaphor when useful:

- engine runs / brakes work / lights work / road test passed = release candidate
- interior rattle / navigation tunnel bug = next hardening wave

Be explicit about the difference between:

- source version
- tested baseline commit
- current HEAD
- deployed plugin copy
- public GitHub Release/tag state
