# hyperframes 开发工程 — 工作交接台

> 新对话打开后，读完本文就能接上。
> 这不是历史日志，是当前手台；旧状态靠 Git 历史追溯。

## 当前状态

<!-- ⚠️ 此区块每次会话结束时整块替换。不要在上面追加。 -->

**阶段**: v0.14.0 权重控制系统 + Sprite Forge 全部开发完成，506 passed 零回归，待实战测试

**分支**: `main`
**源码版本**: plugin.yaml = 0.14.0 ✅
**测试**: 506 passed / 1 skipped ✅ 零回归（开发环境 + 部署环境双确认，content hash 一致）
**最新 commit**: 版本号 bump release commit

### v0.14.0 交付内容（全部完成）

| Phase | 内容 | 状态 |
|-------|------|------|
| A | ControlProfile 五行权重 + render_directive() | ✅ |
| B | Hook 神经通路穿透（frame.md 注入 + expanded-prompt 一致性检查 + caution_motion 兼容） | ✅ |
| C | quality_audit 接入权重一致性检查（P2 需解释） | ✅ |
| D | director skill Phase 0.5 试菜流程 + guardrails 权重系统规则 | ✅ |
| E | Sprite Forge（process_sprite.py + make_layout_guide.py + 知识库 + SKILL.md + 武器衔接） | ✅ |
| F | 版本号 bump 0.12.0→0.14.0 + 部署同步 + CONTEXT 更新 | ✅ |

### 五行权重系统（v0.14 核心）

五个正交权重，相生相克涵盖所有创意控制：
- 木 creative_autonomy — 创意自主度
- 金 restraint_force — 克制力
- 火 atmosphere_density — 氛围密度
- 水 motion_dynamism — 动作张力
- 土 weapon_reliance — 武器依赖度

流程：试菜（Phase 0.5）→ 自定权重 → 写入 frame.md control_profile → Hook 神经通路穿透到末梢 → 权重一致性检查（P2）

### Sprite Forge（v0.14 能力升级）

不集成生图工具，只出 prompt 让用户外出生成 → 拿回来后 Framepack 做后处理（裁切/去背/装订）→ 交给 sprite-animation 武器播放。
- `skills/framepack-sprite-forge/scripts/process_sprite.py` — 品红去背+切帧+QC
- `skills/framepack-sprite-forge/scripts/make_layout_guide.py` — 布局参考图
- `skills/framepack-sprite-forge/references/` — prompt 规则 + 素材类型指南

### 部署同步

源码 `F:/hyperframes/framepack-plugin/` 与部署 `F:/Hermes_windows/plugins/framepack/` 全量 content hash 验证一致（203 文件，0 mismatch）。

## 设计文档

- `F:/hyperframes/.hermes/designs/2026-06-19--v014-weight-control-system.md` — 权重控制系统设计（五行框架）
- `F:/hyperframes/.hermes/designs/2026-06-19--sprite-forge-integration.md` — Sprite Forge 集成设计
- `F:/hyperframes/.hermes/designs/2026-06-19--v013-taste-wiring.md` — v0.13 品味接线设计（已实现）

## 关键路径

1. ~~v0.13 武器架构重构~~ ✅
2. ~~v0.13 品味接线~~ ✅
3. ~~v0.14 权重控制系统~~ ✅
4. ~~v0.14 Sprite Forge~~ ✅
5. ~~版本 bump 0.14.0 + 部署同步~~ ✅
6. **实战测试** ← 下一步

## 文件索引

- 源码: `F:/hyperframes/framepack-plugin/`
- 部署: `F:/Hermes_windows/plugins/framepack/`
- 权重核心: `core/control_profile.py` + `core/restraint_audit.py`
- Hook 穿透: `hooks/on_post_tool_call.py`（_build_weight_directive + _build_weight_consistency_report）
- Sprite Forge: `skills/framepack-sprite-forge/`
- 独立 skill: `F:/Hermes_windows/skills/software-development/framepack/SKILL.md`
