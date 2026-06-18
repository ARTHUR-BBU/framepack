// typewriter-cursor | Typewriter Cursor with chromatic aberration (Element-Inject Pattern)
// GSAP 3.x — deterministic typewriter reveal with cursor blink + shimmer
//
// ┌──────────────────────────────────────────────────────────────────────┐
// │  STATIC HTML PREREQUISITE (Agent must pre-write in HTML):            │
// │                                                                      │
// │  <div class="typewriter-stage" style="position:relative">            │
// │    <div class="typewriter-text" style="font-family:Inter Tight,...;  │
// │         font-weight:700;font-size:6vw;color:#f5f5f7;text-align:center">│
// │      <span class="tw-char" style="opacity:0;display:inline">H</span> │
// │      <span class="tw-char" style="opacity:0;display:inline">E</span> │
// │      <span class="tw-char" style="opacity:0;display:inline">L</span> │
// │      <span class="tw-char" style="opacity:0;display:inline">L</span> │
// │      <span class="tw-char" style="opacity:0;display:inline">O</span> │
// │      <span class="typewriter-cursor" style="display:inline-block;     │
// │            width:3px;height:1em;background:#ff3b6f;margin-left:2px;   │
// │            vertical-align:middle"></span>                             │
// │    </div>                                                            │
// │    <div class="typewriter-shimmer" style="position:absolute;top:0;    │
// │         left:0;width:100%;height:100%;                               │
// │         background:linear-gradient(90deg,transparent 0%,              │
// │            rgba(255,255,255,0.15) 50%,transparent 100%);              │
// │         pointer-events:none"></div>                                   │
// │  </div>                                                              │
// │                                                                      │
// │  One .tw-char span per character (opacity:0).                        │
// │  .typewriter-cursor and .typewriter-shimmer are optional              │
// │  (only needed if cursorBlink/shimmerAtEnd are enabled).               │
// └──────────────────────────────────────────────────────────────────────┘
//
// @param {gsap.core.Timeline} tl
// @param {HTMLElement|string} container — the .typewriter-stage
// @param {object} opts
// @returns {{tl, textEl, cursorEl}}
//
// Architecture contract: NO createElement / innerHTML. Operates on pre-existing elements only.

function typewriterCursor(tl, container, opts = {}) {
  container = typeof container === 'string' ? document.querySelector(container) : container;

  const { charInterval = 0.08,
          chromaticPair = ['#ff3b6f', '#00d4ff'],
          chromaticDuration = 0.2,
          shimmerAtEnd = true } = opts;

  // Query pre-existing elements
  const textEl = container.querySelector('.typewriter-text');
  if (!textEl) {
    console.warn(
      'typewriterCursor: .typewriter-text not found. ' +
      'Pre-write the static HTML structure (see header comment for template).'
    );
    return { tl, textEl: null, cursorEl: null };
  }

  const charSpans = Array.from(textEl.querySelectorAll('.tw-char'));
  const cursorEl = textEl.querySelector('.typewriter-cursor');
  const shimmerEl = container.querySelector('.typewriter-shimmer');

  if (charSpans.length === 0) {
    console.warn('typewriterCursor: No .tw-char spans found in .typewriter-text.');
    return { tl, textEl, cursorEl };
  }

  const blinkPattern = [1, 1, 1, 0, 1, 1, 0, 0, 1, 0, 1, 1, 1, 0];

  charSpans.forEach((span, i) => {
    tl.to(span, { opacity: 1, duration: 0.01, ease: 'steps(1)' }, '>+' + charInterval);
    tl.to(span, { textShadow: '2px 0 ' + chromaticPair[0] + ', -2px 0 ' + chromaticPair[1], duration: 0.01 }, '<');
    tl.to(span, { textShadow: '0 0 0 transparent', duration: chromaticDuration }, '<');
  });

  if (cursorEl) {
    const totalFlashes = Math.ceil(charSpans.length * charInterval / 0.5);
    for (let f = 0; f < totalFlashes; f++) {
      tl.to(cursorEl, { opacity: blinkPattern[f % blinkPattern.length] ? 1 : 0, duration: 0.01 }, '>');
    }
  }

  if (shimmerAtEnd && cursorEl) {
    tl.to(cursorEl, { opacity: 0, duration: 0.3 }, '>');
    if (shimmerEl) {
      tl.fromTo(shimmerEl, { x: '-100%' }, { x: '100%', duration: 0.5, ease: 'power2.inOut' }, '>');
    }
  }

  return { tl, textEl, cursorEl };
}
