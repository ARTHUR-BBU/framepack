# Framepack v0.10.5 Production Quality Layer — 设计文档

> 状态：设计草案，等待老田确认后进入 implementation plan / TDD 执行。
> 日期：2026-06-15
> 分支：framepack-agent-platform
> 上游参考：saranambiar/hyperframes-video-agent-skills
> 当前前置：v0.10.4 Arsenal Binding Contract 已实现、已部署、未 commit、未 bump。

---

## 0. 一句话定位

v0.10.5 不做“再加几个酷炫特效”。

v0.10.5 做的是 Framepack 的“制片场记层”：

- 用 timeline manifest 管住全片时间轴、场景锁、proof 点、音频、字幕、转场依赖。
- 用 scene spec 把 expanded-prompt 的导演分镜落成可施工的时间颗粒。
- 用 proof frame / contact sheet 让“完成”变成证据，而不是 Agent 嘴硬。
- 用 carryover dependency / boundary proof 把场景之间的漏气点抓出来。
- 用 surgical edit contract 防止后期“一字小改，整片重写”。

类比：

- frame.md 是美术指导板。
- expanded-prompt.md 是导演分镜。
- arsenal.json 是武器收发室账本。
- timeline-manifest.json 是场记 + 剪辑台账本。
- proofs/ 是片场监视器截图墙。

---

## 1. 背景和问题

### 1.1 v0.10.4 已解决的问题

v0.10.4 的主题是 Arsenal Binding Contract：

- `.framepack/arsenal.json` 自动初始化。
- builtin weapon metadata 增加 canonical function name。
- `sync_arsenal_from_project()` 成为 hook / CLI 共用入口。
- Quality Audit 不再维护重复的 `WEAPON_TO_FUNCTION`。
- `manifest_weapon_not_called` 增加 inline GSAP lookalike hint。
- CLI 默认只读，`--sync-arsenal` 显式写入。

它解决的是：

```text
Execution Manifest 声明了武器
  ↓
arsenal.json 记录武器与 canonical function
  ↓
Quality Audit 判断 HTML 是否真的调用了函数
```

### 1.2 v0.10.5 要解决的新问题

测试组 whop 案例已经证明：HyperFrames lint / validate / render 可以全绿，但片子仍然会暴露“生产质量”问题。

典型问题不是语法错误，而是制片过程散：

- 场景时长散落在 expanded-prompt、HTML、render 输出、旁白文件里，没有统一账本。
- 用户批准过的场景没有锁，Agent 后续容易手痒“顺便优化”。
- 场景 A 的 final frame 改了，场景 B 的 first frame/carryover 没跟着验证。
- 最终成片没有 proof frames，Agent 只能说“应该好了”。
- 后期小改缺少 surgical contract，容易重写大片。
- 音频、字幕、BGM ducking 没有进入同一条生产时间轴。

v0.10.5 的目标就是给这些生产风险建一个轻量但明确的“场记系统”。

---

## 2. 外部参考提炼：Sara 仓库哪些东西值得吸收

参考仓库：`saranambiar/hyperframes-video-agent-skills`

### 2.1 直接可吸收的模式

#### A. Scene Spec / Beat Timeline

原模板核心字段：

```markdown
## Beat Timeline
| Time | Narration or cue | Visual action | Required proof |
```

价值：把“高级、丝滑、冲击力”这种形容词变成：

- 0.0s 首帧必须是什么。
- 2.4s 哪个标题必须可见。
- 4.8s 哪个卡片必须落稳。
- 5.0s 截什么 proof。

Framepack 适配：

- 不替代 expanded-prompt。
- 在 expanded-prompt 之后生成/维护 scene spec 视图。
- 作为 HyperFrames Step 3 的施工参考。

#### B. Timeline Manifest

原模板字段：

```json
{
  "project": { "width": 1920, "height": 1080, "fps": 60, "output": "renders/final.mp4" },
  "segments": [{ "id": "scene-01", "source_duration": 9.0, "target_duration": 10.0 }],
  "captions": {},
  "music": {},
  "proofs": []
}
```

Framepack 适配：

- 扩展为 `.framepack/timeline-manifest.json`。
- 增加 scene lock、carryover dependency、boundary proofs、source references。
- 只做账本与审计，不直接拼片，不替代 HyperFrames render。

#### C. Proof Frames / Contact Sheet

可直接搬脚本思想：

- `probe_media.py`
- `extract_proof_frames.py`
- `make_contact_sheet.py`

Framepack 适配：

- 从 timeline manifest 自动读取 proof timestamps。
- 输出到 `.framepack/proofs/`。
- Quality Audit 检查 proof 是否存在、是否覆盖 scene boundary / CTA / final hold。

#### D. Carryover Frame / Boundary QA

原 skill 强调：

- first frame must match previous final frame
- boundary -0.05s / +0.05s proof
- stale carryover source scan

Framepack 适配：

- timeline manifest 记录 `first_frame_depends_on`。
- Quality Audit 检查依赖是否有 boundary proof。
- 不分析像素相似度 v0.10.5 暂不做，先检查声明和 proof 文件存在。

#### E. Surgical Change Contract

