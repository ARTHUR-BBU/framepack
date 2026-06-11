#!/usr/bin/env python3
"""
Motion Analyzer — per-scene motion energy + direction + animation classification.

Uses ffmpeg's signalstats and scene-level frame differencing to quantify:
- Motion energy (0-100): how much visual change per scene
- Motion type: static / subtle_drift / moderate / intense / chaotic
- Direction bias: zoom-in / zoom-out / pan / static / mixed
- Motion curve: energy over time within each scene
"""
import subprocess, json, sys, os, re, tempfile

def run_ffmpeg_cmd(cmd, timeout=60):
    """Run ffmpeg command, return stdout+stderr."""
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
    return result.stdout + result.stderr

def extract_frame_diffs(video_path, scene_start, scene_end, sample_rate=4):
    """
    Extract per-frame difference values to quantify motion.
    Uses ffmpeg's signalstats to measure frame-to-frame change.
    Sample at 'sample_rate' frames per second across the scene.
    """
    duration = scene_end - scene_start
    if duration < 0.5:
        return []
    
    diffs = []
    # Use blend=difference + signalstats to measure frame-to-frame change
    cmd = [
        "ffmpeg", "-ss", str(scene_start), "-t", str(duration),
        "-i", video_path,
        "-vf", f"fps={sample_rate},tblend=all_mode=difference,signalstats",
        "-f", "null", "-"
    ]
    output = run_ffmpeg_cmd(cmd)
    
    # Parse signalstats YAVG (average luma of diff frame)
    for line in output.split('\n'):
        m = re.search(r'YAVG:(\d+)', line)
        if m:
            yavg = float(m.group(1))
            # Normalize: 0-255 scale, higher = more change
            diffs.append(round(min(yavg / 255 * 100, 100), 1))
    
    return diffs

def classify_motion(diffs):
    """
    Classify motion from difference values.
    Returns: energy_score, motion_type, direction_guess
    """
    if not diffs or len(diffs) < 2:
        return {
            "energy_score": 0,
            "motion_type": "static",
            "direction": "static",
            "peak_energy": 0,
            "energy_variance": 0,
            "sample_count": len(diffs)
        }
    
    avg = sum(diffs) / len(diffs)
    peak = max(diffs)
    variance = sum((d - avg)**2 for d in diffs) / len(diffs)
    
    # Classify energy level
    if avg < 3:
        motion_type = "static"
    elif avg < 10:
        motion_type = "subtle_drift"
    elif avg < 25:
        motion_type = "moderate"
    elif avg < 50:
        motion_type = "active"
    elif avg < 75:
        motion_type = "intense"
    else:
        motion_type = "chaotic"
    
    # Direction guess: look at first vs last third of diffs
    # Rising = accelerating (could be zoom-in), falling = decelerating
    third = len(diffs) // 3
    if third > 0:
        first_third_avg = sum(diffs[:third]) / third
        last_third_avg = sum(diffs[-third:]) / third if third > 0 else first_third_avg
        
        if last_third_avg > first_third_avg * 1.5:
            direction = "accelerating"
        elif first_third_avg > last_third_avg * 1.5:
            direction = "decelerating"
        elif variance > avg * 3:
            direction = "pulsing"
        else:
            direction = "steady"
    else:
        direction = "steady"
    
    return {
        "energy_score": round(avg, 1),
        "motion_type": motion_type,
        "direction": direction,
        "peak_energy": round(peak, 1),
        "energy_variance": round(variance, 1),
        "sample_count": len(diffs)
    }

def analyze_scene(video_path, scene, sample_rate=4):
    """Analyze motion for a single scene."""
    diff_values = extract_frame_diffs(video_path, scene["start"], scene["end"], sample_rate)
    motion = classify_motion(diff_values)
    
    return {
        "scene_index": scene["index"],
        "start": scene["start"],
        "end": scene["end"],
        "duration": scene["duration"],
        "motion": motion,
        "diff_values": diff_values  # raw data for curve plotting
    }

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: motion-analyze.py <video_path> [scenes_json_path]"}), file=sys.stderr)
        sys.exit(1)
    
    video_path = sys.argv[1]
    if not os.path.exists(video_path):
        print(json.dumps({"error": f"File not found: {video_path}"}))
        sys.exit(1)
    
    # Load scenes from scene-detect output, or analyze whole video as one scene
    if len(sys.argv) > 2 and os.path.exists(sys.argv[2]):
        with open(sys.argv[2], 'r') as f:
            scene_data = json.load(f)
        scenes = scene_data.get("scenes", [])
    else:
        # Treat whole video as one scene
        from scene_detect import run_ffprobe
        try:
            probe = run_ffprobe(video_path)
            duration = float(probe["format"]["duration"])
        except:
            # Fallback: rough duration from ffprobe
            cmd = ["ffprobe", "-v", "quiet", "-show_format", "-print_format", "json", video_path]
            result = subprocess.run(cmd, capture_output=True, text=True)
            probe = json.loads(result.stdout)
            duration = float(probe["format"]["duration"])
        
        scenes = [{
            "index": 1,
            "start": 0,
            "end": round(duration, 2),
            "duration": round(duration, 2)
        }]
    
    # Analyze each scene
    results = []
    for scene in scenes:
        result = analyze_scene(video_path, scene)
        results.append(result)
    
    # Overall summary
    all_energies = [r["motion"]["energy_score"] for r in results if r["diff_values"]]
    overall = {
        "scenes_analyzed": len(results),
        "overall_energy": round(sum(all_energies) / len(all_energies), 1) if all_energies else 0,
        "motion_distribution": {},
        "scene_results": results
    }
    
    # Distribution of motion types
    for r in results:
        mt = r["motion"]["motion_type"]
        overall["motion_distribution"][mt] = overall["motion_distribution"].get(mt, 0) + 1
    
    print(json.dumps(overall, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    main()
