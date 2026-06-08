/**
 * Background Blur Mask — 背景模糊遮罩
 *
 * Creates (if needed) and animates a full-container overlay with
 * backdrop-filter blur + darkening for spotlight effect.
 *
 * @param {gsap.core.Timeline} tl
 * @param {HTMLElement} container
 * @param {object} opts
 * @param {string|number} position
 * @returns {gsap.core.Timeline}
 */
function bgBlurMask(tl, container, opts = {}, position = '<') {
  const {
    blurAmount = '8px',
    darkenOpacity = 0.3,
    duration = 0.4,
    curve = 'power2.inOut'
  } = opts;

  // Ensure mask layer exists
  let mask = container.querySelector('.bg-blur-mask');
  if (!mask) {
    mask = document.createElement('div');
    mask.className = 'bg-blur-mask';
    mask.style.cssText = [
      'position: absolute',
      'inset: 0',
      'pointer-events: none',
      'z-index: 1',
      // Start transparent — animation will fade in
      'backdrop-filter: blur(0px)',
      'background-color: rgba(0, 0, 0, 0)'
    ].join(';');

    // Ensure container has positioning context
    const pos = getComputedStyle(container).position;
    if (pos === 'static') {
      container.style.position = 'relative';
    }

    container.appendChild(mask);
  }

  // Animate blur + darken together
  return tl.to(mask, {
    backdropFilter: `blur(${blurAmount})`,
    backgroundColor: `rgba(0, 0, 0, ${darkenOpacity})`,
    duration,
    ease: curve,
    overwrite: 'auto'
  }, position);
}
