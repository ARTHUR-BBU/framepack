// anime-text-split | Anime.js Text Split Entrance (Element-Inject Pattern)
// anime.js 4.x — lightweight text split (no GSAP dependency)
import { animate, stagger } from 'animejs';

/**
 * Animates pre-split text spans for a stagger entrance effect.
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  STATIC HTML PREREQUISITE (Agent must pre-write in HTML):       │
 * │                                                                 │
 * │  <h2 class="hero-text">                                        │
 * │    <span style="display:inline-block">H</span>                 │
 * │    <span style="display:inline-block">E</span>                 │
 * │    <span style="display:inline-block">L</span>                 │
 * │    <span style="display:inline-block">L</span>                 │
 * │    <span style="display:inline-block">O</span>                 │
 * │  </h2>                                                          │
 * │                                                                 │
 * │  Use opts.splitBy to match:                                     │
 * │    splitBy='letter' → one <span> per character                  │
 * │    splitBy='word'   → one <span> per word                       │
 * │  Spaces should use \u00A0 (non-breaking) inside spans.          │
 * └─────────────────────────────────────────────────────────────────┘
 *
 * @param {gsap.core.Timeline} tl — GSAP timeline (ignored, anime.js runs standalone)
 * @param {HTMLElement|string} textEl — container with pre-split <span> children
 * @param {object} opts
 * @returns {anime.js animation}
 *
 * Architecture contract: NO createElement / innerHTML. Operates on pre-existing spans only.
 * See design doc: 2026-06-18--v0130-weapon-architecture-refactor.md
 */
function animeTextSplit(tl, textEl, opts = {}) {
  textEl = typeof textEl === 'string' ? document.querySelector(textEl) : textEl;
  const { splitBy = 'letter', direction = 'up',
          staggerAmount = 40, duration = 800 } = opts;

  // Query pre-existing spans — Agent must pre-write them in HTML
  const spans = Array.from(textEl.querySelectorAll(':scope > span'));

  if (spans.length === 0) {
    console.warn(
      'animeTextSplit: No <span> children found in textEl. ' +
      'Pre-split the text into <span style="display:inline-block"> elements. ' +
      'Example: <h2><span style="display:inline-block">H</span>...</h2>'
    );
    return tl;
  }

  const dirMap = {
    up:    { translateY: [24, 0], opacity: [0, 1] },
    down:  { translateY: [-24, 0], opacity: [0, 1] },
    scale: { scale: [0, 1], opacity: [0, 1] },
    rotate:{ rotate: ['0.25turn', 0], opacity: [0, 1] },
  };
  const props = dirMap[direction] || dirMap.up;

  return animate(spans, {
    ...props,
    duration,
    delay: stagger(staggerAmount),
    ease: 'out(3)',
    autoplay: false
  });
}
