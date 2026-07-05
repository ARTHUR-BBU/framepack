"""Red-team cases for weapon gate effectiveness tests."""
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class GateBypassCase:
    case_id: str
    html: str
    should_block: bool
    reason: str


GATE_BYPASS_CASES: list[GateBypassCase] = [
    GateBypassCase(
        case_id="function_in_comment_only",
        html="""<script>// numberCountUp({ target: '#metric' })</script>""",
        should_block=True,
        reason="comments are not implementation",
    ),
    GateBypassCase(
        case_id="function_string_only",
        html="""<script>const fn = 'numberCountUp';</script>""",
        should_block=True,
        reason="strings are not implementation",
    ),
    GateBypassCase(
        case_id="function_referenced_not_called",
        html="""<script>const fn = numberCountUp;</script>""",
        should_block=True,
        reason="references are not calls",
    ),
    GateBypassCase(
        case_id="wrong_function_casing",
        html="""<script>numbercountup({ target: '#metric' });</script>""",
        should_block=True,
        reason="canonical function names are case-sensitive",
    ),
    GateBypassCase(
        case_id="fake_local_shim",
        html="""<script>function numberCountUp(){}; numberCountUp({ target: '#metric' });</script>""",
        should_block=True,
        reason="local fake shim is not loaded weapon code",
    ),
    GateBypassCase(
        case_id="empty_preset_call",
        html="""<script src="parts/references/number-count-up.js"></script><script>numberCountUp({});</script>""",
        should_block=True,
        reason="function call without preset-quality params is not enough",
    ),
    GateBypassCase(
        case_id="proper_weapon_call_with_load_marker",
        html=(
            """<script src="parts/references/number-count-up.js"></script>"""
            """<script>numberCountUp({ preset: 'luxury_metric', target: '#metric', duration: 1.4 });</script>"""
        ),
        should_block=False,
        reason="loaded canonical weapon and used preset params",
    ),
    GateBypassCase(
        case_id="terminal_redirect_index_html",
        html='python build.py > "index.html"',
        should_block=True,
        reason="terminal redirect must be caught by pre-write/stale-receipt gates",
    ),
    GateBypassCase(
        case_id="handwrite_vague_waiver",
        html="""<script>gsap.to('.metric', { opacity: 1 });</script>""",
        should_block=True,
        reason="HANDWRITE waiver must include concrete checked sources and reason",
    ),
]
