"""Shared readiness gate types.

During the migration, these aliases keep identity compatibility with the legacy
`core.render_readiness` public API. Once render_readiness becomes a facade, the
canonical definitions can move here without changing import sites.
"""

from __future__ import annotations

from core.render_readiness import GateResult, GateStatus, ReadinessBoard

__all__ = ["GateResult", "GateStatus", "ReadinessBoard"]
