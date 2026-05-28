# Design System Inspired by BMW M

> Category: Automotive
> Motorsport performance sub-brand. Near-black cockpit surfaces, BMW M tricolor accents, sharp engineering geometry.

## 1. Visual Theme & Atmosphere
BMW M's analyzed editorial and marketing pages lean on a near-pure black canvas (`{colors.canvas}` — #000) holding white BMW Type Next Latin headlines in **confident UPPERCASE**. The system has no decorative voltage of its own; brand energy comes from **full-bleed automotive photography** — cars cornering at speed, carbon-fiber wheel detail, driver cockpit shots, motorsport pit lanes — placed as edge-to-edge content that fills entire bands. UI chrome around the photography stays minimal: thin sans-serif copy, dividers as 1px hairlines (`{colors.hairline}`), all-caps button labels with no fill until hovered.

The **M tricolor stripe** — `{colors.m-blue-light}` (#0066b1) → `{colors.m-blue-dark}` (#1c69d4) → `{colors.m-red}` (#e22718) — appears sparingly as the brand's signature accent, used on the M wordmark, motorsport chrome, vehicle-tech callouts, and model badges. It is never a CTA color and never used as a background fill — the tricolor is exclusively a brand-identity marker.

Type voice should stay aligned with the broader BMW family system: BMW Type Next Latin Light carries the large editorial display voice, while BMW Type Next Latin regular carries body and UI text. BMW M can use heavier uppercase weights for buttons, labels, cards, and emphasis, but agents should not treat a 700/300 split as a universal BMW M rule without page-specific evidence.

**Key Characteristics:**
- Near-pure black canvas (`{colors.canvas}` — #000) with white type across the analyzed editorial and marketing pages. Configurator, account, checkout, and order-management flows are unresolved and may introduce light surfaces.
- Display headlines use UPPERCASE BMW Type Next Latin Light when following the BMW family system. Heavier uppercase settings are reserved for labels, buttons, card titles, and observed M-specific emphasis.
- M tricolor (`{colors.m-blue-light}` / `{colors.m-blue-dark}` / `{colors.m-red}`) used as 4px brand-stripe dividers, M-wordmark accents, and motorsport chrome — never as buttons or fills.
- Photography fills entire bands edge-to-edge. Cars are always the visual subject; UI chrome backs off to small white labels overlaid on photography.
- Buttons are flat with 0px corners and uppercase letterspaced labels. The "industrial precision" rectangular silhouette IS the brand.
- Border radius is mostly zero across the system. The few exceptions are circular icon buttons such as carousel arrows and any confirmed small toggle pills.
- Spacing is generous and grid-aligned: `{spacing.section}` (96px) between major bands; `{spacing.xxl}` (64px) inside hero photo bands; `{spacing.xl}` (40px) inside content cards.

## 2. Color Palette & Roles
### Brand & Accent
- **Primary** (#ffffff): `{colors.primary}`. The system's primary type and CTA color. Used for h1/h2/h3 display, body text on dark, and primary button labels (the buttons themselves are transparent or canvas-colored — the white text + outline IS the button).
- **M Blue Light** (#0066b1): `{colors.m-blue-light}`. The first stop in the M tricolor stripe. Used on M-badge accents and motorsport chrome.
- **M Blue Dark** (#1c69d4): `{colors.m-blue-dark}`. The middle stop and BMW heritage blue value, repurposed as the middle band of the M stripe.
- **M Red** (#e22718): `{colors.m-red}`. The third stop. The signature M-power red, used in the stripe and on motorsport-pace callouts.
- **Electric Blue** (#0653b6): `{colors.electric-blue}`. A separate electric-vehicle accent used on M xDrive electric model pages. Distinct from the heritage blue — feels colder, more digital.

### Surface
- **Canvas** (#000000): `{colors.canvas}`. The default page floor across the analyzed editorial and marketing surfaces. True black.
- **Surface Soft** (#0d0d0d): `{colors.surface-soft}`. A barely-different-from-black used for spec table cells and footer-adjacent strips.
- **Surface Card** (#1a1a1a): `{colors.surface-card}`. Cards, secondary buttons, icon-button backgrounds.
- **Surface Elevated** (#262626): `{colors.surface-elevated}`. One step lighter, used for nested cards inside dark bands.
- **Carbon Gray** (#2b2b2b): `{colors.carbon-gray}`. Carbon-fiber-inspired surface tone used on technical-spec cards.

### Hairlines & Borders
- **Hairline** (#3c3c3c): `{colors.hairline}`. The 1px divider tone on dark surfaces. Used between body sections, between table rows, around card outlines.
- **Hairline Strong** (#262626): `{colors.hairline-strong}`. Same hex as `{colors.surface-elevated}` — borders feel like one-step elevations rather than ink lines.

### Text
- **Ink / On Dark** (#ffffff): `{colors.on-dark}`. All headline and primary text on dark canvas.
- **Body** (#bbbbbb): `{colors.body}`. Default running-text color (slightly cooler than pure white). Used for body paragraphs and secondary metadata.
- **Body Strong** (#e6e6e6): `{colors.body-strong}`. Emphasized body / lead paragraph.
- **Muted** (#7e7e7e): `{colors.muted}`. Footer links, breadcrumbs, captions.

### Semantic
- **Warning** (#f4b400): `{colors.warning}`. Used very sparingly on technical-warning callouts.
- **Success** (#0fa336): `{colors.success}`. Order-confirmation states (rare on marketing surfaces).

## 3. Typography Rules
### Font Family
**BMW Type Next Latin** is BMW's licensed display + body typeface. Align fallback guidance with the existing BMW design system: use `BMWTypeNextLatin Light` for display when available, `BMWTypeNextLatin` for body/UI, then `Helvetica, Arial, Hiragino Kaku Gothic ProN, Hiragino Sans, Meiryo, sans-serif`.

Observed BMW M examples can push uppercase labels, buttons, and card titles heavier for a motorsport "stamped" voice, but the family baseline remains:
- Display: Light (300) for large h1/h2 editorial headlines unless a captured M page clearly uses a heavier static cut
- Body/UI: regular (400) for paragraphs, descriptive copy, and persistent navigation
- Emphasis: 700 for buttons, category labels, and card titles; 900 only where navigation emphasis is explicitly observed

The important pattern is contrast and restraint, not a hard 700/300 split. Avoid medium-weight mush: use Light for large display, regular for reading text, and heavier weights only for short UI labels or M-specific emphasis.

### Hierarchy

| Token | Size | Weight | Line Height | Letter Spacing | Use |
|---|---|---|---|---|---|
| `{typography.display-xl}` | 80px | 300 Light | 1.0 | 0 | Hero h1 ("THE ULTIMATE", "MORE BMW M.") |
| `{typography.display-lg}` | 56px | 300 Light | 1.05 | 0 | Section heads ("MORE FROM BMW M MAGAZINE.") |
| `{typography.display-md}` | 40px | 300 Light / 400 | 1.1 | 0 | Sub-section heads, model names |
| `{typography.display-sm}` | 32px | 400 | 1.15 | 0 | CTA-band heads, category page titles |
| `{typography.title-lg}` | 24px | 700 | 1.3 | 0 | Card titles in 3-up grids |
| `{typography.title-md}` | 20px | 400 | 1.4 | 0 | Card sub-titles, lead paragraphs |
| `{typography.title-sm}` | 18px | 400 | 1.4 | 0 | Spec callouts, intro paragraphs |
| `{typography.label-uppercase}` | 14px | 700 | 1.3 | 1.5px | Category tabs, "VIEW MORE" inline labels |
| `{typography.body-md}` | 16px | 400 | 1.5 | 0 | Default body — BMW Type Next Latin regular |
| `{typography.body-sm}` | 14px | 400 | 1.5 | 0 | Footer body, cookie consent, fine print |
| `{typography.caption}` | 12px | 400 | 1.4 | 0.5px | Photo captions, image-credit lines |
| `{typography.button}` | 14px | 700 | 1.0 | 1.5px | All button labels — uppercase, letterspaced |
| `{typography.nav-link}` | 14px | 400 | 1.4 | 0.5px | Top-nav menu items |

### Principles
The system contrasts light, architectural display type against crisp regular body text, then uses heavier weights only for short labels and action chrome. Letter-spacing is non-trivial: button labels and category labels carry 1.5px tracking that makes them feel "machined" rather than "typed." Display headlines stay at 0 letter-spacing — BMW Type's natural cap-height handles spacing on large sizes.

UPPERCASE display is the default voice for h1/h2 — sentence case appears on body and intro paragraphs but rarely on headlines. The all-caps treatment is a brand-voice signal, not a stylistic choice.

### Note on Font Substitutes
If BMW Type Next Latin is unavailable, **Inter** (variable) at 300/400/700 is the closest open-source substitute. Keep display tracking at 0 unless the chosen fallback looks loose at large sizes. **Saira Condensed** is an alternative for short motorsport labels if a slightly more compressed feel is desired.

## 7. Do's and Don'ts
### Do
- Anchor every page with full-bleed automotive photography. The cars are the brand voltage; chrome backs off.
- Use UPPERCASE display headlines in `{typography.display-xl}` or `{typography.display-lg}`. Sentence-case display reads as off-brand.
- Keep typography disciplined: Light display, regular body text, heavier weights only for short labels, buttons, card titles, or observed M-specific emphasis.
- Reserve the M tricolor stripe for brand-identity moments — wordmark accents, motorsport chrome, model badges. Never as a button fill or surface.
- Use 0px radius by default. Reserve full-circle geometry for circular icon buttons only.
- Letter-space all-caps labels at 1.5px. The "machined" feel is non-negotiable.
- Use `{spacing.section}` (96px) between major editorial bands for grid-aligned vertical rhythm.

### Don't
- Don't introduce a brand color outside the M tricolor (`{colors.m-blue-light}` / `{colors.m-blue-dark}` / `{colors.m-red}`) and the documented electric-blue accent.
- Don't force body type into Light if readability suffers. Body should usually stay regular 400; reserve Light for large display and secondary editorial moments.
- Don't use rounded buttons. The rectangular silhouette IS the brand. Rounded corners read as consumer-tech, not motorsport.
- Don't put decorative gradient backdrops behind hero type. If a crop makes text fail contrast, add a functional black scrim, reposition the crop, or move the text into a solid black panel.
- Don't repeat the same surface mode in two consecutive bands. Rhythm: photo band → spec table → photo band → magazine grid → photo band. Two text-only bands in a row read as a corporate site.
- Don't use the M stripe as a button fill. The stripe is a divider / accent — never an action surface.
- Don't bold uppercase tracking under 1.5px on button labels — the spacing is what makes them feel "machined."

## 9. Agent Prompt Guide
1. Focus on ONE component at a time. Reference its component name (`hero-photo-band`, `spec-cell`).
2. New components default to 0px radius. Only use full-circle geometry for circular icon buttons.
3. Variants (`-active`, `-disabled`) live as separate prose entries next to the component name.
4. Use `{token.refs}` everywhere — never inline hex.
5. Never document hover states. Default and Active/Pressed only.
6. Display headlines stay UPPERCASE and light/architectural by default; body stays sentence-case regular. Use 700 only for short emphasis and UI labels.
7. The M tricolor is brand-identity-only — never extend it to system tokens for "primary action."
8. White-on-photo text needs a contrast strategy every time: crop first, scrim second, solid panel if needed.
9. When in doubt about emphasis: bigger photography before bigger type.

### Known Gaps
- The dembrandt frequency analyzer captured the white text (count 955) as the highest-frequency token. The black canvas was inferred from screenshot — dembrandt's body-background sampling didn't surface it as a top palette entry, but the page is unambiguously black-on-white-text.
- The exact M tricolor stops are documented from public BMW brand guidelines; the screenshots show the stripe as a small element but pixel-sampling at this resolution doesn't reliably distinguish #0066b1 from #1c69d4. Treat the documented stops as canonical based on BMW Design Works' published brand spec.
- BMW Type Next Latin weight evidence is incomplete. The broader BMW design system documents Light (300) display and regular (400) body/UI; BMW M-specific heavier label usage should be treated as observed emphasis, not a global replacement for BMW family typography.
- Animation and transition timings (photo carousel transitions, hover-reveal effects, configurator interactions) are not in scope.
- Form validation states beyond `text-input` defaults are not extracted — error / success input variants would need a configurator or order flow to confirm.
- The configurator surface (vehicle build pages with color / wheel / interior pickers) was not in the analyzed URL set; its swatch grid, comparison panels, and price-summary card are not documented here.
- The cookie consent overlay obscured part of the homepage hero in the captured screenshot; secondary hero treatments (different car models cycling through the hero band) may carry variations not captured.
