# VIDEO_DNA Extraction Template

Use this template when the user provides a reference video and wants a technical blueprint for HyperFrames reproduction.

## Required Output Format

Every VIDEO_DNA.md must include all 6 sections below. See [video-dna-example.md](video-dna-example.md) for a complete worked example.

### Section 1: Source Metadata

```markdown
# VIDEO_DNA — [Video Title]

**Source**: [filename or URL]
**Duration**: [X]s | **Resolution**: [WxH] | **FPS**: [N]
**Type**: [genre — e.g., AI/tech launch, product demo, brand sizzle]
```

### Section 2: Segment-by-Second Breakdown

Split the video into **segments** (logical chapters). For each segment:

1. **Segment header** with name and time range (e.g., `SEGMENT 3: FEATURE CAROUSEL (8-18s)`)
2. **Per-second table** with columns: `秒 | 画面 | 动画技法 | GSAP / CSS HOW-TO`

The HOW-TO column must contain **copy-pasteable GSAP code** with specific parameters:

```js
// GOOD — specific, reusable
tl.fromTo(".logo", {scale:1.5, opacity:0}, {scale:1, opacity:1, duration:0.6, ease:"power3.out"})

// BAD — vague, not actionable
"Logo appears with a zoom effect"
```

3. **ASCII layout diagram** showing element positions for complex segments
4. **Asset checklist** with priority markers:
   - `🔴 BLOCKING` — segment cannot be built without this
   - `🟡 RECOMMENDED` — significantly improves quality
   - `🟢 OPTIONAL` — nice to have

### Section 3: Design Tokens

Extract CSS custom properties from the video:

```css
:root {
  --bg-primary: #hex;
  --bg-secondary: #hex;
  --accent-primary: #hex;
  --text-primary: #hex;
  --text-secondary: #hex;
  --glass-bg: rgba(...);
  --glass-border: rgba(...);
}

/* Typography */
.headline { font-size: Xpx; font-weight: N; }
.body { font-size: Xpx; font-weight: N; }
.caption { font-size: Xpx; font-weight: N; }
```

### Section 4: Transition Library

List every transition type used, with timing and GSAP code:

| Name | Duration | Used at | Code |
|------|----------|---------|------|
| White Flash | 0.05s | Segment cuts | `tl.to(flash,{opacity:0.9,duration:0.03}); tl.to(flash,{opacity:0,duration:0.04})` |
| Cross Dissolve | 0.5s | Video switches | `tl.to(out,{opacity:0,duration:0.5})` |

### Section 5: Rhythm Analysis

| Segment | Duration | Cut Frequency | Info Density |
|---------|----------|---------------|--------------|
| SEG 1 | 4s | Slow (gradient) | ★☆☆☆☆ |
| SEG 3 | 10s | Fast (every 3.3s) | ★★★★☆ |

### Section 6: Complete Asset Checklist

Consolidate all segment assets into one table with priority:

#### 🔴 BLOCKING (missing = cannot build)

| # | Asset | Format | Qty | Blocks |
|---|-------|--------|-----|--------|
| 1 | Brand Logo | SVG + PNG | 2 | SEG 1,2,8 |

#### 🟡 RECOMMENDED (missing = degraded quality)

| # | Asset | Format | Qty | Affects |
|---|-------|--------|-----|---------|
| 7 | Scene videos | MP4 1920x1080 5-10s | 2-3 | SEG 4 |

#### 🟢 OPTIONAL (missing = acceptable fallback)

| # | Asset | Format | Source | Fallback |
|---|-------|--------|--------|----------|
| 13 | Particle background | MP4/CSS | tsParticles | CSS gradient |

### Section 7: HyperFrames Feasibility

| Segment | Programmable | Needs External Assets | Key Challenge |
|---------|-------------|----------------------|---------------|
| SEG 1 | 80% | Logo SVG | Particle convergence needs CSS tricks |
| SEG 4 | 40% | Scene videos | `<video>` embed + backdrop-filter |

