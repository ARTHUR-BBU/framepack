"""Tests for asset_detector — transparent channel detection for user-provided images."""

from __future__ import annotations

import struct
import zlib
from pathlib import Path

import pytest

from core.asset_detector import (
    AssetInfo,
    detect_transparency,
    scan_asset_directory,
)


# ---------------------------------------------------------------------------
# Helpers — generate tiny synthetic images without Pillow dependency
# ---------------------------------------------------------------------------

def _write_png(path: Path, width: int = 2, height: int = 2, has_alpha: bool = True, fully_opaque: bool = False):
    """Write a minimal valid PNG. If has_alpha and not fully_opaque, the alpha channel has at least one transparent pixel."""
    channels = 4 if has_alpha else 3
    color_type = 6 if has_alpha else 2  # 6 = RGBA, 2 = RGB

    raw = bytearray()
    for _y in range(height):
        raw.append(0)  # filter byte: None
        for _x in range(width):
            raw.extend(b'\xff\x00\x00')  # red pixel
            if has_alpha:
                if fully_opaque:
                    raw.append(255)  # fully opaque
                else:
                    raw.append(0)    # fully transparent

    def _chunk(chunk_type: bytes, data: bytes) -> bytes:
        c = chunk_type + data
        crc = struct.pack('>I', zlib.crc32(c) & 0xFFFFFFFF)
        return struct.pack('>I', len(data)) + c + crc

    signature = b'\x89PNG\r\n\x1a\n'
    ihdr = struct.pack('>IIBBBBB', width, height, 8, color_type, 0, 0, 0)
    compressed = zlib.compress(bytes(raw))

    with open(path, 'wb') as f:
        f.write(signature)
        f.write(_chunk(b'IHDR', ihdr))
        f.write(_chunk(b'IDAT', compressed))
        f.write(_chunk(b'IEND', b''))


def _write_jpg(path: Path):
    """Write a minimal fake JPG (just enough for extension detection)."""
    path.write_bytes(b'\xff\xd8\xff\xe0' + b'\x00' * 100 + b'\xff\xd9')


def _write_svg(path: Path):
    """Write a minimal SVG file."""
    path.write_text('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="40"/></svg>')


# ---------------------------------------------------------------------------
# detect_transparency tests
# ---------------------------------------------------------------------------

class TestDetectTransparency:
    """Unit tests for single-image transparency detection."""

    def test_svg_is_always_transparent(self, tmp_path: Path):
        svg = tmp_path / "logo.svg"
        _write_svg(svg)

        info = detect_transparency(svg)

        assert info.format == "svg"
        assert info.transparent is True
        assert info.needs_processing is False

    def test_png_with_alpha_transparent(self, tmp_path: Path):
        png = tmp_path / "product.png"
        _write_png(png, has_alpha=True, fully_opaque=False)

        info = detect_transparency(png)

        assert info.format == "png"
        assert info.transparent is True
        assert info.needs_processing is False

    def test_png_with_alpha_but_fully_opaque(self, tmp_path: Path):
        """PNG with alpha channel but every pixel is opaque — treat as non-transparent for practical purposes."""
        png = tmp_path / "opaque.png"
        _write_png(png, has_alpha=True, fully_opaque=True)

        info = detect_transparency(png)

        assert info.format == "png"
        assert info.transparent is False
        assert info.needs_processing is True

    def test_png_without_alpha(self, tmp_path: Path):
        """PNG without alpha channel (RGB only)."""
        png = tmp_path / "rgb.png"
        _write_png(png, has_alpha=False)

        info = detect_transparency(png)

        assert info.format == "png"
        assert info.transparent is False
        assert info.needs_processing is True

    def test_jpg_never_transparent(self, tmp_path: Path):
        jpg = tmp_path / "photo.jpg"
        _write_jpg(jpg)

        info = detect_transparency(jpg)

        assert info.format == "jpg"
        assert info.transparent is False
        assert info.needs_processing is True

    def test_webp_extension_recognized(self, tmp_path: Path):
        """Even without decoding WebP, we know the format."""
        webp = tmp_path / "img.webp"
        webp.write_bytes(b'\x00' * 50)

        info = detect_transparency(webp)

        assert info.format == "webp"
        # Can't verify transparency without Pillow; default to None (unknown)
        assert info.transparent is None

    def test_nonexistent_file_returns_missing(self, tmp_path: Path):
        info = detect_transparency(tmp_path / "nope.png")

        assert info.format is None
        assert info.transparent is None
        assert info.needs_processing is False
        assert "missing" in info.status.lower()


# ---------------------------------------------------------------------------
# scan_asset_directory tests
# ---------------------------------------------------------------------------

class TestScanAssetDirectory:
    """Tests for batch scanning an assets/ directory."""

    def test_scan_mixed_assets(self, tmp_path: Path):
        assets = tmp_path / "assets"
        assets.mkdir()

        _write_svg(assets / "logo.svg")
        _write_png(assets / "product.png", has_alpha=True, fully_opaque=False)
        _write_jpg(assets / "photo.jpg")
        _write_png(assets / "opaque.png", has_alpha=True, fully_opaque=True)

        results = scan_asset_directory(assets)

        assert len(results) == 4

        by_name = {r.filename: r for r in results}
        assert by_name["logo.svg"].transparent is True
        assert by_name["product.png"].transparent is True
        assert by_name["photo.jpg"].transparent is False
        assert by_name["photo.jpg"].needs_processing is True
        assert by_name["opaque.png"].transparent is False
        assert by_name["opaque.png"].needs_processing is True

    def test_scan_empty_directory(self, tmp_path: Path):
        assets = tmp_path / "assets"
        assets.mkdir()

        results = scan_asset_directory(assets)

        assert results == []

    def test_scan_nonexistent_directory(self, tmp_path: Path):
        results = scan_asset_directory(tmp_path / "nope")

        assert results == []

    def test_scan_ignores_non_image_files(self, tmp_path: Path):
        assets = tmp_path / "assets"
        assets.mkdir()

        _write_svg(assets / "logo.svg")
        (assets / "readme.txt").write_text("hello")
        (assets / "data.json").write_text("{}")
        (assets / "audio.mp3").write_bytes(b'\x00' * 50)

        results = scan_asset_directory(assets)

        assert len(results) == 1
        assert results[0].filename == "logo.svg"

    def test_scan_nested_subdirectory(self, tmp_path: Path):
        """Should scan recursively, including subdirectories like assets/bgm/."""
        assets = tmp_path / "assets"
        bgm = assets / "bgm"
        bgm.mkdir(parents=True)

        _write_svg(assets / "logo.svg")
        _write_png(bgm.parent / "product.png", has_alpha=True, fully_opaque=False)

        results = scan_asset_directory(assets)

        assert len(results) == 2
