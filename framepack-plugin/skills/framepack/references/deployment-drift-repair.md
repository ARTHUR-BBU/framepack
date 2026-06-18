# Deployment Drift Repair — Source vs Deployment Sync

When the deployment directory (`F:/Hermes_windows/plugins/framepack/`) falls behind
the source (`F:/hyperframes/framepack-plugin/`) after a version bump, source tests
pass but deployment tests fail. This file is the systematic diagnosis + repair recipe.

## Diagnosis: Find Drifted Files

Compare file lists and sizes between source and deployment. Categories:

1. **Source-only files** — exist in source but missing from deployment (rare; usually
   means the file was added after the last full deploy).
2. **Deployment-only files** — exist in deployment but not source (usually a renamed
   file, e.g. `test_team_v0106_auto_test.py` → `test_team_v0110_auto_test.py`; the old
   name lingers).
3. **Size-different files** — same path, different content. These are the silent killers:
   version strings, test patches, support-window updates that didn't get copied over.

Run this comparison (in execute_code or a Python script):

```python
import os
from pathlib import Path

SRC = Path("F:/hyperframes/framepack-plugin")
DST = Path("F:/Hermes_windows/plugins/framepack")
SKIP = {".e2e-sandbox", "__pycache__", ".pytest_cache", ".git", "node_modules"}

def collect(root):
    files = {}
    for dp, dns, fns in os.walk(root):
        dns[:] = [d for d in dns if d not in SKIP]
        for fn in fns:
            rel = (Path(dp) / fn).relative_to(root).as_posix()
            files[rel] = (Path(dp) / fn).stat().st_size
    return files

s, d = collect(SRC), collect(DST)
print("source-only:", sorted(set(s) - set(d)))
print("deploy-only:", sorted(set(d) - set(s)))
print("size-diff:", [(f, s[f], d[f]) for f in sorted(set(s) & set(d)) if s[f] != d[f]])
```

## Repair Steps

1. **Overwrite all size-different files** from source to deployment:
   ```bash
   cp F:/hyperframes/framepack-plugin/tests/<file> F:/Hermes_windows/plugins/framepack/tests/<file>
   ```
2. **Copy any source-only files** to the matching deployment path.
3. **Handle script path resolution**: tests that reference helper scripts via
   `Path(__file__).resolve().parents[2] / "scripts" / "<name>.py"` need the script
   mirrored in the deployment tree:
   - Source: `F:/hyperframes/scripts/test_team_v0XYZ_auto_test.py`
   - Deploy: `F:/Hermes_windows/plugins/scripts/test_team_v0XYZ_auto_test.py`
   - Create `plugins/scripts/` if it doesn't exist, then copy.
4. **Delete stale deployment-only files** (old renamed scripts).
5. **Verify**: run both test suites:
   ```bash
   cd F:/hyperframes/framepack-plugin && python -m pytest tests/ -q -o "addopts="
   cd F:/Hermes_windows/plugins/framepack && python -m pytest tests/ -q -o "addopts="
   ```
   Both must show the same count (e.g. 296 passed).

## Common Drift Patterns by File

| File | What drifts | Fix |
|------|-------------|-----|
| `test_deploy_manifest.py` | Version strings (0.10.6 vs 0.11.0) + test function names (`test_0106_` vs `test_0110_`) | Overwrite from source; ensure `if not path.exists(): continue` in the release_files loop (deployment env has no REPO_ROOT README.md) |
| `test_environment_doctor.py` | FakeRunner signature (cwd param added in v0.11.0), support-window versions (0.6.97 → 0.6.104), test assertions for npx fallback | Overwrite from source |
| `test_test_team_auto_script.py` | Script filename reference (`v0106` → `v0110`) | Overwrite from source + mirror script to `plugins/scripts/` |
| `test_hyperframes_support.py` | Support-window assertions | Overwrite from source |
| `test_taste_audit.py` | Audit logic changes between versions | Overwrite from source |

## Prevention

After every version bump or significant code change, run the full diagnosis comparison
above BEFORE declaring the release done. The deployment directory is a manual copy —
nothing automates the sync. If source is 296 green but deployment is <296, you have drift.
