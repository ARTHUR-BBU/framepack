#!/usr/bin/env python3
"""Asset Intake Phase 0 — end-to-end validation script.

Generates synthetic test assets, runs the real asset_detector against them,
and validates detection results including the RGBA-but-fully-opaque trapdoor.

Usage:
    python scripts/asset-intake-e2e-validate.py

Exits 0 if all checks pass, 1 otherwise.
Requires framepack-plugin source on sys.path (auto-detected from script location).
"""
import sys
import struct
import zlib
from pathlib import Path

# Auto-resolve framepack-plugin source
_PLUGIN_SRC = Path(__file__).resolve().parents[3] / "framepack-plugin" / "framepack-plugin"
if not _PLUGIN_SRC.exists():
    _PLUGIN_SRC = Path(__file__).resolve().parents[2] / "framepack-plugin"
if str(_PLUGIN_SRC) not in sys.path:
    sys.path.insert(0, str(_PLUGIN_SRC))

from core.asset_detector import detect_transparency, scan_asset_directory  # noqa: E402


def _write_png(path, width=4, height=4, has_alpha=True, fully_opaque=False):
    """Minimal valid PNG via stdlib only (no Pillow)."""
    channels = 4 if has_alpha else 3
    color_type = 6 if has_alpha else 2
    raw = bytearray()
    for _ in range(height):
        raw.append(0)  # filter: None
        for _ in range(width):
            raw.extend(b'\xff\x00\x00')  # red pixel
            if has_alpha:
                raw.append(255 if fully_opaque else 0)

    def _chunk(ct, data):
        c = ct + data
        return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xFFFFFFFF)

    sig = b'\x89PNG\r\n\x1a\n'
    ihdr = struct.pack('>IIBBBBB', width, height, 8, color_type, 0, 0, 0)
    with open(path, 'wb') as f:
        f.write(sig + _chunk(b'IHDR', ihdr) + _chunk(b'IDAT', zlib.compress(bytes(raw))) + _chunk(b'IEND', b''))


def _write_jpg(path):
    path.write_bytes(b'\xff\xd8\xff\xe0' + b'\x00' * 100 + b'\xff\xd9')


def _write_svg(path):
    path.write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 40"><text>Logo</text></svg>')


def main():
    sandbox = Path(".asset-intake-e2e")
    assets = sandbox / "assets"
    assets.mkdir(parents=True, exist_ok=True)

    # Generate test assets covering all transparency edge cases
    _write_svg(assets / "logo.svg")                                    # SVG: always transparent
    _write_png(assets / "cutout.png", has_alpha=True, fully_opaque=False)   # PNG: truly transparent
    _write_png(assets / "fake-alpha.png", has_alpha=True, fully_opaque=True)  # RGBA but all pixels opaque
    _write_png(assets / "rgb.png", has_alpha=False)                     # PNG RGB: no alpha channel
    _write_jpg(assets / "photo.jpg")                                    # JPG: never transparent
    (assets / "readme.txt").write_text("not an image")                 # Non-image: should be ignored

    # Run detection
    files = {f.name: detect_transparency(f) for f in sorted(assets.glob("*")) if f.suffix in {".svg", ".png", ".jpg"}}
    batch = scan_asset_directory(assets)

    # Validate
    checks = []
    checks.append(("SVG transparent + ready",
                   files["logo.svg"].transparent is True and files["logo.svg"].status == "ready"))
    checks.append(("True-alpha PNG transparent + ready",
                   files["cutout.png"].transparent is True and files["cutout.png"].status == "ready"))
    checks.append(("RGBA-but-opaque PNG detected as needs_processing (trapdoor)",
                   files["fake-alpha.png"].transparent is False and files["fake-alpha.png"].needs_processing))
    checks.append(("RGB PNG detected as needs_processing",
                   files["rgb.png"].transparent is False and files["rgb.png"].needs_processing))
    checks.append(("JPG detected as needs_processing",
                   files["photo.jpg"].transparent is False and files["photo.jpg"].needs_processing))
    checks.append(("scan ignores non-image files",
                   len(batch) == 5))

    passed = sum(ok for _, ok in checks)
    for name, ok in checks:
        print(f"  [{'PASS' if ok else 'FAIL'}] {name}")

    print(f"\n{passed}/{len(checks)} checks passed")
    if passed != len(checks):
        print("FAILURES DETECTED — asset_detector may have regressed.")
        sys.exit(1)
    print("All checks passed — Phase 0 detection pipeline is healthy.")
    sys.exit(0)


if __name__ == "__main__":
    main()
