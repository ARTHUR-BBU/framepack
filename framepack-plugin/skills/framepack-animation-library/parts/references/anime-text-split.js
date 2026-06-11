// anime-text-split | Anime.js Text Split Entrance
// anime.js 4.x — lightweight text split (no GSAP dependency)
import { animate, stagger } from 'animejs';

function animeTextSplit(tl, textEl, opts = {}) {
  textEl = typeof textEl === 'string' ? document.querySelector(textEl) : textEl;
  const { splitBy = 'letter', direction = 'up',
          staggerAmount = 40, duration = 800 } = opts;

  const text = textEl.textContent.trim();
  const unit = splitBy === 'letter' ? text.split('') : text.split(' ');
  textEl.innerHTML = '';

  const spans = unit.map(function(ch) {
    const span = document.createElement('span');
    span.textContent = ch === ' ' ? '\u00A0' : ch;
    span.style.display = 'inline-block';
    textEl.appendChild(span);
    return span;
  });

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
