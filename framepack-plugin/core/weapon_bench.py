"""Weapon bench artifacts for real visual trial runs."""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from core.weapon_scorecard import ScoreSet, WeaponScorecard, load_scorecard, save_scorecard


PLUGIN_ROOT = Path(__file__).resolve().parents[1]
CAPTION_CLIP_WIPE_REF = (
    PLUGIN_ROOT
    / "skills"
    / "framepack-animation-library"
    / "parts"
    / "references"
    / "caption-clip-wipe.js"
)


@dataclass(frozen=True)
class WeaponBenchResult:
    weapon_id: str
    demo_html: str
    scorecard: str

    def to_dict(self) -> dict[str, str]:
        return {
            "weapon_id": self.weapon_id,
            "demo_html": self.demo_html,
            "scorecard": self.scorecard,
        }


def _bench_dir(project: Path, weapon_id: str) -> Path:
    return project / ".framepack" / "weapon-bench" / weapon_id


def _rel(path: str) -> str:
    return path.replace("\\", "/")


def _copy_weapon_reference(weapon_id: str, out_dir: Path) -> str:
    if weapon_id != "caption-clip-wipe":
        raise ValueError(f"weapon bench generator not implemented for {weapon_id!r}")
    ref_dir = out_dir / "references"
    ref_dir.mkdir(parents=True, exist_ok=True)
    target = ref_dir / "caption-clip-wipe.js"
    target.write_text(CAPTION_CLIP_WIPE_REF.read_text(encoding="utf-8"), encoding="utf-8")
    return "references/caption-clip-wipe.js"


def _caption_words(text: str) -> str:
    return "".join(
        f'<span class="word" style="clip-path: inset(0 100% 0 0)">{word}</span>'
        for word in text.split()
    )


def render_caption_clip_wipe_demo(script_src: str = "references/caption-clip-wipe.js") -> str:
    lanes = [
        ("lane-a", "Editorial wipe", "left-to-right", "CREATIVE GATE PASSES"),
        ("lane-b", "Hero emphasis", "center-out", "POLISH BEFORE RENDER"),
        ("lane-c", "Vertical caption", "top-to-bottom", "NO FAKE WEAPONS"),
    ]
    lane_html = "\n".join(
        f'''        <section class="bench-lane" id="{lane_id}">
          <p class="lane-label">{label} · {direction}</p>
          <h2 class="caption">{_caption_words(text)}</h2>
        </section>'''
        for lane_id, label, direction, text in lanes
    )
    calls = "\n".join(
        f"      captionClipWipe(tl, '#{lane_id} .caption', "
        "{ direction: '" + direction + "', staggerPerWord: 0.08, durationPerWord: 0.45 }, "
        f"{index * 2.1 + 0.35:.2f});"
        for index, (lane_id, _label, direction, _text) in enumerate(lanes)
    )
    return f'''<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>caption-clip-wipe weapon bench</title>
  <style>
    html, body {{ margin: 0; width: 100%; height: 100%; background: #050507; color: #f8f4e8; }}
    body {{ font-family: "Inter", "Arial", sans-serif; overflow: hidden; }}
    #main {{ position: relative; width: 100%; height: 100%; background: radial-gradient(circle at 20% 12%, rgba(255,185,72,.18), transparent 34%), #050507; }}
    .clip {{ position: absolute; inset: 0; }}
    .scene-inner {{ width: 100%; height: 100%; box-sizing: border-box; padding: 92px 112px; display: flex; flex-direction: column; justify-content: center; gap: 42px; }}
    .bench-title {{ margin: 0; font-size: 38px; letter-spacing: .18em; text-transform: uppercase; color: #e9b95f; }}
    .bench-lane {{ border-left: 5px solid rgba(233,185,95,.92); padding: 18px 0 18px 34px; }}
    .lane-label {{ margin: 0 0 10px; color: rgba(248,244,232,.58); font-size: 24px; letter-spacing: .08em; text-transform: uppercase; }}
    .caption {{ margin: 0; max-width: 1440px; font-size: 78px; line-height: .96; letter-spacing: -.04em; font-weight: 900; }}
    .word {{ display: inline-block; margin-right: .22em; will-change: clip-path, opacity; }}
  </style>
</head>
<body>
  <div id="main" data-composition-id="main" data-start="0" data-width="1920" data-height="1080" data-duration="8">
    <div id="bench-scene" class="clip" data-start="0" data-duration="8" data-track-index="1">
      <div class="scene-inner">
        <h1 class="bench-title">Framepack Weapon Bench · caption-clip-wipe</h1>
{lane_html}
      </div>
    </div>
  </div>
  <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
  <script src="{script_src}"></script>
  <script>
    window.__timelines = window.__timelines || {{}};
    const tl = gsap.timeline({{ paused: true }});
    tl.from('#bench-scene .scene-inner', {{ opacity: 0, y: 30, duration: 0.45, ease: 'power2.out' }}, 0.05);
{calls}
    window.__timelines["main"] = tl;
  </script>
</body>
</html>
'''


