"""Asset detector — transparent channel detection for user-provided images.

Reports per-file format, transparency, and processing needs without mutating files.
Framepack detects and suggests; HyperFrames tools (remove-background etc.) handle execution.
"""

from __future__ import annotations

import struct
import zlib
from dataclasses import dataclass
from pathlib import Path

IMAGE_EXTENSIONS = {".svg", ".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp"}


@dataclass
class AssetInfo:
    path: str          # relative path within project
    filename: str       # basename only
    format: str | None  # svg | png | jpg | webp | gif | bmp | None
    transparent: bool | None  # True=has transparency, False=opaque, None=unknown
    needs_processing: bool   # True if needs remove-background etc.
    status: str              # ready | needs_processing | missing | unknown


def detect_transparency(file_path: str | Path) -> AssetInfo:
    """Detect if an image file has a transparent channel.

    SVG is always transparent (vector format).
    PNG: reads IHDR chunk to check color type (6=RGBA, 2=RGB).
         If color type is 6, also samples pixels to check if alpha is actually used.
    JPG: never transparent.
    WebP/other: format recognized but transparency detection requires Pillow.
    """
    path = Path(file_path)

    if not path.exists():
        return AssetInfo(
            path=str(path),
            filename=path.name,
            format=None,
            transparent=None,
            needs_processing=False,
            status="missing",
        )

    ext = path.suffix.lower()
    filename = path.name

    # ── SVG ──
    if ext == ".svg":
        return AssetInfo(
            path=str(path), filename=filename, format="svg",
            transparent=True, needs_processing=False, status="ready",
        )

    # ── JPG / JPEG ──
    if ext in (".jpg", ".jpeg"):
        return AssetInfo(
            path=str(path), filename=filename, format="jpg",
            transparent=False, needs_processing=True,
            status="needs_processing",
        )

    # ── PNG ──
    if ext == ".png":
        try:
            with open(path, "rb") as f:
                sig = f.read(8)
                if sig[:4] != b"\x89PNG":
                    return AssetInfo(
                        path=str(path), filename=filename, format="png",
                        transparent=None, needs_processing=False,
                        status="unknown",
                    )
                # Read IHDR
                _length_bytes = f.read(4)
                _chunk_type = f.read(4)
                width = struct.unpack(">I", f.read(4))[0]
                height = struct.unpack(">I", f.read(4))[0]
                bit_depth = f.read(1)[0]
                color_type = f.read(1)[0]

            if color_type == 6:  # RGBA
                # Has alpha channel — but check if any pixel is actually non-opaque
                if _has_any_transparency(path, width, height, bit_depth, color_type):
                    return AssetInfo(
                        path=str(path), filename=filename, format="png",
                        transparent=True, needs_processing=False, status="ready",
                    )
                else:
                    return AssetInfo(
                        path=str(path), filename=filename, format="png",
                        transparent=False, needs_processing=True,
                        status="needs_processing",
                    )
            else:
                # Color type 2 = RGB, 0 = Grayscale, etc. — no alpha
                return AssetInfo(
                    path=str(path), filename=filename, format="png",
                    transparent=False, needs_processing=True,
                    status="needs_processing",
                )
        except Exception:
            return AssetInfo(
                path=str(path), filename=filename, format="png",
                transparent=None, needs_processing=False,
                status="unknown",
            )

    # ── WebP / other known extensions ──
    if ext in IMAGE_EXTENSIONS:
        return AssetInfo(
            path=str(path), filename=filename,
            format=ext.lstrip("."),
            transparent=None,  # Can't verify without Pillow
            needs_processing=False,
            status="ready",  # assume ready but unknown transparency
        )

    # ── Unknown ──
    return AssetInfo(
        path=str(path), filename=filename, format=None,
        transparent=None, needs_processing=False, status="unknown",
    )


def _has_any_transparency(path: Path, width: int, height: int, bit_depth: int, color_type: int) -> bool:
    """Sample the PNG pixel data to check if any alpha value is < 255.

    Skips the decompression overhead for very large images by reading only
    the first few scanlines (most product images have transparent edges).
    """
    sample_rows = min(height, 8)  # first 8 rows — pragmatic sampling
    buf = bytearray()

    with open(path, "rb") as f:
        f.seek(8)  # skip signature
        while True:
            length_bytes = f.read(4)
            if len(length_bytes) < 4:
                break
            length = struct.unpack(">I", length_bytes)[0]
            chunk_type = f.read(4)
            if chunk_type == b"IDAT":
                buf.extend(f.read(length))
                f.read(4)  # CRC
            elif chunk_type == b"IEND":
                break
            else:
                f.seek(length + 4, 1)  # skip data + CRC

    if not buf:
        return False

    try:
        raw = zlib.decompress(bytes(buf))
    except zlib.error:
        return False

    bytes_per_pixel = 4 if color_type == 6 else 3
    stride = 1 + width * bytes_per_pixel  # filter byte + row

    for row_idx in range(min(sample_rows, height)):
        start = row_idx * stride
        if start + stride > len(raw):
            break
        row = raw[start + 1 : start + stride]  # skip filter byte
        for px in range(0, len(row), bytes_per_pixel):
            alpha = row[px + 3] if color_type == 6 else 255
            if alpha < 255:
                return True

    return False


def scan_asset_directory(directory: str | Path) -> list[AssetInfo]:
    """Scans an asset directory for image files and detects transparency.

    Walks all subdirectories (e.g. assets/bgm/, assets/fonts/).
    Only image files are reported; non-image files are silently ignored.
    Returns empty list if directory doesn't exist or is empty.
    """
    dir_path = Path(directory)
    if not dir_path.is_dir():
        return []

    results: list[AssetInfo] = []
    for file_path in sorted(dir_path.rglob("*")):
        if file_path.is_file() and file_path.suffix.lower() in IMAGE_EXTENSIONS:
            results.append(detect_transparency(file_path))

    return results
