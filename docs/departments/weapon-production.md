# Weapon Production Department

> Role: the kitchen equipment room + recipe archive. Guarantee the Agent never cooks barehanded.
>
> Plain-English job: Weapon Production is the sous-chef's station. When the Director Bible says "premium lower-third caption reveal," Weapon Production finds the right weapon, the right preset, the right recipe — and writes a load plan so the HTML-writing Agent doesn't freestyle.

## 1. Department boundary

Weapon Production owns **tool selection and recipe management**:

- Match scene intent to the right animation weapon.
- Maintain Arsenal Registry: find → download → register → hash → dedupe → unused warning.
- Maintain Preset Registry: named recipes with safe use cases, avoids, and parameter hints.
- Maintain Scorecards: commercial readiness, risk, Studio editability.
- Generate weapon-load-plan so HTML production knows exactly what to load.

Weapon Production does **not** own:

- whether the film direction is commercially strong — Taste Intelligence owns that
- whether the final output looks cheap — Taste / Audit own that
- whether the HTML is structurally valid — HyperFrames lint owns that
- creative direction — Director Bible owns that

## 2. Input contracts

| Input | Why it matters |
|---|---|
| `.hyperframes/expanded-prompt.md` | Execution Manifest: scene → weapon binding |
| `.framepack/arsenal.json` | project-local weapon registry |
| HyperFrames catalog | official registry weapons |
| Framepack animation-library | builtin weapon catalog |
| project-local `.framepack/weapons/` | downloaded/custom weapons |

## 3. Output contracts

| Artifact | Purpose |
|---|---|
| `.framepack/weapon-load-plan.json` | machine-readable: scene → weapon_id → preset_id → params |
| `.framepack/weapon-load-plan.md` | human-readable: what to load, in what order, with what params |
| `.framepack/arsenal.json` | weapon registry with hashes, sources, status |
| `weapon-presets/*.json` | named recipes per weapon |
| `weapon-scorecards/*.json` | commercial readiness rating |
| HANDWRITE waiver | when no weapon fits, explicit waiver with reason |

## 4. Weapon matching pipeline

```text
Execution Manifest scene intent
  → search sources in priority order:
    1. official HyperFrames catalog
    2. Framepack builtin weapons (animation-library)
    3. project-local arsenal (.framepack/weapons/)
    4. specialist skills
  → match by scene verb + visual family
  → if match found: select weapon → look up preset → write load plan entry
  → if no match: HANDWRITE waiver required (with concrete reason)
```

## 5. Post-write gate

Weapon Production's enforcement is split across the department boundary:

- **Business logic** (did the Agent call the real weapon?): owned by Weapon Production via `weapon_enforcement.py`
- **Intervention mechanics** (how hard to pull back): owned by Intervention via `intervention_events_for_weapon_violations()`

The gate catches:

- empty weapon calls (function name appears but no real invocation)
- fake shims (placeholder function definitions)
- comment-only calls (weapon mentioned in `// comment` but not called)
- missing preset-quality params (called with bare target+duration instead of recipe)

All violations become `InterventionEvent(department="weapon", severity="hard_stop")`.

## 6. Arsenal lifecycle

| Stage | Rule |
|---|---|
| Find weapon | Check arsenal.json → catalog → animation-library → project-local |
| Download | Whitelist sources only: nexu.io, codepen.io/@gsap, github.com/hyperframes |
| Register | Write to `.framepack/weapons/` → add to arsenal.json with hash |
| Dedupe | Hash-based: same hash = no re-download |
| Use | Execution Manifest references → Agent reads arsenal.json for path |
| Unused warning | In arsenal.json but not in manifest → flag `unused` |
| Archive | At project end, valuable weapons feed back to main library |

## 7. Anti-conflict rules

### 7.1 Weapon does not judge taste

Weapon Production may say: "This caption scene has a ready-made lower-third preset."

Weapon Production must NOT say: "This film feels cheap because it doesn't use weapons properly."

That's Taste Intelligence's job.

### 7.2 Weapon does not bypass Director Bible

Weapon Production reads scene intent from the Director Story Bible. It does not invent scenes or override creative direction.

### 7.3 HANDWRITE is allowed but accountable

An Agent may write raw GSAP when no weapon fits. But the waiver must be concrete:

- which weapons were checked and why they didn't fit
- what the hand-written animation does
- why it's safe for this scene

## 8. Current status

Implemented:

- weapon matching from Execution Manifest
- arsenal registry with hash-based dedup
- preset registry (first recipes)
- scorecard registry (first ratings)
- post-write weapon gate with fake-call detection
- Weapon → Intervention events bridge
- trusted-source whitelist enforcement

Next priority:

1. expand preset coverage: every builtin weapon should have at least 2 named presets
2. expand scorecard coverage: every builtin weapon should have a commercial readiness rating
3. weapon effectiveness red-teaming: verify gates catch all fake-call patterns (comments, strings, shims, empty params)
