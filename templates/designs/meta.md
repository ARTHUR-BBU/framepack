# Design System Inspired by Meta (Store)

> Category: E-Commerce & Retail
> Tech retail store. Photography-first, binary light/dark surfaces, Meta Blue CTAs.

## 1. Visual Theme & Atmosphere

The Meta Store is a product-forward retail experience built to sell hardware — Quest VR headsets, Ray-Ban Meta smart glasses, and accessories. The design walks a tightrope between consumer electronics showroom and lifestyle editorial, deploying cinematic product photography against expansive white canvas to create a gallery-like sense of aspiration. Every design decision serves the merchandise: generous negative space frames hero product shots like museum pieces, while alternating light and dark surface sections create a visual rhythm that mimics the experience of walking through a physical retail space.

The "Dolly" design system (Meta's internal name for the store layer) sits atop the broader FDS (Facebook Design System) foundation, inheriting its gray scale and semantic tokens while overlaying its own product-focused palette. The result is a system that feels distinctly Meta — the custom Optimistic typeface brings warmth and approachability to what could otherwise be cold tech retail — yet flexible enough to showcase wildly different product lines (from VR headsets to fashion eyewear) without feeling disjointed. The surface strategy is binary: pure white for browsing and information, rich dark for immersive product moments.

The store's visual hierarchy is ruthlessly simple. Photography does the heavy lifting, supported by short, punchy headlines in Optimistic Medium and body text that stays brief and scannable. Calls to action are pill-shaped, unmistakable, and always Meta Blue. There is no visual noise, no decoration for decoration's sake — every element either sells or navigates.

**Key Characteristics:**
- Photography-first retail design where products are the visual heroes, not UI
- Binary surface strategy: pure white for information, deep dark for immersive product moments
- Pill-shaped CTAs in saturated blue create unmistakable action points
- Optimistic VF typeface with OpenType ss01/ss02 features brings geometric warmth
- Generous whitespace frames products like gallery exhibits
- 8px spacing grid with disciplined vertical rhythm
- Alternating light/dark sections create a "walkthrough" retail cadence

## 2. Color Palette & Roles

### Primary

- **Meta Blue** (`#0064E0`): Primary CTA background, interactive links, action-driving elements throughout the store
- **Meta Blue Hover** (`#0143B5`): Darkened blue for hover states on primary buttons
- **Meta Blue Pressed** (`#004BB9`): Deepest blue for active/pressed button states
- **Meta Blue Light** (`#47A5FA`): Lighter blue variant used on dark backgrounds for CTAs
- **Facebook Blue** (`#1877F2`): Legacy accent inherited from FDS, used for deemphasized button text and badges

### Secondary & Accent

- **Ray-Ban Red** (`#D6311F`): Product-specific accent for Ray-Ban Meta smart glasses sections
- **Oculus Purple** (`#A121CE`): Quest/Oculus product accent for VR content
- **Work Purple** (`#6441D2`): Accent for Meta for Work/enterprise content
- **Portal Blue** (`#1B365D`): Deep navy accent for Portal product line
- **Portal Hero Blue** (`#C8E4E8`): Soft teal-blue for Portal hero backgrounds
- **Portal Light Blue** (`#ADD4E0`): Secondary Portal surface tint

### Surface & Background

- **White** (`#FFFFFF`): Primary page canvas, nav bar background, card surfaces
- **Soft Gray** (`#F1F4F7`): Secondary background for content sections (--dolly-bg-grey)
- **Warm Gray** (`#F7F8FA`): Flat card background, subtle surface differentiation
- **Web Wash** (`#F0F2F5`): Deemphasized background areas, attachment footers
- **Linen** (`#F2F0E6`): Warm off-white for lifestyle-adjacent sections
- **Baby Blue** (`#E8F3FF`): Highlight background, subtle blue tint for informational areas
- **Near Black** (`#1C1E21`): Dark section backgrounds, immersive product showcase areas
- **Oculus Light** (`#181A1B`): Slightly warm dark surface for Quest product sections
- **Oculus Dark** (`#000000`): Pure black for maximum contrast product displays
- **Overlay** (`rgba(0, 0, 0, 0.6)`): Modal/lightbox backdrop

### Neutrals & Text

- **Primary Text** (`#050505`): Main body and heading text on light surfaces
- **Dark Charcoal** (`#1C2B33`): Dolly system primary text, slightly warmer than pure black (--dolly-text-primary)
- **Icon Secondary** (`#465A69`): Secondary icon fills, subdued UI elements
- **Secondary Text** (`#65676B`): Supporting copy, labels, timestamps (--secondary-text)
- **Slate Gray** (`#5D6C7B`): Meta Store secondary text, product descriptions (--dolly-text-secondary)
- **Section Header** (`#4B4C4F`): Mid-gray for section titles
- **Button Text Gray** (`#444950`): FDS button text default (--fds-button-text)
- **Disabled Text** (`#BCC0C4`): Inactive button labels, placeholder text
- **CTA Disabled Text** (`#8595A4`): Muted blue-gray for disabled interactive labels
- **Divider** (`#CED0D4`): Content separators, input borders
- **Divider Gray** (`#DEE3E9`): Lighter divider for Dolly sections
- **CTA Gray Border** (`#CBD2D9`): Outline button borders
- **Dark Gray Border** (`#909396`): Stronger outline for emphasis

### Semantic & Accent

- **Success Green** (`#31A24C`): Badge success background, positive indicators
- **Store Success** (`#007D1E`): Darker success green for Dolly store confirmations
- **Error Red** (`#E41E3F`): Critical badge background, notification badges
- **Store Error** (`#C80A28`): Darker error red for Dolly store error states
- **Warning Amber** (`#F7B928`): Attention badges, caution indicators
- **Positive BG** (`rgba(36, 228, 0, 0.15)`): Subtle success background tint
- **Error BG** (`rgba(255, 123, 145, 0.15)`): Subtle error background tint
- **Warning BG** (`rgba(255, 226, 0, 0.15)`): Subtle warning background tint
- **Info BG** (`rgba(0, 145, 255, 0.15)`): Subtle informational blue tint

### Base Color Spectrum (FDS)

- **Cherry** (`#F3425F`): Expressive accent
- **Grape** (`#9360F7`): Purple accent
- **Lime** (`#45BD62`): Green accent
- **Seafoam** (`#54C7EC`): Cyan accent
- **Teal** (`#2ABBA7`): Teal accent
- **Tomato** (`#FB724B`): Orange accent
- **Pink** (`#FF66BF`): Pink accent

### Gradient System

- **Dark Overlay Gradient**: `linear-gradient(rgba(0,0,0,0), rgba(0,0,0,0.6))` — applied over dark product photography for text legibility
- **Blue Infinity Gradient**: The Meta symbol uses a blue-to-teal gradient on brand materials, though the store uses flat blue
- **Shadow Alpha Scale**: 0.05, 0.10, 0.15, 0.20, 0.30, 0.40, 0.50, 0.60, 0.80 — both black and white alpha ramps for layered transparency

## 3. Typography Rules

### Font Family

**Primary:** Optimistic VF (variable font by Dalton Maag, commissioned by Meta)
- Fallbacks: Montserrat, Helvetica, Arial, Noto Sans
- OpenType features: `"ss01", "ss02"` — stylistic sets that activate Meta-specific alternate glyphs
- Variable font with continuous weight axis (observed: 300, 400, 500, 700)

**Secondary:** Helvetica
- Fallbacks: Arial
- Used for small utility text (12px footer links, legal copy)

### Hierarchy

| Role | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|--------|-------------|----------------|-------|
| Display 1 | 64px | 500 (Medium) | 1.16 | — | Hero headlines on desktop, ss01+ss02 |
| Display 2 | 48px | 500 (Medium) | 1.17 | — | Section heroes, product titles |
| Heading 1 | 36px | 500 (Medium) | 1.28 | — | Major section headings |
| Heading 2 | 28px | 300 (Light) | 1.21 | — | Subheadings, lighter feel |
| Heading 3 | 18px | 700 (Bold) | 1.44 | — | Card titles, bold callouts, ss01+ss02 |
| Body | 18px | 400 (Regular) | 1.44 | — | Product descriptions, body copy |
| Body Compact | 16px | 500 (Medium) | 1.50 | -0.16px | Navigation links, UI labels |
| Caption Bold | 14px | 700 (Bold) | 1.43 | — | Emphasized labels, price text |
| Caption | 14px | 400 (Regular) | 1.43 | -0.14px | Secondary labels, metadata |
| Small | 12px | 400 (Regular) | 1.33 | — | Footer links, legal text, timestamps |
| Button | 14px | 400 (Regular) | 1.43 | -0.14px | Button label text |

### Principles

Optimistic VF is the cornerstone of Meta's typographic identity — a humanist sans-serif with geometric underpinnings that strikes a balance between Silicon Valley precision and consumer warmth. The "ss01" and "ss02" stylistic sets introduce alternate glyphs that give headlines a distinctive Meta character. Weight 500 (Medium) dominates headlines, creating a presence that commands without shouting, while the unexpected use of weight 300 (Light) at 28px adds an airy, editorial quality to subheadings. Negative letter-spacing at smaller sizes (-0.14px to -0.16px) tightens the optical rhythm for UI elements, keeping the reading experience crisp and efficient.

## 7. Do's and Don'ts

### Do

- Use pill-shaped (100px radius) buttons for all primary and secondary CTAs
- Let product photography dominate — make images the visual hero of every section
- Alternate between light and dark surface sections to create visual rhythm
- Use Optimistic VF with ss01 and ss02 features for all display text
- Keep body copy brief and scannable — this is retail, not editorial
- Use the dual-shadow pattern (ambient + direct) when elevation is needed
- Apply Meta Blue (`#0064E0`) exclusively for actionable elements
- Use generous whitespace (64-80px section padding) to convey premium feel
- Apply gradient overlays on dark photography when placing text over images
- Use the semantic color tokens (success, error, warning) consistently for status communication

### Don't

- Don't use sharp corners (< 8px radius) — the Meta Store is all smooth curves
- Don't mix product-specific accents (Ray-Ban Red with Quest Purple in the same section)
- Don't add decorative borders or ornamental dividers — dividers are functional only
- Don't place important text directly on photography without a gradient scrim
- Don't use weight 300 for anything smaller than 28px — it becomes too thin
- Don't use Facebook Blue (`#1877F2`) as a primary CTA color — use Meta Blue (`#0064E0`) instead
- Don't crowd product images — maintain generous padding around all photography
- Don't use more than 2 levels of text hierarchy in a single card
- Don't add drop shadows to cards in dark sections — rely on border and color separation
- Don't use long paragraphs — limit to 2-3 lines of body copy per block

## 9. Agent Prompt Guide

### Quick Color Reference

- Primary CTA: Meta Blue (`#0064E0`)
- Background: White (`#FFFFFF`)
- Heading text: Dark Charcoal (`#1C2B33`)
- Body text: Slate Gray (`#5D6C7B`)
- Border/divider: Divider Gray (`#DEE3E9`)
- Secondary surface: Soft Gray (`#F1F4F7`)
- Dark sections: Near Black (`#1C1E21`)

### Example Component Prompts

- "Create a product hero section with a full-width cinematic image, `linear-gradient(rgba(0,0,0,0), rgba(0,0,0,0.6))` text overlay, Optimistic-style 64px/500 white headline, and a Meta Blue (`#0064E0`) pill button (100px radius, 10px 22px padding)"
- "Design a 3-column product card grid with 20px rounded corners, white backgrounds, edge-to-edge product images at top, 18px/400 body text in Slate Gray (`#5D6C7B`), and 24px grid gap"
- "Build a sticky navigation bar with white background, `rgba(241, 244, 247, 0.8)` frosted glass effect, 16px/500 dark text links, and a right-aligned Meta Blue pill CTA"
- "Create a dark product showcase section with `#1C1E21` background, white 48px/500 headline, `#5D6C7B` body text, and a secondary outlined pill button with `rgba(10, 19, 23, 0.12)` border"
- "Design a feature comparison grid with Soft Gray (`#F1F4F7`) background, 24px rounded cards, Meta Blue checkmark icons, and 14px/700 bold labels"

### Iteration Guide

When refining existing screens generated with this design system:
1. Focus on ONE component at a time
2. Reference specific color names and hex codes from this document
3. Use natural language descriptions, not CSS values — "pill-shaped Meta Blue button" not "border-radius: 100px; background: #0064E0"
4. Describe the desired "feel" alongside specific measurements — "generous whitespace like a gallery" means 64-80px section padding
5. For dark sections, specify which product context (Quest dark `#181A1B`, pure black `#000000`, or standard dark `#1C1E21`)
6. Always specify the Optimistic VF weight explicitly (300, 400, 500, or 700) — each creates a dramatically different feel
