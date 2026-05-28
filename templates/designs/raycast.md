# Design System Inspired by Raycast

> Category: Developer Tools
> Productivity launcher. Sleek dark chrome, vibrant gradient accents.

## 1. Visual Theme & Atmosphere

Raycast's marketing site feels like the dark interior of a precision instrument — a Swiss watch case carved from obsidian. The background isn't just dark, it's an almost-black blue-tint (`#07080a`) that creates a sense of being inside a macOS native application rather than a website. Every surface, every border, every shadow is calibrated to evoke the feeling of a high-performance desktop utility: fast, minimal, trustworthy.

The signature move is the layered shadow system borrowed from macOS window chrome: multi-layer box-shadows with inset highlights that simulate physical depth, as if cards and buttons are actual pressed or raised glass elements on a dark desk. Combined with Raycast Red (`#FF6363`) — deployed almost exclusively in the hero's iconic diagonal stripe pattern — the palette creates a brand that reads as "powerful tool with personality." The red doesn't dominate; it punctuates.

Inter is used everywhere — headings, body, buttons, captions — with extensive OpenType features (`calt`, `kern`, `liga`, `ss03`) creating a consistent, readable typographic voice. The positive letter-spacing (0.2px–0.4px on body text) is unusual for a dark UI and gives the text an airy, breathable quality that counterbalances the dense, dark surfaces. GeistMono appears for code elements, reinforcing the developer-tool identity.

**Key Characteristics:**
- Near-black blue-tinted background (`#07080a`) — not pure black, subtly blue-shifted
- macOS-native shadow system with multi-layer inset highlights simulating physical depth
- Raycast Red (`#FF6363`) as a punctuation color — hero stripes, not pervasive
- Inter with positive letter-spacing (0.2px) for an airy, readable dark-mode experience
- Radix UI component primitives powering the interaction layer
- Subtle rgba white borders (0.06–0.1 opacity) for containment on dark surfaces
- Keyboard shortcut styling with gradient key caps and heavy shadows

## 2. Color Palette & Roles

### Primary
- **Near-Black Blue** (`#07080a`): Primary page background — the foundational void with a subtle blue-cold undertone
- **Pure White** (`#ffffff`): Primary heading text, high-emphasis elements
- **Raycast Red** (`#FF6363` / `hsl(0, 100%, 69%)`): Brand accent — hero stripes, danger states, critical highlights

### Secondary & Accent
- **Raycast Blue** (`hsl(202, 100%, 67%)` / ~`#55b3ff`): Interactive accent — links, focus states, selected items
- **Raycast Green** (`hsl(151, 59%, 59%)` / ~`#5fc992`): Success states, positive indicators
- **Raycast Yellow** (`hsl(43, 100%, 60%)` / ~`#ffbc33`): Warning accents, highlights
- **Blue Transparent** (`hsla(202, 100%, 67%, 0.15)`): Blue tint overlay for interactive surfaces
- **Red Transparent** (`hsla(0, 100%, 69%, 0.15)`): Red tint overlay for danger/error surfaces

### Surface & Background
- **Deep Background** (`#07080a`): Page canvas, the darkest surface
- **Surface 100** (`#101111`): Elevated surface, card backgrounds
- **Key Start** (`#121212`): Keyboard key gradient start
- **Key End** (`#0d0d0d`): Keyboard key gradient end
- **Card Surface** (`#1b1c1e`): Badge backgrounds, tag fills, elevated containers
- **Button Foreground** (`#18191a`): Dark surface for button text on light backgrounds

### Neutrals & Text
- **Near White** (`#f9f9f9` / `hsl(240, 11%, 96%)`): Primary body text, high-emphasis content
- **Light Gray** (`#cecece` / `#cdcdce`): Secondary body text, descriptions
- **Silver** (`#c0c0c0`): Tertiary text, subdued labels
- **Medium Gray** (`#9c9c9d`): Link default color, secondary navigation
- **Dim Gray** (`#6a6b6c`): Disabled text, low-emphasis labels
- **Dark Gray** (`#434345`): Muted borders, inactive navigation links
- **Border** (`hsl(195, 5%, 15%)` / ~`#252829`): Standard border color for cards and dividers
- **Dark Border** (`#2f3031`): Separator lines, table borders

