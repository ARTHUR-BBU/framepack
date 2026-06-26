# Built-in Template Menu Experience Plan

1. Add RED tests for menu formatting and builtin miara installation.
2. Implement `format_template_menu()` in `core/templates/arsenal.py`.
3. Implement `core/templates/builtin.py` with:
   - `list_builtin_templates()`
   - `install_builtin_template()`
4. Add CLI commands:
   - `menu --project <dir> [--intent <text>]`
   - `install-builtin <template_id> --project <dir>`
5. Add bundled `templates/bundles/miara-style-template` without mp4 renders.
6. Verify:
   - targeted template tests
   - full plugin suite
   - install-builtin → menu → recommend → select smoke
   - deploy sync + MD5
   - subagent test once; fallback if provider fails
