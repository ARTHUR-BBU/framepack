#!/usr/bin/env python3
"""
Content Decomposer — extract key frames per scene and prepare them for
vision-based content analysis.

This script:
1. Extracts 2-3 key frames per scene (start/middle/end)
2. Generates a per-scene contact strip
3. Outputs a JSON manifest that guides the agent's vision analysis

The vision analysis itself is done by the agent using vision_analyze.
This script handles the mechanical ffmpeg work.
"""
import subprocess, json, sys, os, tempfile

def extract_key_frames(video_path, scene, output_dir, count=3):
    """Extract key frames for a scene."""
    frames = []
    duration = scene["duration"]
    
    if duration < 0.3:
        # Single frame
        ts = scene["start"]
        out = os.path.join(output_dir, f"scene_{scene['index']:02d}_frame_00.jpg")
        cmd = ["ffmpeg", "-y", "-ss", str(ts), "-i", video_path, "-vframes", "1", "-q:v", "3", out]
        subprocess.run(cmd, capture_output=True, timeout=10)
        if os.path.exists(out) and os.path.getsize(out) > 1000:
            frames.append({"file": out, "timestamp": ts, "label": "single"})
    else:
        offsets = [0.1, 0.5, 0.9]  # start, middle, end
        labels = ["start", "middle", "end"]
        
        for i, (offset, label) in enumerate(zip(offsets, labels)):
            ts = scene["start"] + duration * offset
            out = os.path.join(output_dir, f"scene_{scene['index']:02d}_frame_{i:02d}.jpg")
            cmd = ["ffmpeg", "-y", "-ss", str(ts), "-i", video_path, "-vframes", "1", "-q:v", "3", out]
            subprocess.run(cmd, capture_output=True, timeout=10)
            if os.path.exists(out) and os.path.getsize(out) > 1000:
                frames.append({"file": out, "timestamp": round(ts, 2), "label": label})
    
    return frames

def generate_scene_strip(scene_frames, scene_index, output_dir):
    """Generate a horizontal strip of frames for one scene."""
    frame_files = [f["file"] for f in scene_frames if os.path.exists(f["file"])]
    if len(frame_files) < 2:
        return None
    
    # Create a temp text file listing frames
    list_file = os.path.join(output_dir, f"scene_{scene_index:02d}_list.txt")
    with open(list_file, 'w') as f:
        for ff in frame_files:
            f.write(f"file '{ff}'\n")
    
    strip_out = os.path.join(output_dir, f"scene_{scene_index:02d}_strip.jpg")
    cmd = ["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", list_file,
           "-vf", "scale=320:-1,tile=3x1", "-q:v", "3", strip_out]
    subprocess.run(cmd, capture_output=True, timeout=10)
    
    if os.path.exists(strip_out) and os.path.getsize(strip_out) > 1000:
        return strip_out
    return None

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: content-decompose.py <video_path> [scenes_json_path] [output_dir]"}), file=sys.stderr)
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
        cmd = ["ffprobe", "-v", "quiet", "-show_format", "-print_format", "json", video_path]
        result = subprocess.run(cmd, capture_output=True, text=True)
        probe = json.loads(result.stdout)
        duration = float(probe["format"]["duration"])
        scenes = [{"index": 1, "start": 0, "end": duration, "duration": duration}]
    
    # Output directory
    output_dir = sys.argv[3] if len(sys.argv) > 3 else tempfile.mkdtemp(prefix="miner_frames_")
    os.makedirs(output_dir, exist_ok=True)
    
    # Extract frames per scene
    all_frames = []
    strips = []
    
    for scene in scenes:
        frames = extract_key_frames(video_path, scene, output_dir)
        if frames:
            all_frames.append({
                "scene_index": scene["index"],
                "start": scene["start"],
                "end": scene["end"],
                "duration": scene["duration"],
                "frames": frames
            })
            
            strip = generate_scene_strip(frames, scene["index"], output_dir)
            if strip:
                strips.append(strip)
    
    # Generate overview contact sheet (all scenes)
    overview = None
    if strips and len(strips) >= 1:
        # Take first frame of each scene for overview
        first_frames = []
        for sf in all_frames:
            if sf["frames"]:
                ff = sf["frames"][0]["file"]
                if os.path.exists(ff):
                    first_frames.append(ff)
        
        if first_frames:
            list_file = os.path.join(output_dir, "overview_list.txt")
            with open(list_file, 'w') as f:
                for ff in first_frames:
                    f.write(f"file '{ff}'\n")
            
            overview = os.path.join(output_dir, "overview.jpg")
            cols = min(len(first_frames), 8)
            cmd = ["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", list_file,
                   "-vf", f"scale=240:-1,tile={cols}x1", "-q:v", "3", overview]
            subprocess.run(cmd, capture_output=True, timeout=10)
            
            if not os.path.exists(overview) or os.path.getsize(overview) < 500:
                overview = None
    
    output = {
        "output_dir": output_dir,
        "scene_count": len(all_frames),
        "total_frames": sum(len(sf["frames"]) for sf in all_frames),
        "overview": overview,
        "scenes": all_frames,
        "analysis_prompt": (
            "For each scene frame strip, describe the CONTENT LAYOUT:\n"
            "1. What occupies the UPPER THIRD? (text headline, logo, empty space, image)\n"
            "2. What occupies the MIDDLE? (product image, person, text body, video, chart)\n"
            "3. What occupies the LOWER THIRD? (CTA button, caption, logo, social proof)\n"
            "4. What's the BACKGROUND? (solid color, gradient, blurred image, video, pattern)\n"
            "5. Any OVERLAYS? (scan lines, grain, light leaks, border, vignette)\n"
            "6. What's the overall LAYOUT PATTERN? (minimal, split-screen, magazine, terminal, phone-frame)\n"
            "\n"
            "Then identify RECURRING ELEMENTS across all scenes:\n"
            "- Same text position? Same image region? Same CTA placement?\n"
            "- What changes between scenes and what stays the same?"
        )
    }
    
    print(json.dumps(output, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    main()
