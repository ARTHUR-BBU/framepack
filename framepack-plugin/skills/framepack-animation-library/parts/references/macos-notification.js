// macos-notification | macOS Notification Card
// GSAP 3.x — macOS-style notification banner with slide-in/auto-dismiss
function showMacOSNotification(tl, container, opts = {}, position = '>') {
  const { title = 'New Signup', body = 'Someone just joined',
          appIcon = '\uD83D\uDD14', appName = 'Product', timestamp = 'now',
          slideDirection = 'from-right', autoDismiss = true,
          displayDuration = 3 } = opts;

  const card = document.createElement('div');
  card.style.cssText = [
    'position:absolute;top:24px;right:24px',
    'background:rgba(30,30,32,0.92)',
    'backdrop-filter:blur(20px)',
    '-webkit-backdrop-filter:blur(20px)',
    'border-radius:14px;padding:16px 20px',
    'min-width:320px;max-width:380px',
    'color:#f5f5f7;font-family:-apple-system,Inter,sans-serif',
    'box-shadow:0 8px 32px rgba(0,0,0,0.4),0 0 0 0.5px rgba(255,255,255,0.1)',
    'z-index:50;opacity:0'
  ].join(';');

  card.innerHTML = '<div style="display:flex;align-items:flex-start;gap:12px">' +
    '<div style="font-size:28px;flex-shrink:0;width:40px;height:40px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.08);border-radius:10px">' + appIcon + '</div>' +
    '<div style="flex:1;min-width:0">' +
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px"><span style="font-size:13px;font-weight:600;letter-spacing:-0.01em">' + appName + '</span><span style="font-size:11px;opacity:0.5">' + timestamp + '</span></div>' +
    '<div style="font-size:14px;font-weight:500;line-height:1.3;margin-bottom:2px">' + title + '</div>' +
    '<div style="font-size:12px;opacity:0.7;line-height:1.4">' + body + '</div></div></div>';

  container.appendChild(card);

  const dirMap = {
    'from-right':  { fromX: 400, fromY: 0 },
    'from-left':   { fromX: -400, fromY: 0 },
    'from-bottom': { fromX: 0, fromY: 400 },
  };
  const dir = dirMap[slideDirection] || dirMap['from-right'];

  tl.fromTo(card,
    { x: dir.fromX, y: dir.fromY, opacity: 0, scale: 0.9 },
    { x: 0, y: 0, opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(1.4)' },
    position
  );

  if (autoDismiss && displayDuration > 0) {
    tl.to(card, { opacity: 0, scale: 0.95, x: dir.fromX * 0.5, duration: 0.3, ease: 'power2.in' },
      '>+' + displayDuration);
  }

  return tl;
}
