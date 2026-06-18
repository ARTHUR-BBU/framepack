/**
 * Background Blur Mask — 背景模糊遮罩 (Element-Inject Pattern)
 *
 * Animates a pre-existing overlay element with backdrop-filter blur + darkening
 * for spotlight effect.
 *
 * ┌─────────────────────────────────────────────────────────────┐
 * │  STATIC HTML PREREQUISITE (Agent must pre-write in HTML):   │
 * │                                                             │
 * │  <div class="bg-blur-mask"                                  │
 * │       style="position:absolute;inset:0;pointer-events:none; │
 * │              z-index:1"></div>                              │
 * │                                                             │
 * │  Place this div INSIDE the container you pass as arg 2.     │
 * └─────────────────────────────────────────────────────────────┘
 *
 * @param {gsap.core.Timeline} tl
 * @param {HTMLElement|string} containerOrMask — container with .bg-blur-mask child,
 *        or the mask element itself
 * @param {object} opts
 * @param {string|number} position
 * @returns {gsap.core.Timeline}
 *
 * Architecture contract: NO createElement. Operates on pre-existing elements only.
 * See design doc: 2026-06-18--v0130-weapon-architecture-refactor.md
 */
function bgBlurMask(tl, containerOrMask, opts = {}, position = '<') {
  const target = typeof containerOrMask === 'string'
    ? document.querySelector(containerOrMask)
    : containerOrMask;

  // Resolve mask element: either target itself has the class, or find child
  const mask = target.classList && target.classList.contains('bg-blur-mask')
    ? target
    : target.querySelector('.bg-blur-mask');

  if (!mask) {
    console.warn(
      'bgBlurMask: .bg-blur-mask element not found. ' +
      'Pre-write <div class="bg-blur-mask" style="position:absolute;inset:0;' +
      'pointer-events:none;z-index:1"></div> inside the container.'
    );
    return tl;
  }

  const {
    blurAmount = '8px',
    darkenOpacity = 0.3,
    duration = 0.4,
    curve = 'power2.inOut'
  } = opts;

  // Animate blur + darken together
  return tl.to(mask, {
    backdropFilter: `blur(${blurAmount})`,
    backgroundColor: `rgba(0, 0, 0, ${darkenOpacity})`,
    duration,
    ease: curve,
    overwrite: 'auto'
  }, position);
}
