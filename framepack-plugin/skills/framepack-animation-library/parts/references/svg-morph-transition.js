// svg-morph-transition | SVG Morph Transition
// anime.js 4.x — SVG path morphing (anime.js native strength)
import { animate } from 'animejs';

function svgMorph(el, fromPath, toPath, opts = {}) {
  const { duration = 1.5, easing = 'inOut(4)' } = opts;
  return animate(el, {
    d: [fromPath, toPath],
    duration,
    ease: easing,
    autoplay: false
  });
}
