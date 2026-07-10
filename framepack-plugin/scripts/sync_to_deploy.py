#!/usr/bin/env python
"""sync_to_deploy.py — LF-normalized source-to-deploy sync for Framepack.

Phase 7: closes the "text diff zero but md5 mismatch" gap.

Behavior:
- Copy plugin files from source to deploy with LF normalization for .py/.md/.json/.yaml.
- Compute text hash (after newline normalization) and byte MD5 (after copy).
- --check: compare text hashes only, so CRLF/LF-only differences don't cause failures.
- Default (no --check): copy, then verify byte MD5 matches immediately after.

Usage:
  python scripts/sync_to_deploy.py                           # full sync to default deploy dir
  python scripts/sync_to_deploy.py --check                   # verify only
  python scripts/sync_to_deploy.py --source A --deploy B      # custom dirs
"""
from __future__ import annotations

import argparse
import hashlib
import sys
from pathlib import Path

LF_EXTENSIONS = {".py", ".md", ".json", ".yaml", ".yml", ".txt", ".html", ".css", ".js"}

DEFAULT_SOURCE = Path("F:/hyperframes/framepack-plugin")
DEFAULT_DEPLOY = Path("F:/Hermes_windows/plugins/framepack")


def _text_hash(path: Path) -> str:
    """Hash file content with newlines normalized to LF."""
    raw = path.read_bytes()
    normalized = raw.replace(b"\r\n", b"\n").replace(b"\r", b"\n")
    return hashlib.md5(normalized).hexdigest()


def _byte_md5(path: Path) -> str:
    return hashlib.md5(path.read_bytes()).hexdigest()


def _collect_files(root: Path) -> list[Path]:
    """Collect syncable files, excluding tests/ and common noise."""
    skip_dirs = {".git", "__pycache__", ".framepack", "node_modules", ".pytest_cache"}
    skip_suffixes = {".pyc", ".pyo"}
    files: list[Path] = []
    for p in root.rglob("*"):
        if not p.is_file():
            continue
        if any(part in skip_dirs for part in p.parts):
            continue
        if p.suffix in skip_suffixes:
            continue
        files.append(p)
    return sorted(files)


def check_sync(source: Path, deploy: Path) -> int:
    """Return 0 if text hashes match for all source files, non-zero otherwise."""
    src_files = _collect_files(source)
    mismatches: list[str] = []

    for src_file in src_files:
        rel = src_file.relative_to(source)
        dst_file = deploy / rel
        if not dst_file.is_file():
            mismatches.append(f"MISSING: {rel}")
            continue
        src_hash = _text_hash(src_file)
        dst_hash = _text_hash(dst_file)
        if src_hash != dst_hash:
            mismatches.append(f"DIFF: {rel} (src={src_hash[:8]} dst={dst_hash[:8]})")

    if mismatches:
        print(f"sync check FAILED: {len(mismatches)} mismatch(es)")
        for m in mismatches[:20]:
            print(f"  {m}")
        if len(mismatches) > 20:
            print(f"  ... {len(mismatches) - 20} more")
        return 1

    print(f"sync check PASSED: {len(src_files)} files in sync")
    return 0


def do_sync(source: Path, deploy: Path) -> int:
    """Copy source to deploy with LF normalization, then verify byte MD5."""
    src_files = _collect_files(source)
    copied = 0

    for src_file in src_files:
        rel = src_file.relative_to(source)
        dst_file = deploy / rel
        dst_file.parent.mkdir(parents=True, exist_ok=True)

        raw = src_file.read_bytes()
        if src_file.suffix in LF_EXTENSIONS:
            raw = raw.replace(b"\r\n", b"\n").replace(b"\r", b"\n")
        dst_file.write_bytes(raw)
        copied += 1

    # verify byte md5 immediately after copy (both sides LF-normalized)
    mismatches: list[str] = []
    for src_file in src_files:
        rel = src_file.relative_to(source)
        dst_file = deploy / rel
        src_raw = src_file.read_bytes()
        if src_file.suffix in LF_EXTENSIONS:
            src_raw = src_raw.replace(b"\r\n", b"\n").replace(b"\r", b"\n")
        dst_raw = dst_file.read_bytes()
        src_md5 = hashlib.md5(src_raw).hexdigest()
        dst_md5 = hashlib.md5(dst_raw).hexdigest()
        if src_md5 != dst_md5:
            mismatches.append(f"{rel}: src={src_md5[:8]} dst={dst_md5[:8]}")

    if mismatches:
        print(f"sync copied {copied} files but MD5 verification FAILED: {len(mismatches)}")
        for m in mismatches[:20]:
            print(f"  {m}")
        return 1

    print(f"sync PASSED: {copied} files copied and MD5 verified")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Sync Framepack source to deploy with LF normalization")
    parser.add_argument("--check", action="store_true", help="verify sync without copying")
    parser.add_argument("--source", default=str(DEFAULT_SOURCE), help="source directory")
    parser.add_argument("--deploy", default=str(DEFAULT_DEPLOY), help="deploy directory")
    args = parser.parse_args()

    source = Path(args.source)
    deploy = Path(args.deploy)

    if not source.is_dir():
        print(f"ERROR: source directory not found: {source}")
        return 2

    if args.check:
        if not deploy.is_dir():
            print(f"ERROR: deploy directory not found: {deploy}")
            return 2
        return check_sync(source, deploy)

    return do_sync(source, deploy)


if __name__ == "__main__":
    sys.exit(main())
