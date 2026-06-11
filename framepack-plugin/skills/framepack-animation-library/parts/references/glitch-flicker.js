// glitch-flicker | Glitch Flicker
// GSAP 3.x — deterministic CRT glitch with preset patterns
function glitchFlicker(tl, el, opts = {}, position = '>') {
  const { flickerCount = 3, intensity = 'medium' } = opts;
  const colors = opts.colors || ['#0ff', '#f0f', '#fff'];
  const dur = { subtle: 0.08, medium: 0.06, heavy: 0.04 }[intensity];
  const gap = { subtle: 0.25, medium: 0.18, heavy: 0.10 }[intensity];
  const shift = { subtle: 2, medium: 5, heavy: 10 }[intensity];
  const patterns = [
    [[1, 0], [-2, 1], [3, 2]],
    [[-2, 1], [0, 2], [2, 0]],
    [[1, 2], [-1, 0], [0, 1]],
  ];
  const pattern = patterns[Math.min(flickerCount - 1, patterns.length - 1)];
  pattern.forEach(([xShift, colorIdx], i) => {
    tl.to(el, {
      x: xShift * shift, color: colors[colorIdx],
      textShadow: (-xShift * 2) + 'px 0 ' + colors[colorIdx],
      duration: dur, ease: 'steps(1)'
    }, position + (i > 0 ? '+=' + gap : ''));
  });
  tl.to(el, { x: 0, color: '', textShadow: '', duration: 0.1, ease: 'power2.out' });
  return tl;
}
