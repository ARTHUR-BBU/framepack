# Design System Inspired by Discord

> Category: Productivity & SaaS
> Voice / chat platform. Deep blurple, dark-first surfaces, playful accent moments.

## 1. Visual Theme & Atmosphere

Discord's product is engineered for evenings, raids, and group voice — so the entire surface is dark-first. The default canvas is the deep `Background Primary` (`#313338` light theme, `#1e1f22` dark theme), with chat columns layered on slightly lighter or darker shades to denote channels, threads, and side panels. The signature **Blurple** (`#5865f2`) is reserved for the brand mark, primary CTAs, mentions, and the "you" affordance — used sparingly so it pops against the muted neutrals.

Typography is **gg sans** (Discord's custom Whitney-replacement) for prose and chrome, with rounded geometric shapes that feel approachable but still legible at the small sizes a chat client demands. Headings step up incrementally; chat rows are tight (4–8px between message groups) so hours of scrollback feel scannable.

The shape language is rounded but not balloon-soft: 8px radii on cards, 4px on inputs, full pills on status badges and tags. Servers are rounded-square avatars at 48px that morph to circles on hover — a tiny piece of motion that has become part of the brand's identity.

**Key Characteristics:**
- Dark-first surfaces: `#1e1f22` / `#2b2d31` / `#313338` (3-step depth)
- Blurple `#5865f2` as the only saturated accent in the chat surface
- gg sans (Whitney-style) for all text — friendly, geometric, neutral
- Rounded-square server avatars (16px radius) that snap to circles on hover
- Tight chat-row spacing, generous side-panel padding
- Status dots: green online, yellow idle, red dnd, gray offline
- Pixel-snapped 1px dividers in subtle off-white at low alpha

## 2. Color Palette & Roles

### Primary
- **Blurple** (`#5865f2`): Brand primary, primary CTA, mention highlight.
- **Blurple Hover** (`#4752c4`): Hover/active for blurple.
- **Blurple Soft** (`#7289da`): Legacy blurple, secondary accent in marketing.

### Surface (Dark Theme — default)
- **Background Tertiary** (`#1e1f22`): Server list rail, deepest background.
- **Background Secondary** (`#2b2d31`): Channel sidebar, settings sidebar.
- **Background Primary** (`#313338`): Chat surface, message column.
- **Background Floating** (`#111214`): Floating popovers, tooltips, autocomplete.
- **Background Modifier Hover** (`rgba(78, 80, 88, 0.3)`): Hover overlay on rows.
- **Background Modifier Selected** (`rgba(78, 80, 88, 0.6)`): Active row.

### Surface (Light Theme)
- **Light Bg Primary** (`#ffffff`): Chat surface in light theme.
- **Light Bg Secondary** (`#f2f3f5`): Sidebar in light theme.
- **Light Bg Tertiary** (`#e3e5e8`): Deepest light surface.

### Text
- **Header Primary** (`#f2f3f5`): Channel headers, modal titles in dark theme.
- **Header Secondary** (`#b5bac1`): Muted headers.
- **Text Normal** (`#dbdee1`): Body text in dark theme — slightly cooler than pure white.
- **Text Muted** (`#949ba4`): Timestamps, server names, secondary metadata.
- **Text Link** (`#00a8fc`): Hyperlinks in messages — sky blue, distinct from blurple.
- **Channels Default** (`#80848e`): Inactive channel name in sidebar.

### Status & Semantic
- **Status Online** (`#23a55a`): Online dot, success states.
- **Status Idle** (`#f0b232`): Idle dot, away.
- **Status DND** (`#f23f43`): Do-not-disturb, also serves as destructive red.
- **Status Streaming** (`#593695`): "Streaming" purple.
- **Status Offline** (`#80848e`): Offline gray.
- **Mention Highlight** (`rgba(88, 101, 242, 0.1)`): Soft blurple wash on @mention rows.

### Border & Divider
- **Background Modifier Accent** (`rgba(255, 255, 255, 0.06)`): Standard divider in dark.
- **Border Subtle** (`#3f4147`): Solid divider for cards.

## 3. Typography Rules

### Font Family
- **Body / UI / Headings**: `gg sans`, with fallback: `"Helvetica Neue", Helvetica, Arial, sans-serif`
- **Display (legacy / Whitney)**: `Whitney`, with fallback: `gg sans`
- **Code / Mono**: `"gg mono"`, with fallback: `Consolas, Andale Mono, Courier New, Courier, monospace`

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|----------------|-------|
| Display Hero | gg sans | 56px (3.5rem) | 800 | 1.1 | -0.02em | Marketing hero |
| Page Heading | gg sans | 24px (1.5rem) | 700 | 1.25 | normal | Settings/profile titles |
| Channel Name | gg sans | 16px (1rem) | 600 | 1.25 | normal | `#general`, channel header |
| Message Body | gg sans | 16px (1rem) | 400 | 1.375 | normal | Standard chat text |
| Username | gg sans | 16px (1rem) | 500 | 1.25 | normal | Author of a message |
| Timestamp | gg sans | 12px (0.75rem) | 500 | 1.25 | normal | "Today at 4:32 PM" |
| Sidebar Channel | gg sans | 16px (1rem) | 500 | 1.25 | normal | Channel list rows |
| Server Name | gg sans | 16px (1rem) | 600 | 1.25 | normal | Server header |
| Caption / Meta | gg sans | 12px (0.75rem) | 400 | 1.3 | 0.02em | Status text, edited tag |
| Code Inline | gg mono | 0.875em | 400 | inherit | normal | Inline `code` |
| Code Block | gg mono | 14px (0.875rem) | 400 | 1.5 | normal | ```triple-fenced``` block |

### Principles
- **Friendly geometry**: gg sans replaces Whitney with rounded terminals on a/g/s — the brand wants warmth without breaking legibility.
- **Weight contrast over color contrast**: hierarchy comes from 400→500→600→700→800 weight steps; the surface stays neutral.
- **16px body**: chat messages do not shrink below 16px. Density comes from line-height (1.375), not font size.
