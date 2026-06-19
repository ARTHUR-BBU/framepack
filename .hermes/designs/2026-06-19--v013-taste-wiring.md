# v0.13 品味系统接线设计

**日期**: 2026-06-19
**状态**: 待批准
**前置**: 方向5 武器架构重构已完成（424 tests passed）

## 问题

品味系统目前完全悬空——三件套（标本、词表、审计器）代码都在，但零运行时消费者。

打比方：你请了品酒师（审计器），给了他品酒手册（词表）和六瓶参考酒（标本）。但餐厅上菜流程里从来没人叫品酒师来尝菜。

## 方案：接线——让品酒师上岗

### 接线点

quality_audit.py 的 `audit_project()` 函数是中央入口，已经串联了 7 个审计函数。在这里加第 8 个：`_audit_taste()`。

```
audit_project()
├── _audit_arsenal()           ← 武器库完整性
├── _audit_html_guardrails()   ← HTML 结构铁律
├── _audit_parameter_drift()   ← 参数漂移（p7 刚改）
├── _audit_font_dependencies() ← 字体依赖
├── _audit_visibility()        ← 可见性风险
├── _audit_timeline()          ← 时间线台账
├── _audit_lint_cache()        ← lint 缓存
└── _audit_taste()             ← 【新增】品味审计
```

### severity 映射（数据驱动，不硬编码）

品酒师的舌头有三个灵敏度档次，对应我们的严重度系统：

| 品酒师说 | 对应我们的 | 含义 | 打比方 |
|---------|-----------|------|--------|
| risk（风险） | P1 | 有问题，建议改 | "这道菜配这个酒不太对" |
| suggestion（建议） | P2 | 可以更好 | "如果加一点 XXX 会更棒" |
| note（提示） | P3 | 知道就好 | "这道菜用了 X 流派的做法" |

**不做 P0 阻断**——品味问题目前不挡门禁。Agent 会看到品味建议，但不会被拦住。P0 阻断留给后续方向 C 升级。

### 接线内容

1. **quality_audit.py 加 `_audit_taste` 函数**
   - 调用 taste_audit.audit_project()
   - 用 severity 映射表转换 TasteAuditIssue → QualityIssue
   - 保留 suggestion 字段（品味审计独有的"改法建议"）

2. **新增标本 ID 验证**
   - taste_audit 目前不验证 `reference_dna: xxx` 的 ID 是否存在
   - 接线时加这个检测：Agent 写了不存在的标本 ID → P1 risk

### 不做的事

- 不改 taste_audit.py 的检测逻辑（只接线，不改行为）
- 不加 P0 阻断（留给方向 C）
- 不扩展标本数据（留给方向 B）
- 不改 severity 分级标准（risk/suggestion/note 三档已经合理）

## 测试计划

1. TDD：先写失败测试（品味审计结果不出现在 quality_audit 报告里）
2. 实现 `_audit_taste` + severity 映射
3. 测试 severity 映射正确（risk→P1, suggestion→P2, note→P3）
4. 测试标本 ID 验证（有效 ID 不报，无效 ID 报 P1）
5. 全量回归验证
