# Design System Inspired by Bugatti

> Category: Automotive
> Hypercar brand. Cinema-black canvas, monochrome austerity, monumental display type.

## 1. Visual Theme & Atmosphere

Bugatti.com does not behave like a website — it behaves like a feature-length car film that a visitor happens to be standing inside. The canvas is pure `#000000`, the only color that appears at rest is white, and the entire page is carried by full-bleed hero video and photography with a single typographic moment laid over the top. There are no cards, no grids, no promotional modules, no newsletter signups, no three-column editorial layouts. It is one continuous cinema-black channel, interrupted only by the cars themselves and a few pill-shaped calls to action that quietly say things like "EXPLORE OUR OPPORTUNITIES" in ALL CAPS monospace.

The single most distinctive move in the entire system is **scale**: the `Bugatti Display` typeface runs at **288px** at hero moments. Two hundred and eighty-eight pixels. That is not a typo — the dembrandt sweep extracted a heading style rendered at an 18rem size, ALL CAPS, line-height 1.0, meant to be read the way you read a brand mark on the front of a Chiron: from across a showroom floor. At 288px the headline is no longer text, it is architecture. The secondary display scale of 60px feels almost miniature next to it, and the 36px mid-display feels like fine print. This typographic hierarchy is the most extreme of any production brand website in this catalog, and it is what gives Bugatti.com its sculptural, couture-showroom presence.

The other signature is **monochromatic austerity**. The entire homepage uses exactly three colors at rest: `#000000`, `#ffffff`, and `#999999` (mid gray for disabled/tertiary states). There is no accent, no brand blue, no hazard color, no commerce orange, no gradient wash. The designers have made a conscious decision that Bugatti's color system should be the car paint itself — the page is a black velvet display stand, and the only color that exists is whatever blue-on-black lacquer the hero vehicle happens to be wearing today. This discipline is the exact opposite of PlayStation's PlayStation Blue or The Verge's Jelly Mint: Bugatti refuses to compete with its own product.

**Key Characteristics:**
- Cinema-black `#000000` canvas for the entire page — no gradients, no tints, no accents
- 288px `Bugatti Display` ALL-CAPS headline — the most extreme display scale in the catalog
- Three-font custom family: `Bugatti Display` (sculptural), `Bugatti Monospace` (UI labels), `Bugatti Text Regular` (body)
- Monochrome-only palette: black, white, and a single `#999999` mid gray for tertiary/disabled
- Pill buttons at `9999px` radius — transparent with a 1px white border, padding `12px 24px`
- Video- and photography-first page — the chrome is almost silent so the product can speak
- Mono UPPERCASE labels with 1.2–1.4px letter-spacing on every CTA, navigation link, and caption

## 2. Color Palette & Roles

### Primary
- **Velvet Black** (`#000000`): The entire canvas. Not near-black, not warm black — the pure HTML `#000`. Bugatti treats this as a display-stand surface, the way a jewelry brand treats a black velvet cloth.
- **Showroom White** (`#ffffff`): All text, all borders, all CTAs. White is the only color that appears at rest on the chrome. It has the weight of typeset print on a matte museum label.

### Secondary & Accent
- **Silver Mist** (`#999999`): The single gray in the system. Used for secondary button borders, disabled states, and the thinnest hairline dividers. Treat this as the "75%-volume" version of white — never a color, just a quieter version of the same voice.

### Surface & Background
- **Velvet Black** (`#000000`): The only surface. There is no secondary surface, no elevated card, no modal backdrop. If something needs to feel "separate", it sits on the same black and is marked with a thin `#999999` border — no color change.

### Neutrals & Text
- **Primary Text** (`#ffffff`): All headlines, body copy, button labels, and navigation items.
- **Tertiary Text** (`#999999`): Disclaimer text, placeholder labels, and the faintest supporting metadata. Used sparingly — Bugatti prefers to hide secondary content rather than dim it.

