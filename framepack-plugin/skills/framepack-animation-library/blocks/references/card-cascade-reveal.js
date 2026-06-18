/**
 * Card Cascade Reveal — 多卡片旋转翻出 (Element-Inject Pattern)
 *
 * Dependencies: GSAP 3.x, elasticScaleEnter(), cardShadowLift(), bgBlurMask()
 * HyperFrames-safe: no Math.random(), no repeat:-1, no ScrollTrigger
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │  USAGE (two-step: setup generates HTML, then animate operates on it) │
 * │                                                                      │
 * │  Step 1 — Call setup to generate HTML, write into index.html:        │
 * │    const html = cardCascadeSetup({ cardCount: 4, layout: 'fan', ... })│
 * │    // paste html string inside the scene container                    │
 * │                                                                      │
 * │  Step 2 — Animate the pre-written cards:                             │
 * │    buildCardCascade(tl, container, { stagger: 0.12, ... })           │
 * │                                                                      │
 * │  Generated HTML structure (Agent writes setup output verbatim):      │
 * │    <div class="card-cascade-wrapper" style="display:flex;...">        │
 * │      <div class="card-cascade-item card-1" style="..."></div>         │
 * │      <div class="card-cascade-item card-2" style="..."></div>         │
 * │      ...                                                             │
 * │      <div class="bg-blur-mask" style="position:absolute;..."></div>   │
 * │    </div>                                                            │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * @param {gsap.core.Timeline} tl — GSAP timeline (passed in, not created)
 * @param {HTMLElement|string} container — scene container with .card-cascade-wrapper
 * @param {object} opts
 * @returns {gsap.core.Timeline}
 *
 * Architecture contract: NO createElement / innerHTML. Operates on pre-existing elements only.
 * See design doc: 2026-06-18--v0130-weapon-architecture-refactor.md
 */
function buildCardCascade(tl, container, opts = {}) {
  container = typeof container === 'string' ? document.querySelector(container) : container;

  const {
    stagger = 0.12,
    rotationIntensity = 'medium',
    entranceDirection = 'center-spread'
  } = opts;

  // ── 1. 背景模糊遮罩 (operates on pre-existing .bg-blur-mask) ──
  bgBlurMask(tl, container, { duration: 0.4 });

  // ── 2. Query pre-existing cards ──────────────────────────
  const cards = Array.from(container.querySelectorAll('.card-cascade-item'));

  if (cards.length === 0) {
    console.warn(
      'buildCardCascade: No .card-cascade-item elements found. ' +
      'Call cardCascadeSetup() to generate HTML, write it into the container, ' +
      'then call buildCardCascade() to animate.'
    );
    return tl;
  }

  const cardCount = cards.length;
  const layout = container.querySelector('.card-cascade-wrapper')?.dataset.layout || 'fan';

  // ── 3. 卡片依次飞出 ──────────────────────────────
  const rot = { subtle: 3, medium: 8, dramatic: 15 }[rotationIntensity];

  cards.forEach((card, i) => {
    const angle = layout === 'fan'
      ? (i - (cardCount - 1) / 2) * rot
      : 0;

    const fromX = entranceDirection === 'left-to-right' ? -120 : 0;
    const fromY = entranceDirection === 'bottom-up' ? 80 : 60;

    // 主飞行动画（弹性入场）
    tl.fromTo(card,
      {
        opacity: 0,
        scale: 0.6,
        rotation: angle * 1.5,
        x: fromX,
        y: fromY
      },
      {
        opacity: 1,
        scale: 1,
        rotation: angle,
        x: 0,
        y: 0,
        duration: 0.55,
        ease: 'back.out(1.4)'
      },
      i * stagger
    );

    // 阴影抬起（在卡片到位后 0.3s 开始加深阴影）
    cardShadowLift(tl, card, {
      delay: i * stagger + 0.3,
      duration: 0.5,
      shadowDepth: 3
    });
  });

  return tl;
}

/**
 * Setup helper — generates static HTML string for card cascade layout.
 * Agent calls this, writes the output into index.html, then calls buildCardCascade().
 *
 * This is a STRING GENERATOR only — it does NOT touch the DOM.
 * The returned HTML is static and visible to the HyperFrames compiler.
 *
 * @param {object} opts
 * @returns {string} HTML string to paste into the scene container
 */
function cardCascadeSetup(opts = {}) {
  const {
    cardCount = 4,
    layout = 'fan',
    cardWidth = '280px',
    gap = '24px',
    colorTheme = 'inherit',
    depth3d = true
  } = opts;

  let cardsHtml = '';
  for (let i = 0; i < cardCount; i++) {
    let bgStyle = '';
    if (colorTheme === 'gradient-cool') {
      bgStyle = `background:linear-gradient(135deg, hsl(${210 + i * 15}, 60%, 50%), hsl(${230 + i * 15}, 50%, 40%));`;
    } else if (colorTheme === 'glass') {
      bgStyle = 'background:rgba(255,255,255,0.08);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.15);';
    }
    cardsHtml += `      <div class="card-cascade-item card-${i + 1}" style="width:${cardWidth};aspect-ratio:16/10;border-radius:16px;${depth3d ? 'transform-style:preserve-3d;' : ''}will-change:transform,opacity;${bgStyle}"></div>\n`;
  }

  return `<div class="card-cascade-wrapper" data-layout="${layout}" style="display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:${gap};perspective:1200px;width:100%;height:100%;position:absolute;inset:0;z-index:2;">
${cardsHtml}      <div class="bg-blur-mask" style="position:absolute;inset:0;pointer-events:none;z-index:1"></div>
    </div>`;
}
