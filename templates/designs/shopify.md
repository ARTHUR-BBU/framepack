# Design System Inspired by Shopify

> Category: E-Commerce & Retail
> E-commerce platform. Dark-first cinematic, neon green accent, ultra-light type.

## 1. Visual Theme & Atmosphere

Shopify.com is a dark-first digital theatre — a website that stages its commerce platform like a cinematic premiere. The entire experience unfolds against an abyss of near-black surfaces that carry the faintest whisper of deep forest green (`#02090A`, `#061A1C`, `#102620`), creating a nocturnal atmosphere that feels less like a SaaS marketing page and more like an exclusive product reveal at a tech keynote. This darkness isn't cold or corporate — it's the warm, enveloping dark of a luxury experience, like sitting in the front row of a darkened auditorium.

The typography is the undeniable star. NeueHaasGrotesk — a refined Helvetica descendant — appears at monumental scale (96px) with impossibly light weight (330-400), creating headlines that feel etched in light rather than printed in ink. The `ss03` OpenType feature gives letterforms a distinctive character that separates Shopify's type from generic Helvetica usage. Below the display layer, Inter Variable handles body text with surgical precision, using equally unusual variable weights (420, 450, 550) that live in the spaces between traditional weight stops. This precision signals a company that sweats every detail.

Color is used with extreme restraint. The primary accent is Shopify Neon Green (`#36F4A4`) — an electric mint that appears exclusively on focus rings and accent highlights, pulsing like a bioluminescent signal against the dark canvas. Softer green tints (Aloe `#C1FBD4`, Pistachio `#D4F9E0`) provide atmospheric washes. White is the only text color that matters on dark surfaces, while a zinc-based neutral scale (`#A1A1AA` through `#3F3F46`) handles the hierarchy of quiet information. The result is a design that makes commerce technology feel like it belongs in a science-fiction future.

**Key Characteristics:**
- Dark-first design with deep forest-teal undertones (not pure black)
- Ultra-light display typography (weight 330) at monumental scale (96px) creating an ethereal presence
- Neon Green (`#36F4A4`) as the singular high-energy accent against darkness
- Full-pill buttons (9999px radius) as the primary interactive shape
- Layered, multi-stage box shadows creating photographic depth
- Product screenshots embedded in dark UI contexts, matching the surrounding darkness
- Zinc-based neutral scale for text hierarchy — balanced between warm and cool

## 2. Color Palette & Roles

### Primary

- **Shopify White** (`#FFFFFF`): Primary text on dark surfaces, button fills, high-contrast elements
- **Shopify Black** (`#000000`): Body background, button text on white, maximum contrast base (--color-shade-100)

### Secondary & Accent

- **Neon Green** (`#36F4A4`): The signature accent — focus rings, interactive highlights, active state indicators. Electric and bioluminescent
- **Aloe** (`#C1FBD4`): Soft green wash for decorative backgrounds, atmospheric cards (--color-aloe-10)
- **Pistachio** (`#D4F9E0`): Lightest green tint for subtle surface differentiation (--color-pistachio-10)

### Surface & Background

- **Void** (`#000000`): Root page background — true black for maximum depth
- **Deep Teal** (`#02090A`): Card surfaces, content containers — near-black with green undertone
- **Dark Forest** (`#061A1C`): Section backgrounds with visible green character
- **Forest** (`#102620`): Elevated dark surfaces, header backgrounds — the warmest dark shade
- **Dark Card Border** (`#1E2C31`): Card borders on dark surfaces, subtle boundary definition

### Neutrals & Text (Zinc Scale)

- **Shade-30** (`#D4D4D8`): Lightest neutral, barely-there borders on dark (--color-shade-30)
- **Muted Text** (`#A1A1AA`): Secondary text, metadata, descriptions — the quiet voice
- **Shade-50** (`#71717A`): Tertiary text, timestamps, least important info (--color-shade-50)
- **Shade-60** (`#52525B`): Disabled text, decorative neutrals (--color-shade-60)
- **Shade-70** (`#3F3F46`): Subtle dividers, barely-visible UI boundaries (--color-shade-70)
- **Light Border** (`#E4E4E7`): Borders on light surfaces (rare — only in light-mode modals)

### Semantic & Accent

