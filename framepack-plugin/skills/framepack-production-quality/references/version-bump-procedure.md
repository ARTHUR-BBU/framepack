# Framepack Version-Bump Procedure

Repeatable checklist for synchronizing ALL version surfaces when bumping
the Framepack plugin version (e.g. 0.10.6 → 0.11.0).

The test gatekeeper is `tests/test_deploy_manifest.py` — if any surface
is stale, this test fails with a clear message showing which file and
which needle is missing.

## Two-phase approach

### Phase A — Mechanical replacement

Blind find-replace of `0.10.6` → `0.11.0` (and `v0.10.6` → `v0.11.0`)
in files where the version string is a simple identifier:

```
AGENTS.md
framepack-plugin/__init__.py
framepack-plugin/hooks/on_pre_tool_call.py
framepack-plugin/hooks/on_post_tool_call.py
framepack-plugin/scripts/apply_skill_overlays.py
framepack-plugin/compat/hyperframes-support.json
framepack-plugin/core/arsenal_registry.py          (DEFAULT_PLUGIN_VERSION)
framepack-plugin/core/timeline_manifest.py          (DEFAULT_PLUGIN_VERSION)
framepack-plugin/templates/timeline-manifest.example.json
framepack-plugin/skills/*/SKILL.md                  (all 7 skill frontmatter version fields)
```

### Phase B — Semantic updates

These files need content changes, not just string replacement:

- `plugin.yaml` — bump `version:` + add a new `vX.Y.Z adds:` description line
- `skills/framepack/SKILL.md` — update title, description, add a new feature section
- `CHANGELOG.md` — new release entry at top with feature summary + test count
- `README.md` — update version mention + description paragraph
- `docs/README.zh-CN.md` — update version mention

### Phase C — File renames

Version-specific files that carry the version in their filename:

```
git mv scripts/test_team_v0106_auto_test.py scripts/test_team_v0110_auto_test.py
git mv TEST_TEAM_AUTOTEST_v0.10.6.md TEST_TEAM_AUTOTEST_v0.11.0.md
```

Then update the internals of both renamed files (FRAMEPACK_VERSION constant,
report JSON filenames, output-dir defaults, doc content).

### Phase D — Test assertions

Update `tests/test_deploy_manifest.py` and `tests/test_test_team_auto_script.py`:

- Function names (e.g. `test_0106_release_...` → `test_0110_release_...`)
- All `0.10.6` string assertions → `0.11.0`
- All `v0106` identifiers → `v0110`
- Script paths referencing the renamed files

### Phase E — Deployment sync

After all source changes pass tests:

1. Sync changed files from `framepack-plugin/` to `F:/Hermes_windows/plugins/framepack/`
2. Sync the main `framepack/SKILL.md` to `F:/Hermes_windows/skills/software-development/framepack/`
3. **Also sync other independent skill copies** (e.g. `framepack-production-quality`) —
   the deploy test only checks the main `framepack` skill, so satellite skills can drift silently
4. Delete old-named deployed scripts (e.g. `test_team_v0106_auto_test.py` in deploy dir)

## Pitfalls

- **Satellite skill drift**: `test_deploy_manifest.py` only checks the main `framepack` skill
  version against the plugin. Other independent skills (`framepack-production-quality`, etc.)
  are NOT covered by that test and can drift to stale versions across releases.
- **CHANGELOG history**: old version entries in CHANGELOG.md are historical records — do NOT
  mechanically replace version strings in past entries. Only add the new entry at top.
- **package-lock.json false positives**: `grep 0.10.6` will match unrelated version strings
  in package-lock.json (e.g. `ecdsa-sig-formatter 1.0.11`). Filter these out when verifying
  no stragglers remain.
- **Run the full test suite after ALL phases**, not just after Phase D. The test_deploy_manifest
  test catches cross-file drift that mechanical replacement can miss.