原模板 `change-request.md` 的价值：

- 改什么。
- 不许改什么。
- 保持哪些锁定场景。
- 哪些 proof 必须重新出。

Framepack 适配：

- 先做模板 / skill。
- 不在 v0.10.5 做自动 diff patch HTML。
- Quality Audit 只检查 change request 与 locked scenes 是否冲突。

### 2.2 不直接吸收的部分

#### A. hyperframes-scene-builder

原因：Framepack 不写 HTML，HyperFrames skills 是主驾驶。

处理：只吸收其“施工前必须有 scene spec”的理念，不搬 builder skill。

#### B. scan_theme_colors.py

原因：它偏源码颜色扫描，容易越界成 HTML/CSS audit。

处理：v0.10.5 暂不搬。v0.11 美学基准阶段可考虑“视觉一致性 proof 评估”，但不能变成 CSS linter。

#### C. 完整 FFmpeg assembly

原因：HyperFrames render 是主链路。Framepack 不应成为第二套视频编译器。

处理：`timeline_manifest_to_ffmpeg.py` 可以先作为 assembly plan generator，不直接 assemble final MP4。

---

## 3. 产品边界

### 3.1 Framepack 负责

- 定义 production quality 元数据。
- 生成/维护 timeline manifest schema。
- 提供 scene spec / change request 模板。
- 提供 proof frame 提取脚本。
- 在 Quality Audit 中做 report-first 审计。
- 在 hooks 中对关键文件写入后给出轻量建议。

### 3.2 Framepack 不负责

- 不写 HTML。
- 不 patch HTML。
- 不替代 `npx hyperframes lint`。
- 不替代 `npx hyperframes render`。
- 不执行完整视频拼接作为主流程。
- 不用像素算法判定“画面好不好看”。
- 不把 timeline manifest 当成 HyperFrames compiler 的替代品。

### 3.3 边界口号

v0.10.5 的口号：

```text
Framepack 不开摄影机，但它要管场记板。
```

---

## 4. 总体架构

```text
用户模糊视频需求
  ↓
frame.md
  管视觉身份：颜色 / 字体 / 氛围 / motion tokens
  ↓
.hyperframes/expanded-prompt.md
  管导演分镜：场景概念 / 节奏 / layers / choreography / Execution Manifest
  ↓
.framepack/arsenal.json
  管武器：id / source / canonical function / used_by / hash / status
  ↓
.framepack/timeline-manifest.json
  管制片：scenes / starts / durations / locks / proofs / audio / captions / carryover
  ↓
.hyperframes/scene-specs/scene-XX.md
  管施工颗粒：Beat Timeline / first frame / final frame / QA points
  ↓
HyperFrames Step 3
  写 HTML / lint / validate / render
  ↓
.framepack/proofs/
  proof frames / contact sheet / probe report
  ↓
framepack quality audit
  输出 Quality Beyond Lint 小票
```

---

## 5. 核心交付一：Timeline Manifest

### 5.1 文件路径

```text
.framepack/timeline-manifest.json
```

### 5.2 schema version

```json
{
  "schema_version": "1.0.0",
  "kind": "framepack_timeline_manifest"
}
```

### 5.3 设计原则

- 它是账本，不是编译器。
- 它允许部分字段缺失，但 Quality Audit 会提示缺口。
- 它尽量从 expanded-prompt / HyperFrames Time Windows 推导初始值。
- 它可以人工编辑。
- 它必须稳定、可 diff、可测试。

### 5.4 建议完整结构

```json
{
  "schema_version": "1.0.0",
  "kind": "framepack_timeline_manifest",
  "project": {
    "name": "Framepack-whop-case",
    "width": 1280,
    "height": 720,
    "fps": 30,
    "duration": 35,
    "output": "renders/final.mp4"
  },
  "source_files": {
    "frame_md": "frame.md",
    "expanded_prompt": ".hyperframes/expanded-prompt.md",
    "html": "index.html",
    "arsenal": ".framepack/arsenal.json"
  },
  "scenes": [
    {
      "id": "scene_01",
      "title": "Opening Hook",
      "status": "draft",
      "start": 0.0,
      "duration": 4.0,
      "track_index": 0,
      "source_composition": "#scene_01",
      "render_output": null,
      "audio": null,
      "captions": [],
      "proofs": [
        { "time": 0.0, "scope": "global", "label": "scene_01_first_frame", "required": true },
        { "time": 2.0, "scope": "global", "label": "scene_01_key_beat", "required": true },
        { "time": 3.95, "scope": "global", "label": "scene_01_final_frame", "required": true }
      ],
      "continuity": {
        "first_frame_depends_on": null,
        "final_frame_reused_by": ["scene_02"],
        "transition_in": "none",
        "transition_out": "camera_swipe",
        "boundary_proofs": [
          { "time": 3.95, "label": "scene_01_boundary_before", "required": true },
          { "time": 4.05, "label": "scene_02_boundary_after", "required": true }
        ]
      },
      "locks": {
        "status": "draft",
        "approved_at": null,
        "approved_by": null,
        "must_not_change": []
      },
      "risks": ["carryover_dependency"]
    }
  ],
  "audio": {
    "narration": [],
    "music": {
      "file": null,
      "start_offset": 0,
      "duck_under_narration": false,
      "end_silence_seconds": 0
    }
  },
  "captions": {
    "script": null,
    "style": null,
    "output": null,
    "proofs": []
  },
  "proofs": {
    "directory": ".framepack/proofs",
    "contact_sheet": ".framepack/proofs/contact-sheet.jpg",
    "required": []
  },
  "change_requests": []
}
```

