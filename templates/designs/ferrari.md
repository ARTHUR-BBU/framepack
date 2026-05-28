# Design System Inspired by Ferrari

> Category: Automotive
> Luxury automotive. Chiaroscuro editorial, Ferrari Red accents, cinematic black.

## 1. Visual Theme & Atmosphere

Ferrari's website is a digital editorial — a curated magazine where the Prancing Horse brand is presented with the gravitas of an art institution and the precision of Italian coachwork. The page opens onto an expanse of absolute black, broken only by the iconic Prancing Horse emblem floating alone in its own atmosphere. Below, the content unfolds in dramatic alternations between inky-dark cinematic sections and crisp white editorial panels. This chiaroscuro rhythm — darkness yielding to light, machinery yielding to human story — feels more like paging through a Ferrari yearbook than scrolling a commercial website. Every section is a curated vignette: a concept car dissolving from shadow, two F1 drivers posed with sculptural stillness, a lineup of production models arranged in a jewel-toned parade.

The color language is monastically restrained for a brand built on speed and emotion. Ferrari Red (`#DA291C`) appears with almost surgical sparseness — reserved for the Subscribe CTA and accent moments that need to command immediate attention. The vast majority of the interface lives in black, white, and a carefully calibrated gray scale (from `#303030` dark surfaces through `#8F8F8F` mid-tones to `#D2D2D2` light borders). Two yellows — Racing Yellow (`#FFF200`) and the deeper Modena Yellow (`#F6E500`) — exist in the token system as heritage accents for special contexts, honoring Ferrari's racing provenance. The restraint means that when red does appear, it carries the weight of the entire brand.

Typography relies on FerrariSans — a proprietary sans-serif family with medium-weight headings (500–700) and compact proportions. Display text runs at 24–26px for section titles, while the UI chrome lives at 12–16px in weights ranging from regular to bold. A secondary "Body-Font" custom typeface handles captions and utility text, rendered in uppercase with wide letter-spacing (1px) to create a label-like editorial quality. This two-font system — FerrariSans for narrative authority, Body-Font for structural annotation — gives the site a print-magazine hierarchy. No text decoration is gratuitous. Letter-spacing is tight for headlines and deliberately expanded for labels, creating a visual rhythm that alternates between urgency and composure.

**Key Characteristics:**
- Chiaroscuro layout alternating between deep black sections and clean white editorial panels
- Ferrari Red (`#DA291C`) used with extreme sparseness — accent, not atmosphere
- Prancing Horse emblem as isolated hero element on a void-black field
- FerrariSans proprietary typeface with compact proportions and medium weights
- Photo-journalism imagery: concept renders, driver portraits, lineup parades — each section is a story
- Uppercase Body-Font labels with wide letter-spacing (1px) for editorial annotation
- Nearly zero border-radius (2px default) reflecting precision engineering aesthetics
- Dual-framework architecture (PrimeReact + Element Plus) powering 32+ interactive components
- Carousel-driven hero with editorial slides and arrow/dot navigation

## 2. Color Palette & Roles

### Primary
- **Ferrari Red** (`#DA291C`): The iconic Rosso Corsa — primary accent and CTA color. Used for the Subscribe button, key action triggers, and brand moments where maximum visual authority is needed. The single most important color in the system (--f-color-accent-100)
- **Pure White** (`#FFFFFF`): Primary surface for editorial content panels, navigation text on dark backgrounds, and button fills. The canvas that provides breathing room between dark cinematic sections (--f-color-ui-0)

### Secondary & Accent
- **Dark Red** (`#B01E0A`): Deeper variant of Ferrari Red for hover/pressed states and high-contrast contexts — adds dimensionality to the brand color without introducing a new hue (--f-color-accent-90)
- **Deep Red** (`#9D2211`): The most saturated dark red — used for active states and extra emphasis where even Dark Red needs more weight (--f-color-accent-80)
- **Racing Yellow** (`#FFF200`): Heritage accent from Ferrari's racing livery — reserved for special highlights and motorsport-related contexts (--f-color-yellow-hypersail)
- **Modena Yellow** (`#F6E500`): Slightly warmer and more golden than Racing Yellow — used for secondary heritage accents and category markers (--f-color-yellow)

### Surface & Background
- **Absolute Black** (`#000000`): Hero sections, cinematic backgrounds, and the dominant dark surface — the void that makes imagery and the Prancing Horse emblem float
- **Dark Surface** (`#303030`): Secondary dark surface for footer regions, newsletter sections, and layered dark panels — slightly lifted from pure black for depth differentiation (--f-color-ui-90)
- **Light Gray Surface** (`#D2D2D2`): Subtle alternate surface for dividers and border treatments on white panels (--f-color-ui-20)
- **Overlay Dark** (`hsla(0, 0%, 7%, 0.8)`): Semi-transparent near-black for modal overlays and image caption backgrounds (--f-color-overlay-darker)

