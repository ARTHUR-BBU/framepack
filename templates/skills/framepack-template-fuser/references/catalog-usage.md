# HyperFrames Catalog Usage Guide

## Block vs Component — Two Completely Different Things

### Block = Complete Mini-Video (usually too heavy)

Blocks are **self-contained 4-15 second videos** with their own style, layout, content, and brand. Examples:

| Block | Duration | What It Is |
|-------|----------|------------|
| flash-through-white | 4s | White flash transition with WebGL shader + metadata panel |
| data-chart | 15s | Complete NYT-style data chart with its own background and fonts |
| vfx-text-cursor | 8s | Text cursor VFX with Canvas shader + "HeyGen" branding |
| app-showcase | 5.5s | Fitness app demo with 3D phone model and workout content |

**When to use Block**: When the block's visual style matches your project exactly. Otherwise, adapting a block to your brand requires major rework — almost like rewriting.

**How to use Block**: Mount as sub-composition:
```html
<div data-composition-id="my-block"
     data-composition-src="compositions/flash-through-white.html"
     data-start="3" data-duration="4">
</div>
```

### Component = CSS/GSAP Code Snippet (this is the real ammunition)

Components are **embeddable animation patterns** — a few lines of CSS + GSAP that you copy into your composition. These are the core building blocks for composition coding.

**Caption Components** (text animation):
- `caption-kinetic-slam` — dynamic text slam
- `caption-clip-wipe` — text wipe reveal
- `caption-neon-glow` — neon glow text
- `caption-pill-karaoke` — karaoke highlight pill
- `caption-gradient-fill` — gradient color fill
- `caption-emoji-pop` — emoji pop effect
- `caption-weight-shift` — font weight transition
- `caption-glitch-rgb` — RGB glitch text
- `caption-particle-burst` — particle explosion text
- `caption-highlight` — highlight marker
- `caption-matrix-decode` — matrix decode effect

**Effect Components** (visual overlays):
- `vignette` — dark corner overlay
- `grain-overlay` — film grain texture
- `shimmer-sweep` — shine sweep effect
- `grid-pixelate-wipe` — pixel dissolve

**Parallax Components**:
- `parallax-zoom` — zoom parallax
- `parallax-unzoom` — reverse parallax

**Value**: Components can reduce 30-50% of hand-written CSS/GSAP. Use them first, write custom code only when no component fits.

## Step-by-Step Usage

### Step 1: Check catalog

```bash
npx hyperframes catalog --json
```

Run this BEFORE writing any custom animation code.

### Step 2: Install components

```bash
# Single component
npx hyperframes add caption-kinetic-slam

# Or batch install via Framepack
npx framepack catalog install
```

### Step 3: Use installed components

After `npx hyperframes add caption-kinetic-slam`, check the installed source in `components/` or `compositions/`. Copy the CSS classes and GSAP tween patterns into your main composition HTML.

Example pattern:
```html
<!-- Copy the component's CSS into your <style> -->
<style>
.caption-kinetic-slam { ... }
</style>

<!-- Use the component's HTML structure -->
<div class="caption-kinetic-slam" data-scene-id="scene-3">
  <span class="word">Your</span>
  <span class="word">Text</span>
  <span class="word">Here</span>
</div>

<!-- Copy the GSAP timeline from the component -->
<script>
tl.fromTo(".caption-kinetic-slam .word", 
  { y: 100, opacity: 0, scale: 0.5 },
  { y: 0, opacity: 1, scale: 1, stagger: 0.08, duration: 0.4, ease: "back.out(1.7)" }
);
</script>
```

### Step 4: Brand-adapt components

Components come with default colors. Override with your project's design tokens:

```css
.caption-kinetic-slam {
  --slam-color: var(--accent-primary);    /* was #ff0000 */
  --slam-bg: var(--bg-primary);           /* was #000000 */
}
```

## Catalog Pre-Flight Checklist

Before starting composition code:

- [ ] Ran `npx hyperframes catalog --json` or `npx framepack catalog`
- [ ] Ran `npx framepack catalog install` to batch-install components
- [ ] Verified installed files in `components/` or `compositions/`
- [ ] Identified which scenes can use components vs need custom code
- [ ] Prioritized components over custom code for all caption/effect needs

## Troubleshooting

**Component install timeout**: This is a known HyperFrames registry issue. Use `npx framepack catalog install` which has built-in retry logic. If all retries fail, the component source can usually be reconstructed from the code-templates reference.

**Block doesn't match my brand**: Blocks are complete mini-videos with their own branding. If a block's style doesn't match, don't force it — use Components instead and build the scene yourself.