### 5.5 必填最小结构

为了避免 v0.10.5 一口吃成胖子，最小可用结构只要求：

```json
{
  "schema_version": "1.0.0",
  "kind": "framepack_timeline_manifest",
  "project": {
    "name": "...",
    "duration": 35,
    "width": 1280,
    "height": 720,
    "fps": 30,
    "output": "renders/final.mp4"
  },
  "scenes": [
    {
      "id": "scene_01",
      "start": 0,
      "duration": 4,
      "status": "draft",
      "proofs": []
    }
  ]
}
```

### 5.6 状态枚举

Scene status：

- `draft`：可改。
- `review`：等待用户确认。
- `locked`：用户已确认，不应被动。
- `superseded`：被新版本替换，保留历史引用。

Quality Audit 对状态的解释：

- `locked` scene 如果出现在 change request target 之外，提示 `scene_lock_violation`。
- `locked` scene 的 start/duration 与 HTML clip 不一致，提示 P1。
- `locked` scene 被 downstream carryover 依赖，且 final frame 改过但 boundary proof 缺失，提示 P1。

---

## 6. 核心交付二：Timeline Manifest Runtime

### 6.1 新模块

```text
framepack-plugin/core/timeline_manifest.py
```

### 6.2 数据类

```python
@dataclass
class TimelineScene:
    id: str
    start: float
    duration: float
    status: str = "draft"
    title: str | None = None
    track_index: int | None = None
    proofs: list[dict[str, Any]] | None = None
    continuity: dict[str, Any] | None = None
    locks: dict[str, Any] | None = None

@dataclass
class TimelineSyncResult:
    changed: bool
    action: str
    path: Path
    warnings: list[TimelineWarning]
    error: str | None = None
```

### 6.3 函数设计

```python
def default_timeline(project_dir: Path) -> dict: ...

def load_timeline(path: Path) -> dict: ...

def ensure_timeline(project_dir: Path, *, plugin_version: str) -> TimelineSyncResult: ...

def parse_hyperframes_time_windows(expanded_prompt: str) -> list[TimelineScene]: ...

def parse_html_clips(html: str) -> list[TimelineScene]: ...

def sync_timeline_from_project(project_dir: Path, *, plugin_version: str) -> TimelineSyncResult: ...

def validate_timeline(data: dict, project_dir: Path) -> list[TimelineWarning]: ...
```

### 6.4 sync 策略

优先级：

1. 已存在 timeline manifest：保留人工字段，如 locks、proofs、audio、captions。
2. 从 `.hyperframes/expanded-prompt.md` 解析 HyperFrames Time Windows。
3. 从 `index.html` 的 clip attributes 解析 start/duration/track-index 作为 fallback。
4. 如果两者冲突，不自动覆盖 locked scene；只发 warning。
5. 不写 `state.json`。

### 6.5 Time Windows 解析目标

支持 expanded-prompt 中常见格式：

```text
scene_01: start=0, duration=4, track=0
Scene 01 — 0.0s–4.0s
| scene_01 | 0.0 | 4.0 | 0 |
```

第一版可以只支持现有 Framepack 输出格式，不追求全 markdown 兼容。

---

## 7. 核心交付三：Scene Spec Template

### 7.1 新模板路径

```text
framepack-plugin/templates/scene-spec.md
```

或作为 skill reference：

```text
framepack-plugin/skills/framepack-production-playbook/references/scene-spec.md
```

建议：二者都要。

- `templates/` 给脚本/用户 copy。
- `references/` 给 skill 加载。

### 7.2 Framepack 版本模板

```markdown
# Scene Spec — {{scene_id}}

## Scene Identity
- Scene ID:
- Title:
- Start:
- Duration:
- Track index:
- Status: draft | review | locked | superseded
- Source composition:
- Render output:

## Creative Intent
- Objective:
- Audience:
- Desired emotional tone:
- What this scene must communicate:
- What this scene must not feel like:

## Visual Contract
- First frame must show:
- Key beat must show:
- Final frame must show:
- Background:
- Primary colors:
- Typography:
- Motion language:
- Weapon references:

## Beat Timeline
| Local time | Global time | Narration/cue | Visual action | Required proof |
|---:|---:|---|---|---|
| 0.0s |  |  |  |  |

## Continuity
- First frame depends on:
- Final frame reused by:
- Transition in:
- Transition out:
- Boundary proof timestamps:

## Protection
- Locked dependencies:
- Must not change:
- Safe to change:

## QA Checklist
- First-frame proof:
- Key-beat proof:
- Final-frame proof:
- Boundary proof:
- Caption proof:
- Audio sync proof:
- Acceptance criteria:
```

