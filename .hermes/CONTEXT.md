# hyperframes 开发工程 — 工作交接台

> 新对话打开后，读完本文就能接上。
> 这不是历史日志，是当前手台；旧状态靠 Git 历史追溯。

## 当前状态

<!-- ⚠️ 此区块每次会话结束时整块替换。不要在上面追加。 -->

**阶段**: Framepack v0.10.4 Arsenal Binding Contract + v0.10.5 Production Quality Layer 已完成实现、验证、部署同步、pre-release review，并已拆成两个 verified commits；尚未 push，尚未 bump 到 v0.10.5，尚未创建 release。  
**分支**: `framepack-agent-platform`  
**正式版本**: v0.10.3（当前 `plugin.yaml` 仍为 `0.10.3`；v0.10.4/v0.10.5 功能已在 Git commits 中，但 release/bump 未完成）  
**GitHub Release**: https://github.com/ARTHUR-BBU/framepack/releases/tag/v0.10.3  
**v0.10.3 发布提交**: `915623e` (`[verified] release framepack v0.10.3`)  
**最新功能提交**:
- `6a63be4` — `[verified] framepack v0.10.4 arsenal binding contract`
- `17a9455` — `[verified] framepack v0.10.5 production quality layer`

**当前 Git 状态**: `git status --short` 输出为空（工作区干净）。  
**刚发生的事**: 老田要求 “push 并 bump，把事情做完整，准备测试组测试”；我开始扫描版本引用，但老田随即要求先做好交接启动新 session。版本 bump 脚本被中断，`git status --short` 确认没有留下工作区改动。  
**下一轮首要任务**: 继续 “push + bump v0.10.5 + 准备测试组测试” 流程。

### 已完成并提交的内容

#### v0.10.4 Arsenal Binding Contract — `6a63be4`

- `.framepack/arsenal.json` 可自动创建/同步。
- builtin weapon metadata 增加 canonical `function` 字段。
- Quality Audit 改用 builtin catalog，不再维护漂移的 `WEAPON_TO_FUNCTION`。
- `manifest_weapon_not_called` 增加 function + inline GSAP hint。
- `framepack_quality_audit.py --sync-arsenal` 保持显式 opt-in；默认只读。

#### v0.10.5 Production Quality Layer — `17a9455`

- 新增 Timeline Manifest：
  - `framepack-plugin/core/timeline_manifest.py`
  - `framepack-plugin/scripts/framepack_timeline_manifest.py`
  - 生成/同步 `.framepack/timeline-manifest.json`
  - 从 `.hyperframes/expanded-prompt.md` 的 HyperFrames Time Windows 或 `index.html` clip 元数据发现 scene timing
  - 保留 locked scene，不盲目覆盖
  - 验证 overlap、invalid scene、duration 等生产问题
- Quality Audit 升级为 Production Quality Audit：
  - timeline/proof issues：`timeline_manifest_missing`、`timeline_manifest_invalid`、`timeline_duration_invalid`、`timeline_duration_mismatch`、`timeline_scene_invalid`、`timeline_scene_overlap`、`proof_invalid`、`proof_missing`、`boundary_proof_missing`、`contact_sheet_missing`、`arsenal_duration_invalid`
  - CLI 新增 `--sync-timeline` 与 `--fail-on P0|P1|P2|P3`
- Proof 工具链：
  - `core/proof_audit.py`
  - `scripts/framepack_probe_media.py`
  - `scripts/framepack_extract_proof_frames.py`
  - `scripts/framepack_make_contact_sheet.py`
- 新增生产模板与 skill：
  - `templates/scene-spec.md`
  - `templates/timeline-manifest.example.json`
  - `skills/framepack-production-quality/SKILL.md`
