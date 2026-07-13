# Legacy Inheritance Record

The old Hermes plugin is archived in Git history and is not a runtime dependency of the Codex workbench.

| New capability | Historical source | New owner | Migration decision |
| --- | --- | --- | --- |
| Explicit root/clip/media/timeline safety rules | `framepack-plugin/guardrails.md` | `packages/hyperframes-bridge` | Reimplemented as deterministic HTML inspection; no hooks imported. |
| Seek-safe GSAP guidance | legacy Framepack GSAP skill | `packages/hyperframes-bridge/template.ts` | Reimplemented as `fromTo` template output. |
| Asset intake and storyboard receipts | legacy director templates | `packages/director-contracts/markdown.ts` | Reduced to stable project files. |
| Pre-render taste review and waiver concept | legacy taste-control modules | `packages/director-engine/audit.ts` | Reimplemented as technical gate plus persisted approval. |

Not inherited: Hermes hooks, context injection, deployment synchronization, plugin metadata, Python runtime code, or old Hermes-only tests.
