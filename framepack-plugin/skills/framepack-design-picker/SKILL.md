---
name: framepack-design-picker
description: >-
  Visual style selection via HyperFrames Design Picker. Launches an
  interactive HTML page where the user browses mood boards, picks palettes
  and typography, and generates a design.md. Framepack orchestrates the
  experience; HyperFrames provides the picker machinery.
version: 0.7.12
platforms: ["linux", "macos", "windows"]
metadata:
  hermes:
    tags: ["video", "framepack", "design-picker", "visual-style", "hyperframes"]
    category: creative
---

# Framepack Design Picker

You orchestrate the visual style selection experience. HyperFrames provides a
44KB interactive HTML picker — you decide what options to show and how to
present them. The user picks a direction; you translate their choice into
a concrete design spec (frame.md or design.md) for the composition pipeline.

## When to Launch

Launch the picker when:
- User's intent is ambiguous ("好看的视频", "something cool")
- Multiple Visual Styles could match
- User asks to see options ("有什么风格可以选？")
- First-time project with no existing design spec

Do NOT launch when:
- User specified a clear style ("Data Drift")
- Project has an existing frame.md — respect it
- Making a small edit to existing composition

## The Picker Flow

### Phase 1: Mood Board Selection

Generate 4-8 mood boards. Each must tell a different STORY about the brand,
not just reshuffle colors.

**Good mood boards tell narratives:**
- "Terminal Precision" — code-forward, data-dense, CLI energy, dark canvas
- "Warm Workspace" — nice notebook energy, personal, approachable
- "Cinematic Launch" — title sequence vibes, the viewer leans forward
- "Street Energy" — raw, kinetic, urban rhythm

**Bad mood boards are color swaps:**
- "Dark Blue" / "Dark Green" / "Dark Purple" / "Dark Red"

Every mood board pre-selects one option from each category (architecture,
palette, typography, corners, density, depth, easing). The user sees a
mini-preview with real content, not abstract swatches.

### Phase 2: Fine-Tune

After the user picks a mood board, they can adjust:
- **Palette** — exact colors (light/dark/tinted mix)
- **Typography** — font pairing (cross-category: serif+sans, not sans+sans)
- **Corners** — sharp vs rounded
- **Density** — spacing and element count
- **Depth** — elevation and shadow intensity
- **Easing** — animation personality

## Technical Setup

### 1. Copy the picker template

```bash
mkdir -p .hyperframes
cp node_modules/hyperframes/dist/skills/hyperframes/templates/design-picker.html \
   .hyperframes/pick-design.html
```

### 2. Generate and inject option data

Replace these placeholders in the HTML (use Python, not sed, for quote safety):

- `__ARCHITECTURES_JSON__` — layout architecture objects (one per mood board min)
- `__PALETTES_JSON__` — 5-6 palette objects (named after the brand's world)
- `__TYPEPAIRS_JSON__` — 5-6 type pairing objects (cross-category)
- `__MOODBOARDS_JSON__` — 4-8 mood board objects (pre-selections)
- `__PROMPT_JSON__` — `{ title, headline, subline, section_desc }`

### Architecture Data Requirements

Each architecture object needs:
- `preview_html` — HTML that renders in the preview panel
- Uses token placeholders: `{{bg}}`, `{{fg}}`, `{{ac}}`, `{{hf}}`, `{{bf}}`,
  `{{cr}}`, `{{pad}}`, `{{gap}}`, `{{shadow}}`, `{{g}}`, opacity variants
- **Every token must be used** — unused tokens = no visible effect
- **15+ distinct elements** in preview_html — headline, subhead, body, label,
  stat, quote, cards, buttons, code block, dividers, data elements
- **No `<script>` tags, event handlers, or `javascript:` URLs** in preview_html
- **Background images**: use `url(path)` WITHOUT quotes (breaks inside `style='...'`)

### Palette Requirements

- 5-6 palettes, named after the brand's world (not generic moods)
- Mix dark + light + tinted backgrounds
- Every palette visually distinct at swatch size (14px)
- If two palettes share same background lightness + similar accent hue → cut one

### Type Pairing Requirements

- 5-6 pairings, cross-category (NEVER two sans-serifs)
- Match brand energy and audience
- Run font discovery script first to avoid defaulting to the same 8 fonts

### 3. Serve the picker

```bash
cd <project-dir> && python3 -m http.server 8723 &
```

Verify: `curl -s -o /dev/null -w "%{http_code}" http://localhost:8723/.hyperframes/pick-design.html`
Only share if returns 200. Do NOT use `npx hyperframes preview` — it blocks.

### 4. Collect the result

The user picks options, copies the generated design.md, and pastes it back.
Save verbatim to `design.md` (or `frame.md`) in project root.

After pasting, kill the server: `kill %1` or `kill $(lsof -ti:8723)`

### 5. Continue to composition

The design.md is now in spec format (YAML frontmatter + prose sections).
It becomes the source of truth for the prompt expansion step.

## Output Format

The picker outputs a Google design.md spec-compliant file:

```yaml
---
name: <style-name>
colors:
  primary: "#hex"
  on-primary: "#hex"
  accent: "#hex"
typography:
  headline: { fontFamily: ..., fontSize: ..., fontWeight: ... }
  label: { fontFamily: ..., fontSize: ..., fontWeight: ... }
rounded: { ... }
spacing: { ... }
---
## Overview
## Colors
## Typography
## Layout
## Elevation
## Components
## Do's and Don'ts
```

This is directly consumable by the HyperFrames pipeline. If the user's
project needs motion tokens (frame.md), add the motion layer based on the
matched Visual Style's defaults.

## Framepack vs HyperFrames Roles

| Framepack (Director) | HyperFrames (Studio Equipment) |
|----------------------|-------------------------------|
| Decides WHICH mood boards to generate | Provides the 44KB picker template |
| Matches user intent to Visual Styles | Renders the interactive UI |
| Interprets user's selection emotionally | Outputs structured design.md |
| Feels like a creative conversation | Is the machinery underneath |
