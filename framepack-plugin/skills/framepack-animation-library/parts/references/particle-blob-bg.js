// particle-blob-bg | Particle Blob Background
// anime.js 4.x — deterministic organic particle blob
import { animate, stagger } from 'animejs';

function createParticleBlob(container, opts = {}) {
  const { particleCount = 120, blobSize = 300, morphAmplitude = 60, duration = 6 } = opts;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 800 800');
  svg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
  const circles = [], baseAngles = [];
  for (let i = 0; i < particleCount; i++) {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('r', '3');
    svg.appendChild(circle);
    circles.push(circle);
    baseAngles.push((i / particleCount) * Math.PI * 2);
  }
  container.appendChild(svg);
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