### Neutrals & Text
- **Near Black** (`#181818`): Primary body text color on light surfaces — slightly softened from absolute black for better readability (link default color)
- **Dark Gray** (`#666666`): Secondary text and subdued UI labels — used where text needs to recede from the primary hierarchy (--f-color-black-60)
- **Mid Gray** (`#8F8F8F`): Tertiary text for metadata, timestamps, and supportive content (--f-color-black-50)
- **Silver Gray** (`#969696`): Placeholder text and disabled state indicators (--f-color-black-55)

### Semantic & Accent
- **Warning Red** (`#F13A2C`): Accessible warning state — brighter and more orange-shifted than Ferrari Red to differentiate semantic alerts from brand expression (--f-color-accessible-warning)
- **Success Green** (`#03904A`): Confirmation and positive status indicators (--f-color-accessible-success)
- **Info Blue** (`#4C98B9`): Informational callouts, tooltips, and neutral status messaging (--f-color-accessible-info)
- **Link Hover Blue** (`#3860BE`): Interactive hover state for text links — a dignified navy-blue that signals interactivity without competing with Ferrari Red

### Gradient System
- No explicit gradients in the token system
- Depth is achieved through photography and the binary contrast between black and white surfaces
- The overlay darker color (`hsla(0, 0%, 7%, 0.8)`) creates depth through transparency layering over imagery
- Occasional photographic gradients (light falloff in studio shots) provide atmospheric depth within image content

## 3. Typography Rules

### Font Family
- **FerrariSans**: Primary typeface for headings, navigation, buttons, and editorial content. A proprietary sans-serif with medium weight as the default (500), compact x-height, and precise letter-spacing control. Fallbacks: Arial, Helvetica, sans-serif
- **Body-Font**: Secondary typeface for captions, labels, and utility text. Frequently rendered in uppercase with expanded letter-spacing (1px) for an editorial label aesthetic. Used for category tags and small annotation text
- **Arial / Helvetica**: System fallback fonts used in cookie consent modals, form elements, and third-party component frameworks

### Hierarchy

| Role | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|--------|-------------|----------------|-------|
| Section Title | 26px (1.63rem) | 500 | 1.20 | normal | FerrariSans, primary editorial headings on white backgrounds |
| Card Heading | 24px (1.50rem) | 400 | normal | normal | FerrariSans, content card titles |
| Subheading | 18px (1.13rem) | 700 | 1.20 (tight) | normal | FerrariSans, bold subsection labels |
| UI Heading | 16px (1.00rem) | 500 | 1.40 | 0.08px | FerrariSans, component headings and nav items |
| Body Bold | 16px (1.00rem) | 700 | 1.30 (tight) | normal | FerrariSans, emphasized inline text |
| Button Label | 16px (1.00rem) | 400 | normal | 1.28px | FerrariSans, primary button text with wide tracking |
| Small Button | 14.4px (0.90rem) | 700 | 1.00 (tight) | normal | FerrariSans, compact action buttons |
| Nav Link | 13px (0.81rem) | 600 | 1.20 (tight) | 0.13px | FerrariSans, navigation and footer links |
| Caption | 13px (0.81rem) | 400 | 1.50 | 0.195px | FerrariSans/Body-Font, metadata and descriptions |
| Micro Button | 12px (0.75rem) | 700 | 1.00 (tight) | 0.96px | FerrariSans, small CTA with wide tracking |
| Label Upper | 12px (0.75rem) | 400 | 1.27 (tight) | 1px | Body-Font, uppercase labels and category tags |
| Micro Label | 11px (0.69rem) | 400 | 1.27 (tight) | 1px | Body-Font, uppercase smallest annotation text |
| Cookie Text | 45px (2.81rem) | 400 | 1.50 | 0.195px | Arial, consent dialog oversized button text |

### Principles
- **Proprietary identity**: FerrariSans is exclusive to Ferrari — it cannot be substituted without losing brand recognition. The font's compact proportions and medium weight default (500) convey engineering precision
- **Two-register system**: FerrariSans handles narrative voice (headings, content, buttons) while Body-Font handles structural annotation (labels, tags, micro-captions) — this mirrors print magazine conventions of editorial text vs. technical labels
- **Uppercase as emphasis tool**: Body-Font captions use `text-transform: uppercase` with expanded letter-spacing (1px) to create a visually distinct label layer that reads as "informational overlay" rather than primary content
- **Compact line-heights**: Headlines use tight line-heights (1.00–1.30) creating dense, impactful text blocks, while body text opens to 1.50 for comfortable reading — the contrast between compressed headers and relaxed body text creates visual tension
- **Weight range 400–700**: Four weights active in the system (400, 500, 600, 700) — significantly more range than Tesla but still controlled. 500 is the default "voice," 700 is for emphasis, 400 for body, 600 for navigation

