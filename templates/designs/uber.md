# Design System Inspired by Uber

> Category: Media & Consumer
> Mobility platform. Bold black and white, tight type, urban energy.

## 1. Visual Theme & Atmosphere

Uber's design language is a masterclass in confident minimalism -- a black-and-white universe where every pixel serves a purpose and nothing decorates without earning its place. The entire experience is built on a stark duality: jet black (`#000000`) and pure white (`#ffffff`), with virtually no mid-tone grays diluting the message. This isn't the sterile minimalism of a startup that hasn't finished designing -- it's the deliberate restraint of a brand so established it can afford to whisper.

The signature typeface, UberMove, is a proprietary geometric sans-serif with a distinctly square, engineered quality. Headlines in UberMove Bold at 52px carry the weight of a billboard -- authoritative, direct, unapologetic. The companion face UberMoveText handles body copy and buttons with a slightly softer, more readable character at medium weight (500). Together, they create a typographic system that feels like a transit map: clear, efficient, built for scanning at speed.

What makes Uber's design truly distinctive is its use of full-bleed photography and illustration paired with pill-shaped interactive elements (999px border-radius). Navigation chips, CTA buttons, and category selectors all share this capsule shape, creating a tactile, thumb-friendly interface language that's unmistakably Uber. The illustrations -- warm, slightly stylized scenes of drivers, riders, and cityscapes -- inject humanity into what could otherwise be a cold, monochrome system. The site alternates between white content sections and a full-black footer, with card-based layouts using the gentlest possible shadows (rgba(0,0,0,0.12-0.16)) to create subtle lift without breaking the flat aesthetic.

**Key Characteristics:**
- Pure black-and-white foundation with virtually no mid-tone grays in the UI chrome
- UberMove (headlines) + UberMoveText (body/UI) -- proprietary geometric sans-serif family
- Pill-shaped everything: buttons, chips, nav items all use 999px border-radius
- Warm, human illustrations contrasting the stark monochrome interface
- Card-based layout with whisper-soft shadows (0.12-0.16 opacity)
- 8px spacing grid with compact, information-dense layouts
- Bold photography integrated as full-bleed hero backgrounds
- Black footer anchoring the page with a dark, high-contrast environment

## 2. Color Palette & Roles

### Primary
- **Uber Black** (`#000000`): The defining brand color -- used for primary buttons, headlines, navigation text, and the footer. Not "near-black" or "off-black," but true, uncompromising black.
- **Pure White** (`#ffffff`): The primary surface color and inverse text. Used for page backgrounds, card surfaces, and text on black elements.

### Interactive & Button States
- **Hover Gray** (`#e2e2e2`): White button hover state -- a clean, cool light gray that provides clear feedback without warmth.
- **Hover Light** (`#f3f3f3`): Subtle hover for elevated white buttons -- barely-there gray for gentle interaction feedback.
- **Chip Gray** (`#efefef`): Background for secondary/filter buttons and navigation chips -- a neutral, ultra-light gray.

### Text & Content
- **Body Gray** (`#4b4b4b`): Secondary text and footer links -- a true mid-gray with no warm or cool bias.
- **Muted Gray** (`#afafaf`): Tertiary text, de-emphasized footer links, and placeholder content.

### Borders & Separation
- **Border Black** (`#000000`): Thin 1px borders for structural containment -- used sparingly on dividers and form containers.

### Shadows & Depth
- **Shadow Light** (`rgba(0, 0, 0, 0.12)`): Standard card elevation -- a featherweight lift for content cards.
- **Shadow Medium** (`rgba(0, 0, 0, 0.16)`): Slightly stronger elevation for floating action buttons and overlays.
- **Button Press** (`rgba(0, 0, 0, 0.08)`): Inset shadow for active/pressed states on secondary buttons.

### Link States
- **Default Link Blue** (`#0000ee`): Standard browser blue for text links with underline -- used in body content.
- **Link White** (`#ffffff`): Links on dark surfaces -- used in footer and dark sections.
- **Link Black** (`#000000`): Links on light surfaces with underline decoration.

### Gradient System
- Uber's design is **entirely gradient-free**. The black/white duality and flat color blocks create all visual hierarchy. No gradients appear anywhere in the system -- every surface is a solid color, every transition is a hard edge or a shadow.

## 3. Typography Rules

### Font Family
- **Headline / Display**: `UberMove`, with fallbacks: `UberMoveText, system-ui, Helvetica Neue, Helvetica, Arial, sans-serif`
- **Body / UI**: `UberMoveText`, with fallbacks: `system-ui, Helvetica Neue, Helvetica, Arial, sans-serif`

*Note: UberMove and UberMoveText are proprietary typefaces. For external implementations, use `system-ui` or Inter as the closest available substitute. The geometric, square-proportioned character of UberMove can be approximated with Inter or DM Sans.*

### Hierarchy

| Role | Font | Size | Weight | Line Height | Notes |
|------|------|------|--------|-------------|-------|
| Display / Hero | UberMove | 52px (3.25rem) | 700 | 1.23 (tight) | Maximum impact, billboard presence |
| Section Heading | UberMove | 36px (2.25rem) | 700 | 1.22 (tight) | Major section anchors |
| Card Title | UberMove | 32px (2rem) | 700 | 1.25 (tight) | Card and feature headings |
| Sub-heading | UberMove | 24px (1.5rem) | 700 | 1.33 | Secondary section headers |
| Small Heading | UberMove | 20px (1.25rem) | 700 | 1.40 | Compact headings, list titles |
| Nav / UI Large | UberMoveText | 18px (1.13rem) | 500 | 1.33 | Navigation links, prominent UI text |
| Body / Button | UberMoveText | 16px (1rem) | 400-500 | 1.25-1.50 | Standard body text, button labels |
| Caption | UberMoveText | 14px (0.88rem) | 400-500 | 1.14-1.43 | Metadata, descriptions, small links |
| Micro | UberMoveText | 12px (0.75rem) | 400 | 1.67 (relaxed) | Fine print, legal text |

