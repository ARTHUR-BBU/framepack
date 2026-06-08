/**
 * Card Cascade Reveal — 多卡片旋转翻出
 *
 * Dependencies: GSAP 3.x, elasticScaleEnter(), cardShadowLift(), bgBlurMask()
 * HyperFrames-safe: no Math.random(), no repeat:-1, no ScrollTrigger
 *
 * @param {HTMLElement} container - 场景容器
 * @param {object} params - 参数（见 SKILL.md#参数）
 * @returns {gsap.core.Timeline}
 */
function buildCardCascade(container, params = {}) {
  const {
    cardCount = 4,
    layout = 'fan',
    cardWidth = '280px',
    gap = '24px',
    stagger = 0.12,
    rotationIntensity = 'medium',
    depth3d = true,
    colorTheme = 'inherit',
    entranceDirection = 'center-spread'
  } = params;

  const tl = gsap.timeline({ paused: true });

  // ── 1. 背景模糊遮罩 ─────────────────────────────
  bgBlurMask(tl, container, { duration: 0.4 });

  // ── 2. 创建卡片 DOM ──────────────────────────────
  const cards = createCards(container, {
    count: cardCount,
    width: cardWidth,
    gap,
    layout,
    colorTheme,
    depth3d
  });

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
 * 创建卡片 DOM 元素
 */
function createCards(container, opts) {
  const { count, width, gap, layout, colorTheme } = opts;
  const wrapper = document.createElement('div');
  wrapper.className = 'card-cascade-wrapper';
  wrapper.style.cssText = `
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    gap: ${gap};
    perspective: 1200px;
    width: 100%;
    height: 100%;
    position: absolute;
    inset: 0;
    z-index: 2;
  `;

  const cards = [];
  for (let i = 0; i < count; i++) {
    const card = document.createElement('div');
    card.className = `card-cascade-item card-${i + 1}`;
    card.style.cssText = `
      width: ${width};
      aspect-ratio: 16 / 10;
      border-radius: 16px;
      transform-style: preserve-3d;
      will-change: transform, opacity;
    `;
    // 颜色主题
    if (colorTheme === 'gradient-cool') {
      card.style.background = `linear-gradient(135deg, hsl(${210 + i * 15}, 60%, 50%), hsl(${230 + i * 15}, 50%, 40%))`;
    } else if (colorTheme === 'glass') {
      card.style.background = 'rgba(255,255,255,0.08)';
      card.style.backdropFilter = 'blur(20px)';
      card.style.border = '1px solid rgba(255,255,255,0.15)';
    }
    wrapper.appendChild(card);
    cards.push(card);
  }

  container.appendChild(wrapper);
  return cards;
}

// Register for HyperFrames if in render context
if (typeof window !== 'undefined' && window.__timelines) {
  // Timeline is registered by the caller with the returned tl
}
