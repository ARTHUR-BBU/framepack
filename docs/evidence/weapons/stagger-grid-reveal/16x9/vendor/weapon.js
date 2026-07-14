function staggerGridReveal(tl, target, opts = {}, position = '>') {
  const container = typeof target === 'string' ? document.querySelector(target) : target;
  if (!container) throw new Error('staggerGridReveal target not found');
  const { rows=3, cols=3, from='center', staggerEach=0.05, animation='fade-up', duration=0.5 } = opts;
  const items = [...container.children];
  if (!items.length) return tl;
  const starts = { 'fade-up':{ y:40, autoAlpha:0 }, 'scale-in':{ scale:0.6, autoAlpha:0 }, 'slide-left':{ x:-60, autoAlpha:0 } };
  return tl.fromTo(items, starts[animation] || starts['fade-up'], { x:0, y:0, scale:1, autoAlpha:1, duration, ease:'back.out(1.2)', stagger:{ each:staggerEach, grid:[rows,cols], from } }, position);
}
