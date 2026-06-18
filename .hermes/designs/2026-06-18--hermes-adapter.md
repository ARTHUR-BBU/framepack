# Design: Hermes Adapter — Patch Tracking & Alert

> 日期: 2026-06-18
> 状态: 待审核
> 关联: PR #48141, 方案 Y (修补追踪 + 告警)

## 问题

Framepack 对 Hermes 框架做了本地 patch（如 skills_tool.py 的 file_path 修复）。
Hermes 升级时这些 patch 可能被覆盖，导致功能静默失效。

## 设计：Marker-Based Patch Tracking

### 为什么不用文件 Hash？

文件 hash 太脆弱——Hermes 官方更新 skills_tool.py 的任何部分（修别的 bug）都会让 hash 变化，
产生假告警。

改用 **marker 检测**：在 patch 代码里插入独特注释标记，检测标记是否存在。
只有当我们的特定修改被移除时才告警，其他更新不干扰。

### Patch 注册表

`.framepack/hermes_patches.json`：

```json
{
  "version": 1,
  "patches": [
    {
      "id": "skills_tool_file_path",
      "target": "tools/skills_tool.py",
      "marker": "# FRAMEPACK-PATCH: skills_tool_file_path",
      "description": "Plugin skill_view file_path support + linked_files probe",
      "pr": "https://github.com/NousResearch/hermes-agent/pull/48141",
      "applied_date": "2026-06-18"
    }
  ]
}
```

### 检测逻辑

```
对每个 patch:
  1. target 文件不存在 → "file_missing"
  2. marker 不在文件内容里 → "marker_missing"（被升级覆盖）
  3. marker 在 → "ok"
```

### 模块结构

`core/hermes_adapter.py`：

```python
@dataclass(frozen=True)
class PatchStatus:
    patch_id: str
    status: str  # "ok" | "file_missing" | "marker_missing"
    target: str
    description: str

def load_patch_registry(project_dir: Path) -> dict
def check_patches(hermes_home: Path, registry: dict) -> list[PatchStatus]
def patch_audit_report(hermes_home: Path, project_dir: Path) -> str
```

### Report 模式

跟 quality_audit 一样——report-first，不自动修。

```
✅ All Hermes patches intact.
```

或

```
⚠️ Hermes patch drift detected (1 issue):
  [skills_tool_file_path] tools/skills_tool.py — patch marker missing (overwritten by upgrade?)
```

### 与 hyperframes_adapter 的关系

| | hyperframes_adapter | hermes_adapter |
|---|---|---|
| 检测对象 | HyperFrames CLI 能力 | Hermes 框架 patch 状态 |
| 模式 | 只读检测 | 修补追踪 + 告警 |
| 调用时机 | 命令分类时 | Framepack 激活时 |
| 输出 | CommandCategory enum | PatchStatus list + report |

### 不做的事

- ❌ 不自动 re-apply patch（Agent 决定何时 apply）
- ❌ 不 monkey-patch 运行时代码
- ❌ 不检测 patch 内容是否被 Hermes 官方部分修改（只检测 marker 在不在）

### 实现步骤

1. TDD：先写 RED 测试
2. 创建 `core/hermes_adapter.py`
3. 在本地 Hermes skills_tool.py 加 marker 注释
4. 创建 `.framepack/hermes_patches.json` 注册表
5. 集成到 hooks（Framepack 激活时自动检测）
6. GREEN + 回归测试

### 文件变更清单

- 新增 `core/hermes_adapter.py`
- 新增 `tests/test_hermes_adapter.py`
- 新增 `.framepack/hermes_patches.json`（模板）
- 修改 `F:\Hermes_windows\hermes-agent\tools\skills_tool.py`（加 marker 注释）
- 可选：修改 hooks 集成
