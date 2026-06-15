# hyperframes 开发工程 — 工作交接台

> 新对话打开后，读完本文就能接上。
> 这不是历史日志，是当前手台；旧状态靠 Git 历史追溯。

## 当前状态

<!-- ⚠️ 此区块每次会话结束时整块替换。不要在上面追加。 -->

**阶段**: Framepack v0.10.4 Arsenal Binding Contract + v0.10.5 Production Quality Layer 已完成源码实现、全量测试、部署同步、runtime smoke 与 pre-release review；尚未 commit，尚未 bump 版本。  
**分支**: framepack-agent-platform  
**正式版本**: v0.10.3（源码/部署 `plugin.yaml` 仍为 0.10.3；v0.10.4/v0.10.5 是未发版工作区变更）  
**GitHub Release**: https://github.com/ARTHUR-BBU/framepack/releases/tag/v0.10.3  
**发布提交**: 915623e ([verified] release framepack v0.10.3)  
**最新 handoff 提交**: 00fc76f (handoff: update framepack v0.10.3 release status)  
**Tag**: v0.10.3  
**测试**: 当前未提交工作区 full plugin test `239 passed in 10.86s`；security added-line scan `No added-line security red flags found.`；independent code review passed；部署目录 runtime smoke passed。  
**部署**: 源码 `F:\hyperframes\framepack-plugin` 已同步到活跃部署目录 `F:\Hermes_windows\plugins\framepack`；15 个新增/修改 runtime 文件 byte-identical verified。  
**工作区**: 大量 tracked + untracked 变更未提交；不要误以为已发版。下一步由老田决定 commit/bump/release 节奏。

### 本轮做了什么

- ✅ 完成 v0.10.4 Arsenal Binding Contract 实现：
  - `.framepack/arsenal.json` 可自动创建/同步。
  - builtin weapon metadata 增加 canonical `function` 字段。
  - Quality Audit 改用 builtin catalog，不再维护漂移的 `WEAPON_TO_FUNCTION`。
  - `manifest_weapon_not_called` 增加 function + inline GSAP hint。
  - `framepack_quality_audit.py --sync-arsenal` 保持显式 opt-in；默认只读。
- ✅ 完成 v0.10.5 设计文档：`.hermes/designs/2026-06-15--framepack-v0.10.5-production-quality-layer.md`。
- ✅ 完成 v0.10.5 implementation plan：`.hermes/plans/2026-06-15_161736-framepack-v0.10.5-production-quality-layer.md`。
- ✅ 实现 Timeline Manifest Core：`core/timeline_manifest.py` + `scripts/framepack_timeline_manifest.py`。
  - 生成/同步 `.framepack/timeline-manifest.json`。
  - 从 `.hyperframes/expanded-prompt.md` 的 HyperFrames Time Windows 或 `index.html` clip 元数据发现 scene timing。
  - 保留 locked scene，不盲目覆盖。
  - 验证 overlap、invalid scene、duration 等生产问题。
- ✅ Quality Audit 升级为 Production Quality Audit：
  - 新增 timeline/proof issues：`timeline_manifest_missing`、`timeline_manifest_invalid`、`timeline_duration_invalid`、`timeline_duration_mismatch`、`timeline_scene_invalid`、`timeline_scene_overlap`、`proof_invalid`、`proof_missing`、`boundary_proof_missing`、`contact_sheet_missing`。
  - CLI 新增 `--sync-timeline` 与 `--fail-on P0|P1|P2|P3`。
- ✅ 实现 Proof 工具链：
  - `core/proof_audit.py`
  - `scripts/framepack_probe_media.py`
  - `scripts/framepack_extract_proof_frames.py`
  - `scripts/framepack_make_contact_sheet.py`
- ✅ 新增生产模板与 skill：
  - `templates/scene-spec.md`
  - `templates/timeline-manifest.example.json`
  - `skills/framepack-production-quality/SKILL.md`
- ✅ Hook 接入 lightweight timeline sync：HyperFrames production 命令前可非阻断同步 timeline ledger；discovery/init/help/version 类命令不触发 side effect。
- ✅ 按 code review 反馈修复 malformed numeric crash：
  - timeline scene `start/duration/track_index` 非数字不再 crash，报告 `timeline_scene_invalid`。
  - timeline `project.duration` 非数字不再 crash，报告 `timeline_duration_invalid`。
  - proof `time` 非数字不再 crash，报告 `proof_invalid`。
  - proof extraction 脚本遇到非法 proof time 会跳过。
  - arsenal `hyperframes_config.duration` 非数字不再 crash，报告 `arsenal_duration_invalid`。
- ✅ 同步部署到 `F:\Hermes_windows\plugins\framepack` 并 byte-identical verified。
- ✅ 部署 runtime smoke passed：`framepack_quality_audit` 能创建 timeline manifest，并对 malformed manifest 输出 `arsenal_duration_invalid` / `timeline_duration_invalid` / `timeline_scene_invalid` / `proof_invalid`，无 traceback。

### 验证证据

- Focused malformed numeric regressions: `5 passed in 0.20s`。
- Production quality + proof scripts: `16 passed in 0.30s`。
- Full plugin suite: `239 passed in 10.86s`。
- Security added-line scan: `No added-line security red flags found.`。
- Deploy sync: `deployed-and-byte-identical`。
- Deployed runtime smoke output:
  - `framepack_quality_audit`
  - `True` timeline manifest exists
  - `True` arsenal_duration_invalid
  - `True` timeline_duration_invalid
  - `True` timeline_scene_invalid
  - `True` proof_invalid
