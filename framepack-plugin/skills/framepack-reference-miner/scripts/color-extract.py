#!/usr/bin/env python3
"""
Color Extractor — per-scene dominant color palette + transition analysis.

Uses ffmpeg to extract representative frames, then numpy/PIL for
k-means color quantization to find dominant colors per scene.
"""
import subprocess, json, sys, os, tempfile, struct
from collections import Counter
import numpy as np

def extract_frame_pixels(video_path, timestamp):
    """Extract a single frame as raw RGB pixels (downsampled to 80x45)."""
    cmd = [
        "ffmpeg", "-ss", str(timestamp), "-i", video_path,
        "-vframes", "1", "-f", "rawvideo",
        "-pix_fmt", "rgb24", "-s", "80x45", "-"
    ]
    result = subprocess.run(cmd, capture_output=True, timeout=10)
    if result.returncode != 0 or len(result.stdout) < 100:
        return None
    
    # Parse raw RGB bytes into numpy array (80x45x3)
    pixels = np.frombuffer(result.stdout, dtype=np.uint8)
    if len(pixels) < 80 * 45 * 3:
        return None
    
    return pixels.reshape((45, 80, 3))

def rgb_to_hex(r, g, b):
    return f"#{r:02x}{g:02x}{b:02x}"

def quantize_colors(pixels, k=6):
    """
    Simple color quantization by bucketing.
    Returns top-k dominant colors with percentages.
    """
    if pixels is None:
        return []
    
    # Reshape to list of (r,g,b)
    pixels_flat = pixels.reshape(-1, 3)
    
    # Bucket into 8x8x8 = 512 color bins (reduce 16M colors)
    bins = {}
    for px in pixels_flat:
        r, g, b = px
        # Quantize to 32 levels per channel (8x8x8 = 512 bins)
        key = (r // 32, g // 32, b // 32)
        bins[key] = bins.get(key, 0) + 1
    
    # Get top k bins
    total = sum(bins.values())
    top_bins = sorted(bins.items(), key=lambda x: x[1], reverse=True)[:k]
    
    colors = []
    for (rq, gq, bq), count in top_bins:
        # Dequantize to center of bin
        r = rq * 32 + 16
        g = gq * 32 + 16
        b = bq * 32 + 16
        colors.append({
            "hex": rgb_to_hex(r, g, b),
            "percentage": round(count / total * 100, 1),
            "role": "unknown"  # will be classified later
        })
    
    return colors

def classify_color_roles(colors):
    """Heuristic: label background (most common), accent (rare vivid), text."""
    if not colors:
        return colors
    
    # Sort by percentage
    sorted_colors = sorted(colors, key=lambda c: c["percentage"], reverse=True)
    
    # Most common = likely background
    if sorted_colors:
        sorted_colors[0]["role"] = "background"
    
    # Look for accent color: vivid (high saturation) + lower percentage
    for c in sorted_colors[1:]:
        hex_str = c["hex"].lstrip('#')
        r, g, b = int(hex_str[0:2], 16), int(hex_str[2:4], 16), int(hex_str[4:6], 16)
        # Saturation: max-min / max
        max_c = max(r, g, b)
        min_c = min(r, g, b)
        if max_c > 0:
            sat = (max_c - min_c) / max_c
        else:
            sat = 0
        
        if sat > 0.3 and c["percentage"] < 20:
            c["role"] = "accent"
        elif c["percentage"] > 15:
            c["role"] = "secondary"
        else:
            c["role"] = "detail"
    
    return sorted_colors

def analyze_scene_colors(video_path, scene, samples=3):
    """Extract colors at multiple timestamps within a scene."""
    duration = scene["duration"]
    if duration < 0.5:
        return {"scene_index": scene["index"], "palette": [], "samples": 0}
    
    # Sample at start, middle, end
    timestamps = [scene["start"] + duration * 0.2,
                  scene["start"] + duration * 0.5,
                  scene["start"] + duration * 0.8]
    
    all_colors = Counter()
    sample_count = 0
    
    for ts in timestamps:
        pixels = extract_frame_pixels(video_path, ts)
        if pixels is None:
            continue
        colors = quantize_colors(pixels)
        for c in colors:
            all_colors[c["hex"]] += c["percentage"]
        sample_count += 1
    
    if sample_count == 0:
        return {"scene_index": scene["index"], "palette": [], "samples": 0}
    
    # Average across samples
    total_pct = sum(all_colors.values())
    palette = []
    for hex_color, pct in all_colors.most_common(6):
        palette.append({
            "hex": hex_color,
            "percentage": round(pct / sample_count, 1)
        })
    
    palette = classify_color_roles(palette)
    
    return {
        "scene_index": scene["index"],
        "start": scene["start"],
        "end": scene["end"],
        "palette": palette,
        "samples": sample_count
    }

def detect_palette_shifts(scene_colors):
    """Detect significant color palette changes between consecutive scenes."""
    shifts = []
    for i in range(len(scene_colors) - 1):
        prev = scene_colors[i]
        curr = scene_colors[i + 1]
        
        if not prev["palette"] or not curr["palette"]:
            continue
        
        prev_hexes = {c["hex"] for c in prev["palette"]}
        curr_hexes = {c["hex"] for c in curr["palette"]}
        overlap = prev_hexes & curr_hexes
        
        if len(overlap) <= 1:
            shifts.append({
                "from_scene": prev["scene_index"],
                "to_scene": curr["scene_index"],
                "type": "major_shift",
                "shared_colors": list(overlap)
            })
        elif len(overlap) <= 2:
            shifts.append({
                "from_scene": prev["scene_index"],
                "to_scene": curr["scene_index"],
                "type": "minor_shift",
                "shared_colors": list(overlap)
            })
    
    return shifts

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: color-extract.py <video_path> [scenes_json_path]"}), file=sys.stderr)
        sys.exit(1)
    
    video_path = sys.argv[1]
    if not os.path.exists(video_path):
        print(json.dumps({"error": f"File not found: {video_path}"}))
        sys.exit(1)
    
    # Load scenes
    if len(sys.argv) > 2 and os.path.exists(sys.argv[2]):
        with open(sys.argv[2], 'r') as f:
            scene_data = json.load(f)
        scenes = scene_data.get("scenes", [])
    else:
        # Single scene: whole video
        cmd = ["ffprobe", "-v", "quiet", "-show_format", "-print_format", "json", video_path]
        result = subprocess.run(cmd, capture_output=True, text=True)
        probe = json.loads(result.stdout)
        duration = float(probe["format"]["duration"])
        scenes = [{"index": 1, "start": 0, "end": duration, "duration": duration}]
    
    # Analyze each scene
    scene_colors = []
    for scene in scenes:
        result = analyze_scene_colors(video_path, scene)
        scene_colors.append(result)
    
    # Detect palette shifts
    shifts = detect_palette_shifts(scene_colors)
    
    output = {
        "scenes": scene_colors,
        "palette_shifts": shifts,
        "shift_count": len(shifts)
    }
    
    print(json.dumps(output, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    main()
