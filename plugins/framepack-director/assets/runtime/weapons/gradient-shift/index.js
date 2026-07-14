export function gradientShift(tl, target, opts = {}, position = '>') {
  const el = typeof target === 'string' ? document.querySelector(target) : target;
  if (!el) throw new Error('gradientShift target not found');
  const { fromColors=['#667eea','#764ba2'], toColors=['#f093fb','#f5576c'], angle=135, duration=3 } = opts;
  const state = { mix:0 };
  const render = () => { el.style.backgroundImage = `linear-gradient(${angle}deg, ${gsap.utils.interpolate(fromColors[0],toColors[0],state.mix)}, ${gsap.utils.interpolate(fromColors[1],toColors[1],state.mix)})`; };
  render();
  tl.fromTo(el, { scale:1 }, { scale:1.018, duration, ease:'sine.inOut' }, position);
  tl.to(state, { mix:1, duration, ease:'sine.inOut', onUpdate:render }, position);
  return tl;
}
