---
name: sticky-flowchart
title: "便利贴流程图 · Sticky Flowchart"
type: block
category: scene
duration: "5-10s"
gsap_version: "3.x"
used_by: ["[[templates/data-shock-explain]]"]
source: "nexu-io/html-anything frame-flowchart-sticky — 改写为 GSAP 确定性版本"
---

# Sticky Flowchart

> **一句话**：白板 + 便利贴风格的流程图——节点交错弹出，贝塞尔曲线逐一绘制。教学/流程说明视频的王牌武器。

## 参数

```yaml
parameters:
  nodes:
    type: array
    description: "[{emoji, title, desc, x, y, color}] 每个节点一张便利贴"

  edges:
    type: array
    description: "[{from: nodeIndex, to: nodeIndex, dashed: bool}]"

  board_style:
    type: enum
    options: [warm-paper, cool-whiteboard]
    default: warm-paper

  node_stagger:
    type: float
    default: 0.3
    note: "节点之间的入场间隔"

  line_duration:
    type: float
    default: 0.5
    note: "连接线绘制的持续时间"

  show_cursor:
    type: bool
    default: false
    note: "是否在节点上显示协作光标"
```

## 代码

> ⚠️ 完整: `references/sticky-flowchart.js`

```js
function buildStickyFlowchart(container, opts = {}) {
  const { nodes = [], edges = [], boardStyle = 'warm-paper',
          nodeStagger = 0.3, lineDuration = 0.5, showCursor = false } = opts;

  const boardColors = {
    'warm-paper':       { bg: '#f4ede1', grid: 'rgba(0,0,0,0.04)' },
    'cool-whiteboard':  { bg: '#f0f2f4', grid: 'rgba(0,0,0,0.04)' },
  };
  const bg = boardColors[boardStyle];
  const stickyColors = ['#fcd34d', '#fca5a5', '#a7f3d0', '#a5b4fc'];

  const W = 1920, H = 1080;
  const tl = gsap.timeline({ paused: true });

  // ── Board Background ──
  container.style.cssText = `
    background:${bg.bg};position:relative;overflow:hidden;
    background-image:
      linear-gradient(${bg.grid} 1px,transparent 1px),
      linear-gradient(90deg,${bg.grid} 1px,transparent 1px);
    background-size:40px 40px;
  `;

  // ── SVG Layer (connection lines) ──
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.style.cssText = 'position:absolute;inset:0;z-index:1;pointer-events:none;';

  const drawnLines = [];

  edges.forEach((edge, ei) => {
    const from = nodes[edge.from];
    const to = nodes[edge.to];
    if (!from || !to) return;

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const x1 = from.x + 120, y1 = from.y + 90;
    const x2 = to.x + 120, y2 = to.y + 90;
    const cx = (x1 + x2) / 2;
    const d = `M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`;

    path.setAttribute('d', d);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', '#2a2a2a');
    path.setAttribute('stroke-width', '2.5');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-dasharray', edge.dashed ? '8 6' : '0');

    const len = 500; // approximate
    path.setAttribute('stroke-dashoffset', len);
    path.setAttribute('stroke-dasharray', `${len}`);
    svg.appendChild(path);

    drawnLines.push({ path, len, fromIndex: edge.from, toIndex: edge.to });
  });

  container.appendChild(svg);

  // ── Draw lines after the "from" node appears ──
  drawnLines.forEach(line => {
    const fromIdx = line.fromIndex;
    tl.to(line.path, {
      'stroke-dashoffset': 0,
      duration: lineDuration,
      ease: 'power2.inOut'
    }, `>+${nodeStagger * (fromIdx + 1) - 0.1}`);
  });

  // ── Sticky Notes ──
  const noteEls = [];
  nodes.forEach((node, i) => {
    const note = document.createElement('div');
    const color = node.color || stickyColors[i % stickyColors.length];
    const rotation = ((i % 5) - 2) * 1.5; // 确定性旋转: -3, -1.5, 0, 1.5, 3

    note.style.cssText = `
      position:absolute;left:${node.x}px;top:${node.y}px;
      width:240px;height:180px;background:${color};
      border-radius:2px;
      transform:rotate(${rotation}deg) scale(0);
      transform-origin:center center;
      box-shadow:0 6px 14px rgba(0,0,0,0.12);
      z-index:2;
      font-family:Caveat,Patrick Hand,LXGW WenKai Screen,cursive;
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      padding:16px;box-sizing:border-box;
    `;

    // Tape decoration
    const tape = document.createElement('div');
    tape.style.cssText = `
      position:absolute;top:-8px;left:50%;transform:translateX(-50%);
      width:60px;height:16px;
      background:linear-gradient(180deg,rgba(255,255,255,0.7),rgba(255,255,255,0.3));
      border-radius:1px;
    `;
    note.appendChild(tape);

    // Content
    note.innerHTML += `
      <div style="font-size:36px;margin-bottom:4px">${node.emoji || ''}</div>
      <div style="font-size:18px;font-weight:700;text-align:center;line-height:1.3">${node.title}</div>
      ${node.desc ? `<div style="font-size:13px;opacity:0.6;margin-top:4px;text-align:center">${node.desc}</div>` : ''}
    `;

    container.appendChild(note);
    noteEls.push(note);

    // Staggered pop-in
    tl.to(note, {
      scale: 1,
      duration: 0.4,
      ease: 'back.out(1.7)'
    }, `>+${nodeStagger}`);
  });

  return tl;
}
```

## 使用示例

```js
buildStickyFlowchart(container, {
  nodes: [
    { emoji:'📱', title:'User Signs Up',   desc:'Email + OAuth', x:80,  y:120 },
    { emoji:'📧', title:'Verify Email',     desc:'Magic link',    x:420, y:300 },
    { emoji:'⚙️', title:'Setup Profile',    desc:'Avatar + Bio',  x:760, y:120 },
    { emoji:'🎯', title:'First Task',       desc:'Onboarding',    x:1100,y:300 },
    { emoji:'🚀', title:'Go Live',          desc:'Production',    x:1440,y:500 },
  ],
  edges: [
    { from:0, to:1 }, { from:1, to:2 }, { from:2, to:3 }, { from:3, to:4 }
  ]
});
```

## HyperFrames 注意

- ✅ 节点坐标、旋转角度、颜色全部预设——等价于声明式布局
- ✅ `stroke-dashoffset` 动画确定性
- ⚠️ `back.out(1.7)` 弹性缓动在渲染时完全可重复
- ⚠️ 手写字体（Caveat/霞鹜文楷）需 CDN 引入或内嵌