### 7.3 生成策略

v0.10.5 不强制自动生成所有 scene spec 文件。

推荐渐进：

- Phase 1：提供模板 + skill 指令，让 Agent 在需要时生成。
- Phase 2：新增脚本 `framepack_scene_specs.py` 从 timeline manifest 生成 skeleton。
- Phase 3：hook 在 expanded-prompt 写入后提示“可生成 scene specs”。

---

## 8. 核心交付四：Proof Scripts

### 8.1 新脚本

```text
framepack-plugin/scripts/framepack_probe_media.py
framepack-plugin/scripts/framepack_extract_proof_frames.py
framepack-plugin/scripts/framepack_make_contact_sheet.py
```

也可以先 vendor 原脚本，再逐步 Framepack 化。

### 8.2 probe_media

功能：

- 调 ffprobe。
- 输出 duration / size / codec / width / height / fps / audio stream。
- `--json` 输出机器可读结果。

验收：

- 无 ffprobe 时输出明确错误。
- 对不存在文件给出非 0 exit。
- JSON 输出稳定。

### 8.3 extract_proof_frames

功能：

- 支持手动时间点：

```bash
python scripts/framepack_extract_proof_frames.py renders/final.mp4 \
  --time scene_01_first=0.0 \
  --time scene_01_final=3.95
```

- 支持 manifest：

```bash
python scripts/framepack_extract_proof_frames.py renders/final.mp4 \
  --manifest .framepack/timeline-manifest.json
```

- 默认输出：

```text
.framepack/proofs/proof-001-scene_01_first-0.000s.png
.framepack/proofs/proof-002-scene_01_final-3.950s.png
```

### 8.4 contact sheet

功能：

- 把 proof png 拼成一张 JPG。
- 每格标 label + timestamp。
- 默认输出 `.framepack/proofs/contact-sheet.jpg`。

### 8.5 为什么 scripts 放在 v0.10.5

这是收益最快的一块。

Quality Audit 说“缺 proof”是报告。
Proof scripts 让 Agent 真能补 proof。

这两者配合，才是闭环。

---

## 9. 核心交付五：Quality Audit 扩展

### 9.1 现有 audit 不变

保留：

- arsenal_missing
- arsenal_project_mismatch
- arsenal_duration_mismatch
- manifest_weapon_missing_from_arsenal
- arsenal_used_by_empty
- manifest_weapon_not_called
- weapon_parameter_drift
- manual_data_hf_id

### 9.2 新增 issue taxonomy

#### Timeline 类

| Code | Severity | 触发条件 |
|---|---|---|
| `timeline_manifest_missing` | P1 | 有 expanded-prompt / index.html，但无 `.framepack/timeline-manifest.json` |
| `timeline_manifest_invalid` | P0 | JSON 无法解析或 schema 缺失 |
| `timeline_duration_mismatch` | P1 | manifest project.duration 与 HTML root data-duration 不一致 |
| `timeline_scene_missing_from_html` | P1 | manifest scene 在 HTML clip 中找不到 |
| `html_clip_missing_from_timeline` | P2 | HTML clip 没有进入 timeline manifest |
| `timeline_scene_overlap` | P1 | 同 track scene 时间重叠 |
| `timeline_scene_gap` | P3 | 非 intentionally blank 的明显空档 |

#### Proof 类

| Code | Severity | 触发条件 |
|---|---|---|
| `proof_missing` | P2 | manifest required proof 文件不存在 |
| `boundary_proof_missing` | P1 | 有 carryover / transition dependency 但 boundary proof 不全 |
| `final_hold_proof_missing` | P2 | final scene 或 CTA 没有 final proof |
| `contact_sheet_missing` | P3 | proofs 存在但无 contact sheet |
| `probe_report_missing` | P3 | 已有 render output 但无 probe JSON |

#### Lock / Surgical 类

| Code | Severity | 触发条件 |
|---|---|---|
| `scene_lock_violation` | P1 | locked scene 出现在 change request target 之外却有变更迹象 |
| `locked_scene_timing_changed` | P1 | locked scene start/duration 与 manifest previous snapshot 不一致 |
| `change_request_missing` | P3 | 用户表达“小改/只改”但没有 change request 文件，v0.10.5 暂不自动检测自然语言，只在 CLI 指定时检查 |
| `carryover_dependency_unverified` | P1 | scene first_frame_depends_on 非空但 boundary proof 缺失 |

#### Audio / Captions 类

| Code | Severity | 触发条件 |
|---|---|---|
| `audio_declared_but_missing` | P1 | manifest audio file 不存在 |
| `captions_declared_but_missing` | P2 | caption output 不存在 |
| `music_ducking_unverified` | P3 | music ducking=true 但没有 audio proof/probe |

### 9.3 P0/P1/P2/P3 原则

- P0：会让账本无效、误导流程、或 JSON/schema 不能读。
- P1：会造成成片生产风险，比如场景错位、锁定失效、边界跳变。
- P2：质量风险，通常不阻断，但会影响验收。
- P3：建议项、舒适性、可观测性。

### 9.4 Audit 模块切分

不要把 `quality_audit.py` 继续塞成巨石。