### Principles
- **Bold headlines, medium body**: UberMove headings are exclusively weight 700 (bold) -- every headline hits with billboard force. UberMoveText body and UI text uses 400-500, creating a clear visual hierarchy through weight contrast.
- **Tight heading line-heights**: All headlines use line-heights between 1.22-1.40 -- compact and punchy, designed for scanning rather than reading.
- **Functional typography**: There is no decorative type treatment anywhere. No letter-spacing, no text-transform, no ornamental sizing. Every text element serves a direct communication purpose.
- **Two fonts, strict roles**: UberMove is exclusively for headings. UberMoveText is exclusively for body, buttons, links, and UI. The boundary is never crossed.

## 7. Do's and Don'ts

### Do
- Use true black (`#000000`) and pure white (`#ffffff`) as the primary palette -- the stark contrast IS Uber
- Use 999px border-radius for all buttons, chips, and pill-shaped navigation elements
- Keep all headings in UberMove Bold (700) for billboard-level impact
- Use whisper-soft shadows (0.12-0.16 opacity) for card elevation -- barely visible
- Maintain the compact, information-dense layout style -- Uber prioritizes efficiency over airiness
- Use warm, human-centric illustrations to soften the monochrome interface
- Apply 8px radius for content cards and 12px for featured containers
- Use UberMoveText at weight 500 for navigation and prominent UI text
- Pair black primary buttons with white secondary buttons for dual-action layouts

### Don't
- Don't introduce color into the UI chrome -- Uber's interface is strictly black, white, and gray
- Don't use rounded corners less than 999px on buttons -- the full-pill shape is a core identity element
- Don't apply heavy shadows or drop shadows with high opacity -- depth is whisper-subtle
- Don't use serif fonts anywhere -- Uber's typography is exclusively geometric sans-serif
- Don't create airy, spacious layouts with excessive whitespace -- Uber's density is intentional
- Don't use gradients or color overlays -- every surface is a flat, solid color
- Don't mix UberMove into body text or UberMoveText into headlines -- the hierarchy is strict
- Don't use decorative borders -- borders are functional (inputs, dividers) or absent entirely
- Don't soften the black/white contrast with off-whites or near-blacks -- the duality is deliberate

## 9. Agent Prompt Guide

### Quick Color Reference
- Primary Button: "Uber Black (#000000)"
- Page Background: "Pure White (#ffffff)"
- Button Text (on black): "Pure White (#ffffff)"
- Button Text (on white): "Uber Black (#000000)"
- Secondary Text: "Body Gray (#4b4b4b)"
- Tertiary Text: "Muted Gray (#afafaf)"
- Chip Background: "Chip Gray (#efefef)"
- Hover State: "Hover Gray (#e2e2e2)"
- Card Shadow: "rgba(0,0,0,0.12) 0px 4px 16px"
- Footer Background: "Uber Black (#000000)"

### Example Component Prompts
- "Create a hero section on Pure White (#ffffff) with a headline at 52px UberMove Bold (700), line-height 1.23. Use Uber Black (#000000) text. Add a subtitle in Body Gray (#4b4b4b) at 16px UberMoveText weight 400 with 1.50 line-height. Place an Uber Black (#000000) pill CTA button with Pure White text, 999px radius, padding 10px 12px."
- "Design a category navigation bar with horizontal pill buttons. Each pill: Chip Gray (#efefef) background, Uber Black (#000000) text, 14px 16px padding, 999px border-radius. Active pill inverts to Uber Black background with Pure White text. Use UberMoveText at 14px weight 500."
- "Build a feature card on Pure White (#ffffff) with 8px border-radius and shadow rgba(0,0,0,0.12) 0px 4px 16px. Title in UberMove at 24px weight 700, description in Body Gray (#4b4b4b) at 16px UberMoveText. Add a black pill CTA button at the bottom."
- "Create a dark footer on Uber Black (#000000) with Pure White (#ffffff) heading text in UberMove at 20px weight 700. Footer links in Muted Gray (#afafaf) at 14px UberMoveText. Links hover to Pure White. Multi-column grid layout."
- "Design a floating action button with Pure White (#ffffff) background, 999px radius, 14px padding, and shadow rgba(0,0,0,0.16) 0px 2px 8px. Hover shifts background to #f3f3f3. Use for scroll-to-top or map controls."

### Iteration Guide
1. Focus on ONE component at a time
2. Reference the strict black/white palette -- "use Uber Black (#000000)" not "make it dark"
3. Always specify 999px radius for buttons and pills -- this is non-negotiable for the Uber identity
4. Describe the font family explicitly -- "UberMove Bold for the heading, UberMoveText Medium for the label"
5. For shadows, use "whisper shadow (rgba(0,0,0,0.12) 0px 4px 16px)" -- never heavy drop shadows
6. Keep layouts compact and information-dense -- Uber is efficient, not airy
7. Illustrations should be warm and human -- describe "stylized people in warm tones" not abstract shapes
8. Pair black CTAs with white secondaries for balanced dual-action layouts
