# Framepack v0.11.0 测试组自动测试说明

目标：让测试组不用理解内部实现，也能稳定复测 v0.11.0 的“安检门”能力。

## 一句话结论

v0.11.0 的新增能力是 Kinetic Taste Engine：语义品味审计（fade-stack 单调性、surprise 操作符密度、kinetic grammar 连贯性），配以 taste specimens 参考校准和 Director 品味参考文档。同时验证了 HyperFrames 0.6.104 兼容性，修复了 environment doctor 的 cwd 探测问题。

- HyperFrames lint 负责结构/编译层；
- Framepack Quality Audit 负责语义风险小票；
- 它只报告，不写、不修、不渲染 HTML。

## 推荐测试命令：A 档，插件基准验收

在仓库根目录运行。这个命令不带 `--case-project`，只验证 v0.11.0 插件基准是否可信：

```bash
python scripts/test_team_v0110_auto_test.py \
  --repo F:/hyperframes \
  --deployed-plugin F:/Hermes_windows/plugins/framepack \
  --output-dir test-team-reports/v0.11.0
```

Windows Git Bash 可直接用上面的 POSIX 换行；如果复制到单行：

```bash
python scripts/test_team_v0110_auto_test.py --repo F:/hyperframes --deployed-plugin F:/Hermes_windows/plugins/framepack --output-dir test-team-reports/v0.11.0
```

预期摘要：

```text
passed=4
failed=0
skipped=1
```

这里的 `skipped=1` 是正常的：没有提供 `--case-project` 时，`case_quality_audit` 会跳过。

## 可选测试命令：B/C 档，案例项目审计

只有当测试组已经准备好“完整 case project”时，才加 `--case-project`：

```bash
python scripts/test_team_v0110_auto_test.py \
  --repo F:/hyperframes \
  --case-project <完整case项目路径> \
  --deployed-plugin F:/Hermes_windows/plugins/framepack \
  --output-dir <报告输出目录>
```

此时预期脚本摘要通常是：

```text
passed=5
failed=0
skipped=0
```

注意：`passed=5` 只代表自动脚本和审计 CLI 成功运行；如果 case 的 Quality Audit 报 P0/P1，那是“安检小票发现了案例风险”，需要再判断是案例缺件、HTML 语义问题、还是 Framepack 需要修。

`F:/Framepack-01-test` 当前不能作为完整命题视频 case。它可以用于“缺件输入测试”（例如验证 audit 能报 `arsenal_missing`），但不能代表真实视频项目质量。

## Dry run

先看脚本会跑什么，不执行测试：

```bash
python scripts/test_team_v0110_auto_test.py --dry-run --output-dir F:/Framepack-01-test/test-team-v0110-dry-run
```

## 输出文件

脚本会生成：

```text
<output-dir>/framepack-v0110-auto-test-report.json   # 机器可读
<output-dir>/framepack-v0110-auto-test-report.md     # 人类可读
<output-dir>/case-quality-audit.json                 # 案例项目 Quality Audit 明细（提供 --case-project 时）
```

## 自动测试覆盖项

1. `source_pytest`
   - 在 `framepack-plugin/` 下运行完整 pytest。
   - 证明源码测试通过。

2. `release_version_sync`
   - 专门跑版本同步测试。
   - 检查 plugin.yaml、README、AGENTS、skill frontmatter、hook logger、compat matrix 等门牌是否都显示 0.11.0。

3. `quality_audit_cli`
   - 检查 `scripts/framepack_quality_audit.py` CLI 可用。

4. `deployed_smoke`
   - 从部署目录 `F:/Hermes_windows/plugins/framepack` import 新模块。
   - 证明不是只改源码，活体插件也能加载。

5. `case_quality_audit`
   - 对真实测试项目运行 Quality Audit。
   - 默认应能复现测试组看到的 semantic issues，例如 stale arsenal、data-hf-id、武器参数漂移等。

## 如何判定通过

看 JSON/Markdown summary：

```json
"summary": {
  "passed": N,
  "failed": 0,
  "skipped": M
}
```

- `failed = 0`：自动测试脚本通过。
- `skipped` 不一定是失败：例如没有提供 `--case-project`，案例审计会跳过。
- `case_quality_audit` 本身 exit 0 不表示案例“完美”，只表示审计工具成功运行；案例里有 P0/P1 issues 是测试输入，不是脚本失败。

## 实际案例测试建议

自动脚本只测“安检门能不能工作”。测试组还需要继续跑真实用户案例：

1. 准备一个带 `frame.md`、`.hyperframes/expanded-prompt.md`、`index.html`、`.framepack/arsenal.json` 的项目。
2. 运行：

```bash
python F:/hyperframes/framepack-plugin/scripts/framepack_quality_audit.py <case-project> --format markdown --output <case-project>/framepack-quality-audit.md
```

3. 再运行 HyperFrames 自己的链路：

```bash
npx hyperframes lint
npx hyperframes validate
npx hyperframes snapshot --at 2,8,18,30,41,52
npx hyperframes render
```

4. 对照检查：
   - lint 是否 0 errors；
   - Quality Audit 是否抓出 stale arsenal / manifest drift / data-hf-id；
   - snapshot 是否有黑屏、元素错位、final hold 丢失；
   - render 后用 ffprobe 检查 duration/resolution/frame count。

## 测试组报告模板

请测试组报告这几项：

```text
Framepack version: 0.11.0
Repo commit:
Auto-test command:
Auto-test summary: passed=?, failed=?, skipped=?
Case project:
Quality Audit summary: P0=?, P1=?, P2=?, P3=?, total=?
HyperFrames lint result:
Snapshot result:
Render result:
Manual findings:
```

## 注意事项

- Quality Audit 是“安检小票”，不是替代 lint。
- 如果 Quality Audit 报 P0/P1，不等于脚本失败；它是在发现真实风险。
- 如果自动脚本 `failed > 0`，才表示 v0.11.0 本身或环境有问题。
- BGM 许可、字体离线回退、最终视觉情绪是否对，是实际案例测试继续观察的内容，不是自动脚本能完全裁决的内容。
