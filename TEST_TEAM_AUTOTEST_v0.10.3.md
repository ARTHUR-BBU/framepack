# Framepack v0.10.3 测试组自动测试说明

目标：让测试组不用理解内部实现，也能稳定复测 v0.10.3 的“安检门”能力。

## 一句话结论

v0.10.3 的新增能力是 Quality Beyond Lint：

- HyperFrames lint 负责结构/编译层；
- Framepack Quality Audit 负责语义风险小票；
- 它只报告，不写、不修、不渲染 HTML。

## 推荐测试命令

在仓库根目录运行：

```bash
python scripts/test_team_v0103_auto_test.py \
  --repo F:/hyperframes \
  --case-project F:/Framepack-01-test \
  --deployed-plugin F:/Hermes_windows/plugins/framepack \
  --output-dir F:/Framepack-01-test/test-team-v0103-report
```

Windows Git Bash 可直接用上面的 POSIX 换行；如果复制到单行：

```bash
python scripts/test_team_v0103_auto_test.py --repo F:/hyperframes --case-project F:/Framepack-01-test --deployed-plugin F:/Hermes_windows/plugins/framepack --output-dir F:/Framepack-01-test/test-team-v0103-report
```

## Dry run

先看脚本会跑什么，不执行测试：

```bash
python scripts/test_team_v0103_auto_test.py --dry-run --output-dir F:/Framepack-01-test/test-team-v0103-dry-run
```

## 输出文件

脚本会生成：

```text
<output-dir>/framepack-v0103-auto-test-report.json   # 机器可读
<output-dir>/framepack-v0103-auto-test-report.md     # 人类可读
<output-dir>/case-quality-audit.json                 # 案例项目 Quality Audit 明细（提供 --case-project 时）
```

## 自动测试覆盖项

1. `source_pytest`
   - 在 `framepack-plugin/` 下运行完整 pytest。
   - 证明源码测试通过。

2. `release_version_sync`
   - 专门跑版本同步测试。
   - 检查 plugin.yaml、README、AGENTS、skill frontmatter、hook logger、compat matrix 等门牌是否都显示 0.10.3。

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
Framepack version: 0.10.3
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
- 如果自动脚本 `failed > 0`，才表示 v0.10.3 本身或环境有问题。
- BGM 许可、字体离线回退、最终视觉情绪是否对，是实际案例测试继续观察的内容，不是自动脚本能完全裁决的内容。
