"""HyperFrames catalog component discovery.

P1 had a small builtin catalog table. P2 adds discovery from project/runtime
manifests so Framepack can see components that HyperFrames exposes locally.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any


@dataclass(frozen=True)
class CatalogComponent:
    """Discovered catalog component metadata."""
    name: str
    description: str = ""
    use_cases: list[str] = field(default_factory=list)
    source: str = ""


def _read_json(path: Path) -> Any | None:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None


def _component_from_obj(name: str, obj: Any, source: Path) -> CatalogComponent | None:
    if not name:
        return None
    if isinstance(obj, dict):
        description = str(obj.get("description") or obj.get("summary") or "")
        use_cases_raw = obj.get("use_cases") or obj.get("tags") or obj.get("keywords") or []
        if isinstance(use_cases_raw, str):
            use_cases = [use_cases_raw]
        elif isinstance(use_cases_raw, list):
            use_cases = [str(x) for x in use_cases_raw]
        else:
            use_cases = []
    else:
        description = ""
        use_cases = []
    return CatalogComponent(
        name=str(name),
        description=description,
        use_cases=use_cases,
        source=str(source).replace("\\", "/"),
    )


def _extract_components(data: Any, source: Path) -> list[CatalogComponent]:
    components: list[CatalogComponent] = []
    if not isinstance(data, dict):
        return components

    raw = data.get("components")
    if isinstance(raw, list):
        for item in raw:
            if not isinstance(item, dict):
                continue
            name = item.get("name") or item.get("id")
            comp = _component_from_obj(str(name) if name else "", item, source)
            if comp:
                components.append(comp)
    elif isinstance(raw, dict):
        for name, meta in raw.items():
            comp = _component_from_obj(name, meta, source)
            if comp:
                components.append(comp)

    # hyperframes.json commonly nests under catalog.components
    catalog = data.get("catalog")
    if isinstance(catalog, dict):
        nested = catalog.get("components")
        if isinstance(nested, dict):
            for name, meta in nested.items():
                comp = _component_from_obj(name, meta, source)
                if comp:
                    components.append(comp)
        elif isinstance(nested, list):
            for item in nested:
                if not isinstance(item, dict):
                    continue
                name = item.get("name") or item.get("id")
                comp = _component_from_obj(str(name) if name else "", item, source)
                if comp:
                    components.append(comp)

    return components


def discover_catalog_components(project_dir: str | Path) -> list[CatalogComponent]:
    """Discover HyperFrames catalog components from known local manifests.

    Sources searched, in priority order:
    - .hyperframes/catalog.json
    - hyperframes.json
    - node_modules/@hyperframes/catalog/catalog.json
    """
    project = Path(project_dir)
    sources = [
        project / ".hyperframes" / "catalog.json",
        project / "hyperframes.json",
        project / "node_modules" / "@hyperframes" / "catalog" / "catalog.json",
    ]
    found: list[CatalogComponent] = []
    seen: set[str] = set()
    for source in sources:
        if not source.is_file():
            continue
        data = _read_json(source)
        if data is None:
            continue
        for comp in _extract_components(data, source):
            if comp.name in seen:
                continue
            seen.add(comp.name)
            found.append(comp)
    return found


def merge_discovered_catalog(
    builtin: dict[str, dict],
    discovered: list[CatalogComponent],
) -> dict[str, dict]:
    """Merge discovered components into builtin catalog metadata.

    Builtin entries win on name conflicts; discovered entries are additive.
    """
    merged = {name: dict(meta) for name, meta in builtin.items()}
    for comp in discovered:
        if comp.name in merged:
            continue
        merged[comp.name] = {
            "description": comp.description,
            "use_cases": comp.use_cases,
            "source": comp.source,
        }
    return merged