- **Link Muted** (`#9797A2`): Muted link text with underline decoration
- **Link Sage** (`#9DABAD`): Teal-tinted muted links
- **Link Lavender** (`#BDBDCA`): Lighter link variant
- **Link Mint** (`#99B3AD`): Green-tinted link variant for themed sections

### Gradient System

- **Dark Teal Wash**: Radial gradient from `#102620` center to `#02090A` edge — used behind product showcases
- **Green Atmospheric**: Subtle green-tinted ambient gradients behind hero sections, creating depth without solid colors
- **Spotlight**: Focused bright area fading to black — creates keynote-style presentation lighting

## 3. Typography Rules

### Font Family

**Display:** NeueHaasGrotesk (refined Helvetica descendant, variable font)
- Fallbacks: Helvetica, Arial, sans-serif
- OpenType features: `ss03` (stylistic set 3 — distinctive letterform alternates)
- Available weights: 330, 360, 400, 500, 750 (variable)
- Used for all headings, hero text, and large display elements

**Body:** Inter-Variable
- Fallbacks: Helvetica, Arial, sans-serif
- OpenType features: `ss03`
- Available weights: 400, 420, 450, 500, 550 (variable)
- Used for body text, links, buttons, UI elements

**Mono:** ui-monospace
- Fallbacks: SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New
- Used for code snippets, data labels, technical content

### Hierarchy

| Role | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|--------|-------------|----------------|-------|
| Display XL | 96px | 400 | 1.00 | — | NeueHaasGrotesk, hero headlines, "ss03" |
| Display XL Bold | 90.74px | 750 | 1.00 | 4.54px | NeueHaasGrotesk, emphasis display |
| Display XL Tracked | 96px | 400 | 1.00 | 2.4px | NeueHaasGrotesk, spaced display |
| Display Light | 96px | 330 | 0.96 | — | NeueHaasGrotesk, ethereal display |
| Heading 1 | 70px | 330 | 1.00 | — | NeueHaasGrotesk, section titles |
| Heading 2 | 55px | 330 | 1.16 | — | NeueHaasGrotesk, subsections |
| Heading 3 | 48px | 330 | 1.14 | — | NeueHaasGrotesk, feature titles |
| Heading 4 | 32px | 360 | 1.14 | 0.32px | NeueHaasGrotesk, card headings |
| Heading 5 | 28px | 500 | 1.28 | 0.42px | NeueHaasGrotesk, small headings |
| Heading 6 | 24px | 400 | 1.14 | 0.36px | NeueHaasGrotesk, minor headings |
| Body Large | 20px | 500 | 1.40 | 0.3px | NeueHaasGrotesk / Inter, lead paragraphs |
| Body | 18px | 400 | 1.56 | — | Inter-Variable, standard body |
| Body Medium | 18px | 550 | 1.56 | — | Inter-Variable, emphasized body |
| Body Small | 16px | 400 | 1.50 | — | Inter / NeueHaasGrotesk, compact body |
| Body Small Medium | 16px | 420 | 1.50 | — | Inter-Variable, slightly emphasized |
| Button | 16px | 400 | 1.50 | — | NeueHaasGrotesk, CTA text |
| Nav Link | 18px | 500 | 1.25 | 0.72px | NeueHaasGrotesk, navigation items |
| Caption | 14px | 500 | 1.49 | 0.28px | NeueHaasGrotesk / Inter, metadata |
| Caption Medium | 14px | 550 | 1.49 | 0.28px | Inter-Variable, emphasized caption |
| Overline | 15.36px | 400 | 1.50 | 1.54px | NeueHaasGrotesk, wide-tracked labels |
| Micro | 13px | 500 | 1.50 | -0.13px | Inter, tight-tracked small text |
| Label | 12px | 400 | 1.20 | 0.72px | Inter, uppercase labels |
| Code | 16px | 400 | 1.50 | — | ui-monospace, uppercase, code blocks |
| Code Small | 12px | 400 | 1.33 | — | ui-monospace, uppercase, inline code |

### Principles

