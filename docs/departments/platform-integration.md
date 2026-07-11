# Platform Integration Department

> Role: external relations and ops. Keep Hermes, HyperFrames, and Framepack aligned.
>
> Plain-English job: Platform Integration is the facilities manager. It keeps the lights on: hooks fire correctly, deployment is in sync, compatibility is known, and the README doesn't lie.

## 1. Department boundary

Platform Integration owns **runtime and release operations**:

- HyperFrames compatibility classification (supported band, probe-before-trust).
- Plugin hook registration and behavior.
- Guardrail Hydrator sync (managed block in project AGENTS.md).
- Deployment sync with MD5 verification.
- Release README / bilingual docs / version surface synchronization.
- CLI command intent classification (production vs discovery vs scaffold).

Platform Integration does **not** own:

- creative taste or weapon semantics
- business rules of any governance department

## 2. Contracts

| Direction | Artifact | Consumer |
|---|---|---|
| Output | compatibility reports | Agent / user |
| Output | hydrated guardrails | project AGENTS.md |
| Output | deployment sync receipts | release verification |
| Output | release docs | users / future agents |
| Output | runtime hook behavior | all departments (via hooks) |
| Input | Hermes runtime state | — |
| Input | HyperFrames CLI version | — |
| Input | plugin.yaml / AGENTS.md / README | — |

## 3. Current status

Implemented and mature:

- HyperFrames compatibility adapter with support matrix
- Guardrail Hydrator with managed-block sync
- Deployment sync script with LF normalization and MD5 verification
- Bilingual README with strategic sections
- Version synchronization test suite
- CLI command intent classification in pre/post hooks
