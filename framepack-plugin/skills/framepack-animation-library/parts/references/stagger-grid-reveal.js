// stagger-grid-reveal | Grid Stagger Reveal
// GSAP 3.12+ stagger.grid — deterministic grid animation
function staggerGridReveal(tl, container, opts = {}, position = '>') {
  const { rows = 3, cols = 3, from = 'center',
          axis = 'both', staggerEach = 0.05, animation = 'fade-up' } = opts;
  const items = container.children;
  if (!items.length) return tl;
  const animMap = {
    'fade-up': { y: 40, opacity: 0 }, 'scale-in': { scale: 0.5, opacity: 0 },
    'flip-in': { rotationX: -90, opacity: 0 }, 'slide-left': { x: -60, opacity: 0 }
  };
  tl.fromTo(items, animMap[animation] || animMap['fade-up'],
    { y: 0, x: 0, scale: 1, rotationX: 0, opacity: 1, duration: 0.5,
      stagger: { each: staggerEach, grid: [rows, cols], from, axis },
      ease: 'back.out(1.2)' }, position);
  return tl;
}