## 7. Do's and Don'ts

### Do
- Use Ferrari Red (`#DA291C`) sparingly — only for primary CTAs and brand-critical moments. Its power comes from restraint
- Alternate between black cinematic sections and white editorial sections to create the signature chiaroscuro rhythm
- Use FerrariSans at weight 500 as the default heading voice — it's the typographic equivalent of the engine note
- Apply Body-Font in uppercase with 1px letter-spacing for all labels, category tags, and structural annotations
- Keep border-radius at 2px for all interactive elements — razor precision, not rounded friendliness
- Let photography carry the emotional weight — every image should be art-directed studio quality
- Use the Prancing Horse emblem as a standalone hero element on black — never crowd it with adjacent content
- Maintain the 12px/10px button padding ratio — compact, purposeful, no excess
- Use `#181818` (Near Black) for body text instead of pure `#000000` — the subtle warmth improves readability
- Reserve the yellow accents (`#FFF200`, `#F6E500`) strictly for motorsport and racing heritage contexts

### Don't
- Scatter Ferrari Red across the interface as decoration — it's a CTA signal, not a theme color
- Use rounded-pill buttons or large border-radii — the 2px precision is non-negotiable
- Add box-shadows to cards or content containers — depth comes from surface color contrast and photography
- Mix FerrariSans and Body-Font within the same text block — they serve separate hierarchical functions
- Use colorful backgrounds (blue, green, etc.) for sections — the palette is exclusively black/white/gray with red and yellow accents
- Apply text transforms to FerrariSans headings — uppercase is reserved for Body-Font labels only
- Display low-quality or user-generated imagery — every photograph must meet editorial standards
- Use the Link Hover Blue (`#3860BE`) for anything other than interactive hover states — it's not a brand color
- Create busy layouts with multiple competing focal points — each section should have one clear story
- Override the semantic color system (warning, success, info) with brand colors — `#F13A2C` warning is deliberately different from `#DA291C` brand red

## 9. Agent Prompt Guide

### Quick Color Reference
- Primary CTA: "Ferrari Red (#DA291C)"
- Background Light: "Pure White (#FFFFFF)"
- Background Dark: "Absolute Black (#000000)"
- Secondary Dark Surface: "Dark Surface (#303030)"
- Heading text (light bg): "Near Black (#181818)"
- Body text: "Dark Gray (#666666)"
- Tertiary text: "Mid Gray (#8F8F8F)"
- Border: "Border Gray (#CCCCCC)"
- Button Hover: "Teal (#1EAEDB)"
- Link Hover: "Link Blue (#3860BE)"

### Example Component Prompts
- "Create a hero section on Absolute Black (#000000) background with a centered logo emblem at the top, generous vertical spacing (80px+), and a single editorial headline in FerrariSans at 26px weight 500 in white, with a small Body-Font uppercase caption (12px, 1px letter-spacing) in Silver Gray (#969696) below"
- "Design a Subscribe section on Dark Surface (#303030) with a left-aligned headline in white FerrariSans (24px/500), a subtitle in Mid Gray (#8F8F8F, 13px), an email input with transparent background and 1px #CCCCCC border, and a Ferrari Red (#DA291C) Subscribe button with white text, 2px border-radius, and 12px 10px padding"
- "Build an editorial card on white background with a full-width image (16:9 ratio) above, a FerrariSans heading (16px/700, Near Black #181818) below, and a Body-Font uppercase label (11px, 1px letter-spacing, Mid Gray #8F8F8F) as the category tag — no border, no shadow, no border-radius"
- "Create a vehicle lineup carousel showing 5 car thumbnails in a horizontal scroll on white background, with left/right arrow navigation, dot indicators below, and a FerrariSans model name (16px/500) beneath each vehicle"
- "Design a dark cinematic section with full-bleed studio photography of a concept car on Absolute Black, a white FerrariSans headline (26px/500) positioned in the lower-left with generous padding (40px), and a Ghost Button (transparent bg, 1px white border, white text, 2px radius) as the CTA"

### Iteration Guide
When refining existing screens generated with this design system:
1. Focus on ONE component at a time — Ferrari's editorial rhythm means each section is a self-contained vignette
2. Reference specific color names and hex codes from this document — the palette is small but each color has a precise role
3. Use natural language descriptions, not CSS values — "razor-sharp 2px corners" conveys intent better than "border-radius: 2px"
4. Describe the desired "feel" alongside specific measurements — "editorial magazine page-turn between sections" communicates the layout philosophy better than "margin-bottom: 80px"
5. Always maintain the chiaroscuro contrast — if a section feels flat, check whether it needs to be on black or white to maintain the alternating rhythm
6. Reserve Ferrari Red for ONE element per screen — if red appears in more than one place, it loses its authority
