// particle-blob-bg | Particle Blob Background (Element-Inject Pattern)
// anime.js 4.x — deterministic organic particle blob
import { animate, stagger } from 'animejs';

/**
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │  USAGE (two-step: setup generates HTML, then animate operates on it) │
 * │                                                                      │
 * │  Step 1 — Call setup to generate HTML, write into index.html:        │
 * │    const html = particleBlobSetup({ particleCount: 120 })            │
 * │    // paste html string inside the scene container                    │
 * │                                                                      │
 * │  Step 2 — Animate the pre-written particles:                         │
 * │    animateParticleBlob(tl, container, { blobSize: 300, ... })        │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * Architecture contract: NO createElement / createElementNS / innerHTML.
 * See design doc: 2026-06-18--v0130-weapon-architecture-refactor.md
 */

/**
 * Setup helper — generates static SVG HTML string with N circles.
 * Agent calls this, writes output into index.html.
 *
 * @param {object} opts
 * @returns {string} HTML string (svg with circle elements)
 */
function particleBlobSetup(opts = {}) {
  const { particleCount = 120 } = opts;
  let circles = '';
  for (let i = 0; i < particleCount; i++) {
    circles += `<circle r="3" data-idx="${i}"></circle>`;
  }
  return `<svg class="particle-blob-svg" viewBox="0 0 800 800" style="position:absolute;inset:0;width:100%;height:100%">${circles}</svg>`;
}

/**
 * Animate pre-existing particle circles for organic blob motion.
 *
 * @param {gsap.core.Timeline} tl — GSAP timeline (unused, anime.js runs standalone)
 * @param {HTMLElement|string} container — element containing .particle-blob-svg
 * @param {object} opts
 * @returns {object} { svg, anim }
 */
function animateParticleBlob(tl, container, opts = {}) {
  container = typeof container === 'string' ? document.querySelector(container) : container;

  const { particleCount = 120, blobSize = 300, morphAmplitude = 60, duration = 6 } = opts;

  const svg = container.querySelector('.particle-blob-svg');
  if (!svg) {
    console.warn(
      'animateParticleBlob: .particle-blob-svg not found. ' +
      'Call particleBlobSetup() to generate HTML first.'
    );
    return { svg: null, anim: null };
  }

  const circles = Array.from(svg.querySelectorAll('circle'));
  if (circles.length === 0) {
    console.warn('animateParticleBlob: No <circle> elements found in SVG.');
    return { svg, anim: null };
  }

  const baseAngles = [];
  for (let i = 0; i < circles.length; i++) {
    baseAngles.push((i / circles.length) * Math.PI * 2);
  }

  const anim = animate(circles, {
    cx: stagger((el, i) => {
      const a = baseAngles[i] + (i * 0.5) % (Math.PI * 2);
      return 400 + Math.cos(a) * (blobSize + ((i % 11) - 5) * morphAmplitude / 5);
    }, { start: 'center' }),
    cy: stagger((el, i) => {
      const a = baseAngles[i] + (i * 0.3) % (Math.PI * 2);
      return 400 + Math.sin(a) * (blobSize + ((i % 7) - 3) * morphAmplitude / 5);
    }, { start: 'center' }),
    duration, ease: 'inOutSine', alternate: true, loop: 0, autoplay: false
  });
  return { svg, anim };
}
