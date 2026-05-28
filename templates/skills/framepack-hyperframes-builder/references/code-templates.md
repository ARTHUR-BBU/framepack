# Animation Code Templates

Reusable GSAP patterns for common video animation techniques. Adapt these to your composition — don't copy-paste blindly.

## Impact Pop (text shock entrance)

```javascript
tl.from(".headline", { scale: 5, ease: "back.out(1.7)", duration: 0.3 }, sceneStart + 0.2);
```

Use for: hero headlines, product names, price reveals.

## Kinetic Typography (word-by-word entrance)

```javascript
tl.from(".word", { y: 80, opacity: 0, stagger: 0.05, duration: 0.4, ease: "power3.out" }, sceneStart);
```

Use for: taglines, feature lists, key phrases. Each word needs its own `<span class="word">` wrapper.

## Hard Scene Snap (instant transition)

```javascript
tl.set("#scene-prev .content", { opacity: 0 }, cutTime);
tl.from("#scene-next .content", { opacity: 0, duration: 0.15 }, cutTime);
```

Use for: fast-paced content, energy shifts, beat drops.

## Smooth Dissolve (soft transition)

```javascript
tl.to("#scene-prev .content", { opacity: 0, duration: 0.5 }, cutTime - 0.5);
tl.from("#scene-next .content", { opacity: 0, duration: 0.5 }, cutTime);
```

Use for: premium feel, emotional shifts, calm pacing.

## Scale Reveal (elements pop in one by one)

```javascript
tl.from(".panel", { scale: 0, ease: "back.out(1.4)", duration: 0.5, stagger: 0.1 }, sceneStart + 0.3);
```

Use for: feature grids, product showcases, proof points.

## Slide Up (standard content entrance)

```javascript
tl.from(".content-block", { y: 60, opacity: 0, duration: 0.6, ease: "power3.out", stagger: 0.08 }, sceneStart + 0.2);
```

Use for: body text, subtitles, supporting content. Default safe choice.

## Number Counter (data/stat reveal)

```javascript
// Use a DOM text node and animate a proxy object
const counter = { val: 0 };
tl.to(counter, {
  val: 12500,
  duration: 1.5,
  ease: "power2.out",
  onUpdate: () => {
    document.getElementById("stat").textContent = Math.round(counter.val).toLocaleString();
  }
}, sceneStart + 0.3);
```

Use for: metrics, KPIs, financial data, growth numbers.

## Sweep Line (decorative horizontal line)

```javascript
tl.from(".sweep-line", { scaleX: 0, transformOrigin: "left center", duration: 0.4, ease: "power2.inOut" }, sceneStart + 0.1);
```

Use for: section dividers, header underlines, separation elements.
