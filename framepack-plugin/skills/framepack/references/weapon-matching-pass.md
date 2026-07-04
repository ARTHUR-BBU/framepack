# Weapon Matching Pass

Weapon Matching Pass 是 HTML 开写前的强制“备菜台”。

## Why

Agent 的默认舒适路径是：看到动画 → 我会 GSAP → `tl.from()`。这会绕过官方 catalog、Framepack arsenal、GSAP skill、HyperFrames references 和项目本地武器。

Weapon Matching Pass 把“记得去查武器库”变成运行时收据：

```text
expanded-prompt.md / script / storyboard
  ↓
Weapon Matching Pass
  ↓
.framepack/weapon-load-plan.json
.framepack/weapon-load-plan.md
  ↓
HTML authoring
```

## Rules

1. 必须执行。找不到武器也要产出 HANDWRITE waiver 收据。
2. 查找源包括：
   - HyperFrames official catalog / registry / references / workflow capabilities
   - Framepack executable builtin arsenal
   - specialist skills as weapons: `gsap`, `hyperframes` captions/transitions/audio-reactive/CSS patterns, reference-miner, sprite/media workflows
   - project-local `.framepack/arsenal.json` and `.framepack/weapons/*`
3. 官方 catalog/registry 遇到 timeout、registry skip、网络墙，必须先探测当前设备代理并重试：
   - `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY`
   - npm proxy
   - git proxy
   - Windows proxy
   - 本机常见：`127.0.0.1:59527`
   blocked request ≠ no official weapon.
4. `transitions-pack` deprecated，不强制选择。转场优先 HyperFrames 原生/reference。
5. HTML 阶段只加载 load plan 列出的资源，不 dump 全库。

## CLI

```bash
python scripts/framepack_match_weapons.py <project> --format text
python scripts/framepack_match_weapons.py <project> --format json
python scripts/framepack_match_weapons.py <project> --dry-run --format markdown
```

Hermes CLI:

```bash
hermes framepack-match-weapons <project> --format text
```

## Output

```text
.framepack/weapon-load-plan.json
.framepack/weapon-load-plan.md
```

The JSON is machine-readable; the markdown is the short human/Agent handoff.

## Enforcement

- post `expanded-prompt.md` write: automatically writes the plan and injects compact load summary.
- pre `index.html` write/patch/terminal edit: if the plan is missing, generates it from expanded-prompt. If expanded-prompt is missing or matching fails, the hook raises a hard gate error and blocks HTML authoring until the pass can run or a valid waiver exists.
- quality audit: if plan selected a Framepack builtin but HTML does not call its canonical function, reports `weapon_load_plan_not_implemented`.

## HANDWRITE waiver

A valid waiver records:

- checked sources
- rejected candidates
- reason no source can be reused
- planned hand-written implementation

Generic “no exact builtin weapon” is not enough.
