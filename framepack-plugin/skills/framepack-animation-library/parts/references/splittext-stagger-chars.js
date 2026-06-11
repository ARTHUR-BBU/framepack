// splittext-stagger-chars | SplitText Char Stagger
// GSAP 3.13+ with SplitText plugin — deterministic char-by-char entrance
// Requires: GSAP SplitText (free as of GSAP 3.13+)
function splitTextStagger(tl, textEl, opts = {}, position = '>') {
  const { splitType = 'chars', direction = 'up',
          staggerAmount = 0.03, travelDistance = 30,
          rotation = 0, duration = 0.5 } = opts;

  const split = SplitText.create(textEl, { type: splitType });
  const elements = split[splitType];

  const dirMap = {
    up:    { y: travelDistance, x: 0 },
    down:  { y: -travelDistance, x: 0 },
    left:  { x: travelDistance, y: 0 },
    right: { x: -travelDistance, y: 0 },
  };
  const from = dirMap[direction] || dirMap.up;
  from.opacity = 0;
  if (rotation) from.rotation = rotation;

  tl.fromTo(elements, from,
    { y: 0, x: 0, opacity: 1, rotation: 0,
      duration, stagger: staggerAmount, ease: 'back.out(1.2)' },
    position
  );

  return { tl, split };
}
