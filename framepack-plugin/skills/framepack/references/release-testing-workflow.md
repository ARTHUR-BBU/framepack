# Framepack Release Testing Workflow

## When to Use

When testing a new Framepack version release (e.g. v0.10.3 → v0.11.0).

## Part 1: Automated Tests

Run the version-specific test script from the repo:

```bash
python scripts/test_team_v0XYZ_auto_test.py \
  --repo F:/hyperframes \
  --case-project F:/Framepack-01-test \
  --deployed-plugin F:/Hermes_windows/plugins/framepack \
  --output-dir F:/Framepack-01-test/test-team-v0XYZ-report
```

Five checks (all must pass):

1. **source_pytest** — plugin unit tests (198+ tests)
2. **release_version_sync** — version strings consistent across all files
3. **quality_audit_cli** — CLI tool responds to `--help`
4. **deployed_smoke** — deployed plugin imports + version matches expected
5. **case_quality_audit** — audit tool runs on case project (detecting real issues is PASS, not FAIL)

Deliverable files (in output-dir):
- `framepack-v0XYZ-auto-test-report.json`
- `framepack-v0XYZ-auto-test-report.md`
- `case-quality-audit.json`

Judgment: `failed=0` in the summary = auto tests passed.

## Part 2: Case Project Test

Fresh build from a reference video (preferred) or replica of existing case:

1. Framepack creative pipeline: reference DNA → `frame.md` → `.hyperframes/expanded-prompt.md`
2. Write `index.html` using weapons per Execution Manifest
3. Run HyperFrames four-step pipeline:
   ```bash
   npx hyperframes lint      # 0 errors required
   npx hyperframes validate  # 0 errors required (contrast warnings OK)
   npx hyperframes snapshot --at 2,8,18,30,41,52  # snapshot points
   npx hyperframes render    # exit_code=0 required
   ```
4. Run quality audit on the case:
   ```bash
   python F:/hyperframes/framepack-plugin/scripts/framepack_quality_audit.py \
     <case-project> --format markdown \
     --output <case-project>/framepack-quality-audit.md
   ```

## Report Template

```
Framepack version: X.Y.Z
Repo commit: <hash>
Auto-test summary: passed=?, failed=?, skipped=?
Case project: <path>
Quality Audit summary: P0=?, P1=?, P2=?, P3=?, total=?
HyperFrames lint result:
Snapshot result:
Render result:
Manual findings:
```

## Known Quality Audit Patterns

Patterns that appear in case projects. These are NOT tool-chain bugs — they
indicate case-level or product-level gaps.

| Pattern | Severity | Meaning | Is it a tool bug? |
|---------|----------|---------|-------------------|
| arsenal_missing | P0 | `.framepack/arsenal.json` not created for new project | Product gap — no auto-init mechanism |
| manifest_weapon_not_called | P1 | Weapon pattern implemented inline as GSAP, function never called by name | Product gap — no auto-binding from manifest to function calls |
| weapon_parameter_drift | P1 | Agent writes params from memory, values drift from Manifest | Agent behavior — mitigated by reading weapon SKILL.md carefully |
| manual_data_hf_id | P1 | Snapshot injected data-hf-id attributes | Workflow — clean up after snapshot, before render |
| arsenal_project_mismatch | P0 | arsenal.json from a prior project copied over | Hygiene — delete stale arsenal.json on project switch |

## Version-to-Version Comparison

Track issue counts between versions to measure improvement:

| Version | Case | P0 | P1 | P2 | P3 | Total | Key change |
|---------|------|----|----|----|----|----|----|
| v0.10.2 (residue) | Digital Soliloquy | 15 | 13 | 0 | 0 | 28 | Baseline (stale arsenal.json + data-hf-id + param drift) |
| v0.10.3 (fresh) | whop "Get a Bag" | 1 | 9 | 0 | 0 | 10 | Fresh case eliminated stale-residue P0s, data-hf-id, param drift |

## Tester Role Boundary

The tester discovers and reports issues. Do NOT fix them — that's the
development team's job. Report findings in the test report under
"Manual findings" with clear severity and root-cause analysis.
