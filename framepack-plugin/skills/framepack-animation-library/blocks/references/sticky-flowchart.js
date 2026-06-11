// sticky-flowchart | Sticky Flowchart
// GSAP 3.x + SVG — sticky-note style flowchart with Bezier connections
function buildStickyFlowchart(container, opts = {}) {
  const { nodes = [], edges = [], boardStyle = 'warm-paper',
          nodeStagger = 0.3, lineDuration = 0.5, showCursor = false } = opts;

  const boardColors = {
    'warm-paper':       { bg: '#f4ede1', grid: 'rgba(0,0,0,0.04)' },
    'cool-whiteboard':  { bg: '#f0f2f4', grid: 'rgba(0,0,0,0.04)' },
  };
  const bg = boardColors[boardStyle] || boardColors['warm-paper'];
  const stickyColors = ['#fcd34d', '#fca5a5', '#a7f3d0', '#a5b4fc'];

  const W = 1920, H = 1080;
  const tl = gsap.timeline({ paused: true });

  container.style.cssText = 'background:' + bg.bg + ';position:relative;overflow:hidden;background-image:linear-gradient(' + bg.grid + ' 1px,transparent 1px),linear-gradient(90deg,' + bg.grid + ' 1px,transparent 1px);background-size:40px 40px;';

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
  svg.style.cssText = 'position:absolute;inset:0;z-index:1;pointer-events:none;';

  const drawnLines = [];
  edges.forEach(function(edge) {
    const from = nodes[edge.from];
    const to = nodes[edge.to];
    if (!from || !to) return;
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const x1 = from.x + 120, y1 = from.y + 90;
    const x2 = to.x + 120, y2 = to.y + 90;
    const cx = (x1 + x2) / 2;
    const d = 'M ' + x1 + ' ' + y1 + ' C ' + cx + ' ' + y1 + ', ' + cx + ' ' + y2 + ', ' + x2 + ' ' + y2;
    path.setAttribute('d', d);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', '#2a2a2a');
    path.setAttribute('stroke-width', '2.5');
    path.setAttribute('stroke-linecap', 'round');
    const len = 500;
    path.setAttribute('stroke-dashoffset', len);
    path.setAttribute('stroke-dasharray', len);
    svg.appendChild(path);
    drawnLines.push({ path: path, len: len, fromIndex: edge.from, toIndex: edge.to });
  });
  container.appendChild(svg);

  drawnLines.forEach(function(line) {
    tl.to(line.path, { 'stroke-dashoffset': 0, duration: lineDuration, ease: 'power2.inOut' },
      '>+' + (nodeStagger * (line.fromIndex + 1) - 0.1));
  });

  nodes.forEach(function(node, i) {
    const note = document.createElement('div');
    const color = node.color || stickyColors[i % stickyColors.length];
    const rotation = ((i % 5) - 2) * 1.5;
    note.style.cssText = 'position:absolute;left:' + node.x + 'px;top:' + node.y + 'px;width:240px;height:180px;background:' + color + ';border-radius:2px;transform:rotate(' + rotation + 'deg) scale(0);transform-origin:center center;box-shadow:0 6px 14px rgba(0,0,0,0.12);z-index:2;font-family:Caveat,Patrick Hand,LXGW WenKai Screen,cursive;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;';

    const tape = document.createElement('div');
    tape.style.cssText = 'position:absolute;top:-8px;left:50%;transform:translateX(-50%);width:60px;height:16px;background:linear-gradient(180deg,rgba(255,255,255,0.7),rgba(255,255,255,0.3));border-radius:1px;';
    note.appendChild(tape);

    note.innerHTML += '<div style="font-size:36px;margin-bottom:4px">' + (node.emoji || '') + '</div>' +
      '<div style="font-size:18px;font-weight:700;text-align:center;line-height:1.3">' + node.title + '</div>' +
      (node.desc ? '<div style="font-size:13px;opacity:0.6;margin-top:4px;text-align:center">' + node.desc + '</div>' : '');

    container.appendChild(note);
    tl.to(note, { scale: 1, duration: 0.4, ease: 'back.out(1.7)' }, '>+' + nodeStagger);
  });

  return tl;
}
