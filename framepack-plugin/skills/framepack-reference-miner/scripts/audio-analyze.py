#!/usr/bin/env python3
"""
Audio Analyzer — BPM detection + beat timestamps + energy envelope.

Uses ffmpeg's aformat + astats for energy analysis.
BPM detection via autocorrelation of energy peaks.
"""
import subprocess, json, sys, os, re

def extract_audio_energy(video_path):
    """
    Extract RMS energy values over time using ffmpeg astats.
    Returns: list of (timestamp, rms_level) tuples
    """
    # Get audio stream info
    probe_cmd = ["ffprobe", "-v", "quiet", "-show_streams", "-select_streams", "a", "-print_format", "json", video_path]
    result = subprocess.run(probe_cmd, capture_output=True, text=True)
    probe = json.loads(result.stdout)
    audio_streams = probe.get("streams", [])
    
    if not audio_streams:
        return None, "No audio stream found"
    
    # Extract energy at 10 samples per second
    cmd = [
        "ffmpeg", "-i", video_path,
        "-af", "astats=metadata=1:reset=1",
        "-f", "null", "-"
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, stderr=subprocess.STDOUT, timeout=120)
    output = result.stdout
    
    # Parse: RMS level dB values + timestamps
    energy_points = []
    current_time = 0
    last_db = None
    
    for line in output.split('\n'):
        # Track timestamp
        time_match = re.search(r'time=([\d:.]+)', line)
        if time_match:
            t = time_match.group(1)
            parts = t.split(':')
            current_time = float(parts[0])*3600 + float(parts[1])*60 + float(parts[2])
        
        # Parse RMS level
        rms_match = re.search(r'RMS level dB: ([-\d.]+)', line)
        if rms_match:
            db = float(rms_match.group(1))
            # Convert dB to linear energy (0-1 scale)
            # Typical audio: -60dB (silence) to 0dB (max)
            energy = min(max((db + 60) / 60, 0), 1) if db > -60 else 0
            energy_points.append({
                "time": round(current_time, 2),
                "db": round(db, 1),
                "energy": round(energy, 3)
            })
    
    return energy_points, None

def detect_beats(energy_points, min_interval=0.2):
    """
    Detect beat peaks from energy data.
    A beat is a local energy peak above the running average.
    """
    if not energy_points or len(energy_points) < 3:
        return [], 0
    
    # Calculate adaptive threshold: 1.3x running average
    beats = []
    window = max(5, len(energy_points) // 20)
    
    for i in range(window, len(energy_points) - window):
        local_window = energy_points[i-window:i+window]
        avg_energy = sum(p["energy"] for p in local_window) / len(local_window)
        
        current = energy_points[i]["energy"]
        prev = energy_points[i-1]["energy"]
        next_e = energy_points[i+1]["energy"]
        
        # Peak: higher than neighbors AND above threshold
        if current > prev and current > next_e and current > avg_energy * 1.3:
            # Don't add if too close to previous beat
            if not beats or energy_points[i]["time"] - beats[-1]["time"] >= min_interval:
                beats.append({
                    "time": energy_points[i]["time"],
                    "energy": round(current, 3),
                    "db": energy_points[i]["db"]
                })
    
    # Calculate BPM from beat intervals
    bpm = 0
    if len(beats) >= 2:
        intervals = [beats[i+1]["time"] - beats[i]["time"] for i in range(len(beats)-1)]
        avg_interval = sum(intervals) / len(intervals)
        if avg_interval > 0:
            bpm = round(60 / avg_interval)
    
    return beats, bpm

def match_beats_to_scenes(beats, scenes):
    """Map beat timestamps to scene boundaries."""
    if not beats or not scenes:
        return []
    
    beat_scene_map = []
    for scene in scenes:
        scene_beats = [b for b in beats if scene["start"] <= b["time"] <= scene["end"]]
        beat_scene_map.append({
            "scene_index": scene["index"],
            "start": scene["start"],
            "end": scene["end"],
            "beat_count": len(scene_beats),
            "beat_density": round(len(scene_beats) / scene["duration"], 2) if scene["duration"] > 0 else 0,
            "beat_times": [b["time"] for b in scene_beats]
        })
    
    return beat_scene_map

def analyze_energy_curve(energy_points, scenes):
    """Characterize energy envelope per scene."""
    if not energy_points:
        return []
    
    curves = []
    for scene in scenes:
        scene_points = [p for p in energy_points if scene["start"] <= p["time"] <= scene["end"]]
        if not scene_points:
            curves.append({"scene_index": scene["index"], "energy_curve": "no_data", "avg_energy": 0, "peak_energy": 0})
            continue
        
        energies = [p["energy"] for p in scene_points]
        avg = sum(energies) / len(energies)
        peak = max(energies)
        
        # Curve shape: rising, falling, peaked, flat
        third = len(energies) // 3
        if third > 1:
            first_avg = sum(energies[:third]) / third
            last_avg = sum(energies[-third:]) / third
            
            if last_avg > first_avg * 1.3:
                curve = "rising"
            elif first_avg > last_avg * 1.3:
                curve = "falling"
            elif peak > avg * 2:
                curve = "peaked"
            else:
                curve = "flat"
        else:
            curve = "flat"
        
        curves.append({
            "scene_index": scene["index"],
            "energy_curve": curve,
            "avg_energy": round(avg, 3),
            "peak_energy": round(peak, 3),
            "sample_count": len(scene_points)
        })
    
    return curves

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: audio-analyze.py <video_path> [scenes_json_path]"}), file=sys.stderr)
        sys.exit(1)
    
    video_path = sys.argv[1]
    if not os.path.exists(video_path):
        print(json.dumps({"error": f"File not found: {video_path}"}))
        sys.exit(1)
    
    # Extract energy
    energy_points, error = extract_audio_energy(video_path)
    if error:
        print(json.dumps({"error": error, "has_audio": False}))
        return
    
    # Detect beats
    beats, bpm = detect_beats(energy_points)
    
    # Load scenes if available
    scene_beat_map = []
    energy_curves = []
    if len(sys.argv) > 2 and os.path.exists(sys.argv[2]):
        with open(sys.argv[2], 'r') as f:
            scene_data = json.load(f)
        scenes = scene_data.get("scenes", [])
        scene_beat_map = match_beats_to_scenes(beats, scenes)
        energy_curves = analyze_energy_curve(energy_points, scenes)
    
    output = {
        "has_audio": True,
        "duration": round(energy_points[-1]["time"], 2) if energy_points else 0,
        "bpm": bpm,
        "beat_count": len(beats),
        "beat_times": [b["time"] for b in beats[:20]],  # first 20 beats
        "energy_curve": [{"time": p["time"], "energy": p["energy"]} for p in energy_points[::5]],  # sampled
        "scene_beat_map": scene_beat_map,
        "energy_by_scene": energy_curves
    }
    
    print(json.dumps(output, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    main()
