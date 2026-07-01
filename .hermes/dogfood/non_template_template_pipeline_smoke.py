from __future__ import annotations

import shutil
import sys
from pathlib import Path

DEPLOYED = Path('F:/Hermes_windows/plugins/framepack')
sys.path.insert(0, str(DEPLOYED))

from hooks.on_post_tool_call import (  # noqa: E402
    _handle_asset_intake,
    _run_pipeline_gates_and_update,
    register,
)

ROOT = Path('F:/hyperframes/.hermes/dogfood/runtime-smoke')
if ROOT.exists():
    shutil.rmtree(ROOT)
ROOT.mkdir(parents=True)

class Ctx:
    def __init__(self):
        self.messages = []
    def inject_message(self, message, role='assistant'):
        self.messages.append((role, message))


def print_section(name):
    print(f'\n=== {name} ===')

# Non-template dogfood: asset intake -> frame.md -> expanded prompt
nt = ROOT / 'non-template-url-idea'
(nt / '.framepack').mkdir(parents=True)
(nt / '.hyperframes').mkdir()
(nt / '.framepack' / 'asset-intake.md').write_text(
    '''intent: website_to_video\nsource:\n  url: https://example.com/product\nbrand:\n  logo: assets/logo.svg\n  palette: black/gold\naudio:\n  bgm: needed\nmissing:\n  - exact duration\n  - aspect ratio\n''',
    encoding='utf-8',
)
ctx = Ctx()
_handle_asset_intake(ctx, str(nt / '.framepack' / 'asset-intake.md'))
print_section('non-template after asset-intake')
print('progress exists:', (nt / '.framepack' / 'progress.md').is_file())
print('progress path:', nt / '.framepack' / 'progress.md')
print((nt / '.framepack' / 'progress.md').read_text(encoding='utf-8'))
print('injected messages:', len(ctx.messages))
print('has creation card:', any('创作小票' in msg for _, msg in ctx.messages))
print('has template card:', any('模板参数' in msg for _, msg in ctx.messages))

(nt / 'frame.md').write_text(
    '''---\ncolors:\n  primary: "#111111"\n  accent: "#d6a84f"\ntypography:\n  heading: "Inter"\nmotion:\n  energy: medium\ncontrol_profile:\n  creative_autonomy: 0.55\n  restraint_force: 0.7\n  atmosphere_density: 0.5\n  motion_dynamism: 0.45\n  weapon_reliance: 0.7\n---\n# Frame\n''',
    encoding='utf-8',
)
_run_pipeline_gates_and_update(ctx, nt, ['core.gates.control_profile.check_control_profile_consistency'])
print_section('non-template after frame.md')
print((nt / '.framepack' / 'progress.md').read_text(encoding='utf-8'))

(nt / '.hyperframes' / 'expanded-prompt.md').write_text(
    '''# Expanded Prompt\n\n## HyperFrames Time Windows\n- scene_1: data-start=0 data-duration=5 data-track-index=0\n\n## Scene 1\nConcept: product reveal with logo.\nAnimation choreography: smooth reveal.\n\n## Execution Manifest\nscene_1:\n  weapon: text-split-enter\n  code: weapons/parts/references/text-split-enter.js\n  params: { target: "#title" }\n''',
    encoding='utf-8',
)
_run_pipeline_gates_and_update(ctx, nt, [
    'core.gates.scene_continuity.check_scene_continuity',
    'core.gates.storyboard_preview.check_storyboard_preview',
])
print_section('non-template after expanded-prompt.md')
print((nt / '.framepack' / 'progress.md').read_text(encoding='utf-8'))

# Template dogfood: template-selection -> param card -> progress evidence
te = ROOT / 'template-miara'
(te / '.framepack').mkdir(parents=True)
(te / '.framepack' / 'template-selection.md').write_text(
    '''# Template Selection\ntemplate_id: miara-style-template\nparams: brand_name, tagline, cta, accent_color\n''',
    encoding='utf-8',
)
ctx2 = Ctx()
ctx2.register_hook = lambda name, handler: setattr(ctx2, 'post_tool_call', handler)
register(ctx2)
ctx2.post_tool_call(
    tool_name='write_file',
    args={'path': str(te / '.framepack' / 'template-selection.md')},
    result='ok',
)
print_section('template after template-selection')
print('param card injected:', any('brand_name' in msg or '模板参数' in msg for _, msg in ctx2.messages))
print('creation card injected:', any('创作小票' in msg for _, msg in ctx2.messages))
print((te / '.framepack' / 'progress.md').read_text(encoding='utf-8'))

# Summary flags for shell assertion
nt_progress = (nt / '.framepack' / 'progress.md').read_text(encoding='utf-8')
te_progress = (te / '.framepack' / 'progress.md').read_text(encoding='utf-8')
checks = {
    'non_template_progress_exists': (nt / '.framepack' / 'progress.md').is_file(),
    'non_template_has_creation_card': any('创作小票' in msg for _, msg in ctx.messages),
    'non_template_reaches_storyboard': '分镜导演稿 ← 当前' in nt_progress,
    'template_param_card': any('brand_name' in msg or '模板参数' in msg for _, msg in ctx2.messages),
    'template_progress_template_evidence': '素材准备 ← 当前（template-selection.md）' in te_progress,
    'template_no_creation_card': not any('创作小票' in msg for _, msg in ctx2.messages),
}
print_section('checks')
for k, v in checks.items():
    print(f'{k}: {v}')
if not all(checks.values()):
    raise SystemExit(1)
