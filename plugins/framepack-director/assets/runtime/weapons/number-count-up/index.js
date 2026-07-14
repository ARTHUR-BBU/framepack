export function numberCountUp(tl, el, opts = {}, position = '>') {
  if (!el) throw new Error('numberCountUp target not found');
  const { targetValue, prefix = '', suffix = '', decimals = 0, duration = 1.5, ease = 'power2.out' } = opts;
  if (!Number.isFinite(targetValue)) throw new Error('numberCountUp targetValue must be finite');
  const state = { value: 0 };
  tl.to(state, { value: targetValue, duration, ease, snap: { value: 1 / (10 ** decimals) }, onUpdate: () => { el.textContent = `${prefix}${state.value.toFixed(decimals)}${suffix}`; } }, position);
  return tl;
}
