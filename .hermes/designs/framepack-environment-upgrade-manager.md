# Framepack Environment & Upgrade Manager

## Why this exists

Framepack is installed and operated inside Hermes by an Agent, not by a human manually copying files.
That changes the product contract.

The Agent is not just a chat assistant. In this lifecycle it acts as:

1. installer — checks whether HyperFrames and its skills exist;
2. operator — runs Framepack/HyperFrames workflows;
3. maintainer — records local hardening learned from failures;
4. upgrader — updates Framepack/HyperFrames without destroying local experience.

This document defines how development/test hardening becomes part of the shipped product, how it is applied to a user's local HyperFrames skills, and how future updates decide between replace, merge, or preserve.

## Core vocabulary

### Official upstream skill

The skill distributed by HyperFrames itself, usually extracted from the HyperFrames npm package, for example:

- `dist/skills/hyperframes/SKILL.md`
- `dist/skills/hyperframes-cli/SKILL.md`
- `dist/skills/gsap/SKILL.md`

This is the vendor manual.

### Framepack-shipped baseline hardening

Hardening learned by Framepack developers/testers before release and bundled with Framepack.

Examples:

- root composition must explicitly set `data-duration`;
- clip roots must not be animated with opacity/filter/transform;
- `data-hf-id` pollution after snapshot must be cleaned;
- Windows preview orphan port cleanup;
- registry failure should detect proxy/VPN and retry;
- official registry/examples are opportunistic; `blank` is the offline-safe baseline.

This is not the user's private local experience. It is product knowledge.
It should ship with Framepack.

### User-local hardening

Experience learned after a user installs Framepack locally.

Examples:

- this user's network needs `HTTPS_PROXY=http://127.0.0.1:59527`;
- this project uses a specific BGM folder convention;
- this user's HyperFrames version has a renderer-specific quirk;
- a project-specific weapon path or asset source.

This may go to memory, user-created skills, `.framepack/*`, or project notes depending on scope.
It should not be silently overwritten by product updates.

### Local installed skill

A skill installed into the user's Hermes home, for example:

- `$HERMES_HOME/skills/software-development/hyperframes/SKILL.md`
- `$HERMES_HOME/skills/software-development/hyperframes-cli/SKILL.md`
- `$HERMES_HOME/skills/software-development/gsap/SKILL.md`

At install time it may equal the official upstream skill.
After Framepack applies shipped hardening, it becomes a local patched skill.
After the user accumulates additional local experience, it becomes local patched + user-local.

## Answer to the lifecycle question

### Do development/test-team patched skills enter the released Framepack product?

Yes — but not as accidental local files.

Development/test experience must be promoted deliberately into one of these Framepack-shipped artifacts:

1. Framepack guardrails (`guardrails.md`, AGENTS managed block)
2. Framepack skills (`framepack/SKILL.md`, director/arsenal/reference-miner skills)
3. HyperFrames skill overlay patches shipped by Framepack
4. Compatibility/doctor code (`core/hyperframes_adapter.py`, future `core/environment_doctor.py`, future `core/skill_upgrade_manager.py`)
5. Upgrade metadata describing where each hardening rule came from and how it should merge

The release package should carry product-level hardening as structured overlays, not as mysterious edits to a developer's local `$HERMES_HOME/skills`.

### How does shipped hardening enter the user's HyperFrames skill after installation?

Installation should follow this chain:

```text
User installs Framepack
  ↓
Framepack first-run doctor checks HyperFrames CLI + official skills
  ↓
If HyperFrames skills are absent:
    extract/install official upstream HyperFrames skills
  ↓
Apply Framepack-shipped hardening overlays
  ↓
Write local installed skill with provenance markers
  ↓
Save baseline manifest for future diff/merge
```

The installed skill is not just copied blindly. It should include provenance markers.

Example marker format:

```markdown
<!-- FRAMEPACK HARDENING START id=hf-root-duration source=framepack@0.10.2 upstream=hyperframes@0.6.97 -->
Root composition must explicitly set `data-duration`.
<!-- FRAMEPACK HARDENING END id=hf-root-duration -->
```

This makes future upgrades auditable.

### Why overlays instead of directly replacing the whole HyperFrames skill?

Because there are three independent sources of truth:

1. official upstream HyperFrames skill — vendor manual;
2. Framepack-shipped hardening — product-level battle scars;
3. user-local hardening — this user's private shop notes.

Replacing the whole file is like repainting the workshop wall and accidentally covering the fire exits.
The manager must patch known blocks, not bulldoze the whole skill.

## Hardening provenance model

Each shipped hardening rule should carry metadata:

```yaml
id: hf-root-duration
owner: framepack
introduced_in: 0.9.4
applies_to:
  skill: hyperframes
  upstream_versions: ">=0.6.0"
merge_policy: preserve_unless_upstream_equivalent
priority: critical
source: test-team-render-integrity
summary: Root composition must explicitly set data-duration to prevent clipped final hold.
```

Suggested merge policies:

