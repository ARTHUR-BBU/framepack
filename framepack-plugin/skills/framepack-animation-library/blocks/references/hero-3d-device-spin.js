/**
 * Hero 3D Device Spin — lightweight CSS 3D mode (Element-Inject Pattern)
 *
 * Creates a device frame (MacBook/iPhone/iPad) with screenshot projection
 * and animates it via GSAP-driven CSS 3D transforms.
 * No GLTF/Three.js dependency.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │  USAGE (two-step: setup generates HTML, then animate operates on it) │
 * │                                                                      │
 * │  Step 1 — Call setup to generate HTML, write into index.html:        │
 * │    const html = deviceSpinSetup({ device:'macbook', screenshot:'x.png' })│
 * │    // paste html string inside the scene container                    │
 * │                                                                      │
 * │  Step 2 — Animate the pre-written device shell:                      │
 * │    buildDeviceSpin(tl, container, { cameraPath:'orbit-left', ... })  │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * @param {gsap.core.Timeline} tl — GSAP timeline (passed in, not created)
 * @param {HTMLElement|string} container — scene container with .device-3d
 * @param {object} opts
 * @returns {{tl, shell, screen}}
 *
 * Architecture contract: NO createElement / innerHTML. Operates on pre-existing elements only.
 * See design doc: 2026-06-18--v0130-weapon-architecture-refactor.md
 */
function buildDeviceSpin(tl, container, opts = {}) {
  container = typeof container === 'string' ? document.querySelector(container) : container;

  const {
    cameraPath = 'orbit-left',
    duration = 10,
    showGlow = true
  } = opts;

  // Query pre-existing device shell
  const shell = container.querySelector('.device-3d');
  if (!shell) {
    console.warn(
      'buildDeviceSpin: .device-3d element not found. ' +
      'Call deviceSpinSetup() to generate HTML, write it into the container, ' +
      'then call buildDeviceSpin() to animate.'
    );
    return { tl, shell: null, screen: null };
  }

  const screen = shell.querySelector('.device-screen');

  // ── Camera paths ───────────────────────────────
  const paths = {
    'orbit-left':     { rotateY: [-18, 28],  x: [-80, 40], duration },
    'orbit-right':    { rotateY: [28, -18],  x: [40, -80], duration },
    'zoom-in':        { scale: [0.65, 1.1],  duration },
    'turntable-360':  { rotateY: [0, 360],   duration },
    'tilt-reveal':    { rotateX: [-35, 0], rotateY: [12, -8], duration },
  };

  const path = paths[cameraPath] || paths['orbit-left'];
  tl.fromTo(shell, path, { ease: 'power2.inOut' });

  // Screen glow
  if (showGlow && screen) {
    tl.to(screen, {
      boxShadow: 'inset 0 0 50px rgba(100,150,255,0.25)',
      duration: 0.6
    }, '>-0.3');
  }

  return { tl, shell, screen };
}

/**
 * Setup helper — generates static HTML string for device frame.
 * Agent calls this, writes the output into index.html, then calls buildDeviceSpin().
 *
 * This is a STRING GENERATOR only — it does NOT touch the DOM.
 *
 * @param {object} opts
 * @returns {string} HTML string to paste into the scene container
 */
function deviceSpinSetup(opts = {}) {
  const {
    device = 'macbook',
    screenshot = '',
    showGlow = true
  } = opts;

  const deviceConfig = {
    macbook:  { w: 600, h: 380, br: '12px 12px 2px 2px', pad: 12, base: true },
    iphone:   { w: 240, h: 480, br: '24px', pad: 8, base: false },
    ipad:     { w: 420, h: 560, br: '16px', pad: 10, base: false },
  };
  const cfg = deviceConfig[device] || deviceConfig.macbook;

  let html = `<div class="device-3d device-${device}" style="width:${cfg.w}px;height:${cfg.h}px;background:linear-gradient(135deg,#2a2a2a,#1a1a1a);border-radius:${cfg.br};padding:${cfg.pad}px;position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);transform-style:preserve-3d;perspective:1200px;box-shadow:0 20px 60px rgba(0,0,0,0.5);">`;

  if (cfg.base) {
    html += `<div style="position:absolute;bottom:-10px;left:50%;transform:translateX(-50%);width:180px;height:8px;background:#1a1a1a;border-radius:0 0 6px 6px;"></div>`;
  }

  const glowStyle = showGlow ? 'box-shadow:inset 0 0 0px rgba(100,150,255,0);' : '';
  html += `<div class="device-screen" style="width:100%;height:100%;border-radius:4px;overflow:hidden;background:#000;position:relative;${glowStyle}">`;

  if (screenshot) {
    html += `<img src="${screenshot}" style="width:100%;height:100%;object-fit:cover;">`;
  }

  html += `</div></div>`;

  return html;
}