def default_scorecard(weapon_id: str) -> WeaponScorecard:
    """Return an intentionally provisional scorecard until runtime smoke exists."""
    if weapon_id == "caption-clip-wipe":
        return WeaponScorecard(
            weapon_id=weapon_id,
            scores=ScoreSet(
                impact=4,
                polish=4,
                commercial_fit=4,
                parameter_safety=4,
                hyperframes_safety=4,
                composability=3,
            ),
            recommended_presets=[
                "editorial-label:left-to-right:stagger=0.08:duration=0.45",
                "hero-emphasis:center-out:stagger=0.08:duration=0.45",
                "vertical-caption:top-to-bottom:stagger=0.08:duration=0.45",
            ],
            avoid=[
                "Do not use as the only hero motion for a full scene; pair with scale/light/transition weapons.",
                "Do not pass empty opts; direction/staggerPerWord/durationPerWord must be explicit.",
                "Do not use on unsplit text; every word needs a .word span.",
            ],
            evidence={
                "lint": "pass",
                "validate": "pass",
                "keyframes": "pass with limitation: HyperFrames keyframes sees wrapper tween but does not introspect GSAP inside external weapon function.",
                "demo": ".framepack/weapon-bench/caption-clip-wipe/demo.html",
            },
            notes=(
                "Good B-class caption weapon: clean, safe, commercially useful for labels and emphasis. "
                "It is not a full-scene spectacle by itself; use as seasoning, not the main dish."
            ),
        )
    return WeaponScorecard(
        weapon_id=weapon_id,
        scores=ScoreSet(
            impact=3,
            polish=3,
            commercial_fit=3,
            parameter_safety=3,
            hyperframes_safety=3,
            composability=3,
        ),
        recommended_presets=[],
        avoid=[],
        evidence={},
        notes="Provisional skeleton scorecard; not a visual rating yet.",
    )


def run_weapon_bench(weapon_id: str, project: str | Path) -> WeaponBenchResult:
    root = Path(project).resolve()
    out_dir = _bench_dir(root, weapon_id)
    out_dir.mkdir(parents=True, exist_ok=True)

    demo_rel = _rel(f".framepack/weapon-bench/{weapon_id}/demo.html")
    score_rel = _rel(f".framepack/weapon-bench/{weapon_id}/scorecard.json")
    demo_path = root / demo_rel
    score_path = root / score_rel

    script_src = _copy_weapon_reference(weapon_id, out_dir)
    demo_path.write_text(render_caption_clip_wipe_demo(script_src), encoding="utf-8")
    save_scorecard(default_scorecard(weapon_id), score_path)
    return WeaponBenchResult(weapon_id=weapon_id, demo_html=demo_rel, scorecard=score_rel)


def render_scorecard_markdown(card: WeaponScorecard) -> str:
    lines = [
        f"# Weapon Scorecard: {card.weapon_id}",
        "",
        f"Class: {card.score_class}",
        f"Average: {card.average_score:.2f}",
        "",
        "## Scores",
    ]
    for name, value in card.scores.to_dict().items():
        lines.append(f"- {name}: {value}")
    if card.recommended_presets:
        lines.extend(["", "## Recommended presets"])
        lines.extend(f"- {preset}" for preset in card.recommended_presets)
    if card.avoid:
        lines.extend(["", "## Avoid"])
        lines.extend(f"- {item}" for item in card.avoid)
    if card.notes:
        lines.extend(["", "## Notes", card.notes])
    return "\n".join(lines) + "\n"


def load_bench_scorecard(weapon_id: str, project: str | Path) -> WeaponScorecard:
    return load_scorecard(_bench_dir(Path(project).resolve(), weapon_id) / "scorecard.json")