建议新增：

```text
framepack-plugin/core/timeline_manifest.py
framepack-plugin/core/proof_audit.py
framepack-plugin/core/html_timeline.py
```

`quality_audit.py` 作为汇总入口：

```python
def audit_project(project_dir: Path) -> QualityAuditReport:
    issues = []
    issues += audit_arsenal(...)
    issues += audit_html_semantics(...)
    issues += audit_timeline(...)
    issues += audit_proofs(...)
    return summarize(issues)
```

---

## 10. 核心交付六：Skills / Templates

### 10.1 新增 plugin skill 候选

为了避免技能膨胀，v0.10.5 不建议一次新增 5 个 skill。

推荐先新增 2 个：

#### A. `framepack:framepack-production-playbook`

职责：

- 端到端生产流程。
- 什么时候写 timeline manifest。
- 什么时候生成 scene spec。
- 什么时候跑 proof scripts。
- 什么叫 locked scene。
- 怎么做 surgical edit。

它是总纲，不教 HTML。

#### B. `framepack:framepack-continuity`

职责：

- Carryover frame。
- Boundary proof。
- 转场类型选择。
- 用户反馈映射：
  - “它跳了” → boundary proof + scale/position check。
  - “像 PPT” → hard cut/fade 过多，考虑 camera swipe/push。
  - “忘了文字” → carryover source stale。

### 10.2 暂不新增但写入 roadmap

- `framepack:framepack-surgical-edit`
- `framepack:framepack-audio-assembly`
- `framepack:framepack-render-qa`

原因：v0.10.5 先立核心账本与 proof 闭环，skill 可以少而精。

### 10.3 模板路径

```text
framepack-plugin/templates/scene-spec.md
framepack-plugin/templates/timeline-manifest.example.json
framepack-plugin/templates/change-request.md
```

对应 skill references：

```text
framepack-plugin/skills/framepack-production-playbook/references/scene-spec.md
framepack-plugin/skills/framepack-production-playbook/references/timeline-manifest.md
framepack-plugin/skills/framepack-production-playbook/references/change-request.md
framepack-plugin/skills/framepack-continuity/references/carryover-frames.md
```

---

## 11. CLI / Script 设计

v0.10.5 不强行新增正式 `framepack` CLI 子命令，先沿用 scripts，降低风险。

### 11.1 timeline sync 脚本

```text
framepack-plugin/scripts/framepack_timeline_manifest.py
```

命令：

```bash
python scripts/framepack_timeline_manifest.py <project_dir> --sync
python scripts/framepack_timeline_manifest.py <project_dir> --validate
python scripts/framepack_timeline_manifest.py <project_dir> --print
```

行为：

- `--sync` 写 `.framepack/timeline-manifest.json`。
- `--validate` 只读检查。
- 默认只读，不写文件。

### 11.2 proof 脚本

```bash
python scripts/framepack_probe_media.py renders/final.mp4 --json \
  --output .framepack/proofs/probe.json

python scripts/framepack_extract_proof_frames.py renders/final.mp4 \
  --manifest .framepack/timeline-manifest.json \
  --output-dir .framepack/proofs \
  --contact-sheet
```

### 11.3 quality audit 增强

现有：

```bash
python scripts/framepack_quality_audit.py <project_dir> --format markdown
```

新增参数：

```bash
--sync-timeline
--require-proofs
--render-output renders/final.mp4
```

原则：

- `--sync-timeline` 才写 timeline manifest。
- `--require-proofs` 才把 proof_missing 升级为更强烈提示；默认只 P2/P3。
- `--render-output` 用于 probe/proof 检查，不自动猜所有 mp4。

---

## 12. Hook 集成策略

### 12.1 pre_tool_call

当检测到 HyperFrames handoff/render/lint 命令：

- 已有 arsenal preflight 保留。
- 新增 timeline readiness summary：
  - 如果有 expanded-prompt 但没有 timeline manifest：提示可运行 `--sync-timeline`。
  - 如果有 carryover dependency 但缺 proof：提示 render 后补 proof。

注意：pre hook 不写文件，避免阻塞工具调用。

### 12.2 post_tool_call

当写入 `.hyperframes/expanded-prompt.md` 后：

- 可注入简短建议：
  - “建议生成 timeline manifest”。
  - “发现 N 个 scene window，可形成 scene spec skeleton”。

是否自动写 timeline manifest？

v0.10.5 建议：不在 post hook 自动写。

理由：

- 写文件 hook 链路曾经有中断风险。
- timeline 是账本，最好由显式 CLI/scripts 写入。
- 自动写容易污染用户项目。

### 12.3 注入内容控制

不能注入一面墙。

每次最多：

- 1 行状态。
- 2 条下一步建议。
- 1 条命令示例。

---

## 13. 测试策略

必须 TDD。

### 13.1 新测试文件

```text
framepack-plugin/tests/test_timeline_manifest.py
framepack-plugin/tests/test_proof_scripts.py
framepack-plugin/tests/test_production_quality_audit.py
framepack-plugin/tests/test_timeline_manifest_cli.py
```

### 13.2 Unit tests — timeline manifest

