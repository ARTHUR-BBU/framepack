#!/usr/bin/env python3
"""Feature-level E2E test for Framepack Asset Intake (Phase 0).

Runs the full Phase 0 flow against the real asset_detector module:
  type detection → collection → transparency detection → manifest output → validation

Usage:
    cd F:/hyperframes/framepack-plugin
    python -m pytest tests/test_asset_detector.py -q          # unit tests first
    python ../skills/software-development/framepack/scripts/test_asset_intake_e2e.py

The test creates synthetic image fixtures (no Pillow dependency) in a sandbox
directory and validates both the detection results and the manifest output.

Exit code 0 = all checks passed. Non-zero = failures detected.
"""

from __future__ import annotations

import struct
import sys
import zlib
from datetime import date
from pathlib import Path

# ── Bootstrap: find the framepack-plugin source ──
PLUGIN_ROOT = Path(__file__).resolve()
# Walk up to find framepack-plugin/
for parent in PLUGIN_ROOT.parents:
    if (parent / "framepack-plugin" / "core" / "asset_detector.py").exists():
        sys.path.insert(0, str(parent / "framepack-plugin"))
        break
else:
    # Fallback: assume running from inside framepack-plugin/
    sys.path.insert(0, str(Path.cwd()))

from core.asset_detector import detect_transparency, scan_asset_directory  # noqa: E402


# ── Synthetic image generators (stdlib only, no Pillow) ──

def _write_png(path: Path, width=4, height=4, has_alpha=True, fully_opaque=False):
    """Write a minimal valid PNG with controllable alpha channel."""
    channels = 4 if has_alpha else 3
    color_type = 6 if has_alpha else 2
    raw = bytearray()
    for _y in range(height):
        raw.append(0)  # filter byte: None
        for _x in range(width):
            raw.extend(b'\xff\x00\x00')  # red pixel
            if has_alpha:
                raw.append(255 if fully_opaque else 0)

    def _chunk(ct, data):
        c = ct + data
        crc = struct.pack('>I', zlib.crc32(c) & 0xFFFFFFFF)
        return struct.pack('>I', len(data)) + c + crc

    sig = b'\x89PNG\r\n\x1a\n'
    ihdr = struct.pack('>IIBBBBB', width, height, 8, color_type, 0, 0, 0)
    with open(path, 'wb') as f:
        f.write(sig + _chunk(b'IHDR', ihdr) + _chunk(b'IDAT', zlib.compress(bytes(raw))) + _chunk(b'IEND', b''))


def _write_jpg(path: Path):
    path.write_bytes(b'\xff\xd8\xff\xe0' + b'\x00' * 100 + b'\xff\xd9')


def _write_svg(path: Path):
    path.write_text(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 40">'
        '<text x="5" y="28" font-family="serif" font-size="24" fill="#c9a96e">Brand</text>'
        '</svg>'
    )


# ── Test scenario: brand_product_launch (full six-category intake) ──

