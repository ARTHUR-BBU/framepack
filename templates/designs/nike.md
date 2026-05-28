# Design System Inspired by Nike

> Category: E-Commerce & Retail
> Athletic retail. Monochrome UI, massive uppercase type, full-bleed photography.

## 1. Visual Theme & Atmosphere

Nike.com is a kinetic retail cathedral — a site that channels the explosive energy of sport into a digital shopping experience. The design operates on a principle of radical simplicity: strip everything back to black, white, and grey so that athletic photography and product color can dominate without competition. The result feels less like a website and more like a sports editorial laid out with the precision of a luxury magazine. Every pixel of real estate is either selling product or driving toward product.

The "Podium CDS" (Nike's internal Core Design System) establishes an aggressively monochromatic foundation. The UI disappears into black (`#111111`) text and white surfaces, allowing hero photography — sweating athletes, mid-air shoes, stadium energy — to carry the emotional weight. When color does appear in the UI, it's almost exclusively functional: red for errors, blue for links, green for success. The product itself is the color story. This restraint creates a visual paradox: the most colorful pages on the internet feel the most minimal, because all vibrancy comes from merchandise rather than interface.

The typography system is the other half of Nike's visual identity. Massive uppercase headlines in Nike Futura ND — a custom condensed Futura variant with impossibly tight line-height (0.90) — punch through hero imagery like a typographic shockwave. Below the headlines, the workhorse Helvetica Now family handles everything from navigation to product descriptions with Swiss-precision clarity. This split between expressive display type and functional body type mirrors Nike's brand duality: inspiration meets execution.

**Key Characteristics:**
- Monochromatic UI (black/white/grey) that lets product photography be the only color source
- Massive uppercase display typography (96px, line-height 0.90) that punches through hero images
- Full-bleed photography with no border radius — imagery fills every available edge
- Pill-shaped buttons (30px radius) as the primary interactive element
- 8px spacing grid with athletic discipline — every measurement snaps to the system
- Category-driven shopping architecture with large navigational image cards
- Shadow-free, border-minimal elevation model — surface differentiation through grey shifts only

## 2. Color Palette & Roles

### Primary

- **Nike Black** (`#111111`): The foundation — primary text, button backgrounds, nav text, hero overlays. Deliberately not pure black (#000000), creating a fractionally softer reading experience
- **Nike White** (`#FFFFFF`): Primary page canvas, button text on dark, card surfaces, nav bar background

### Surface & Background

- **Snow** (`#FAFAFA`): Lightest surface, near-white subtle differentiation (--podium-cds-color-grey-50)
- **Light Gray** (`#F5F5F5`): Secondary background, search input fill, image placeholder, loading skeleton (--podium-cds-color-grey-100)
- **Hover Gray** (`#E5E5E5`): Hover state background, disabled button fill (--podium-cds-color-grey-200)
- **Dark Surface** (`#28282A`): Primary background on dark/inverted sections (--podium-cds-color-grey-800)
- **Deep Charcoal** (`#1F1F21`): Inverse primary background, darkest non-black surface (--podium-cds-color-grey-900)
- **Dark Hover** (`#39393B`): Hover state on dark backgrounds (--podium-cds-color-grey-700)

### Neutrals & Text

- **Primary Text** (`#111111`): Main body text, headings, nav links (--podium-cds-color-text-primary)
- **Secondary Text** (`#707072`): Descriptive copy, metadata, timestamps, price labels (--podium-cds-color-text-secondary)
- **Disabled Text** (`#9E9EA0`): Inactive elements, unavailable options (--podium-cds-color-text-disabled)
- **Disabled Inverse** (`#4B4B4D`): Disabled text on dark backgrounds (--podium-cds-color-text-disabled-inverse)
- **Border Primary** (`#707072`): Standard border color, matching secondary text
- **Border Secondary** (`#CACACB`): Subtle borders, input borders, divider lines (--podium-cds-color-grey-300)
- **Border Disabled** (`#CACACB`): Inactive border state
- **Border Active** (`#111111`): Active/focused border, matching primary text

### Semantic & Accent

- **Nike Red** (`#D30005`): Critical errors, sale badges, urgent notifications (--podium-cds-color-red-600)
- **Bright Red** (`#EE0005`): Red-500, slightly lighter red for emphasis
- **Nike Orange Badge** (`#D33918`): Badge text, promotional callouts (--podium-cds-color-text-badge)
- **Orange Flash** (`#FF5000`): Expressive orange accent (--podium-cds-color-orange-400)
- **Success Green** (`#007D48`): Confirmation, availability, positive states (--podium-cds-color-green-600)
- **Success Inverse** (`#1EAA52`): Success on dark backgrounds (--podium-cds-color-green-500)
- **Link Blue** (`#1151FF`): Text links, informational highlights (--podium-cds-color-blue-500)
- **Info Inverse** (`#1190FF`): Links on dark backgrounds (--podium-cds-color-blue-400)
- **Warning Yellow** (`#FEDF35`): Warning backgrounds, attention banners (--podium-cds-color-yellow-200)
- **Focus Ring** (`rgba(39, 93, 197, 1)`): Keyboard focus indicator ring

### Extended Color Spectrum (Podium CDS)

Each color ramp runs 50–900 for expressive use in campaigns and product pages:

- **Red**: `#FFE5E5` → `#EE0005` → `#530300`
- **Orange**: `#FFE2D6` → `#FF5000` → `#3E1009`
- **Yellow**: `#FEF087` → `#FCA600` → `#99470A`
- **Green**: `#DFFFB9` → `#1EAA52` → `#003C2A`
- **Teal**: `#D4FFFB` → `#008E98` → `#043441`
- **Blue**: `#D6EEFF` → `#1151FF` → `#020664`
- **Purple**: `#E4E1FC` → `#6E0FF6` → `#1C0060`
- **Pink**: `#FFE1F3` → `#ED1AA0` → `#4C012D`

### Gradient System

Nike avoids UI gradients. When gradients appear, they are photographic — applied to product hero backgrounds (e.g., a red shoe on a red-to-deeper-red gradient). The design system itself is flat-color only.

## 3. Typography Rules

### Font Family

**Display:** Nike Futura ND (custom condensed Futura variant exclusive to Nike)
- Fallbacks: Helvetica Now Text Medium, Helvetica, Arial
- Used exclusively for large uppercase display headlines
- Characteristically tight line-height (0.90) and uppercase transform

**Heading:** Helvetica Now Display Medium
- Fallbacks: Helvetica, Arial
- Used for section headings and product titles at 24–32px

**Body Medium:** Helvetica Now Text Medium (weight 500)
- Fallbacks: Helvetica, Arial
- Used for links, buttons, captions, emphasized body text

**Body:** Helvetica Now Text (weight 400)
- Fallbacks: Helvetica, Arial
- Used for standard body copy, descriptions, metadata

**Arabic:** Neue Frutiger Arabic — locale-specific alternative

### Hierarchy

| Role | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|--------|-------------|----------------|-------|
| Display | 96px | 500 | 0.90 | — | Nike Futura ND, uppercase, hero headlines |
| Heading 1 | 32px | 500 | 1.20 | — | Helvetica Now Display Medium, section titles |
| Heading 2 | 24px | 500 | 1.20 | — | Helvetica Now Display Medium, subsections |
| Heading 3 | 16px | 500 | 1.50 | — | Helvetica Now Text Medium, card titles |
| Body | 16px | 400 | 1.75 | — | Helvetica Now Text, product descriptions |
| Body Medium | 16px | 500 | 1.75 | — | Helvetica Now Text Medium, emphasized text |
| Link | 16px | 500 | 1.75 | — | Helvetica Now Text Medium, navigation links |
| Link Small | 14px | 500 | 1.86 | — | Helvetica Now Text Medium, footer/utility links |
| Button | 16px | 500 | 1.50 | — | Helvetica Now Text Medium, CTA text |
| Button Small | 14px | 500 | 1.50 | — | Helvetica Now Text Medium, secondary buttons |
| Caption | 14px | 500 | 1.50 | — | Helvetica Now Text Medium, price labels |
| Small | 12px | 500 | 1.50 | — | Helvetica Now Text Medium, timestamps |
| Tiny | 12px | 400 | 1.50 | — | Helvetica Now Text, legal text |

### Principles

Nike's typography is a study in tension. The display layer — Nike Futura ND at 96px with a devastating 0.90 line-height — is engineered to feel like a stadium scoreboard: massive, condensed, uppercase, impossible to ignore. It transforms headlines into battle cries. Below the display layer, Helvetica Now provides a clinical counterpoint: Swiss-precision legibility with generous 1.75 line-height for comfortable product browsing. Weight 500 (Medium) dominates throughout the body text, giving Nike's prose a slight assertiveness without the heaviness of bold — every sentence reads like a confident recommendation, not a shout.

## 7. Do's and Don'ts

### Do

- Use Nike Black (#111111) for all primary text — never pure #000000
- Keep buttons pill-shaped (30px radius) and limited to primary/secondary variants
- Use full-bleed, edge-to-edge photography for hero sections — no border radius on images
- Let product photography provide all color vibrancy; keep UI monochromatic
- Use uppercase Nike Futura ND ONLY for display headlines (96px+)
- Maintain tight product grid gaps (4-12px) for a dense, abundant feel
- Use Grey-100 (#F5F5F5) for all input and placeholder backgrounds
- Reserve color exclusively for semantic meaning (red=error, green=success, blue=link)
- Use weight 500 (Medium) for all interactive text elements

### Don't

- Don't add shadows to cards — Nike's elevation model is entirely flat
- Don't use border radius on product imagery — only UI elements get rounded corners
- Don't introduce brand colors beyond the grey scale for UI elements
- Don't use Nike Futura ND below 24px — it's exclusively a display face
- Don't add hover lift effects — Nike cards don't animate on hover
- Don't use regular weight (400) for buttons or links — always use 500
- Don't place colored backgrounds behind UI elements — color is reserved for product contexts
- Don't use more than two levels of text hierarchy per card (title + body)
- Don't add decorative dividers — the 1px inset is the only divider pattern
- Don't soften the contrast — Nike's design deliberately pushes black-on-white to maximum

## 9. Agent Prompt Guide

### Quick Color Reference

- Primary CTA: Nike Black (`#111111`)
- Background: White (`#FFFFFF`)
- Secondary surface: Light Gray (`#F5F5F5`)
- Heading text: Nike Black (`#111111`)
- Body text / hover: Secondary Text (`#707072`)
- Border: Border Secondary (`#CACACB`)
- Error: Nike Red (`#D30005`)
- Link: Link Blue (`#1151FF`)

### Example Component Prompts

- "Create a product hero section with full-bleed edge-to-edge photography, no border radius, a dark gradient overlay for text, and a massive uppercase 96px/500 headline in Nike Futura style with 0.90 line-height and a Nike Black (#111111) pill button (30px radius)"
- "Design a 3-column product card grid with square images (no border radius), 4px gap between cards, product name in 16px/500 Nike Black (#111111), price in 14px/500, and secondary text in Grey-500 (#707072)"
- "Build a sticky white navigation bar with a left-aligned logo, centered category links in 16px/500 (#111111) with hover color #707072, and right-aligned search (24px radius, #F5F5F5 background), favorites, and cart icons"
- "Create a promotional banner strip with #111111 background, white 12px/500 centered text, and 8px vertical padding — full width, no border radius"
- "Design a secondary outlined button with transparent background, 1.5px #CACACB border, 30px pill radius, 16px/500 #111111 text, hover border darkening to #707072"

### Iteration Guide

When refining existing screens generated with this design system:
1. Focus on ONE component at a time
2. Reference specific color names and hex codes from this document
3. Remember: product photography is the color — UI stays monochromatic
4. Use the grey scale for state changes: #F5F5F5 → #E5E5E5 → #CACACB → #707072
5. If something feels too colorful in the UI, it probably is — Nike keeps UI greyscale
6. Display type (Nike Futura) should ALWAYS be uppercase and never below 24px
7. Body type (Helvetica Now) should almost always be weight 500 for interactive elements