- Hook 接入 lightweight timeline sync：HyperFrames production 命令前可非阻断同步 timeline ledger；discovery/init/help/version 类命令不触发 side effect。
- 按 independent code review 反馈修复 malformed numeric crash：
  - timeline scene `start/duration/track_index` 非数字不再 crash，报告 `timeline_scene_invalid`
  - timeline `project.duration` 非数字不再 crash，报告 `timeline_duration_invalid`
  - proof `time` 非数字不再 crash，报告 `proof_invalid`
  - proof extraction 脚本遇到非法 proof time 会跳过
  - arsenal `hyperframes_config.duration` 非数字不再 crash，报告 `arsenal_duration_invalid`

### 最近验证证据

提交前/提交后已经跑过：

- Full plugin suite: `239 passed in 11.19s`（提交后）
- Security added-line scan: `No added-line security red flags found.`
- Deploy sync: `deployed-and-byte-identical`
- Deployed runtime smoke: `framepack_quality_audit` 能创建 timeline manifest，并对 malformed manifest 输出 `arsenal_duration_invalid` / `timeline_duration_invalid` / `timeline_scene_invalid` / `proof_invalid`，无 traceback。
- Independent final review: `passed=true`；no `security_concerns`；no `logic_errors`。

### 当前未完成

1. **Push 未完成**
   - 需要下一轮执行：`git push origin framepack-agent-platform`
   - push 前建议先 `git fetch origin` + `git status --short` + `git log --oneline -3`。

2. **v0.10.5 bump 未完成**
   - 当前源码版本仍为 v0.10.3。
   - 下一轮必须按老田“全面升级”铁律同步所有门牌，不要只改 `plugin.yaml`。

3. **测试组包未准备**
   - bump 后要同步部署目录，再跑 full suite + deployed smoke + test-team auto script dry-run/real report。

4. **release/tag 未完成**
   - 老田当前说的是“准备测试组测试”，不一定等于 GitHub Release。
   - 下一轮应先确认目标是：
     - 只 push branch + bump commit 给测试组；还是
     - 创建 `v0.10.5` tag / GitHub Release。

### v0.10.5 bump 必扫清单

已初步扫描到的版本引用面（下一轮继续）：

- `framepack-plugin/plugin.yaml`
- `framepack-plugin/compat/hyperframes-support.json`
- `framepack-plugin/core/arsenal_registry.py` — `DEFAULT_PLUGIN_VERSION`
- `framepack-plugin/core/timeline_manifest.py` — `DEFAULT_PLUGIN_VERSION`
- `framepack-plugin/hooks/on_pre_tool_call.py` — docstring/logger
- `framepack-plugin/hooks/on_post_tool_call.py` — docstring/logger
- `framepack-plugin/__init__.py` — logger
- `framepack-plugin/scripts/apply_skill_overlays.py` — `FRAMEPACK_VERSION`
- `scripts/test_team_v0103_auto_test.py` — script docstring/constants/report file names/title
- `framepack-plugin/skills/*/SKILL.md` — frontmatter versions；尤其 main `framepack/SKILL.md` description/title/sections
- `framepack-plugin/skills/framepack-production-quality/SKILL.md` — 已是 v0.10.5 语义，但 frontmatter/version 要统一检查
- `framepack-plugin/templates/timeline-manifest.example.json` — `0.10.5-draft` 要改成正式 `0.10.5`
- `README.md` — hooks heading/install version/current changelog paragraph
- `docs/README.zh-CN.md` — install verify version
- `AGENTS.md` — top version comment/hooks/skills表
- `framepack-plugin/tests/test_deploy_manifest.py` — release sync expectations
- `framepack-plugin/tests/test_test_team_auto_script.py` — auto-test expected version/report filename

重要：老田要求“全面升级”，所以 description 里的 changelog 文案、logger 消息、README 示例输出、章节标题、测试脚本报告名都要同步，不能只换数字。

### 下一轮推荐执行顺序

1. 先读：
   - `AGENTS.md`
   - `.hermes/CONTEXT.md`
   - 加载 skills：`github-pr-workflow`、`requesting-code-review`、`verification-before-completion`；如果改版本/代码，按规则也加载 `test-driven-development`（Python 测试会改）和必要时 `brainstorming`。
