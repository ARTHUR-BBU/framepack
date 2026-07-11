# Director Bible Department

> Role: the director's room. Turn "I want a premium 30s brand video" into a shootable story bible.
>
> Plain-English job: Director Bible is the screenwriter + director. It owns the creative source-of-truth that every other department reads from.

## 1. Department boundary

Director Bible owns **creative direction artifacts**:

- `frame.md`: visual identity, colors, typography, atmosphere, motion energy, control profile, taste_read/dials.
- `.hyperframes/expanded-prompt.md`: scene beats, rhythm, time windows, depth layers, animation choreography, motifs, negative prompt, Execution Manifest.

Director Bible does **not** own:

- HTML writing — HyperFrames workflow owns that
- weapon selection — Weapon Production owns that
- taste judgment — Taste Intelligence owns that
- structural validation — HyperFrames lint owns that

## 2. Contracts

| Direction | Artifact | Consumer |
|---|---|---|
| Output | `frame.md` | Taste, Weapon, HyperFrames |
| Output | `.hyperframes/expanded-prompt.md` | Taste, Weapon, Audit, HyperFrames |
| Output | Execution Manifest (inside expanded-prompt) | Weapon matching |
| Input | intent classification from Intent & Intake | — |
| Input | user confirmation / co-creation | — |
| Input | reference DNA from Knowledge Assets | — |

## 3. Key deliverable quality bars

- `frame.md` must contain: colors (hex), typography (literal font names), atmosphere, motion energy, control_profile.
- `expanded-prompt.md` must contain: title+style block, rhythm declaration, HyperFrames Time Windows, per-scene beats (concept/mood/layers/choreography/transition), recurring motifs, negative prompt, HyperFrames Structure Checklist, Execution Manifest.

## 4. Current status

Implemented and mature. The Director Bible pipeline has been stable since v0.16.