### Semantic & Accent
- **Error Red** (`hsl(0, 100%, 69%)`): Error states, destructive actions
- **Success Green** (`hsl(151, 59%, 59%)`): Success confirmations, positive states
- **Warning Yellow** (`hsl(43, 100%, 60%)`): Warnings, attention-needed states
- **Info Blue** (`hsl(202, 100%, 67%)`): Informational highlights, links

### Gradient System
- **Keyboard Key Gradient**: Linear gradient from `#121212` (top) to `#0d0d0d` (bottom) — simulates physical key depth
- **Warm Glow**: `rgba(215, 201, 175, 0.05)` radial spread — subtle warm ambient glow behind featured elements

## 3. Typography Rules

### Font Family
- **Primary**: `Inter` — humanist sans-serif, used everywhere. Fallbacks: `Inter Fallback`, system sans-serif
- **System**: `SF Pro Text` — Apple system font for select macOS-native UI elements. Fallbacks: `SF Pro Icons`, `Inter`, `Inter Fallback`
- **Monospace**: `GeistMono` — Vercel's monospace font for code elements. Fallbacks: `ui-monospace`, `SFMono-Regular`, `Roboto Mono`, `Menlo`, `Monaco`
- **OpenType features**: `calt`, `kern`, `liga`, `ss03` enabled globally; `ss02`, `ss08` on display text; `liga` disabled (`"liga" 0`) on hero headings

### Hierarchy

| Role | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|--------|-------------|----------------|-------|
| Display Hero | 64px | 600 | 1.10 | 0px | OpenType: liga 0, ss02, ss08 |
| Section Display | 56px | 400 | 1.17 | 0.2px | OpenType: calt, kern, liga, ss03 |
| Section Heading | 24px | 500 | normal | 0.2px | OpenType: calt, kern, liga, ss03 |
| Card Heading | 22px | 400 | 1.15 | 0px | OpenType: calt, kern, liga, ss03 |
| Sub-heading | 20px | 500 | 1.60 | 0.2px | Relaxed line-height for readability |
| Body Large | 18px | 400 | 1.15 | 0.2px | OpenType: calt, kern, liga, ss03 |
| Body | 16px | 500 | 1.60 | 0.2px | Primary body text, relaxed rhythm |
| Body Tight | 16px | 400 | 1.15 | 0.1px | UI labels, compact contexts |
| Button | 16px | 600 | 1.15 | 0.3px | Semibold, slightly wider tracking |
| Nav Link | 16px | 500 | 1.40 | 0.3px | Links in navigation |
| Caption | 14px | 500 | 1.14 | 0.2px | Small labels, metadata |
| Caption Bold | 14px | 600 | 1.40 | 0px | Emphasized captions |
| Small | 12px | 600 | 1.33 | 0px | Badges, tags, micro-labels |
| Small Link | 12px | 400 | 1.50 | 0.4px | Footer links, fine print |
| Code | 14px (GeistMono) | 500 | 1.60 | 0.3px | Code blocks, technical content |
| Code Small | 12px (GeistMono) | 400 | 1.60 | 0.2px | Inline code, terminal output |

### Principles
- **Positive tracking on dark**: Unlike most dark UIs that use tight or neutral letter-spacing, Raycast applies +0.2px to +0.4px — creating an airy, readable feel that compensates for the dark background
- **Weight 500 as baseline**: Most body text uses medium weight (500), not regular (400) — subtle extra heft improves legibility on dark surfaces
- **Display restraint**: Hero text at 64px/600 is confident but not oversized — Raycast avoids typographic spectacle in favor of functional elegance
- **OpenType everywhere**: `ss03` (stylistic set 3) is enabled globally across Inter, giving the typeface a slightly more geometric, tool-like quality