#### Test 1: ensure creates minimal manifest

- Given：空项目目录。
- When：`ensure_timeline(project_dir)`。
- Then：创建 `.framepack/timeline-manifest.json`。
- Assert：schema_version / kind / project.name / scenes=[]。

#### Test 2: sync parses HyperFrames time windows

- Given：expanded-prompt 包含 scene time windows。
- When：`sync_timeline_from_project()`。
- Then：manifest scenes 包含 start/duration/track_index。

#### Test 3: sync preserves locked scene fields

- Given：已有 timeline scene_01 status=locked，proofs 非空。
- When：expanded-prompt 同 scene 有不同 title。
- Then：不覆盖 locks/proofs/status。

#### Test 4: invalid JSON emits warning not crash

- Given：timeline manifest 是坏 JSON。
- When：validate/audit。
- Then：产生 `timeline_manifest_invalid` P0。

#### Test 5: scene overlap detection

- Given：同 track 两个 scene 时间重叠。
- Then：`timeline_scene_overlap` P1。

### 13.3 Unit tests — proof scripts

#### Test 1: probe_media handles missing ffprobe

通过 monkeypatch `shutil.which` 返回 None。

#### Test 2: extract proof command construction

不要依赖真实 ffmpeg，可把 command builder 拆函数测试。

#### Test 3: manifest proof parsing

Given：timeline manifest 有 required proofs。
When：load proof points。
Then：返回 label/time 列表，去重、排序。

#### Test 4: contact sheet labels

可用 PIL 或跳过图像像素细节，仅测试 output path / layout plan。

### 13.4 Integration tests — quality audit

#### Test 1: missing timeline manifest

Given：project 有 expanded-prompt + index.html。
Then：audit 返回 `timeline_manifest_missing` P1。

#### Test 2: duration mismatch

Given：timeline duration=35, HTML root data-duration=30。
Then：`timeline_duration_mismatch` P1。

#### Test 3: boundary proof missing

Given：scene_02 first_frame_depends_on=scene_01.final_frame，但 proof 文件不存在。
Then：`boundary_proof_missing` P1。

#### Test 4: proof exists clears issue

Given：同上，但 `.framepack/proofs/...png` 存在。
Then：不报 boundary proof missing。

#### Test 5: contact sheet missing P3

Given：proof png 存在但 contact-sheet 不存在。
Then：`contact_sheet_missing` P3。

### 13.5 CLI tests

- `framepack_timeline_manifest.py --validate` 默认不写。
- `framepack_timeline_manifest.py --sync` 写文件。
- `framepack_quality_audit.py --sync-timeline` 显式写 timeline。
- JSON/Markdown 输出稳定。

### 13.6 全量验证命令

```bash
cd framepack-plugin
python -m pytest tests/ -q -o "addopts="
```

部署后验证：

```bash
cp -r framepack-plugin/* /f/Hermes_windows/plugins/framepack/
python -m pytest tests/ -q -o "addopts="
cmp framepack-plugin/core/timeline_manifest.py /f/Hermes_windows/plugins/framepack/core/timeline_manifest.py
```

---

## 14. 颗粒度执行路线

### Phase 0 — 收住 v0.10.4

目标：不要把 v0.10.4 和 v0.10.5 搅成一锅。

动作：

1. 检查 v0.10.4 diff。
2. 做 simplify + review。
3. 决定是否先 commit v0.10.4。
4. 不 bump 0.10.5。

验收：

- v0.10.4 的改动边界清楚。
- Git 工作区知道哪些属于 v0.10.4，哪些属于 v0.10.5。

### Phase 1 — Timeline Manifest Core

目标：先有制片账本。

任务：

1. 写 `test_timeline_manifest.py`。
2. 新建 `core/timeline_manifest.py`。
3. 实现 default/load/ensure。
4. 实现 expanded-prompt time window parser。
5. 实现 HTML clip fallback parser。
6. 实现 sync preserve rules。
7. 实现 validate warnings。

验收：

- timeline manifest 可创建。
- 可从 expanded-prompt/HTML 推导 scenes。
- locked scene 字段不被覆盖。
- 坏 JSON 不 crash。

### Phase 2 — Quality Audit Timeline Issues

目标：把 timeline 风险接入现有小票。

任务：

1. 新增 timeline audit helper。
2. 接入 `quality_audit.audit_project()`。
3. Markdown/JSON 输出包含新 issue details。
4. 增加 tests。

验收：

- `timeline_manifest_missing` 能被检出。
- duration mismatch 能被检出。
- scene overlap 能被检出。

### Phase 3 — Proof Scripts

目标：把 proof 从理念变成工具。

任务：

1. vendor/adapt `probe_media.py`。
2. vendor/adapt `extract_proof_frames.py`。
3. vendor/adapt `make_contact_sheet.py`。
4. 从 timeline manifest 读取 proof points。
5. CLI 参数稳定。
6. tests mock subprocess。

验收：

- 无 ffmpeg/ffprobe 时错误清楚。
- 有 manifest 时能生成 ffmpeg commands。
- 能输出 contact sheet path。

### Phase 4 — Proof Audit

目标：Quality Audit 知道 proof 是否齐。

