// macos-notification | macOS Notification Card (Element-Inject Pattern)
// GSAP 3.x — macOS-style notification banner with slide-in/auto-dismiss
//
// ┌──────────────────────────────────────────────────────────────────────┐
// │  STATIC HTML PREREQUISITE (Agent must pre-write in HTML):            │
// │                                                                      │
// │  <div class="macos-notification" style="position:absolute;            │
// │       top:24px;right:24px;background:rgba(30,30,32,0.92);             │
// │       backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);  │
// │       border-radius:14px;padding:16px 20px;min-width:320px;           │
// │       max-width:380px;color:#f5f5f7;                                  │
// │       font-family:-apple-system,Inter,sans-serif;                     │
// │       box-shadow:0 8px 32px rgba(0,0,0,0.4),                          │
// │         0 0 0 0.5px rgba(255,255,255,0.1);z-index:50;opacity:0">      │
// │    <div style="display:flex;align-items:flex-start;gap:12px">         │
// │      <div style="font-size:28px;flex-shrink:0;width:40px;height:40px; │
// │           display:flex;align-items:center;justify-content:center;      │
// │           background:rgba(255,255,255,0.08);border-radius:10px">🔔    │
// │      </div>                                                          │
// │      <div style="flex:1;min-width:0">                                │
// │        <div style="display:flex;align-items:center;                    │
// │             justify-content:space-between;margin-bottom:4px">          │
// │          <span style="font-size:13px;font-weight:600;                  │
// │                letter-spacing:-0.01em">Product</span>                 │
// │          <span style="font-size:11px;opacity:0.5">now</span>          │
// │        </div>                                                        │
// │        <div style="font-size:14px;font-weight:500;line-height:1.3;     │
// │             margin-bottom:2px">New Signup</div>                       │
// │        <div style="font-size:12px;opacity:0.7;line-height:1.4">       │
// │          Someone just joined                                          │
// │        </div>                                                        │
// │      </div>                                                          │
// │    </div>                                                            │
// │  </div>                                                              │
// │                                                                      │
// │  Replace 🔔/Product/now/New Signup/Someone just joined               │
// │  with your actual content.                                           │
// └──────────────────────────────────────────────────────────────────────┘
//
// @param {gsap.core.Timeline} tl
// @param {HTMLElement|string} container — parent containing .macos-notification
// @param {object} opts
// @param {string|number} position
// @returns {gsap.core.Timeline}
//
// Architecture contract: NO createElement / innerHTML. Operates on pre-existing elements only.
// See design doc: 2026-06-18--v0130-weapon-architecture-refactor.md

function showMacOSNotification(tl, container, opts = {}, position = '>') {
  container = typeof container === 'string' ? document.querySelector(container) : container;

  const { slideDirection = 'from-right',
          autoDismiss = true,
          displayDuration = 3 } = opts;

  // Query pre-existing card element
  const card = container.querySelector('.macos-notification');
  if (!card) {
    console.warn(
      'showMacOSNotification: .macos-notification element not found. ' +
      'Pre-write the notification card HTML (see header comment for template).'
    );
    return tl;
  }

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