2. 确认干净状态：
   - `git status --short`
   - `git branch --show-current`
   - `git log --oneline -5`
3. 先 push 已完成 commits：
   - `git push origin framepack-agent-platform`
4. 做 v0.10.5 bump：
   - 批量但谨慎地更新上面“必扫清单”。
   - 更新 deploy manifest tests。
   - 跑 grep 确认没有该升未升的 `0.10.3` 门牌（历史脉络/旧 release 链接可保留，但当前版本面不能漂移）。
5. 跑验证：
   - `cd framepack-plugin && python -m pytest tests/ -q -o "addopts="`
   - `python /f/Hermes_windows/skills/software-development/requesting-code-review/scripts/scan_worktree_added_lines.py`
   - 如有 test-team script：跑 dry-run，确认 report 文件名和版本。
6. 同步部署：
   - `F:\hyperframes\framepack-plugin` → `F:\Hermes_windows\plugins\framepack`
   - read back deployed `plugin.yaml` / main skill version
   - deployed runtime smoke
7. Independent review：
   - 使用 `delegate_task` 做 final code review。
8. Commit bump：
   - 建议 commit message：`[verified] release prep framepack v0.10.5`
9. Push bump commit：
   - `git push origin framepack-agent-platform`
10. 更新本交接台并 commit handoff。

### 注意事项

- **不要误判已 bump**：刚才 bump 脚本被用户中断，`git status --short` 为空；没有落地任何版本改动。
- **不要误判已 push**：目前只确认本地有 `17a9455` / `6a63be4`，没有完成 push 验证。
- **测试组口径**：当前正式 release 仍是 v0.10.3；准备测试组测试前，最好把源码版本 bump 到 v0.10.5 并 push，这样测试报告不会写成 v0.10.3。
- **部署口径**：功能代码此前已同步到 `F:\Hermes_windows\plugins\framepack`，但 bump 后必须重新同步部署目录，否则 live plugin 版本会漂移。
- **版本历史可保留**：README/AGENTS/CONTEXT 的“版本脉络”里可以保留旧 v0.10.3 说明；但当前版本面、install verify、logger、manifest、skill frontmatter、tests 必须指向 v0.10.5。

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
- v0.10.4：Arsenal Binding Contract；arsenal 自动创建/同步、canonical weapon function、inline GSAP hint、sync opt-in。本地 commit: `6a63be4`。
- v0.10.5：Production Quality Layer；timeline manifest、proof frames/contact sheet、scene spec、production quality audit、lightweight hook sync。本地 commit: `17a9455`。

## 待办 / 想法池

- [ ] Push `framepack-agent-platform` 到 origin。
- [ ] 全面 bump 到 v0.10.5。
- [ ] 重新同步部署目录并 read back 版本。
- [ ] 跑 full suite / security scan / deployed smoke / test-team script。
- [ ] 提交 bump commit 并 push。
- [ ] 视老田决定：创建 v0.10.5 tag/GitHub Release，或仅交测试组先测。
- [ ] Hardening：数值解析拒绝 NaN/Infinity。
- [ ] Hardening：proof path 限定在 project-local 或至少 audit warning。
- [ ] 文档：hook 会非阻断创建/同步 `.framepack` ledger；CLI 默认 report-first，只在显式 sync/output flags 下写文件。
- [ ] v0.11 方向：Aesthetic Benchmark / Director Taste System，对表 nexu-io/html-video 21 templates 与 html-anything 10 frame。

## 笔记

- 测试组和开发组分工：测试由测试组测，开发侧不要抢跑；开发侧负责修复、交接台、版本/部署/路径口径核验。
- 老田提交前偏好：先做 “simplify + 审核”，最后再 commit。
- 交接台更新原则：replace not append；阶段切换/发布/准备开新 session 前必须更新 `.hermes/CONTEXT.md` 并单独提交 handoff。
- v0.10.5 是“场记层/制片 QA”，不是 HTML 生产器：Framepack 仍不写/patch/render 用户 HTML，只做 prompt、ledger、audit、proof workflow。