### Semantic & Accent
- **Tailwind Ring Leak** (`rgba(59, 130, 246, 0.5)`): A Tailwind default `--tw-ring-color` leaks into the extracted tokens from the build system — this is **not** part of the Bugatti brand palette. Ignore it. If a real focus state is needed, use a 1px `#ffffff` ring instead.

### Gradient System
None. There are zero decorative gradients on Bugatti.com. The only "gradient" on the page is whatever natural light gradient exists inside the hero video of the car itself. The brand refuses to apply any chrome gradient that could compete with the atmospheric lighting of the product photography.

## 3. Typography Rules

### Font Family
- **Bugatti Display** — fallback: `ui-sans-serif`, `system-ui`. A proprietary custom display typeface used only at very large sizes for hero and mid-display headlines. Designed to be read at architectural scale — at 288px, its geometry doubles as a visual element, not just text. The face carries a faint hint of early-20th-century Grand Prix typography (the period when Ettore Bugatti was racing) without ever becoming nostalgic.
- **Bugatti Monospace** — fallback: `ui-sans-serif`, `system-ui`. A custom monospaced face reserved for every UI label on the site. It handles all navigation links, all button labels, all captions, and all UPPERCASE metadata. The strict mono tracking (1.2–1.4px letter-spacing on all usages) gives the UI the appearance of a technical dossier or dashboard telemetry printout — appropriate for a company that builds 1600-horsepower hypercars.
- **Bugatti Text Regular** — fallback: `ui-sans-serif`, `system-ui`. The body copy workhorse, used for the rare paragraph and inline reading text. Weights and styles are restrained — this font exists to be invisible when the display type is shouting and the monospace is whispering.

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|---|---|---|---|---|---|---|
| Hero Display (Monumental) | Bugatti Display | 288px / 18.00rem | 400 | 1.00 | — | ALL CAPS — the largest display scale in this catalog, architectural in presence |
| Mid Display (Feature) | Bugatti Display | 60px / 3.75rem | 400 | 1.00 | 1.4px | Feature-panel headlines, ALL CAPS optional |
| Mid Display (Subfeature) | Bugatti Display | 60px / 3.75rem | 400 | 1.00 | — | Secondary feature headlines |
| Section Heading | Bugatti Display | 36px / 2.25rem | 400 | 1.11 | — | Section-level title |
| Monumental Mono Headline | Bugatti Monospace | 60px / 3.75rem | 400 | 1.00 | — | UPPERCASE — reserved for technical/section labels at hero scale |
| Body Small (Display) | Bugatti Display | 16px / 1.00rem | 400 | 1.50 | — | Display face used sparingly at body size for marketing copy |
| Lead Body | Bugatti Text Regular | 20px / 1.25rem | 400 | 1.40 | — | Paragraph lead |
| Body Regular | Bugatti Text Regular | 16px / 1.00rem | 400 | 1.50 | — | Standard reading body |
| Body Compact | Bugatti Text Regular | 14px / 0.88rem | 400 | 1.43 | — | Dense body |
| UI Link (Caps) | Bugatti Monospace | 14px / 0.88rem | 400 | 1.43 | 1.4px | UPPERCASE — primary navigation and primary link style |
| UI Link (Mono Plain) | Bugatti Monospace | 14px / 0.88rem | 400 | 1.43 | — | Plain-case mono link — rare, used for disclaimer links |
| Button Label (CAPS) | Bugatti Monospace | 14px / 0.88rem | 400 | 1.43 | 1.4px | UPPERCASE — primary pill-button label |
| Button Label (Compact) | Bugatti Monospace | 12px / 0.75rem | 400 | 1.33 | 1.2px | UPPERCASE — small pill-button label |
| Button Label (Unstyled) | Bugatti Monospace | 12px / 0.75rem | 400 | 1.33 | — | Plain-case mono — footer microbutton |
| Caption CAPS Wide | Bugatti Monospace | 14px / 0.88rem | 400 | 1.43 | 1.4px | UPPERCASE — section eyebrows and tech-spec labels |
| Caption Plain Wide | Bugatti Monospace | 14px / 0.88rem | 400 | 1.43 | 1.4px | Plain-case with 1.4px tracking — the "mid-formal" register |
| Caption Plain | Bugatti Monospace | 14px / 0.88rem | 400 | 1.43 | — | Plain mono caption |
| Caption Micro (Text) | Bugatti Text Regular | 14px / 0.88rem | 400 | 1.43 | — | Body-face caption |
| Caption Micro (CAPS) | Bugatti Monospace | 12px / 0.75rem | 400 | 1.33 | 1.2px | UPPERCASE — smallest tagging label |
| Caption Micro (Plain) | Bugatti Monospace | 12px / 0.75rem | 400 | 1.33 | — | Smallest plain-case mono |