- Independent final review: passed=true；no security_concerns；no logic_errors；建议项仅为后续 hardening（NaN/Infinity、proof path 约束、hook 写入行为文档）。

### 当前未提交变更

Tracked modified:
- `framepack-plugin/core/arsenal_registry.py`
- `framepack-plugin/core/builtin_weapons.py`
- `framepack-plugin/core/quality_audit.py`
- `framepack-plugin/hooks/on_post_tool_call.py`
- `framepack-plugin/hooks/on_pre_tool_call.py`
- `framepack-plugin/scripts/framepack_quality_audit.py`
- `framepack-plugin/tests/test_arsenal_hook.py`
- `framepack-plugin/tests/test_arsenal_registry.py`
- `framepack-plugin/tests/test_quality_audit.py`
- `framepack-plugin/tests/test_quality_audit_cli.py`

Untracked:
- `.hermes/designs/2026-06-15--framepack-v0.10.4-arsenal-binding.md`
- `.hermes/designs/2026-06-15--framepack-v0.10.5-production-quality-layer.md`
- `.hermes/plans/2026-06-15_133023-framepack-v0.10.4-arsenal-binding.md`
- `.hermes/plans/2026-06-15_161736-framepack-v0.10.5-production-quality-layer.md`
- `framepack-plugin/core/proof_audit.py`
- `framepack-plugin/core/timeline_manifest.py`
- `framepack-plugin/scripts/framepack_extract_proof_frames.py`
- `framepack-plugin/scripts/framepack_make_contact_sheet.py`
- `framepack-plugin/scripts/framepack_probe_media.py`
- `framepack-plugin/scripts/framepack_timeline_manifest.py`
- `framepack-plugin/skills/framepack-production-quality/`
- `framepack-plugin/templates/`
- `framepack-plugin/tests/test_production_quality_audit.py`
- `framepack-plugin/tests/test_production_templates.py`
- `framepack-plugin/tests/test_proof_scripts.py`
- `framepack-plugin/tests/test_timeline_manifest.py`
- `framepack-plugin/tests/test_timeline_manifest_cli.py`

### 下次要做什么

- 老田决定发版/提交策略：
  - A. 拆两个 commit：v0.10.4 Arsenal Binding Contract / v0.10.5 Production Quality Layer。
  - B. 直接 bump 到 v0.10.5，一次性走全面版本同步 + release。
  - C. 先提交实现但不 bump，交测试组跑未发版验证。
- 如果要 bump/release：必须按“全面升级”铁律同步 README、AGENTS.md、plugin.yaml、`__init__.py` logger、hooks 注释/logger、skill frontmatter、示例输出、版本表等所有版本引用。
- 如果要 commit：先 `git status --short`，确认是否要把 `.hermes/designs/` 与 `.hermes/plans/` 一并提交。
- 如果继续 hardening：优先处理 final review suggestions：NaN/Infinity 数字拒绝、proof path 项目内约束、hook 写入行为文档化。

## 新对话打开后

1. 读 AGENTS.md，确认 Framepack 开发铁律和当前版本。
2. 读本文件 `## 当前状态`，不要再按 v0.10.3 旧开发状态行动。
3. `git status --short`，确认上述 tracked/untracked 变更仍在。
4. `cd framepack-plugin && python -m pytest tests/ -q -o "addopts="`，提交/发版前重新跑 full suite。
5. `python /f/Hermes_windows/skills/software-development/requesting-code-review/scripts/scan_worktree_added_lines.py`，提交前重新跑安全扫描。
6. 不要直接 bump；先问老田选 A/B/C 哪个节奏。

## 关键路径

- 项目根：`F:\hyperframes\`
- 开发目录：`F:\hyperframes\framepack-plugin\`
- 部署目录：`F:\Hermes_windows\plugins\framepack\`
- 测试项目：`F:\Framepack-01-test\`
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
- v0.10.4（未发版工作区）：Arsenal Binding Contract；arsenal 自动创建/同步、canonical weapon function、inline GSAP hint、sync opt-in。
- v0.10.5（未发版工作区）：Production Quality Layer；timeline manifest、proof frames/contact sheet、scene spec、production quality audit、lightweight hook sync。

## 待办 / 想法池

- [ ] 决定 v0.10.4/v0.10.5 commit 与版本 bump 策略。
- [ ] 发版前做全面版本同步，避免 v0.10.3/v0.10.5 文案漂移。
- [ ] 交测试组前确认源码版本 vs 未发版变更口径，避免测试组误读。
- [ ] Hardening：数值解析拒绝 NaN/Infinity。
- [ ] Hardening：proof path 限定在 project-local 或至少 audit warning。
- [ ] 文档：hook 会非阻断创建/同步 `.framepack` ledger；CLI 默认 report-first，只在显式 sync/output flags 下写文件。
- [ ] v0.11 方向：Aesthetic Benchmark / Director Taste System，对表 nexu-io/html-video 21 templates 与 html-anything 10 frame。

## 笔记

- 测试组和开发组分工：测试由测试组测，开发侧不要抢跑；开发侧负责修复、交接台、版本/部署/路径口径核验。
- 老田提交前偏好：先做 “simplify + 审核”，最后再 commit。
- 交接台更新原则：replace not append；阶段切换/发布/准备开新 session 前必须更新 `.hermes/CONTEXT.md` 并单独提交 handoff。
- v0.10.5 是“场记层/制片 QA”，不是 HTML 生产器：Framepack 仍不写/patch/render 用户 HTML，只做 prompt、ledger、audit、proof workflow。
