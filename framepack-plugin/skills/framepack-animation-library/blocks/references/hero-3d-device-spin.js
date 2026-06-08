/**
 * Hero 3D Device Spin — lightweight CSS 3D mode
 *
 * Creates a device frame (MacBook/iPhone) with screenshot projection
 * and animates it via GSAP-driven CSS 3D transforms.
 * No GLTF/Three.js dependency.
 */
function buildDeviceSpin(container, params = {}) {
  const {
    device = 'macbook',
    screenshot = '',
    cameraPath = 'orbit-left',
    duration = 10,
    showGlow = true
  } = params;

  const tl = gsap.timeline({ paused: true });

  // ── Create device shell ────────────────────────
  const deviceConfig = {
    macbook:  { w: 600, h: 380, br: '12px 12px 2px 2px', pad: 12, base: true },
    iphone:   { w: 240, h: 480, br: '24px', pad: 8, base: false },
    ipad:     { w: 420, h: 560, br: '16px', pad: 10, base: false },
  };
  const cfg = deviceConfig[device] || deviceConfig.macbook;

  const shell = document.createElement('div');
  shell.className = `device-3d device-${device}`;
  shell.style.cssText = `
    width:${cfg.w}px; height:${cfg.h}px;
    background: linear-gradient(135deg, #2a2a2a, #1a1a1a);
    border-radius: ${cfg.br};
    padding: ${cfg.pad}px;
    position: absolute;
    left: 50%; top: 50%;
    transform: translate(-50%, -50%);
    transform-style: preserve-3d;
    perspective: 1200px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
  `;

  // Base/stand for MacBook
  if (cfg.base) {
    const base = document.createElement('div');
    base.style.cssText = `
      position:absolute; bottom:-10px; left:50%;
      transform:translateX(-50%);
      width:180px; height:8px;
      background:#1a1a1a;
      border-radius:0 0 6px 6px;
    `;
    shell.appendChild(base);
  }

  // Screen
  const screen = document.createElement('div');
  screen.className = 'device-screen';
  screen.style.cssText = `
    width:100%; height:100%;
    border-radius:4px;
    overflow:hidden;
    background:#000;
    position:relative;
  `;

  if (screenshot) {
    const img = document.createElement('img');
    img.src = screenshot;
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;';
    screen.appendChild(img);
  }

  // Glow
  if (showGlow) {
    screen.style.boxShadow = 'inset 0 0 0px rgba(100,150,255,0)';
  }

  shell.appendChild(screen);
  container.appendChild(shell);

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
  if (showGlow) {
    tl.to(screen, {
      boxShadow: 'inset 0 0 50px rgba(100,150,255,0.25)',
      duration: 0.6
    }, '>-0.3');
  }

  return { tl, shell, screen };
}
