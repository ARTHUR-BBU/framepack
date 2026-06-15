#!/usr/bin/env python
"""Extract Framepack proof frames from a rendered video."""

from __future__ import annotations

import argparse
from dataclasses import dataclass
import json
from pathlib import Path
import re
import shutil
import subprocess
from typing import Any


@dataclass(frozen=True)
class ProofPoint:
    label: str
    time: float


def _required(item: dict[str, Any]) -> bool:
    return bool(item.get("required", True))


def _coerce_time(value: Any) -> float | None:
    if isinstance(value, bool):
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _point(item: dict[str, Any]) -> ProofPoint | None:
    if "time" not in item or not item.get("label") or not _required(item):
        return None
    time = _coerce_time(item.get("time"))
    if time is None:
        return None
    return ProofPoint(label=str(item["label"]), time=time)


def load_manifest_proof_points(manifest_path: Path) -> list[ProofPoint]:
    data = json.loads(Path(manifest_path).read_text(encoding="utf-8"))
    points: list[ProofPoint] = []
    for scene in data.get("scenes", []):
        if not isinstance(scene, dict):
            continue
        for item in scene.get("proofs", []) or []:
            if isinstance(item, dict) and (point := _point(item)):
                points.append(point)
        continuity = scene.get("continuity") if isinstance(scene.get("continuity"), dict) else {}
        for item in continuity.get("boundary_proofs", []) or []:
            if isinstance(item, dict) and (point := _point(item)):
                points.append(point)
    proofs = data.get("proofs") if isinstance(data.get("proofs"), dict) else {}
    for item in proofs.get("required", []) or []:
        if isinstance(item, dict) and (point := _point(item)):
            points.append(point)
    deduped: dict[tuple[str, float], ProofPoint] = {(point.label, point.time): point for point in points}
    return sorted(deduped.values(), key=lambda point: (point.time, point.label))


def sanitize_label(label: str) -> str:
    text = re.sub(r"[^A-Za-z0-9._-]+", "-", label.strip().lower())
    text = re.sub(r"-+", "-", text).strip("-._")
    return text or "proof"


def proof_output_path(output_dir: Path, index: int, point: ProofPoint) -> Path:
    return Path(output_dir) / f"proof-{index:03d}-{sanitize_label(point.label)}-{point.time:.3f}s.png"


def build_extract_command(video: Path, time: float, output: Path) -> list[str]:
    video_arg = video.as_posix() if not video.is_absolute() else str(video)
    return ["ffmpeg", "-y", "-ss", f"{time:.3f}", "-i", video_arg, "-frames:v", "1", str(output)]


def extract_proof(video: Path, point: ProofPoint, output: Path) -> Path:
    if not shutil.which("ffmpeg"):
        raise SystemExit("ffmpeg not found on PATH")
    output.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(build_extract_command(video, point.time, output), check=True)
    return output


def parse_manual_time(value: str) -> ProofPoint:
    label, sep, raw_time = value.partition("=")
    if not sep:
        raise argparse.ArgumentTypeError("--time must be label=seconds")
    return ProofPoint(label=label, time=float(raw_time.rstrip("s")))


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("video", type=Path, help="Rendered video file")
    parser.add_argument("--manifest", type=Path, help="Timeline manifest JSON")
    parser.add_argument("--time", action="append", type=parse_manual_time, default=[], help="Proof point as label=seconds")
    parser.add_argument("--output-dir", type=Path, default=Path(".framepack/proofs"))
    args = parser.parse_args(argv)

    points = list(args.time)
    if args.manifest:
        points.extend(load_manifest_proof_points(args.manifest))
    if not points:
        raise SystemExit("No proof points supplied; use --time or --manifest")
    for index, point in enumerate(points, 1):
        output = proof_output_path(args.output_dir, index, point)
        print(extract_proof(args.video, point, output))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
