# Taste Control Loop Design

## Verdict

把 Taste Audit 从“影评人写建议”升级成“厨房出菜小票”：发现 P1 taste debt 后，必须落到账本；开 render/preview 前，Agent 不能假装没看见，必须三选一：revise / proof / waiver。

## Scope

Phase 3B only builds the smallest verifiable loop:

1. Convert P1 taste issues into action cards.
2. Persist `.framepack/taste-audit.json` and `.framepack/taste-debt.md`.
3. Add `.framepack/taste-waivers.json` support.
4. Inject a pre-render `Framepack Taste Control` message when open P1 debt exists.
5. Resolve an issue when the source audit no longer reports it; waive it when a matching waiver exists.

No hard render block in this phase. Taste is director control, not compiler law.

## Data model

### TasteActionCard

- `issue_id`: stable hash from code/path/scene/message
- `code`, `severity`, `path`, `scene`, `message`
- `required_action`: one of `revise`, `proof`, `waiver`
- `acceptance`: human-readable acceptance check
- `repair_target`: file/area to edit
- `status`: `open`, `waived`, `resolved`
- `waiver`: optional waiver metadata

### Waiver input

`.framepack/taste-waivers.json`:

```json
{
  "waivers": [
    {
      "code": "text_dominance",
      "reason": "No product assets available; typography-led teaser is intentional.",
      "approved_by": "user",
      "expires": "2026-07-31"
    }
  ]
}
```

For minimal v1, matching by `issue_id` OR `code` is enough. `reason` is required.

## Hook behavior

On HyperFrames `preview` / `render` / `publish` / `present` / `snapshot`:

1. Run existing quality audit.
2. Build/update taste control ledger from taste-derived P1 issues.
3. If open debt exists, inject:
   - top open cards
   - required choice: revise / proof / waiver
   - paths to `.framepack/taste-audit.json` and `.framepack/taste-debt.md`
4. If all P1 taste debt is waived or resolved, no Taste Control warning.

## Testing strategy

Strict TDD:

1. Core ledger tests first in `tests/test_taste_control_loop.py`.
2. Hook integration tests second in `tests/test_pre_render_hook.py`.
3. Focused tests, then source full suite.
4. Sync changed plugin files to `F:/Hermes_windows/plugins/framepack/` and md5-verify source/deploy.
5. Run deployed focused smoke.

## Files expected to change

- Create `framepack-plugin/core/taste_control.py`
- Modify `framepack-plugin/hooks/on_pre_tool_call.py`
- Add/modify tests under `framepack-plugin/tests/`

## Non-goals

- No new philosophy essay.
- No P0 hard block for taste.
- No visual scoring model yet.
- No expansion of weapon library in this slice.
