// data-chart-editorial | Editorial Data Chart (Element-Inject Pattern)
// GSAP 3.x + SVG — NYT-style data visualization, no chart.js/d3 dependency
//
// ┌──────────────────────────────────────────────────────────────────────┐
// │  USAGE (two-step: setup generates HTML, then animate operates on it) │
// │                                                                      │
// │  Step 1 — Call setup to generate HTML, write into index.html:        │
// │    const html = dataChartSetup({ data: [...], headline: '...', ... })│
// │    // paste html string inside the scene container                    │
// │                                                                      │
// │  Step 2 — Animate the pre-written chart:                             │
// │    buildDataChart(tl, container, { revealStagger: 0.12, ... })       │
// └──────────────────────────────────────────────────────────────────────┘
//
// Architecture contract: NO createElement / createElementNS / innerHTML.
// See design doc: 2026-06-18--v0130-weapon-architecture-refactor.md

/**
 * Setup helper — generates static HTML string for editorial data chart.
 * Computes polyline points and circle positions from data array.
 *
 * @param {object} opts — { chartType, theme, accentColor, data, headline, kicker, source }
 * @returns {string} HTML string (kicker + headline + svg chart + source)
 */
function dataChartSetup(opts = {}) {
  const { chartType = 'line', accentColor = 'red-nyt', data = [],
          headline = '', kicker = '', source = '' } = opts;

  const colors = {
    'red-nyt':        { accent: '#a91d1d', bg: '#f7f5ee', text: '#0e0e0e', ink: '#1a1a1a' },
    'mint-editorial': { accent: '#5fb38a', bg: '#f7f5ee', text: '#0e0e0e', ink: '#1a1a1a' },
    'warm-orange':    { accent: '#d97757', bg: '#f7f5ee', text: '#0e0e0e', ink: '#1a1a1a' },
  };
  const c = colors[accentColor] || colors['red-nyt'];

  let html = `<div class="data-chart-stage" style="background:${c.bg};color:${c.text};font-family:Source Serif Pro,serif;position:relative;overflow:hidden;">`;

  // Kicker
  html += `<div class="chart-kicker" style="font-size:11px;letter-spacing:0.14em;color:${c.accent};text-transform:uppercase;opacity:0;">${kicker.toUpperCase()}</div>`;

  // Headline
  html += `<h2 class="chart-headline" style="font-size:5.6vw;font-weight:400;line-height:1.1;margin:12px 0 24px;opacity:0;">${headline}</h2>`;

  // SVG chart
  if (chartType === 'line' && data.length > 0) {
    const maxY = Math.max.apply(null, data.map(function(d) { return d.values[0]; }));
    const points = data.map(function(d, i) {
      const x = 60 + (i / (data.length - 1)) * 680;
      const y = 300 - (d.values[0] / maxY) * 260;
      return x + ',' + y;
    });

    const length = 1000; // approximate; GSAP will animate regardless

    html += `<svg class="chart-svg" viewBox="0 0 800 350" style="width:100%;opacity:0;">`;
    html += `<polyline class="chart-line" points="${points.join(' ')}" fill="none" stroke="${c.ink}" stroke-width="2.5" stroke-linejoin="round" style="stroke-dasharray:${length};stroke-dashoffset:${length}"></polyline>`;

    data.forEach(function(d, i) {
      const x = 60 + (i / (data.length - 1)) * 680;
      const y = 300 - (d.values[0] / maxY) * 260;
      html += `<circle class="chart-point" data-idx="${i}" cx="${x}" cy="${y}" r="4" fill="${c.accent}" style="opacity:0;"></circle>`;
    });

    html += `</svg>`;
  }

  // Source
  html += `<div class="chart-source" style="font-size:10px;font-family:IBM Plex Mono,monospace;opacity:0;margin-top:8px;">${source}</div>`;
  html += `</div>`;

  return html;
}

/**
 * Animate pre-existing editorial data chart elements.
 *
 * @param {gsap.core.Timeline} tl — GSAP timeline (passed in, not created)
 * @param {HTMLElement|string} container — element containing .data-chart-stage
 * @param {object} opts
 * @returns {gsap.core.Timeline}
 */
function buildDataChart(tl, container, opts = {}) {
  container = typeof container === 'string' ? document.querySelector(container) : container;

  const { revealStagger = 0.12 } = opts;

  const stage = container.querySelector('.data-chart-stage') || container;
  const kickerEl = stage.querySelector('.chart-kicker');
  const headlineEl = stage.querySelector('.chart-headline');
  const svg = stage.querySelector('.chart-svg');
  const polyline = stage.querySelector('.chart-line');
  const circles = Array.from(stage.querySelectorAll('.chart-point'));
  const sourceEl = stage.querySelector('.chart-source');

  if (!kickerEl && !headlineEl && !svg) {
    console.warn(
      'buildDataChart: Chart elements not found. ' +
      'Call dataChartSetup() to generate HTML first.'
    );
    return tl;
  }

  // Kicker
  if (kickerEl) {
    tl.to(kickerEl, { opacity: 1, duration: 0.3 }, '>');
  }

  // Headline
  if (headlineEl) {
    tl.to(headlineEl, { opacity: 1, y: 0, duration: 0.5 }, '>+' + revealStagger);
  }

  // SVG chart
  if (svg) {
    tl.to(svg, { opacity: 1, duration: 0.2 }, '>+' + revealStagger);
  }
  if (polyline) {
    tl.to(polyline, { strokeDashoffset: 0, duration: 1.2, ease: 'power2.out' }, '>');
  }

  // Data points
  circles.forEach(function(circle) {
    tl.to(circle, { opacity: 1, duration: 0.15 }, '>+' + (revealStagger * 0.8));
  });

  // Source
  if (sourceEl) {
    tl.to(sourceEl, { opacity: 0.6, duration: 0.2 }, '>-0.1');
  }

  return tl;
}