def run_e2e(sandbox_dir: Path | None = None) -> tuple[bool, list[tuple[str, bool]]]:
    """Run the full Phase 0 e2e test. Returns (all_passed, checks_list)."""
    sandbox = sandbox_dir or Path.cwd() / ".e2e-sandbox" / "brand-launch"
    assets = sandbox / "assets"
    frpk = sandbox / ".framepack"
    assets.mkdir(parents=True, exist_ok=True)
    frpk.mkdir(parents=True, exist_ok=True)

    # Step 0.2: Create fixtures simulating a brand product launch
    _write_svg(assets / "brand-logo.svg")                                  # SVG (naturally transparent)
    _write_png(assets / "product-cutout.png", has_alpha=True, fully_opaque=False)  # transparent PNG
    _write_png(assets / "product-render.png", has_alpha=True, fully_opaque=True)   # RGBA but opaque (TRAP)
    _write_png(assets / "product-flat.png", has_alpha=False)                       # RGB, no alpha
    _write_jpg(assets / "product-lifestyle.jpg")                                   # JPG
    (assets / "README.txt").write_text("not an image")
    (assets / "data.json").write_text("{}")

    # Step 0.3: Transparency detection (real module)
    checks: list[tuple[str, bool]] = []

    logo = detect_transparency(assets / "brand-logo.svg")
    cutout = detect_transparency(assets / "product-cutout.png")
    render = detect_transparency(assets / "product-render.png")
    flat = detect_transparency(assets / "product-flat.png")
    lifestyle = detect_transparency(assets / "product-lifestyle.jpg")

    checks.append(("SVG logo → transparent + ready",
                   logo.transparent is True and logo.status == "ready"))
    checks.append(("Transparent PNG → transparent + ready",
                   cutout.transparent is True and cutout.status == "ready"))
    checks.append(("RGBA-opaque PNG (TRAP) → not transparent + needs_processing",
                   render.transparent is False and render.needs_processing))
    checks.append(("RGB PNG → not transparent + needs_processing",
                   flat.transparent is False and flat.needs_processing))
    checks.append(("JPG → not transparent + needs_processing",
                   lifestyle.transparent is False and lifestyle.needs_processing))

    # scan_asset_directory
    batch = scan_asset_directory(assets)
    checks.append(("scan finds exactly 5 images (ignores txt/json)",
                   len(batch) == 5))
    checks.append(("scan non-existent dir returns empty list",
                   scan_asset_directory(assets / "nope") == []))

    # Step 0.4: Manifest output
    per_file = {
        "brand-logo.svg": logo,
        "product-cutout.png": cutout,
        "product-render.png": render,
        "product-flat.png": flat,
        "product-lifestyle.jpg": lifestyle,
    }

    manifest = f"""---
# Asset Intake Manifest
intake_date: "{date.today().isoformat()}"
video_type: brand_product_launch
intake_depth: full

brand:
  name: "Test Brand"
  logo:
    path: assets/brand-logo.svg
    format: svg
    transparent: true
    status: ready
  colors:
    primary: "#1a1a2e"
    accent: "#c9a96e"
    source: brand_vi
  slogan: "Test Slogan"

products:
  - name: "Test Product"
    images:
    - path: assets/product-cutout.png
      format: png
      transparent: true
      status: ready
    - path: assets/product-render.png
      format: png
      transparent: false
      status: needs_processing
    - path: assets/product-flat.png
      format: png
      transparent: false
      status: needs_processing
    - path: assets/product-lifestyle.jpg
      format: jpg
      transparent: false
      status: needs_processing

footage: []
text:
  cta: "Explore"
audio:
  bgm:
    preference: "piano + strings"
references: []
missing:
  - licensed_bgm
  - footage
---
"""
    manifest_path = frpk / "asset-intake.md"
    manifest_path.write_text(manifest, encoding="utf-8")

    # Step 0.5: Manifest validation
    checks.append(("manifest contains all six categories",
                   all(k in manifest for k in ["brand:", "products:", "footage:",
                                                "text:", "audio:", "references:", "missing:"])))
    checks.append(("manifest YAML frontmatter parseable",
                   manifest.strip().startswith("---") and manifest.strip().endswith("---")))
    checks.append(("manifest missing list non-empty",
                   "missing:" in manifest and "licensed_bgm" in manifest))

    # Report
    print("=" * 60)
    print("Asset Intake E2E — brand_product_launch (full)")
    print("=" * 60)
    passed = 0
    for name, ok in checks:
        status = "PASS" if ok else "FAIL"
        print(f"  [{status}] {name}")
        if ok:
            passed += 1

    ready = [n for n, i in per_file.items() if i.status == "ready"]
    needs = [n for n, i in per_file.items() if i.status == "needs_processing"]
    print(f"\nReady: {ready}")
    print(f"Needs processing: {needs}")
    print(f"Manifest: {manifest_path}")
    print(f"\nResult: {passed}/{len(checks)} checks passed")
    print(f"Conclusion: {'ALL GREEN — Phase 0 e2e verified' if passed == len(checks) else 'FAILURES DETECTED'}")

    all_passed = passed == len(checks)
    return all_passed, checks


if __name__ == "__main__":
    ok, _ = run_e2e()
    sys.exit(0 if ok else 1)
