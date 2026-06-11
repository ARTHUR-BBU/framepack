// number-count-up | Number Count Up
// GSAP 3.x snap — deterministic counter animation
function numberCountUp(tl, el, opts = {}, position = '>') {
  const { targetValue = 100, prefix = '', suffix = '',
          decimals = 0, duration = 1.5, ease = 'power2.out' } = opts;
  const obj = { val: 0 };
  const snapVal = decimals > 0 ? (1 / Math.pow(10, decimals)).toString() : '1';
  tl.to(obj, {
    val: targetValue, duration, ease,
    snap: { val: parseFloat(snapVal) },
    onUpdate: () => { el.textContent = prefix + obj.val.toFixed(decimals) + suffix; }
  }, position);
  return tl;
}