### Principles
- **Bugatti Display is a sculpture, not a font.** If you find yourself typesetting body copy or a button in Bugatti Display, you're using the wrong tool. Reserve this face for headlines at **36px minimum**, ideally 60px+, and at least once per page use it at 200px+ to create the monumental effect the brand is built around.
- **Bugatti Monospace owns the UI.** Every navigation link, every button, every caption, every eyebrow runs in Bugatti Monospace — usually UPPERCASE with 1.2–1.4px tracking. This mono-caps discipline is what makes the UI read like a Grand Prix telemetry panel rather than a luxury shopping cart.
- **Bugatti Text Regular is invisible.** It appears only in short paragraphs and inline reading copy, usually at 14–20px. It is never used for labels, buttons, or display.
- **There is no bold.** Every weight in the extracted tokens is regular (400). Bugatti does not use weight for hierarchy — it uses scale. When you need emphasis, make the type bigger, not heavier.
- **Tracking has two registers.** Mono caps always carry 1.2–1.4px letter-spacing. Display type at 60px+ sometimes carries 1.4px tracking at the hero scale. Body type has no tracking.
- **Line-height is brutally tight at display.** Every Bugatti Display usage runs at line-height 1.00 or 1.11. Headlines touch each other when they wrap — that's the design. Do not relax the leading.

### Note on Font Substitutes
The 1.00 line-height and 288px display scale both assume the **proprietary Bugatti Display face**, which is drawn with compact vertical metrics purpose-built for architectural scale. If you substitute with open-source extended geometric displays like **Unbounded**, **Big Shoulders Display**, or **Archivo Black**, make two adjustments: (1) **loosen line-height to ~1.05–1.10** to prevent ascender collisions, and (2) **cap the maximum display size at ~104–128px** on most viewports — these substitutes have wider horizontal metrics than Bugatti Display, so a 288px monumental headline will wrap across 4+ lines and overwhelm the layout. Reserve the 200px+ scale only for single-word monumental moments (e.g., "BUGATTI" alone). Bugatti Monospace substitutes (Space Mono, JetBrains Mono) and Bugatti Text Regular substitutes (Inter, DM Sans) work at the token values without adjustment.

## 7. Do's and Don'ts

### Do
- **Do** keep the entire canvas `#000000`. No off-black, no near-black, no warm black. Bugatti is pure black.
- **Do** use Bugatti Display at architectural scale — minimum 36px, ideally 60px+, and once per page land a monumental 200px+ headline.
- **Do** use Bugatti Monospace UPPERCASE with 1.2–1.4px tracking for every button, link, nav item, and caption.
- **Do** use only white text at rest. `#999999` is only for disabled, tertiary, and thin borders.
- **Do** use 9999px border radius for primary buttons — full pill, thin 1px white outline, transparent fill.
- **Do** use full-bleed video and photography for every hero section. The product is the UI.
- **Do** maintain line-height 1.00–1.11 on display headlines. Tight leading is the architecture.
- **Do** treat whitespace like cinematic negative space — give every block its own silent room.

