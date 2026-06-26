# Built-in Template Menu Experience

## Verdict

把 Template Arsenal 的“后厨能力”接成“前厅点菜”：

1. Agent 能输出一张用户可读的模板菜单。
2. 插件自带第一套可安装模板：`miara-style-template`。
3. 用户在任意测试项目里可以一条命令安装内置模板，再 recommend/select 实测。

## Scope

### 做

- `format_template_menu(project_dir, user_intent=None, limit=3)`：把 registered/recommend 的结构化结果格式化成用户可读菜单。
- CLI `menu --project <dir> [--intent <text>]`：给 Agent/用户直接看菜单。
- `install_builtin_template(project_dir, template_id)`：从插件内置 bundle 复制到项目 `.framepack/templates/<id>` 并注册进 `.framepack/arsenal.json`。
- CLI `install-builtin miara-style-template --project <dir>`。
- 内置 bundle：`framepack-plugin/templates/bundles/miara-style-template/`，包含 `TEMPLATE_CARD.md`、`index.html`、必要 assets/source notes，不包含 render mp4。

### 不做

- 不让 Framepack 写/渲染 HTML；还是 HyperFrames 接管。
- 不自动替用户选模板；菜单只推荐，用户决定。
- 不提交测试工作台 render mp4。

## UX

```bash
python scripts/framepack_template.py install-builtin miara-style-template --project <project>
python scripts/framepack_template.py menu --project <project> --intent "帮我做一个产品发布品牌讲解视频"
python scripts/framepack_template.py select miara-style-template --project <project> --brief "..." --param brand_name=Miara
```

菜单输出示意：

```text
📋 Framepack template menu

★ Miara Style Template (miara-style-template) — score=4
  适合: product launch, brand explainer
  参数: brand_name, tagline, accent_color
  为什么推荐: matched product launch, brand explainer

下一步: framepack_template.py select miara-style-template --project <project> --brief "..."
```

## Tests

- Core tests:
  - menu formatter renders registered templates and recommendation reasons.
  - builtin install copies bundle, registers template_suite, is idempotent.
- CLI tests:
  - `menu` outputs readable template menu.
  - `install-builtin` installs/registers miara.
- Smoke:
  - temp project install-builtin → menu → recommend → select.
  - real sample package remains independently green.
