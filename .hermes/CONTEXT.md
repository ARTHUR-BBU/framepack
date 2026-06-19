# hyperframes 开发工程 — 工作交接台

> 新对话打开后，读完本文就能接上。
> 这不是历史日志，是当前手台；旧状态靠 Git 历史追溯。

## 当前状态

<!-- ⚠️ 此区块每次会话结束时整块替换。不要在上面追加。 -->

**阶段**: v0.13.0 武器架构重构 + 品味接线全部完成，测试组验收 PASS，待真实视频项目测试 + 版本发布

**分支**: `main`
**源码版本**: plugin.yaml = 0.12.0（v0.13.0 尚未 bump）
**测试**: 432 passed / 1 skipped ✅ 零回归（开发环境 + 部署环境双确认）
**最新 commit**: 待提交 — 品味系统接线（taste_audit → quality_audit 桥接）

### v0.13.0 进度（全部完成）

| 步骤 | 内容 | 状态 |
|------|------|------|
| P1-P3 | 10 件自建DOM型武器 → 元素注入型（21/21 合规） | ✅ |
| P4 | 注册表补全 3 个 block 武器 + SKILL.md 架构契约文档 | ✅ |
| P5 | manifest_weapon_not_called P1→P0 阻断 | ✅ |
| P6 | taste vocabulary 接线（消除影子词表） | ✅ |
| P7 | 参数漂移 3x 阈值检测（P1→P2） | ✅ |
| **品味接线** | taste_audit 接入 quality_audit（方向A） | **✅ 完成** |

### 品味系统接线（已完成）

**设计文档**: `F:/hyperframes/.hermes/designs/2026-06-19--v013-taste-wiring.md`

**实现内容**:
1. `core/quality_audit.py` 新增 `TASTE_SEVERITY_MAP`（risk→P1, suggestion→P2, note→P3）
2. `_validate_specimen_ids()` — 解析 frame.md 的 reference_dna 列表，无效 ID → P1
3. `_audit_taste()` — 桥接 taste_audit.audit_project() 到 quality pipeline，保留 suggestion 到 details
4. audit_project() 第 8 个审计函数（_audit_lint_cache 之后）
5. 8 个新测试（test_quality_audit_taste_bridge.py），覆盖三档映射 + 标本验证 + suggestion 保留 + summary 集成
6. 不做 P0 阻断（留给方向 C），不改 taste_audit.py 检测逻辑

**部署**: 已同步到 F:/Hermes_windows/plugins/framepack/（content hash 双确认）

### 测试组验收（v0.13 品味接线）

**报告**: `F:/Framepack-01-test/reports/v0.13/taste-wiring-test-report.md` + `.json`
**结论**: 品味接线功能验收 PASS（8/8 自动 + 11/11 手动全通过）

**暴露的部署同步问题**（已修复）:
- 根因: P1-P7 武器重构的 37 个文件未同步到部署目录（size 相同但内容不同的文件被 size diff 漏检）
- 关键 case: `test_quality_audit_cli.py` 开发源码用 `travelDistance:'200px'`（3.33x>3x→drift），部署目录残留旧数据 `'120px'`（2x<3x→no drift），导致测试在部署环境失败
- 修复: content hash 对比全量同步 37 文件，部署目录 432 passed 确认一致
- 教训: 部署同步必须用 content hash，不能只比 file size

## v0.13.0 武器架构重构总览

### 做了什么

v0.12.0 的 21 件武器中有 10 件是"自建DOM型"——它们自己 createElement 建结构，跟 HyperFrames 的"先搭骨架再填动画"铁律打架。全部重构为"元素注入型"：Agent 先写 HTML 结构，武器只负责动画。

### 重构的 10 件武器

| 武器 | 类型 | 行数 | commit |
|------|------|------|--------|
| bg-blur-mask | part | 62 | P1 |
| anime-text-split | part | 66 | P2 |
| typewriter-cursor | part | 89 | P2 |
| macos-notification | part | 86 | P2 |
| light-leak-carma | part | 94 | P2 |
| card-cascade-reveal | block | 139 | P2 |
| hero-3d-device-spin | block | 112 | P2 |
| particle-blob-bg | part | 83 | P3 |
| sticky-flowchart | block | 110 | P3 |
| data-chart-editorial | block | 133 | P3 |

### 三把尺子（永久护栏）

1. **武器架构契约测试** — 扫描每件武器 .js，发现 createElement 立即报红
2. **函数名一致性测试** — 注册表的函数名必须和 .js 定义完全匹配
3. **P0 阻断门禁** — Agent 跳过武器函数自己手写，门禁挡住

### p6 影子词表消除

- taste_grammar.py 的 TASTE_MOVES 加了 energy_level 元数据
- 新增 `moves_by_energy_level()` 作为唯一查询入口
- taste_audit.py 不再硬编码 high_energy_moves 集合

### p7 参数漂移阈值

- 数值参数: 3x 差异才报漂移（P2）
- CSS 单位 (px/%/s/deg): 先提取数值再比阈值
- 非数值参数 (ease/color): 精确匹配
- severity: P1→P2（建议级别，不阻断）

## 版本发布计划

全部完成后:
1. ~~品味系统接线（方向A）~~ ← 当前
2. 真实视频项目测试（验证 Agent 能用之前用不了的武器）
3. 版本 bump 0.12.0→0.13.0 + changelog + tag + release

## 关键路径

1. ~~P1-P7 武器架构重构~~ ✅
2. ~~品味系统接线~~ ✅
3. ~~部署同步修复（content hash 全量）~~ ✅
4. ~~测试组验收~~ ✅ PASS
5. **真实视频项目测试** ← 下一步
6. 版本发布 v0.13.0

## 文件索引

- 源码: `F:/hyperframes/framepack-plugin/`
- 部署: `F:/Hermes_windows/plugins/framepack/`
- 品味接线设计: `F:/hyperframes/.hermes/designs/2026-06-19--v013-taste-wiring.md`
- 武器重构设计: `F:/hyperframes/.hermes/designs/2026-06-18--v0130-weapon-architecture-refactor.md`
- 测试报告（v0.12.0 独立验收）: `F:/Framepack-01-test/reports/v0.12.0/framepack-v0120-test-report.md`
- 独立 skill: `F:/Hermes_windows/skills/software-development/framepack/SKILL.md`
