#!/usr/bin/env python3
"""
Scene Detection — find cut points + transition types in a video.
Uses ffmpeg's scene detection filter to identify boundaries.

Output: JSON to stdout — scene array with start/end times and transition types.
"""
import subprocess, json, sys, os, re

def run_ffprobe(video_path):
    """Extract video metadata."""
    cmd = [
        "ffprobe", "-v", "quiet", "-print_format", "json",
        "-show_format", "-show_streams", video_path
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    return json.loads(result.stdout)

def detect_cuts(video_path, threshold=0.35):
    """
    Detect hard cuts using ffmpeg's scene filter.
    Returns list of timestamps where scene changes occur.
    """
    cmd = [
        "ffmpeg", "-i", video_path,
        "-vf", f"select='gt(scene,{threshold})',showinfo",
        "-f", "null", "-"
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, stderr=subprocess.STDOUT)
    
    cuts = []
    # Parse showinfo output: pts_time:12.345
    for line in result.stdout.split('\n'):
        m = re.search(r'pts_time:([\d.]+)', line)
        if m:
            cuts.append(float(m.group(1)))
    
    return sorted(set(cuts))  # deduplicate

def detect_fades(video_path, duration, num_samples=30):
    """
    Detect fade-to-black and fade-from-black by sampling brightness.
    Returns list of (timestamp, type) for fades.
    """
    fades = []
    if duration < 2:
        return fades
    
    interval = duration / num_samples
    prev_brightness = None
    
    for i in range(num_samples + 1):
        t = i * interval
        if t > duration:
            t = duration
        
        cmd = [
            "ffmpeg", "-ss", str(t), "-i", video_path,
            "-vframes", "1", "-f", "rawvideo",
            "-pix_fmt", "rgb24", "-s", "16x16", "-"
        ]
        result = subprocess.run(cmd, capture_output=True, timeout=10)
        
        if result.returncode != 0 or len(result.stdout) < 100:
            continue
        
        # Average brightness from 16x16 thumbnail
        pixels = result.stdout
        brightness = sum(pixels) / len(pixels) if pixels else 128
        
        if prev_brightness is not None:
            # Fade to black: brightness drops significantly
            if prev_brightness > 40 and brightness < 15:
                fades.append({"time": round(t - interval/2, 2), "type": "fade-to-black"})
            # Fade from black: brightness rises from dark
            elif prev_brightness < 15 and brightness > 40:
                fades.append({"time": round(t - interval/2, 2), "type": "fade-from-black"})
        
        prev_brightness = brightness
    
    return fades

def build_scenes(cuts, fades, total_duration):
    """
    Merge cut points and fade points into scene boundaries.
    Classify transition type between each scene.
    """
    # Combine all boundary points
    boundaries = [(t, "cut") for t in cuts]
    boundaries += [(f["time"], f["type"]) for f in fades]
    boundaries.sort()
    
    # Deduplicate nearby boundaries (within 0.3s)
    merged = []
    for t, ttype in boundaries:
        if merged and abs(t - merged[-1][0]) < 0.3:
            # Keep the more specific type
            if ttype != "cut" or merged[-1][1] == "cut":
                merged[-1] = (t, ttype)
        else:
            merged.append((t, ttype))
    
    # Build scenes
    scenes = []
    if not merged:
        scenes.append({
            "index": 1,
            "start": 0,
            "end": round(total_duration, 2),
            "duration": round(total_duration, 2),
            "transition_in": "start",
            "transition_out": "end"
        })
        return scenes
    
    # First scene starts at 0
    start = 0
    for i, (t, ttype) in enumerate(merged):
        if t <= start + 0.1:
            continue
        
        scenes.append({
            "index": len(scenes) + 1,
            "start": round(start, 2),
            "end": round(t, 2),
            "duration": round(t - start, 2),
            "transition_in": merged[i-1][1] if i > 0 else "start",
            "transition_out": ttype
        })
        start = t
    
    # Last scene
    if start < total_duration - 0.1:
        scenes.append({
            "index": len(scenes) + 1,
            "start": round(start, 2),
            "end": round(total_duration, 2),
            "duration": round(total_duration - start, 2),
            "transition_in": merged[-1][1] if merged else "start",
            "transition_out": "end"
        })
    
    return scenes

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: scene-detect.py <video_path> [threshold]"}), file=sys.stderr)
        sys.exit(1)
    
    video_path = sys.argv[1]
    threshold = float(sys.argv[2]) if len(sys.argv) > 2 else 0.35
    
    if not os.path.exists(video_path):
        print(json.dumps({"error": f"File not found: {video_path}"}))
        sys.exit(1)
    
    # Get video metadata
    probe = run_ffprobe(video_path)
    video_stream = next((s for s in probe.get("streams", []) if s["codec_type"] == "video"), None)
    if not video_stream:
        print(json.dumps({"error": "No video stream found"}))
        sys.exit(1)
    
    duration = float(probe["format"]["duration"])
    width = video_stream["width"]
    height = video_stream["height"]
    fps_str = video_stream.get("r_frame_rate", "30/1")
    fps = eval(fps_str) if '/' in fps_str else float(fps_str)
    
    # Detect cuts
    cuts = detect_cuts(video_path, threshold)
    
    # Detect fades
    fades = detect_fades(video_path, duration)
    
    # Build scene list
    scenes = build_scenes(cuts, fades, duration)
    
    output = {
        "video": {
            "path": os.path.abspath(video_path),
            "duration": round(duration, 2),
            "resolution": f"{width}x{height}",
            "fps": round(fps, 2)
        },
        "scene_count": len(scenes),
        "cut_count": len(cuts),
        "fade_count": len(fades),
        "threshold_used": threshold,
        "scenes": scenes
    }
    
    print(json.dumps(output, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    main()