**Total programmable ratio**: ~X%

## Extraction Workflow

### Step 1: Two-Pass Viewing

1. **First pass** — feel the rhythm, pacing, structure. Note segment boundaries.
2. **Second pass** — note specific timing, transitions, text, colors, motion parameters.

### Step 2: Segment the Video

Group consecutive seconds into logical segments. Common patterns:

| Segment Type | Typical Duration | Purpose |
|-------------|-----------------|---------|
| Dark Open | 3-5s | Build tension, brand hint |
| Brand Reveal | 3-5s | Logo + product name |
| Feature Carousel | 8-15s | 3-5 features, hard cuts between each |
| Use Case / Scene | 8-15s | Real-world footage + overlay cards |
| Data / Metrics | 10-15s | Number counters, charts, progress bars |
| Social Proof | 5-10s | Logo wall, testimonials |
| Value Summary + CTA | 5-8s | Keywords, CTA button |
| Brand Outro | 4-6s | Logo, slogan, fade to black |

### Step 3: Extract Per-Second HOW-TO

For each second within a segment:

1. **Describe what appears** on screen
2. **Name the animation technique** (from the standard vocabulary below)
3. **Write the GSAP code** with specific parameters (ease, duration, stagger)

Standard animation vocabulary:

| Technique | When to Use | Key Parameters |
|-----------|------------|----------------|
| Impact Pop | Text/element entrance | `scale: N, ease: "back.out(X)", duration: 0.3-0.6` |
| Kinetic Type | Word-by-word entrance | `stagger: 0.05-0.1, duration: 0.3` |
| Slide Up | Content entrance | `y: 30-60, ease: "power3.out", duration: 0.4-0.5` |
| Sweep Line | Scanning effect | `scaleX: 0→1, transformOrigin: "left center"` |
| Number Counter | Metric display | `onUpdate` with `Math.round().toLocaleString()` |
| Stagger Pop | Multiple elements | `stagger: 0.1-0.25, ease: "back.out(1.5-2)"` |
| Fade In/Out | Gentle transitions | `opacity: 0→1, duration: 0.3-0.6` |
| Scale Reveal | Element reveal | `scale: 1.2→1, duration: 0.5` |
| White Flash | Hard segment cuts | `opacity: 0.9, duration: 0.03-0.05` |
| Cross Dissolve | Video scene switches | `opacity swap, duration: 0.5` |

### Step 4: Extract Design Tokens

Use color picker or frame analysis to extract:

1. All background colors (hex)
2. All text colors (hex)
3. All accent/highlight colors (hex)
4. Font sizes for each hierarchy level (px)
5. Font weights for each level
6. Glass/overlay effects (rgba values)

### Step 5: Build Asset Checklist

For each segment, list required assets with priority. Cross-reference with the user's `assets/` directory when available to identify gaps.

## VIDEO_DNA → COMPOSITION Workflow

After extracting VIDEO_DNA.md:

1. Compare DNA asset requirements against user's `ASSETS.md`
2. Update `ASSET_GAPS.md` with DNA-derived blocking gaps
3. Extract design tokens into `DESIGN_TOKENS.md` (override style-matched tokens if DNA is available)
4. Use HOW-TO code segments as the starting point for `COMPOSITION.md` scene code
5. Use the feasibility assessment to guide which segments need user-provided assets vs pure code

## Quality Checklist

Before finalizing VIDEO_DNA.md, verify:

- [ ] Every second has a specific GSAP/CSS HOW-TO code line
- [ ] All hex colors are extracted (not described as "blue" or "dark")
- [ ] Every segment has an asset checklist with priority markers
- [ ] ASCII layout diagrams exist for complex segments (3+ elements)
- [ ] Feasibility percentage is assigned to every segment
- [ ] Transition library covers all segment boundaries
- [ ] Rhythm analysis shows pacing variation across segments