Shopify's typography is a masterclass in variable font precision. The display layer lives almost exclusively at weights 330-400 — featherweight text that appears to hover above the dark background like projected light. This is the opposite of the bold, heavy approach most SaaS sites take: where others shout, Shopify whispers at scale. The 96px headlines at weight 330 create a paradox of enormous size and delicate stroke that feels both monumental and fragile. The `ss03` OpenType feature activates a stylistic set that gives specific characters (likely 'a', 'g', and certain numerals) a more refined appearance, distinguishing Shopify's typography from standard Helvetica Neue usage. Inter Variable handles the body layer with surgical precision, using weights like 420 and 550 that exist between the traditional stops — every piece of text has exactly the visual weight it needs.

## 7. Do's and Don'ts

### Do

- Use the dark teal-black surface hierarchy (Void → Deep Teal → Dark Forest → Forest) for depth
- Keep display typography at weight 330-400 — the ethereal lightness is the design's signature
- Use Neon Green (`#36F4A4`) exclusively for focus states and critical accent highlights
- Apply 9999px radius to all primary CTA buttons — the full pill is non-negotiable
- Use the multi-layered shadow system for card elevation — single shadows look flat
- Maintain the `ss03` OpenType feature across all text — it's part of the typographic identity
- Use Inter Variable for body text and NeueHaasGrotesk for headings — never mix their roles
- Create theatrical spacing between sections (80px+) for cinematic pacing

### Don't

- Don't use pure black (#000000) for text on dark backgrounds — use white (#FFFFFF) only
- Don't introduce warm colors (orange, red, yellow) — the palette is strictly cool (greens, teals, neutrals)
- Don't use font weights above 500 for NeueHaasGrotesk body text — heavy weights break the ethereal feel
- Don't apply green accents to large surfaces — Neon Green is for small, precise highlights only
- Don't use sharp corners (0px radius) on interactive elements — everything rounds
- Don't add bright backgrounds — the dark theme is fundamental, not optional
- Don't use single-layer box shadows — the stacked approach is the system
- Don't set line-height above 1.56 for body text — Shopify's text is relatively compact
- Don't mix NeueHaasGrotesk and Inter at the same size/role — their weight scales differ
- Don't use letter-spacing below 0 for headings — Shopify headings track neutral or positive

## 9. Agent Prompt Guide

### Quick Color Reference

- Primary CTA: Shopify White (`#FFFFFF`)
- Page background: Void Black (`#000000`)
- Card surface: Deep Teal (`#02090A`)
- Section bg: Dark Forest (`#061A1C`)
- Elevated bg: Forest (`#102620`)
- Accent: Neon Green (`#36F4A4`)
- Body text: White (`#FFFFFF`)
- Muted text: Muted (`#A1A1AA`)
- Border dark: Dark Card Border (`#1E2C31`)

### Example Component Prompts

- "Create a hero section on true black (#000000) background with a 96px/330 NeueHaasGrotesk headline in white, a 20px/500 subtitle in #A1A1AA, and two pill buttons: white filled (9999px radius) and ghost with 2px white border"
- "Design a feature card on Deep Teal (#02090A) with 1px #1E2C31 border, 12px radius, multi-layer shadow (1px ring + 2px/4px/8px blur at 10% black), containing a 32px/360 white heading and 18px/400 #A1A1AA body text"
- "Build a stats section on Dark Forest (#061A1C) with 96px/750 white numbers (NeueHaasGrotesk), 16px/400 #A1A1AA descriptive labels, and generous 64px spacing between stat blocks"
- "Create a sticky nav with transparent background (becomes #102620 on scroll), white Shopify logo left, 18px/500 white nav links with 0.72px letter-spacing, and a white pill 'Start for free' button right"
- "Design a tag/badge with rgba(255,255,255,0.2) frosted glass background, 4px radius, 12px 16px padding, white 16px text — floating over a dark card surface"

### Iteration Guide

When refining existing screens generated with this design system:
1. Focus on ONE component at a time
2. Reference specific color names and hex codes from this document
3. Remember: this is a DARK-FIRST design — light surfaces are the exception, not the rule
4. Display text should always feel feather-light (weight 330-400) — if it looks heavy, reduce the weight
5. Neon Green (#36F4A4) is precious — use sparingly for focus and accent only
6. The dark surface hierarchy (black → deep teal → dark forest → forest) creates subtle depth
7. Shadows are multi-layered — a single `box-shadow` value won't capture the Shopify card feel
8. `ss03` OpenType feature must be active on all text for typographic consistency
