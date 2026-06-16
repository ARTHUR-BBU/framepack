# hyperframes 开发工程 — 工作交接台

> 新对话打开后，读完本文就能接上。
> 这不是历史日志，是当前手台；旧状态靠 Git 历史追溯。

## 当前状态

<!-- ⚠️ 此区块每次会话结束时整块替换。不要在上面追加。 -->

**阶段**: Framepack v0.11 Kinetic Taste Engine MVP 已完成源码实现与本地部署同步；尚未 commit，尚未 bump 正式版本，仍属于 Unreleased 开发成果。
**分支**: `framepack-agent-platform`
**正式源码版本**: v0.10.6（`framepack-plugin/plugin.yaml` 仍为 `0.10.6`；本轮没有做 release bump）
**当前 HEAD**: `f19bfd3`
**部署状态**: 已同步 `framepack-plugin/.` → `F:/Hermes_windows/plugins/framepack/`，并读回确认 `core/taste_audit.py` 与 `scripts/framepack_taste_audit.py` 存在。
**测试**: Focused suite `43 passed`; full plugin suite `280 passed`; root-level focused smoke `38 passed`; final targeted check `23 passed`; deploy manifest `5 passed`; manual Taste Audit smoke 输出 markdown/json 均成功；security scan clean；diff check clean；independent reviewer passed。

### 本轮做了什么

- ✅ 基于已批准设计 `F:/hyperframes/.hermes/designs/2026-06-16--framepack-v0.11-kinetic-taste-engine.md` 写入实施计划：`F:/hyperframes/.hermes/plans/2026-06-16_121719-framepack-v011-kinetic-taste-engine.md`。
- ✅ 按 TDD 红→绿新增 Kinetic Taste 词汇表：`framepack-plugin/core/taste_grammar.py`。
  - `KINETIC_GRAMMAR`: 7 个稳定 ID。
  - `TASTE_MOVES`: 12 个稳定 ID。
  - `SURPRISE_OPERATORS`: 10 个稳定 ID。
- ✅ 按 TDD 新增 Reference Specimens：`framepack-plugin/core/taste_specimens.py`，内置 6 个 MVP specimens。
- ✅ 按 TDD 新增 Taste Audit：`framepack-plugin/core/taste_audit.py`。
  - 报告形态：`framepack_taste_audit`。
  - severity: `risk | suggestion | note`，不输出假精确美学总分。
  - 检查：missing taste block、missing kinetic continuity、generic fade stack、static mockup risk、no controlled surprise、too many surprises、surprise without intent、motif not transformed。
- ✅ 新增 CLI：`framepack-plugin/scripts/framepack_taste_audit.py`，支持 `--format json|markdown` 与 `--output`。
- ✅ 扩展 Execution Manifest parser，向后兼容新增可选字段：`motion_role`、`grammar`、`taste_move`、`surprise`。
- ✅ 更新 Director skill：`framepack-plugin/skills/framepack-director/SKILL.md`。
  - `frame.md` 示例加入 compact `taste:` block。
  - `expanded-prompt.md` per-scene beats 加入 `Kinetic Continuity` contract。
  - Execution Manifest 示例加入 motion semantics。
- ✅ 新增 Director 参考文档：
  - `references/kinetic-taste-engine.md`
  - `references/reference-specimens.md`
  - `references/kinetic-grammar.md`
  - `references/taste-moves.md`
  - `references/surprise-operators.md`
- ✅ 新增/更新测试：taste grammar、specimens、audit、CLI、execution manifest、director prompt contract。
- ✅ 部署同步到 active plugin：`F:/Hermes_windows/plugins/framepack/`。
- ✅ simplify + 审核补强：
  - 新增 `framepack-plugin/tests/conftest.py`，支持从 repo 根目录直接跑 focused tests。
  - 调整 `taste_audit.py` 的 surprise intent 判断：只有 `frame.md` 的 `surprise_operator` 需要 `intent`，Execution Manifest 的场景级 `surprise:` 不再误报缺 intent。
  - 新增回归测试 `test_manifest_surprise_semantics_do_not_require_scene_intent`。
  - 新增 `test_surprise_operator_intent_must_be_inside_operator_block`，避免别处 `intent:` 误洗白 `surprise_operator`。
  - 新增 bullet-style manifest motion semantics 覆盖测试。
  - `surprise-operators.md` 明确：frame.md 的 `surprise_operator` 需要 intent，Execution Manifest 的场景级 `surprise:` 只是语义标签。
  - `.gitignore` 增加 `tmp/`，保留 smoke 现场但避免误提交。