任务：

1. 新增 `core/proof_audit.py`。
2. 按 required proof 检查文件存在。
3. 检查 boundary proof。
4. 检查 contact sheet。
5. 接入 `quality_audit.py`。

验收：

- required proof missing → P2。
- boundary proof missing → P1。
- contact sheet missing → P3。

### Phase 5 — Templates + Skills

目标：把生产流程写进 Agent 行为。

任务：

1. 新建 `templates/scene-spec.md`。
2. 新建 `templates/timeline-manifest.example.json`。
3. 新建 `templates/change-request.md`。
4. 新建 plugin skill `framepack-production-playbook`。
5. 新建 plugin skill `framepack-continuity`。
6. 更新 `__init__.py` skill auto-scan 测试（若已有 auto-scan 则 smoke）。
7. 更新 AGENTS.md skills 表。

验收：

- `skill_view("framepack:framepack-production-playbook")` 可加载。
- `skill_view("framepack:framepack-continuity")` 可加载。
- skill 不教 HTML，不越界。

### Phase 6 — CLI Integration

目标：显式命令闭环。

任务：

1. 新建 `scripts/framepack_timeline_manifest.py`。
2. 给 `framepack_quality_audit.py` 加 `--sync-timeline`。
3. 给 audit 加 `--render-output` / `--require-proofs`（可选，若范围过大则延期）。
4. CLI tests。

验收：

- 默认只读。
- 显式 `--sync-timeline` 才写。
- 输出 markdown/json 都稳定。

### Phase 7 — Hooks Lightweight Advice

目标：在合适节点提醒，不刷屏。

任务：

1. expanded-prompt 写入后提示 timeline manifest readiness。
2. hyperframes handoff 命令前提示 timeline/proof readiness。
3. 限制注入长度。
4. tests。

验收：

- 不在 discovery/help 命令触发。
- 不自动写 timeline。
- 不干扰 write_file。

### Phase 8 — Deploy + Verification

目标：源码、部署、测试一致。

任务：

1. 全量 pytest。
2. 同步到 `/f/Hermes_windows/plugins/framepack/`。
3. cmp/diff 验证关键文件。
4. deployed runtime smoke。
5. 更新 CONTEXT.md。

验收：

- pytest 全部通过，0 failed。
- 部署文件 byte-identical。
- deployed script 可 import 新模块。

---

## 15. 文件清单

### 15.1 新增文件

```text
framepack-plugin/core/timeline_manifest.py
framepack-plugin/core/proof_audit.py
framepack-plugin/core/html_timeline.py
framepack-plugin/scripts/framepack_timeline_manifest.py
framepack-plugin/scripts/framepack_probe_media.py
framepack-plugin/scripts/framepack_extract_proof_frames.py
framepack-plugin/scripts/framepack_make_contact_sheet.py
framepack-plugin/templates/scene-spec.md
framepack-plugin/templates/timeline-manifest.example.json
framepack-plugin/templates/change-request.md
framepack-plugin/skills/framepack-production-playbook/SKILL.md
framepack-plugin/skills/framepack-production-playbook/references/scene-spec.md
framepack-plugin/skills/framepack-production-playbook/references/timeline-manifest.md
framepack-plugin/skills/framepack-production-playbook/references/change-request.md
framepack-plugin/skills/framepack-continuity/SKILL.md
framepack-plugin/skills/framepack-continuity/references/carryover-frames.md
framepack-plugin/tests/test_timeline_manifest.py
framepack-plugin/tests/test_timeline_manifest_cli.py
framepack-plugin/tests/test_proof_scripts.py
framepack-plugin/tests/test_production_quality_audit.py
```

### 15.2 修改文件

```text
framepack-plugin/core/quality_audit.py
framepack-plugin/scripts/framepack_quality_audit.py
framepack-plugin/hooks/on_post_tool_call.py
framepack-plugin/hooks/on_pre_tool_call.py
framepack-plugin/tests/test_quality_audit.py
framepack-plugin/tests/test_quality_audit_cli.py
AGENTS.md
README.md
README.zh-CN.md 或 docs/README.zh-CN.md
.hermes/CONTEXT.md
```

### 15.3 暂不改

```text
HyperFrames skill files
node_modules/hyperframes/*
任何第三方 skill 安装目录
```

---

## 16. 风险与取舍

### 16.1 风险：重新变成 13 个中间文件

v0.8 的大胜利是砍掉 13 个中间文件。v0.10.5 又引入 timeline/scene-spec/proofs，容易被误解成倒退。

控制方式：

- timeline manifest 是项目账本，不是创意中间文件。
- scene spec 是可选施工视图，不是每次强制全量生成。
- proof 是验证产物，不是创作文件。
- 所有新增文件围绕“生产质量”，不改变 Framepack 的 Prompt Factory 边界。

### 16.2 风险：Quality Audit 过度报警

控制方式：

- timeline missing 是 P1，不是 P0。
- proof missing 默认 P2/P3，只有 boundary dependency 才 P1。
- 没有 render output 时不强制 proof。
- 只有 manifest 明确 declared required proof，才报 proof_missing。

