// data-chart-editorial | Editorial Data Chart
// GSAP 3.x + SVG — NYT-style data visualization, no chart.js/d3 dependency
function buildDataChart(container, opts = {}) {
  const { chartType = 'line', theme = 'light-nyt',
          accentColor = 'red-nyt', data = [],
          headline = '', kicker = '', source = '',
          revealStagger = 0.12 } = opts;

  const colors = {
    'red-nyt':        { accent: '#a91d1d', bg: '#f7f5ee', text: '#0e0e0e', ink: '#1a1a1a' },
    'mint-editorial': { accent: '#5fb38a', bg: '#f7f5ee', text: '#0e0e0e', ink: '#1a1a1a' },
    'warm-orange':    { accent: '#d97757', bg: '#f7f5ee', text: '#0e0e0e', ink: '#1a1a1a' },
  };
  const c = colors[accentColor] || colors['red-nyt'];

  const tl = gsap.timeline({ paused: true });
  container.style.cssText = 'background:' + c.bg + ';color:' + c.text + ';font-family:Source Serif Pro,serif;position:relative;overflow:hidden;';

  const kickerEl = document.createElement('div');
  kickerEl.textContent = kicker.toUpperCase();
  kickerEl.style.cssText = 'font-size:11px;letter-spacing:0.14em;color:' + c.accent + ';text-transform:uppercase;opacity:0;';
  container.appendChild(kickerEl);
  tl.to(kickerEl, { opacity: 1, duration: 0.3 }, '>');

  const headlineEl = document.createElement('h2');
  headlineEl.textContent = headline;
  headlineEl.style.cssText = 'font-size:5.6vw;font-weight:400;line-height:1.1;margin:12px 0 24px;opacity:0;';
  container.appendChild(headlineEl);
  tl.to(headlineEl, { opacity: 1, y: 0, duration: 0.5 }, '>+' + revealStagger);

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 800 350');
  svg.style.cssText = 'width:100%;opacity:0;';

  if (chartType === 'line' && data.length > 0) {
    const maxY = Math.max.apply(null, data.map(function(d) { return d.values[0]; }));
    const points = data.map(function(d, i) {
      const x = 60 + (i / (data.length - 1)) * 680;
      const y = 300 - (d.values[0] / maxY) * 260;
      return x + ',' + y;
    });

    const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    polyline.setAttribute('points', points.join(' '));
    polyline.setAttribute('fill', 'none');
    polyline.setAttribute('stroke', c.ink);
    polyline.setAttribute('stroke-width', '2.5');
    polyline.setAttribute('stroke-linejoin', 'round');

    const length = polyline.getTotalLength ? polyline.getTotalLength() : 1000;
    polyline.setAttribute('stroke-dasharray', length);
    polyline.setAttribute('stroke-dashoffset', length);
    svg.appendChild(polyline);

    tl.to(svg, { opacity: 1, duration: 0.2 }, '>+' + revealStagger);
    tl.to(polyline, { 'stroke-dashoffset': 0, duration: 1.2, ease: 'power2.out' }, '>');

    data.forEach(function(d, i) {
      const x = 60 + (i / (data.length - 1)) * 680;
      const y = 300 - (d.values[0] / maxY) * 260;
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', x);
      circle.setAttribute('cy', y);
      circle.setAttribute('r', '4');
      circle.setAttribute('fill', c.accent);
      circle.style.opacity = '0';
      svg.appendChild(circle);
      tl.to(circle, { opacity: 1, duration: 0.15 }, '>+' + (revealStagger * 0.8));
    });
  }

  container.appendChild(svg);

  const sourceEl = document.createElement('div');
  sourceEl.textContent = source;
  sourceEl.style.cssText = 'font-size:10px;font-family:IBM Plex Mono,monospace;opacity:0.6;margin-top:8px;';
  container.appendChild(sourceEl);
  tl.to(sourceEl, { opacity: 0.6, duration: 0.2 }, '>-0.1');

  return tl;
}
