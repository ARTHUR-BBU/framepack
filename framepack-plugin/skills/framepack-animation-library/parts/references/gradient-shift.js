// gradient-shift | Gradient Shift
// GSAP 3.x CSS variable animation — breathing background
function gradientShift(tl, el, opts = {}, position = '>') {
  const { fromColors = ['#667eea', '#764ba2'], toColors = ['#f093fb', '#f5576c'],
          angle = 135, duration = 8 } = opts;
  const fromStr = fromColors.join(', ');
  gsap.set(el, {
    '--grad-from': fromStr,
    backgroundImage: 'linear-gradient(' + angle + 'deg, var(--grad-from))'
  });
  tl.to(el, {
    '--grad-from': toColors.join(', '),
    duration, ease: 'sine.inOut', repeat: 0,
    onUpdate: function() {
      el.style.backgroundImage = 'linear-gradient(' + angle + 'deg, ' +
        this.targets()[0].style.getPropertyValue('--grad-from') + ')';
    }
  }, position);
  return tl;
}
