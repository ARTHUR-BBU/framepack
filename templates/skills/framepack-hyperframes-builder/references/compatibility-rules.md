# HyperFrames Compatibility Rules

Every rule below comes from real render failures. Violating any one will break the render.

## 1. Video elements need data-start AND data-media-start

```html
<video data-start="0" data-duration="3" data-media-start="0" muted playsinline src="clip.mp4">
</video>
```

Missing `data-media-start` causes video not to play during render.

## 2. No Math.random() — use seeded PRNG

```javascript
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const rng = mulberry32(42);
```

`Math.random()` produces different values per frame, making the render non-deterministic.

## 3. No repeat: -1 — always calculate finite repeats

```javascript
repeat: Math.floor(totalDuration / cycleDuration) - 1
```

Infinite repeat causes the frame capture engine to loop forever.

## 4. GSAP must be loaded synchronously

```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
```

CDN may 404. If possible, use a local copy. Never load GSAP inside async code.

## 5. Video source files should be pre-transcoded

```bash
ffmpeg -i input.mp4 -c:v libx264 -r 30 -g 30 -keyint_min 30 -movflags +faststart -c:a copy output.mp4
```

Sparse keyframes (>1s apart) cause frozen video frames during render.

## 6. Scene switches use tl.set(), not tl.to()

```javascript
// CORRECT
tl.set("#scene-prev .content", { opacity: 0 }, cutTime);

// WRONG — duration:0.01 at t=0 never completes the interpolation
tl.to("#scene-prev .content", { opacity: 1, duration: 0.01 }, 0);
```

## 7. First scene must be visible via CSS before JavaScript runs

```css
[data-scene-id] { opacity: 0; }
[data-scene-id="scene-1"] { opacity: 1; }
```

Without this, the first frame is black until JS animation kicks in.

## 8. Multiple tweens on the same property need overwrite:"auto"

```javascript
tl.to(".elem", { x: 100, overwrite: "auto" }, 1);
```

Missing `overwrite` causes tween conflicts and rendering warnings.

## 9. Timeline registration is mandatory

```javascript
window.__timelines = window.__timelines || {};
const tl = gsap.timeline({ paused: true });
// ... tweens ...
window.__timelines["my-composition"] = tl;
```

The key must match the root element's `data-composition-id`.

## 10. Root element attributes are required

```html
<div data-composition-id="main" data-start="0" data-duration="30" data-width="1920" data-height="1080">
```

## 11. Never animate visibility or display with GSAP

Never call `video.play()` or `audio.play()`. The HyperFrames framework owns media playback.

## 12. Never build timelines inside async/await, setTimeout, or Promises

The capture engine reads `window.__timelines` synchronously after page load. Async construction means timelines are missing when the engine checks.

## 13. Never use <br> for line breaks in content text

Use `max-width` to let text wrap naturally. Forced `<br>` breaks don't account for actual rendered font width and cause overflow.

## 14. Every multi-scene composition must have transitions

No jump cuts. Always use transitions between scenes. Read [transitions.md](transitions.md) for implementation.

## 15. No exit animations except on the final scene

The transition IS the exit. The outgoing scene must be fully visible when the transition starts. Only the final scene may fade out.