- `append_if_missing` — add block if absent;
- `replace_managed_block` — update only the matching Framepack-managed block;
- `preserve_unless_upstream_equivalent` — keep local block unless official skill now contains equivalent rule;
- `manual_review_on_conflict` — never auto-resolve;
- `remove_if_obsolete` — remove only if explicit migration says so.

## HyperFrames support window

Framepack must declare the HyperFrames versions it supports.

This is not optional. HyperFrames moves quickly, and users may update HyperFrames independently before a matching Framepack release exists.

Framepack therefore needs a support matrix, for example:

```yaml
framepack_version: 0.10.2
hyperframes:
  supported_min: 0.6.90
  supported_max_tested: 0.6.103
  soft_max: 0.6.x
  hard_block_below: 0.6.80
  unknown_newer_policy: warn_and_probe
```

### Version classes

#### supported

The installed HyperFrames version is within Framepack's tested range.

Action:

- run normal capability snapshot;
- run registry/proxy checks;
- run smoke tests;
- proceed.

#### too old

HyperFrames is below `supported_min` but not below `hard_block_below`.

Action:

- warn that the installed HyperFrames may miss required commands/features;
- recommend Agent-managed HyperFrames upgrade;
- allow read-only/discovery operations;
- block render/preview unless user explicitly accepts degraded mode.

#### hard too old

HyperFrames is below `hard_block_below`.

Action:

- block Framepack → HyperFrames handoff;
- tell the Agent to upgrade HyperFrames first;
- do not attempt render/preview/lint handoff.

#### newer but same compatibility band

Example: Framepack tested up to `0.6.103`, user has `0.6.108`, and `soft_max` is `0.6.x`.

Action:

- warn: newer-than-tested HyperFrames detected;
- run capability snapshot;
- compare command/flag set against expected capabilities;
- run blank smoke test;
- if probes pass, allow with warning;
- save report so Framepack maintainers can update tested max later.

#### unknown major/minor newer

Example: Framepack supports `0.6.x`, user installed `0.7.0` or `1.0.0` before Framepack caught up.

Action:

- do not assume compatibility;
- run discovery-only probes first (`version`, `help`, `catalog`, command help);
- do not run destructive/project-mutating commands until compatibility classification succeeds;
- require `blank` smoke in an isolated temp directory;
- if smoke passes, allow only guarded mode;
- if smoke fails or command contract changed, block handoff and recommend either:
  1. upgrade Framepack when available;
  2. downgrade HyperFrames to latest supported version;
  3. proceed manually with explicit user approval.

### Capability contract beats semver optimism

Version range is the first gate, not the only gate.

Even inside a supported version range, Framepack must verify the actual CLI contract:

- required commands exist;
- required flags still exist;
- official registry behavior is understood;
- `blank` init still works;
- output shape from `catalog --json` is parseable;
- known handoff commands still behave as expected.

If semver says OK but probes fail, probes win.

If semver says unknown but probes pass, Framepack may allow guarded mode with a warning.

### Single-user independent HyperFrames update scenario

If the user independently updates HyperFrames while Framepack remains old:

```text
User updates HyperFrames
  ↓
Framepack doctor detects installed HyperFrames > supported_max_tested
  ↓
Adapter runs discovery-only probes
  ↓
Blank smoke runs in isolated temp project
  ↓
Decision:
    pass + same band → allow with newer-than-tested warning
    pass + unknown band → guarded mode, report generated
    fail → block handoff; recommend Framepack update or HyperFrames downgrade
```

### Downgrade recommendation

Framepack should know the latest supported HyperFrames version and provide an exact downgrade/install command, for example:

```text
Framepack 0.10.2 supports HyperFrames up to 0.6.103.
Installed HyperFrames is 0.7.0 and failed compatibility smoke.
Recommended options:
1. Update Framepack if a newer version exists.
2. Temporarily use HyperFrames 0.6.103 for this project.
3. Continue manually with explicit approval.
```

The Agent should never silently downgrade a user's HyperFrames. Downgrade is a recommendation or an approval-gated action.

### Support window metadata location

Support metadata should ship with Framepack, not live only in prose.

Future file:

```text
framepack-plugin/compat/hyperframes-support.yaml
```

It should include:

- supported min/max tested versions;
- known-good command contracts;
- known-bad versions;
- migration notes;
- required smoke tests;
- downgrade target;
- policy for unknown newer versions.

## Install flow

### Phase 1: Environment doctor

Checks:

- Node.js version
- npm/npx availability
- HyperFrames CLI availability/version
- HyperFrames official skills availability
- local Hermes skill install location
- registry availability
- local proxy/VPN settings if registry fails
- blank example smoke test

### Phase 2: Official skill install

If HyperFrames skills are missing:

1. fetch official HyperFrames package;
2. extract official skills;
3. install into Hermes skill directory;
4. record official baseline hash in a manifest.

Manifest example:

```json
{
  "skills": {
    "hyperframes": {
      "official_version": "0.6.97",
      "official_sha256": "...",
      "installed_sha256": "...",
      "framepack_overlays": ["hf-root-duration", "hf-clip-root-animation-ban"],
      "user_local_blocks": []
    }
  }
}
```

