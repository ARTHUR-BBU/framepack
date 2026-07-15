function elasticScaleEnter(tl, target, opts = {}, position = '>') {
  const el = typeof target === 'string' ? document.querySelector(target) : target;
  if (!el) throw new Error('elasticScaleEnter target not found');
  const { fromScale = 0.6, duration = 0.55, ease = 'back.out(1.4)', fade = true } = opts;
  return tl.fromTo(el, { scale: fromScale, autoAlpha: fade ? 0 : 1, transformOrigin:'50% 50%' }, { scale:1, autoAlpha:1, duration, ease, overwrite:'auto' }, position);
}