### 16.3 风险：越界到 HTML audit

控制方式：

- 只读取 clip start/duration/id 这些时间调度属性。
- 不审 CSS 样式、不审 DOM 结构 correctness。
- HTML 结构仍交给 `hyperframes lint`。

### 16.4 风险：ffmpeg 环境依赖

控制方式：

- scripts 缺 ffmpeg/ffprobe 时清楚报错。
- Unit tests mock subprocess，不依赖本机 ffmpeg。
- Quality Audit 不因 ffmpeg 不存在失败。

### 16.5 风险：v0.10.4 未 commit 导致混乱

控制方式：

- implementation plan 第一阶段先收住 v0.10.4。
- v0.10.5 文件改动要和 v0.10.4 diff 分清。
- 必要时先提交 v0.10.4，再开 v0.10.5。

---

## 17. 成功标准

### 17.1 产品成功标准

- 一个 HyperFrames 项目能拥有 `.framepack/timeline-manifest.json`。
- timeline manifest 能表达 scene windows、locks、proofs、carryover。
- Quality Audit 能在 lint/render 之外提示生产质量风险。
- Agent 能基于 scene spec 更少猜测。
- 成片验收能拿出 proof frames / contact sheet。

### 17.2 工程成功标准

- 所有新增功能有 tests。
- 全量 pytest 0 failed。
- CLI 默认只读，写入必须显式参数。
- 部署目录与源码一致。
- 不修改第三方 HyperFrames skill。
- 不引入必须联网依赖。

### 17.3 用户体验成功标准

- 老田不用再问“证据呢？”——proof sheet 就是证据。
- 用户说“只改这一个地方”时，Agent 有 surgical contract 可遵守。
- 用户批准的场景不会被 Agent 无意重写。
- 场景边界不再靠肉眼玄学猜，至少有 boundary proof。

---

## 18. v0.11 展望：Aesthetic Benchmark / Director Taste System

v0.10.5 是“制片质量层”，不是最终美学系统。

v0.11 才进入“导演审美系统”。

### 18.1 v0.11 目标

建立 Framepack 的审美 benchmark 与导演手册，让 Agent 不只是“生产不散架”，而是“更有品味”。

### 18.2 参考对象

- nexu-io/html-video 21 templates
- html-anything 10 frame
- HyperFrames official examples
- Sara repo motion-design-systems 中可抽象的 premium motion / chart storytelling
- 我们自己的 whop、珍珠品牌等测试案例

### 18.3 可能模块

#### A. Aesthetic Pattern Library

沉淀：

- hero hook patterns
- kinetic typography patterns
- product demo landing patterns
- chart storytelling patterns
- CTA hold patterns
- premium background motion patterns

#### B. Director Scoring Rubric

不是机器打分先行，而是 Agent 可解释评审：

- visual hierarchy
- density balance
- rhythm curve
- typography contrast
- transition continuity
- CTA readability
- brand atmosphere match

#### C. Benchmark Harness

对表真实模板：

```text
输入同一 brief
  ↓
Framepack 生成 frame.md / expanded-prompt
  ↓
HyperFrames 出片
  ↓
proof sheet + aesthetic rubric
  ↓
与 benchmark template 对照
```

#### D. Director Recipes

把 benchmark 拆成可复用导演配方：

- “Linear/Stripe 式 B2B 可信感”
- “Vercel 式冷感科技张力”
- “Apple 式产品揭幕节奏”
- “nexu 式高密度 demo 节奏”

### 18.4 v0.11 不应做什么

- 不做闭门造车的“AI 自评 95 分”。
- 不把 aesthetic rubric 做成硬 lint。
- 不让 Framepack 写 HTML。
- 不用单一模板限制创意。

### 18.5 v0.10.5 与 v0.11 的关系

v0.10.5 负责：

```text
片子别散架，有证据，有场记，有边界。
```

v0.11 负责：

```text
片子更像专业导演做的，而不是 Agent 拼的。
```

底盘先稳，再谈审美。

---

## 19. 建议决策

推荐路线：

1. 先确认本设计文档。
2. 收住并提交 v0.10.4 Arsenal Binding Contract。
3. 为 v0.10.5 写 implementation plan。
4. 按 TDD 执行 Phase 1 → Phase 8。
5. v0.10.5 不做版本 bump 到最后一刻。
6. v0.10.5 完成后再进入 v0.11 aesthetic benchmark 设计。

不推荐：

- 把 v0.10.5 和 v0.11 混着做。
- 直接搬 Sara 全部 skill，导致 Framepack 边界混乱。
- 一上来做像素级审美自动评分。
- 在 hooks 里自动写大量项目文件。

---

## 20. 自审

- [x] 没有让 Framepack 写 HTML。
- [x] 没有替代 HyperFrames lint/render。
- [x] v0.10.5 颗粒度拆成了可执行 phases。
- [x] v0.11 只作为展望，不混进当前实施范围。
- [x] 明确了新文件、修改文件、测试文件。
- [x] 明确了 issue taxonomy 和 severity。
- [x] 明确了脚本默认只读 / 显式写入原则。
- [x] 明确了 v0.10.4 未 commit 的风险。