### Phase 3: Apply Framepack hardening overlays

For each overlay:

1. check whether official skill already contains equivalent guidance;
2. if not, insert/update the managed block;
3. record overlay id and version;
4. never remove user-local blocks.

### Phase 4: Smoke test

Run:

- HyperFrames version/help probe;
- registry catalog probe with proxy retry;
- `init --example blank` smoke;
- skill load smoke if Hermes can reload skills.

## Runtime learning flow

When Agent learns something during real use:

### User/environment facts → Hermes memory

Example:

- user is in China network environment and uses local proxy;
- this Windows host uses Git Bash terminal;
- user prefers blank smoke before render.

### Reusable procedures → user-created skill or Framepack issue candidate

Example:

- a robust recipe for debugging a new HyperFrames renderer warning.

If it is broadly applicable, promote it into Framepack-shipped hardening in the next release.

### Project state → `.framepack/*` or `.hyperframes/*`

Example:

- downloaded weapons;
- registry capability snapshot;
- project-specific expanded prompt;
- asset inventory.

### Product rules → Framepack source

Example:

- command classification;
- proxy retry;
- handoff rules;
- guardrail hydration behavior.

## Upgrade flow

When HyperFrames and/or Framepack update, the Agent must not overwrite blindly.

### Inputs

- old official upstream skill (`official_old`)
- new official upstream skill (`official_new`)
- current local installed skill (`local_current`)
- Framepack old overlay manifest
- Framepack new overlay manifest
- user-local blocks discovered in local skill

### Three-way decision

```text
If local_current == official_old + old_framepack_overlays:
    safe to auto-apply official_new + new_framepack_overlays

If local_current has user-local blocks:
    preserve user-local blocks, then apply official_new + new_framepack_overlays

If official_new now includes an equivalent Framepack hardening rule:
    either mark overlay as upstream_absorbed or keep a short compatibility note

If official_new conflicts with Framepack hardening:
    manual review required; default preserve Framepack critical hardening

If user-local block conflicts with official/Framepack rules:
    ask user; never silently delete user-local knowledge
```

## Replacement vs merge vs preserve

### Replace

Allowed only when:

- local skill hash equals recorded official baseline;
- no Framepack overlays applied;
- no user-local blocks detected.

### Auto-merge

Allowed when:

- changes are in non-overlapping managed blocks;
- user-local blocks are clearly delimited;
- official update adds new sections without conflicting with hardening.

### Preserve and report

Required when:

- Framepack hardening is critical and official skill lacks equivalent rule;
- user-local blocks exist;
- conflict detection is uncertain.

### Manual review

Required when:

- official guidance contradicts Framepack hardening;
- user-local guidance contradicts official/Framepack guidance;
- block markers are malformed;
- skill was edited heavily without provenance markers.

## User-facing upgrade report

Agent should report like this:

```text
Framepack/HyperFrames upgrade report

HyperFrames CLI:
  0.6.97 → 0.6.103

Registry:
  first attempt failed
  proxy detected: env:HTTPS_PROXY http://127.0.0.1:59527
  proxy retry succeeded
  registry items: 113 → 128

Skills:
  hyperframes:
    official additions: 4
    Framepack hardening preserved: 9
    upstream absorbed: 1
    user-local blocks preserved: 2
    conflicts: 0

  hyperframes-cli:
    official additions: 2
    Framepack hardening preserved: 3
    conflicts: 1 manual review recommended

Smoke:
  blank init: pass
  hook classification: pass
```

## Product principle

Development/test-team experience should ship as Framepack product hardening.
User-local experience should stay local unless deliberately promoted.
Official updates should be absorbed, not worshipped.
Local battle scars should be preserved, not paved over.

The Agent-managed upgrade path is therefore:

```text
official upstream skill
  + Framepack-shipped hardening overlays
  + user-local hardening blocks
  + project capability snapshots
  → diff/merge/preserve on every update
```

Metaphor:

- Official HyperFrames skill = factory manual
- Framepack shipped hardening = recall notices + workshop best practices
- User-local hardening = notes written by the mechanic using this exact car every day
- Environment & Upgrade Manager = service manager who decides what to replace, what to merge, and what to leave taped to the dashboard

## Implementation targets

Future modules:

- `core/environment_doctor.py`
- `core/skill_overlay_manager.py`
- `core/skill_upgrade_manager.py`
- `scripts/framepack_doctor.py`
- `scripts/framepack_upgrade_report.py`

Future tests:

- missing HyperFrames CLI triggers install recommendation;
- missing HyperFrames skills triggers official skill install plan;
- official skill + Framepack overlay produces patched local skill with provenance markers;
- update with unchanged local skill allows replace;
- update with Framepack overlays performs managed-block merge;
- update with user-local blocks preserves them;
- conflicting official/user/Framepack blocks require manual review;
- registry failure probes proxy and retries before fallback;
- upgrade report includes decisions and smoke evidence.