### Don't
- **Don't** introduce accent colors. No blue, no red, no commerce orange, no hover cyan, no warning red. The palette is black, white, and one gray.
- **Don't** use bold weights for hierarchy. Scale is the only hierarchy device — make it bigger, not heavier.
- **Don't** use drop shadows on any element. Bugatti has no `box-shadow` in its chrome.
- **Don't** use cards or elevated surfaces. Bugatti has no card component.
- **Don't** use rounded rectangles between 6px and 9999px. The radius system is rectangle, slightly-rounded utility, or full pill — nothing in between.
- **Don't** use Bugatti Display for body, buttons, or UI labels. Reserve it for headlines at 36px+.
- **Don't** use Bugatti Monospace in lowercase for primary UI. Buttons and nav links are always ALL CAPS.
- **Don't** add gradients, glows, blurs, or glassmorphism anywhere. The chrome is silent.
- **Don't** put text over photography without a `rgba(0, 0, 0, 0.4)` bottom-up vignette if legibility is at risk.

## 9. Agent Prompt Guide

### Quick Color Reference
- **Primary Canvas**: "Velvet Black (`#000000`)"
- **Primary Text**: "Showroom White (`#ffffff`)"
- **Secondary Text / Disabled / Hairline Border**: "Silver Mist (`#999999`)"
- **Accent**: None. Do not add one.
- **Hover Signal**: Opacity shift or border-color shift — no color change

### Example Component Prompts
1. *"Create a monumental hero headline using Bugatti Display at 288px, ALL CAPS, `#ffffff` text on a pure `#000000` canvas, line-height 1.0, no letter-spacing. Place a full-bleed 21:9 hero video behind it with a `rgba(0, 0, 0, 0.4) → transparent` bottom-up vignette for legibility."*
2. *"Design a primary pill CTA button: transparent background, 1px solid `#ffffff` border, `9999px` border radius, 12px × 24px padding, Bugatti Monospace 14px / 400 / 1.4px letter-spacing UPPERCASE label in `#ffffff`. Hover state fills the background white with black text, 250ms ease."*
3. *"Build a navigation bar: pure `#000000` background, `MENU` link left, centered `BUGATTI` wordmark (128×29px), `STORE` link right. All links in Bugatti Monospace 14px UPPERCASE with 1.4px letter-spacing in `#ffffff`. No dividers, no hover color — just a slight opacity dim on hover."*
4. *"Create a mid-feature section heading: Bugatti Display 60px ALL CAPS in `#ffffff`, line-height 1.0, centered over a full-bleed photograph. Place a single primary pill CTA 48–64px below the headline."*
5. *"Design a secondary utility button for a cookie dialog: transparent background, 1px solid `#999999` border, 6px border radius, 6px × 12px padding, Bugatti Monospace 12px / 400 / 1.2px tracking UPPERCASE label in `#ffffff`."*

### Iteration Guide
When refining existing screens generated with this design system:
1. **Audit the canvas.** If the background isn't pure `#000000`, change it. Bugatti does not tolerate off-black.
2. **Audit the palette.** Any color that isn't `#000000`, `#ffffff`, or `#999999` is drift. Remove it — that includes ALL accent colors, including common defaults like `#0070cc` Tailwind blue.
3. **Audit display scale.** If the largest headline on a page is smaller than 60px, it's under-scaled. Bugatti's minimum "monumental moment" is 60px; the maximum is 288px. Aim for the upper half.
4. **Audit mono-caps discipline.** Every button, every nav link, every caption, every CTA should be Bugatti Monospace UPPERCASE with 1.2–1.4px letter-spacing. If you see sentence case or mixed case on a button, that's drift.
5. **Audit shadows and gradients.** Strip every `box-shadow`. Strip every gradient except the one legibility vignette over video. Bugatti's chrome is silent.
6. **Audit radius.** Every container should land on `0`, `6px`, or `9999px`. If you see `12px`, `16px`, `20px`, `24px`, correct to the nearest Bugatti value (almost always `6px` or `9999px`).
7. **Audit type weight.** All weights should be 400. If you see `bold` or `700` anywhere, change it. Scale, not weight, is the hierarchy.
8. **Audit whitespace.** If a section feels cramped, add 48–64px. If it feels airy, leave it — Bugatti's negative space is a feature.
9. **Audit product presence.** Every hero section should have a vehicle — video or photograph — as the primary visual. The chrome should feel like it's framing the car, not competing with it.
