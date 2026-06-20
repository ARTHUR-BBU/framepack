# hyperframes 开发工程 — 工作交接台

> 新对话打开后，读完本文就能接上。
> 这不是历史日志，是当前手台；旧状态靠 Git 历史追溯。

## 当前状态

<!-- ⚠️ 此区块每次会话结束时整块替换。不要在上面追加。 -->

**阶段**: v0.14.2 已发版 ✅ + Sprite Forge 火焰实战验证（SF-AK1/AK2 两轮修复）
**分支**: `main`
**源码版本**: plugin.yaml = 0.14.2 ✅
**测试**: 548 passed / 1 skipped ✅ 零回归（v0.14.1 的 541 → +7 erode 测试）
**部署同步**: 源码与部署目录 md5 全一致 ✅（最近一次同步 5 文件，2026-06-20）

### 上次做了什么

Sprite Forge 动画覆盖范围头脑风暴 → 火焰循环实战验证 → 发现并修复 2 个色键健壮性缺口：

- ✅ **头脑风暴 7 个战场**：有机特效/粒子爆发/角色/漫画特效/天气/风格化UI/材质。
  核心判断"形状在变用 GSAP，内容在变用 Sprite Forge"。用户选先做实战验证。
- ✅ **火焰循环实战**（第 1 个验证方向）：出图纸 → 用户生图（2×4, 8 帧）→ 后处理。
  暴露角色 sprite 不会遇到的"辉光过渡区卡色键"问题。
- ✅ **SF-AK1 修复**（commit `103b255`）：生图工具画 magenta 是 (230,45,183) 而非
  (255,0,255)，硬编码阈值 30 够不着 → 加 `detect_background_color()` 自适应检测。
  TDD 全流程，7 测试，真实图验证 56.8% transparent。
- ✅ **版本 bump 0.14.1 → 0.14.2**（commit `068b2f0`）：4-phase 精细处理，
  23 文件同步，零版本漂移。
- ✅ **SF-AK2 修复**（commit `52a2ab1`）：火焰辉光外缘与品红背景的过渡区
  （距离 30-200px 的粉品红像素）卡在色键灰色地带 → 新增 `erode_alpha()` alpha
  通道形态学收缩 + prompt-rules.md 规则 8（辉光最小化，两层防线）。
  TDD 全流程，7 测试，真实火焰图 erode=6 后品红边缘 19.8%→0.8%，深色背景
  合成 vision 确认生产可用。独立 reviewer PASS（0 must-fix）。
- ✅ **Sprite Forge 文档扩展**：SKILL.md 加 erode CLI/参数表/流水线说明；
  sheet-modes.md 推断速查表加 erode 列 + 火焰行；prompt-rules.md 规则 8。

### 下次要做什么

Sprite Forge 动画覆盖范围还剩 2 个验证方向（用户说"等等吧"）：
- **爆炸/烟花**（粒子爆发类）—— 验证"结构每帧不同"，一次性播放（loopCount=1）
- **速度线**（漫画特效类）—— 验证"风格化图形"，最轻量
- 跑通后用真实数据锚点更新 sheet-modes.md 分类表（当前是游戏化分类，
  头脑风暴发现应按视频制作需求重组：有机特效/粒子/漫画特效优先级最高）

**deferred**：
- `remove_bg_magenta` 重命名（名不副实了，属 refactor commit 范畴）

### commit 链（v0.14.2 线）

```
52a2ab1 fix(sprite-forge): alpha erosion for glow-fringe (SF-AK2)
068b2f0 release: bump v0.14.1 → v0.14.2
103b255 fix(sprite-forge): adaptive chroma key for off-magenta (SF-AK1)
6f21092 [verified] release v0.14.1 — production hardening
```

### Sprite Forge 实战产物

`F:/hyperframes/assets/sprites/` 下有两个真实验证案例：
- `walk-cycle-pixel-demo/` — 角色走路循环（SF-AK1 验证用）
- `fire-loop-demo/` — 火焰循环（SF-AK2 验证用），含 erode-0/2/4/6/8/10 对比产物
  和 `composite-compare.png`（深色背景合成对比图）
- 注意：assets/ 未纳入 git（在仓库上层）

## 设计文档

- `F:/hyperframes/.hermes/designs/2026-06-19--v014-weight-control-system.md` — 权重控制系统设计
- `F:/hyperframes/.hermes/designs/2026-06-19--sprite-forge-integration.md` — Sprite Forge 集成设计

## 文件索引

- 源码: `F:/hyperframes/framepack-plugin/`
- 部署: `F:/Hermes_windows/plugins/framepack/`
- 权重核心: `core/control_profile.py` + `core/restraint_audit.py`
- Hook 穿透: `hooks/on_post_tool_call.py`（_build_weight_directive + _build_weight_consistency_report）
- Sprite Forge: `skills/framepack-sprite-forge/`
- 独立 skill: `F:/Hermes_windows/skills/software-development/framepack/SKILL.md`
- 测试报告: `F:/hyperframes/framepack-e2e-test/reports/`

## 开发铁律提醒

- TDD: RED → GREEN → 全量回归 → 部署同步(md5) → git commit
- 部署同步必须用 content hash（md5），不能只比 file size
- 改完 PLUGIN 文件必须同步到 `F:/Hermes_windows/plugins/framepack/`
- 修复 skill 用到问题应 patch skill_manage
