/**
 * Text Split Enter — 文字分裂进场
 *
 * Supports horizontal split (left/right), vertical split (top/bottom),
 * and per-character stagger via GSAP SplitText.
 *
 * HTML must be pre-processed in setup phase — see SKILL.md#html-结构
 */
function textSplitEnter(tl, textEl, opts = {}, position = '>') {
  textEl = typeof textEl === 'string' ? document.querySelector(textEl) : textEl;
  const {
    splitMode = 'horizontal',
    direction = 'inward',
    travelDistance = '40px',
    staggerPerChar = 0.03,
    duration = 0.5,
    clipPath = true
  } = opts;

  const sign = direction === 'inward' ? -1 : 1;

  if (splitMode === 'horizontal') {
    const half1 = textEl.querySelector('.split-left');
    const half2 = textEl.querySelector('.split-right');
    if (!half1 || !half2) {
      console.warn('textSplitEnter: missing .split-left/.split-right children');
      return tl;
    }
    tl.fromTo(half1,
      { x: sign * -parseFloat(travelDistance), opacity: 0 },
      { x: 0, opacity: 1, duration, ease: 'power3.out' },
      position
    );
    tl.fromTo(half2,
      { x: sign * parseFloat(travelDistance), opacity: 0 },
      { x: 0, opacity: 1, duration, ease: 'power3.out' },
      position
    );
  }

  if (splitMode === 'vertical') {
    const top = textEl.querySelector('.split-top');
    const bottom = textEl.querySelector('.split-bottom');
    if (!top || !bottom) return tl;
    tl.fromTo(top,
      { y: sign * -parseFloat(travelDistance), opacity: 0 },
      { y: 0, opacity: 1, duration, ease: 'power3.out' },
      position
    );
    tl.fromTo(bottom,
      { y: sign * parseFloat(travelDistance), opacity: 0 },
      { y: 0, opacity: 1, duration, ease: 'power3.out' },
      position
    );
  }

  if (splitMode === 'char') {
    // Requires GSAP SplitText plugin — use chars option
    // Each character flies in with stagger
    const chars = textEl.querySelectorAll('.char');
    if (chars.length === 0) return tl;
    const fromY = direction === 'inward' ? sign * -60 : 0;
    tl.fromTo(chars,
      { opacity: 0, y: fromY, rotateX: -40 },
      { opacity: 1, y: 0, rotateX: 0, duration: 0.4,
        ease: 'back.out(1.2)', stagger: staggerPerChar },
      position
    );
  }

  return tl;
}
