"""Legacy readiness gate wrappers.

This module is intentionally thin during Phase A. Later migrations can move
individual checks here before replacing them with native gate modules.
"""

from __future__ import annotations

from core.render_readiness import *  # noqa: F401,F403 - compatibility bridge