## 7. Do's and Don'ts

### Do
- Use `#07080a` (not pure black) as the background — the blue-cold tint is essential to the Raycast feel
- Apply positive letter-spacing (+0.2px) on body text — this is deliberately different from most dark UIs
- Use multi-layer shadows with inset highlights for interactive elements — the macOS-native depth is signature
- Keep Raycast Red (`#FF6363`) as punctuation, not pervasive — reserve it for hero moments and error states
- Use `rgba(255, 255, 255, 0.06)` borders for card containment — barely visible, structurally essential
- Apply weight 500 as the body text baseline — medium weight improves dark-mode legibility
- Use pill shapes (86px+ radius) for primary CTAs, rectangular shapes (6px–8px) for secondary actions
- Enable OpenType features `calt`, `kern`, `liga`, `ss03` on all Inter text
- Use opacity transitions (hover: opacity 0.6) for button interactions, not color changes

### Don't
- Use pure black (`#000000`) as the background — the blue tint differentiates Raycast from generic dark themes
- Apply negative letter-spacing on body text — Raycast deliberately uses positive spacing for readability
- Use Raycast Blue as the primary accent for everything — blue is for interactive/info, red is the brand color
- Create single-layer flat shadows — the multi-layer inset system is core to the macOS-native aesthetic
- Use regular weight (400) for body text when 500 is available — the extra weight prevents dark-mode text from feeling thin
- Mix warm and cool borders — stick to the cool gray (`hsl(195, 5%, 15%)`) border palette
- Apply heavy drop shadows without inset companions — shadows always come in pairs (outer + inset)
- Use decorative elements, gradients, or colorful backgrounds — the dark void is the stage, content is the performer

## 9. Agent Prompt Guide

### Quick Color Reference
- Primary Background: Near-Black Blue (`#07080a`)
- Primary Text: Near White (`#f9f9f9`)
- Brand Accent: Raycast Red (`#FF6363`)
- Interactive Blue: Raycast Blue (`hsl(202, 100%, 67%)` / ~`#55b3ff`)
- Secondary Text: Medium Gray (`#9c9c9d`)
- Card Surface: Surface 100 (`#101111`)
- Border: Dark Border (`hsl(195, 5%, 15%)` / ~`#252829`)

### Example Component Prompts
- "Create a hero section on #07080a background with 64px Inter heading (weight 600, line-height 1.1), near-white text (#f9f9f9), and a semi-transparent white pill CTA button (hsla(0,0%,100%,0.815), 86px radius, dark text #18191a)"
- "Design a feature card with #101111 background, 1px solid rgba(255,255,255,0.06) border, 16px border-radius, double-ring shadow (rgb(27,28,30) 0px 0px 0px 1px outer), 22px Inter heading, and #9c9c9d body text"
- "Build a navigation bar on dark background (#07080a), Inter links at 16px weight 500 in #9c9c9d, hover to white, and a translucent white pill button at the right end"
- "Create a keyboard shortcut display with key caps using gradient background (#121212→#0d0d0d), 5-layer shadow for physical depth, 4px radius, Inter 12px weight 600 text"
- "Design an alert card with #101111 surface, Raycast Red (#FF6363) left border accent, translucent red glow (hsla(0,100%,69%,0.15)), white heading, and #cecece description text"

### Iteration Guide
When refining existing screens generated with this design system:
1. Check the background is `#07080a` not pure black — the blue tint is critical
2. Verify letter-spacing is positive (+0.2px) on body text — negative spacing breaks the Raycast aesthetic
3. Ensure shadows have both outer and inset layers — single-layer shadows look flat and wrong
4. Confirm Inter has OpenType features `calt`, `kern`, `liga`, `ss03` enabled
5. Test that hover states use opacity transitions (0.6) not color swaps — this is a core interaction pattern