### 验证证据

- RED evidence：
  - `python -m pytest tests/test_taste_grammar.py -q -o "addopts="` → 初次 `ModuleNotFoundError: No module named 'core.taste_grammar'`。
  - `python -m pytest tests/test_taste_specimens.py -q -o "addopts="` → 初次 `ModuleNotFoundError: No module named 'core.taste_specimens'`。
  - `python -m pytest tests/test_taste_audit.py -q -o "addopts="` → 初次 `ModuleNotFoundError: No module named 'core.taste_audit'`。
  - `python -m pytest tests/test_taste_audit_cli.py -q -o "addopts="` → 初次 `ModuleNotFoundError: No module named 'scripts.framepack_taste_audit'`。
  - `python -m pytest tests/test_execution_manifest.py::test_parse_scene_keyed_manifest_with_motion_semantics -q -o "addopts="` → 初次 `AttributeError: 'ManifestWeapon' object has no attribute 'motion_role'`。
  - `python -m pytest tests/test_director_taste_prompt_contract.py -q -o "addopts="` → 初次 `4 failed`，缺 taste block / Kinetic Continuity / motion semantics / reference docs。
- GREEN evidence：
  - `python -m pytest tests/test_taste_grammar.py tests/test_taste_specimens.py -q -o "addopts="` → `12 passed in 0.07s`。
  - `python -m pytest tests/test_taste_audit.py tests/test_execution_manifest.py -q -o "addopts="` → `19 passed in 0.14s`。
  - `python -m pytest tests/test_taste_audit_cli.py -q -o "addopts="` → `3 passed in 0.11s`。
  - `python -m pytest tests/test_director_taste_prompt_contract.py -q -o "addopts="` → `4 passed in 0.08s`。
- Focused suite：`python -m pytest tests/test_taste_grammar.py tests/test_taste_specimens.py tests/test_taste_audit.py tests/test_taste_audit_cli.py tests/test_execution_manifest.py tests/test_director_taste_prompt_contract.py tests/test_deploy_manifest.py -q -o "addopts="` → `43 passed in 0.32s`。
- Full suite：`python -m pytest tests/ -q -o "addopts="` → `280 passed in 11.09s`。
- Root-level focused smoke：`python -m pytest framepack-plugin/tests/test_taste_grammar.py framepack-plugin/tests/test_taste_specimens.py framepack-plugin/tests/test_taste_audit.py framepack-plugin/tests/test_taste_audit_cli.py framepack-plugin/tests/test_execution_manifest.py framepack-plugin/tests/test_director_taste_prompt_contract.py -q -o "addopts="` → `38 passed in 0.36s`。
- Final targeted check：`python -m pytest tests/test_director_taste_prompt_contract.py tests/test_taste_audit.py tests/test_execution_manifest.py -q -o "addopts="` → `23 passed in 0.19s`。
- Deploy sync：`cp -r framepack-plugin/. /f/Hermes_windows/plugins/framepack/ && test -f /f/Hermes_windows/plugins/framepack/core/taste_audit.py && test -f /f/Hermes_windows/plugins/framepack/tests/conftest.py` → `deployment sync ok`。
- Deploy manifest after sync：`python -m pytest tests/test_deploy_manifest.py -q -o "addopts="` → `5 passed in 0.06s`。

- Diff hygiene/security：`git diff --check && python /f/Hermes_windows/skills/software-development/requesting-code-review/scripts/scan_worktree_added_lines.py` → exit 0，`No added-line security red flags found.`。
- Independent reviewer：passed=true；无 security concerns；无 logic errors；最后一条文档澄清建议已补到 `surprise-operators.md`。

### 给测试组的入口

当前仍是开发分支未提交状态，不要当正式 release 测试入口。

开发侧推荐验证命令：

```bash
cd F:/hyperframes/framepack-plugin
python -m pytest tests/ -q -o "addopts="
python scripts/framepack_taste_audit.py F:/hyperframes/tmp/taste-audit-smoke --format markdown
```

