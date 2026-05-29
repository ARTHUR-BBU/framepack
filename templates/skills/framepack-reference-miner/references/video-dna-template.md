# Video DNA Extraction Guide

Use this guide when the user provides a finished video or reference video and wants to extract a reusable template from it.

## What is VIDEO_DNA.md?

VIDEO_DNA.md captures the structural DNA of a reference video — the timing, rhythm, scene structure, motion patterns, and text treatment. It is not a frame-by-frame breakdown; it is the director's blueprint.

## Extraction Steps

### 1. Observe the full video at least twice

First pass: feel the rhythm, pacing, and overall structure.
Second pass: note specific timing, transitions, and text treatments.

### 2. Document scene structure

For each scene, record:

- **Start time** and **duration**
- **Visual content**: what appears on screen (text, image, video clip, data visualization)
- **Text content**: exact wording of any text, subtitles, or captions
- **Animation type**: entrance, transition, exit (use the code-templates naming: impact pop, kinetic type, hard snap, dissolve, scale reveal, slide up, number counter, sweep line)
- **Motion direction**: left-to-right, bottom-up, scale-in, fade, etc.
- **Color treatment**: background, text color, overlay opacity

### 3. Document audio synchronization

- Music beat points (if any)
- Voice-over timing
- Sound effect triggers

### 4. Extract the rhythm pattern

Common patterns:

- **Steady beat**: scenes change at equal intervals (e.g., every 2s for a 30s video with 15 scenes)
- **Accelerating**: start slow, build speed (e.g., 4s → 3s → 2s → 1s)
- **Book-ended**: slow open and close, fast middle
- **Punctuated**: mostly steady with occasional pauses for emphasis

### 5. Identify the text treatment pattern

- Font weight and size hierarchy
- Animation style for text (kinetic type, impact pop, slide up)
- Text duration on screen relative to reading speed

## VIDEO_DNA.md Template

```markdown
# Video DNA: [Reference Name]

## Metadata
- Source: [file name or URL]
- Duration: [total seconds]
- Format: [16:9 / 9:16]
- Estimated fps: [24/30/60]

## Rhythm Pattern
[steady / accelerating / book-ended / punctuated]
Average scene duration: [X]s

## Scene Breakdown

### Scene 1 (0.0s - 2.5s)
- Visual: [description]
- Text: "[exact text]"
- Animation: [entrance type → exit type]
- Color: bg [#hex], text [#hex]
- Audio: [sync point]

[... repeat for each scene ...]

## Motion Vocabulary
- Primary animation: [e.g., kinetic type, scale reveal]
- Transition style: [e.g., hard snap, dissolve]
- Text treatment: [e.g., impact pop for headlines, slide up for body]

## Color System
- Primary: [#hex]
- Secondary: [#hex]
- Background: [#hex]
- Text: [#hex]
- Accent: [#hex]

## Typography
- Headline: [font weight, size relative to viewport]
- Body: [font weight, size]
- Caption/subtitle: [font weight, size]
```

## Converting VIDEO_DNA to TEMPLATE_BLUEPRINT

Once VIDEO_DNA.md is complete, convert it to TEMPLATE_BLUEPRINT.md by abstracting the specific content into reusable slots:

| VIDEO_DNA field | TEMPLATE_BLUEPRINT slot |
|---|---|
| Scene 1 text: "Introducing Acme" | `{{headline}}` |
| Scene 2 text: "The fastest way to..." | `{{value_proposition}}` |
| Scene 3 image: product.jpg | `{{product_image}}` |
| Color #hex values | `{{color_primary}}`, `{{color_secondary}}` |

The blueprint should be generic enough to apply to different products, brands, or campaigns while preserving the structural DNA.
