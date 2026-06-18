// sticky-flowchart | Sticky Flowchart (Element-Inject Pattern)
// GSAP 3.x + SVG — sticky-note style flowchart with Bezier connections
//
// ┌──────────────────────────────────────────────────────────────────────┐
// │  USAGE (two-step: setup generates HTML, then animate operates on it) │
// │                                                                      │
// │  Step 1 — Call setup to generate HTML, write into index.html:        │
// │    const html = stickyFlowchartSetup({ nodes: [...], edges: [...] }) │
// │    // paste html string inside the scene container                    │
// │                                                                      │
// │  Step 2 — Animate the pre-written flowchart:                         │
// │    buildStickyFlowchart(tl, container, { nodeStagger: 0.3, ... })    │
// └──────────────────────────────────────────────────────────────────────┘
//
// Architecture contract: NO createElement / createElementNS / innerHTML.
// See design doc: 2026-06-18--v0130-weapon-architecture-refactor.md

/**
 * Setup helper — generates static HTML string for sticky flowchart.
 * Computes Bezier paths and sticky-note positions from nodes/edges data.
 *
 * @param {object} opts — { nodes, edges, boardStyle }
 * @returns {string} HTML string (svg paths + sticky-note divs)
 */
function stickyFlowchartSetup(opts = {}) {
  const { nodes = [], edges = [], boardStyle = 'warm-paper' } = opts;

  const boardColors = {
    'warm-paper':       { bg: '#f4ede1', grid: 'rgba(0,0,0,0.04)' },
    'cool-whiteboard':  { bg: '#f0f2f4', grid: 'rgba(0,0,0,0.04)' },
  };
  const bg = boardColors[boardStyle] || boardColors['warm-paper'];
  const stickyColors = ['#fcd34d', '#fca5a5', '#a7f3d0', '#a5b4fc'];

  const W = 1920, H = 1080;

  // SVG paths
  let pathsHtml = '';
  edges.forEach(function(edge) {
    const from = nodes[edge.from];
    const to = nodes[edge.to];
    if (!from || !to) return;
    const x1 = from.x + 120, y1 = from.y + 90;
    const x2 = to.x + 120, y2 = to.y + 90;
    const cx = (x1 + x2) / 2;
    const d = 'M ' + x1 + ' ' + y1 + ' C ' + cx + ' ' + y1 + ', ' + cx + ' ' + y2 + ', ' + x2 + ' ' + y2;
    const len = 500;
    pathsHtml += `<path class="flow-line" data-from="${edge.from}" data-to="${edge.to}" d="${d}" fill="none" stroke="#2a2a2a" stroke-width="2.5" stroke-linecap="round" style="stroke-dashoffset:${len};stroke-dasharray:${len}"></path>`;
  });

  // Sticky notes
  let notesHtml = '';
  nodes.forEach(function(node, i) {
    const color = node.color || stickyColors[i % stickyColors.length];
    const rotation = ((i % 5) - 2) * 1.5;
    notesHtml += `<div class="sticky-note" data-idx="${i}" style="position:absolute;left:${node.x}px;top:${node.y}px;width:240px;height:180px;background:${color};border-radius:2px;transform:rotate(${rotation}deg) scale(0);transform-origin:center center;box-shadow:0 6px 14px rgba(0,0,0,0.12);z-index:2;font-family:Caveat,Patrick Hand,LXGW WenKai Screen,cursive;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;">`;
    notesHtml += `<div style="position:absolute;top:-8px;left:50%;transform:translateX(-50%);width:60px;height:16px;background:linear-gradient(180deg,rgba(255,255,255,0.7),rgba(255,255,255,0.3));border-radius:1px;"></div>`;
    notesHtml += `<div style="font-size:36px;margin-bottom:4px">${node.emoji || ''}</div>`;
    notesHtml += `<div style="font-size:18px;font-weight:700;text-align:center;line-height:1.3">${node.title}</div>`;
    if (node.desc) {
      notesHtml += `<div style="font-size:13px;opacity:0.6;margin-top:4px;text-align:center">${node.desc}</div>`;
    }
    notesHtml += `</div>`;
  });

  const bgStyle = `background:${bg.bg};position:relative;overflow:hidden;background-image:linear-gradient(${bg.grid} 1px,transparent 1px),linear-gradient(90deg,${bg.grid} 1px,transparent 1px);background-size:40px 40px;`;

  return `<div class="flowchart-stage" style="${bgStyle}"><svg class="flowchart-svg" viewBox="0 0 ${W} ${H}" style="position:absolute;inset:0;z-index:1;pointer-events:none;">${pathsHtml}</svg>${notesHtml}</div>`;
}

/**
 * Animate pre-existing sticky flowchart elements.
 *
 * @param {gsap.core.Timeline} tl — GSAP timeline (passed in, not created)
 * @param {HTMLElement|string} container — element containing .flowchart-stage
 * @param {object} opts
 * @returns {gsap.core.Timeline}
 */
function buildStickyFlowchart(tl, container, opts = {}) {
  container = typeof container === 'string' ? document.querySelector(container) : container;

  const { nodeStagger = 0.3, lineDuration = 0.5 } = opts;

  const stage = container.querySelector('.flowchart-stage') || container;
  const lines = Array.from(stage.querySelectorAll('.flow-line'));
  const notes = Array.from(stage.querySelectorAll('.sticky-note'));

  if (lines.length === 0 && notes.length === 0) {
    console.warn(
      'buildStickyFlowchart: No .flow-line or .sticky-note elements found. ' +
      'Call stickyFlowchartSetup() to generate HTML first.'
    );
    return tl;
  }

  // Animate connection lines
  lines.forEach(function(line) {
    const fromIndex = parseInt(line.dataset.from || '0');
    tl.to(line, { strokeDashoffset: 0, duration: lineDuration, ease: 'power2.inOut' },
      '>+' + (nodeStagger * (fromIndex + 1) - 0.1));
  });

  // Animate sticky notes
  notes.forEach(function(note, i) {
    tl.to(note, { scale: 1, duration: 0.4, ease: 'back.out(1.7)' }, '>+' + nodeStagger);
  });

  return tl;
}