正式测试组入口仍以 v0.10.6 release 命令为准，直到 v0.11 release-prep/bump 完成。

### 下次要做什么

- 按老田习惯，commit 前最后清点提交范围。
- 不要提交 `tmp/` smoke 目录；`.gitignore` 已加入 `tmp/`。
- 设计文档、计划文档是否随本次 feature 一起提交由老田决定。
- 如准备提交，建议 message：`feat: add framepack kinetic taste engine`。
- 后续 release-prep 才 bump 版本到 v0.11；现在不要写“v0.11 released”。

## 关键路径

- 项目根：`F:\hyperframes\`
- 开发目录：`F:\hyperframes\framepack-plugin\`
- 部署目录：`F:\Hermes_windows\plugins\framepack\`
- Active independent framepack skill：`F:\Hermes_windows\skills\software-development\framepack\`
- 当前 smoke 现场：`F:\hyperframes\tmp\taste-audit-smoke\`（保留现场，不提交）
- Git 分支：`framepack-agent-platform`
- 远程：https://github.com/ARTHUR-BBU/framepack

## 版本脉络

- v0.8.0：定位重构为 Prompt Factory for HyperFrames；Framepack 只产出 frame.md + expanded-prompt.md，HTML/render 交给 HyperFrames。
- v0.9.1：HyperFrames Structure Bridge；Time Windows、Structure Checklist、结构铁律、resolveElement compat。
- v0.9.2：Guardrail Hydrator；plugin guardrails.md → 项目 AGENTS.md managed block → 当前 session 注入。
- v0.9.3：Test-Team Hardening；clip root 禁动画、scene-inner wrapper、text-split CSS contract、state.json future-only。
- v0.9.4：Replica Mode Render Integrity；VIDEO_DNA/content_decomposition/TEMPLATE_BLUEPRINT、root data-duration、模糊实现语句禁令。
- v0.10.0：Arsenal Registry Runtime；.framepack/arsenal.json、Execution Manifest reconcile、builtin weapon catalog、trusted-source whitelist、preflight audit。
- v0.10.1：HyperFrames Compatibility Adapter；命令分类、capability snapshot、registry fallback、proxy/VPN retry、official skill diff、upstream watcher。
- v0.10.2：Environment & Upgrade Manager groundwork；doctor/install/overlay/upgrade/report/support-window 生命周期托管。
- v0.10.3：Quality Beyond Lint；语义审计小票、JSON/Markdown audit CLI、handoff 前非阻断 summary、scene-keyed Manifest parser、测试组自动测试脚本。
- v0.10.4：Arsenal Binding Contract；arsenal 自动创建/同步、canonical weapon function、inline GSAP hint、sync opt-in。
- v0.10.5：Production Quality Layer；timeline manifest、proof frames/contact sheet、scene spec、production quality audit、lightweight hook sync。
- v0.10.6：Production Hardening Patch；external font dependency、本地字体资产缺失、低可见性风险、NaN/Infinity、proof path project-local 审计。
- v0.11-dev：Kinetic Taste Engine；Reference DNA、Visual Physics、Kinetic Grammar、Director Taste Moves、Controlled Surprise、Taste Audit CLI。

## 待办 / 想法池

- [x] v0.11 Kinetic Taste Engine 设计文档落盘并获确认。
- [x] v0.11 Kinetic Taste Engine 实施计划落盘。
- [x] Kinetic Taste Engine MVP 源码实现 + 测试 + 部署同步。
- [ ] commit 前 simplify + 审核。
- [ ] 决定是否补 root-level pytest import convention / surprise edge-case tests。
- [ ] commit 本轮 feature。
- [ ] 后续 release-prep 时再 bump v0.11 版本与 release surfaces。

## 笔记

- 测试组和开发组分工：测试由测试组测，开发侧不要抢跑；开发侧负责修复、交接台、版本/部署/路径口径核验。
- 老田提交前偏好：先做 “simplify + 审核”，最后再 commit。
- 交接台更新原则：replace not append；阶段切换/发布/准备开新 session 前必须更新 `.hermes/CONTEXT.md` 并单独提交 handoff。
- Framepack 边界不变：Framepack 不写 HTML、不替代 HyperFrames lint/render；Taste Audit 是导演批注，不是审美总分。
