# Design Picker Workflow — How Framepack Launches the Visual Selector

When the user's intent is ambiguous or they want to explore options, launch
HyperFrames' Design Picker. This is a 44KB HTML interactive page that
HyperFrames provides — Framepack just orchestrates it.

## When to Launch

- User says something vague: "帮我做个好看的视频"
- Multiple Visual Styles could match (e.g., "高端" could be Velvet Standard or Swiss Pulse)
- User explicitly asks to see options: "有什么风格可以选？"
- First-time project with no frame.md or design.md

Do NOT launch when:
- User already specified a clear style ("我要 Data Drift 那种")
- Project has an existing frame.md — respect it
- Making a small edit to an existing composition

## How to Launch

### 1. Generate options

Create deeply contextual options based on the user's prompt:

**Mood boards** (4-8): Each tells a different STORY about the brand.
Not just color swaps — different narrative positions.

**Architectures** (one per mood board): Visually distinct layout options.
Use `{{prompt_headline}}` and `{{prompt_sub}}` tokens for real content.

**Palettes** (5-6): Named after the brand's world, not generic moods.
Mix dark + light + tinted. Every palette must be visually distinct at swatch size.

**Type pairings** (5-6): Cross-category (never two sans-serifs).
Match the brand's energy and audience.

### 2. Set up the picker

```bash
mkdir -p .hyperframes
# Copy the Design Picker template from HyperFrames
cp node_modules/hyperframes/dist/skills/hyperframes/templates/design-picker.html \
   .hyperframes/pick-design.html
```

### 3. Inject data

Replace these placeholders in the HTML:
- `__ARCHITECTURES_JSON__` — array of architecture objects
- `__PALETTES_JSON__` — array of palette objects
- `__TYPEPAIRS_JSON__` — array of type pairing objects
- `__MOODBOARDS_JSON__` — array of mood board objects
- `__PROMPT_JSON__` — object with prompt context

### 4. Serve

```bash
cd <project-dir> && python3 -m http.server 8723 &
```

Verify: `curl -s -o /dev/null -w "%{http_code}" http://localhost:8723/.hyperframes/pick-design.html`
Only share the link if it returns 200.

Do NOT use `npx hyperframes preview` for the picker — it blocks.

### 5. Collect

The user picks options in the browser, then copies the generated design.md
and pastes it back. Save verbatim to `design.md` (or `frame.md`) in the
project root.

After the user pastes, kill the server: `kill %1`

### 6. Continue

Now you have a complete design spec with brand tokens. Proceed with
Prompt Expansion → Composition → Render.

## Framepack's Role vs HyperFrames' Role

| Framepack (Director) | HyperFrames (Studio) |
|----------------------|----------------------|
| Decides WHICH mood boards to generate | Provides the Design Picker template |
| Matches intent to Visual Style | Renders the interactive UI |
| Interprets user's selection | Outputs the design.md format |
| Feels natural to the user | Is the machinery underneath |

The user sees Framepack helping them choose a direction.
They don't see HyperFrames running the picker.
