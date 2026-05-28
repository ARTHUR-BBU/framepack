# Catalog Component Usage Guide

## Step 1: Check available components

```bash
npx hyperframes catalog --json
```

This returns all available blocks and components. Run this BEFORE writing any custom code.

## Step 2: Install recommended components

For each component listed in the COMPOSITION.md Catalog Plan:

```bash
npx hyperframes add <component-id>
```

Example:
```bash
npx hyperframes add caption-clip-wipe
npx hyperframes add logo-outro
```

## Step 3: Use installed components

### Block type components (sub-compositions)

Blocks are complete scene-level units. Mount them as sub-compositions:

```html
<div id="caption-1"
     data-composition-id="caption-clip-wipe"
     data-composition-src="compositions/caption-clip-wipe.html"
     data-start="3" data-duration="4" data-track-index="2">
</div>
```

After `npx hyperframes add`, the block HTML is placed in `compositions/`. Reference it via `data-composition-src`.

### Component type (code snippets)

Components are CSS/GSAP patterns. After installation, the component's styles and tween patterns are available to copy into your main composition.

Check the installed component's source in `compositions/` or `components/` for exact usage.

## Step 4: Prioritize catalog over custom code

Catalog components are production-tested best practices. Before writing custom animation for a caption, transition, or outro — check if a catalog component already does it.

Only write custom code for what the catalog does not cover.

## Catalog Pre-Flight Checklist

Before starting composition code:

- [ ] Ran `npx hyperframes catalog --json`
- [ ] Installed all recommended components from COMPOSITION.md
- [ ] Verified installed files exist in `compositions/` or `components/`
- [ ] Identified which scenes can use catalog blocks vs need custom code
