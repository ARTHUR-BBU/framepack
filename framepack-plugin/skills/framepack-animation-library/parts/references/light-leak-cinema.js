// light-leak-cinema | Cinematic Light Leak (Element-Inject Pattern)
// GSAP 3.x — 35mm grain + warm light leaks + letterbox
//
// ┌──────────────────────────────────────────────────────────────────────┐
// │  STATIC HTML PREREQUISITE (Agent must pre-write in HTML):            │
// │                                                                      │
// │  <div class="light-leak-stage" style="background:#1a0d08;             │
// │       overflow:hidden;position:relative">                            │
// │                                                                      │
// │    <!-- Letterbox bars (if letterbox enabled) -->                     │
// │    <div class="ll-bar-top" style="position:absolute;top:0;left:0;     │
// │         width:100%;height:140px;background:#000;z-index:10"></div>    │
// │    <div class="ll-bar-bottom" style="position:absolute;bottom:0;      │
// │         left:0;width:100%;height:140px;background:#000;z-index:10">   │
// │    </div>                                                            │
// │                                                                      │
// │    <!-- Film grain layer -->                                         │
// │    <div class="ll-grain" style="position:absolute;inset:0;z-index:5;  │
// │         pointer-events:none;opacity:0.14;mix-blend-mode:overlay;      │
// │         background-image:url('data:image/svg+xml,%3Csvg viewBox='0 0  │
// │         256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter       │
// │         id='n'%3E%3CfeTurbulence type='fractalNoise'                  │
// │         baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'       │
// │         /%3E%3C/filter%3E%3Crect width='100%25' height='100%25'       │
// │         filter='url(%23n)'/%3E%3C/svg%3E')"></div>                    │
// │                                                                      │
// │    <!-- Light leak layers (one .ll-leak per leak, default 3) -->      │
// │    <div class="ll-leak" data-leak="0" style="position:absolute;       │
// │         z-index:3;pointer-events:none;top:-10%;left:60%;width:50%;    │
// │         height:50%;background:radial-gradient(ellipse at center,       │
// │         #ffb547 0%, transparent 70%);opacity:0.35;                    │
// │         mix-blend-mode:screen"></div>                                 │
// │    <div class="ll-leak" data-leak="1" style="position:absolute;       │
// │         z-index:3;pointer-events:none;top:40%;left:80%;width:45%;     │
// │         height:45%;background:radial-gradient(ellipse at center,       │
// │         #d97757 0%, transparent 70%);opacity:0.35;                    │
// │         mix-blend-mode:screen"></div>                                 │
// │    <div class="ll-leak" data-leak="2" style="position:absolute;       │
// │         z-index:3;pointer-events:none;top:60%;left:10%;width:40%;     │
// │         height:40%;background:radial-gradient(ellipse at center,       │
// │         #fca5a5 0%, transparent 70%);opacity:0.35;                    │
// │         mix-blend-mode:screen"></div>                                 │
// │                                                                      │
// │    <!-- Your content goes here (between bars, above leaks, below grain)│
// │         Use z-index: 1 for content background, 8+ for foreground -->   │
// │  </div>                                                              │
// └──────────────────────────────────────────────────────────────────────┘
//
// @param {gsap.core.Timeline} tl
// @param {HTMLElement|string} container — the .light-leak-stage
// @param {object} opts
// @returns {gsap.core.Timeline}
//
// Architecture contract: NO createElement / innerHTML. Operates on pre-existing elements only.
// See design doc: 2026-06-18--v0130-weapon-architecture-refactor.md

function lightLeakCinema(tl, container, opts = {}) {
  container = typeof container === 'string' ? document.querySelector(container) : container;

  const { driftDuration = 12,
          introUnderexpose = true } = opts;

  // Query pre-existing layers (all optional — function degrades gracefully)
  const grain = container.querySelector('.ll-grain');
  const leaks = Array.from(container.querySelectorAll('.ll-leak'));

  if (leaks.length === 0 && !grain) {
    console.warn(
      'lightLeakCinema: No .ll-leak or .ll-grain elements found. ' +
      'Pre-write the cinema overlay layers (see header comment for template).'
    );
    return tl;
  }

  if (introUnderexpose) {
    tl.fromTo(container, { filter: 'brightness(0.3)' }, { filter: 'brightness(1)', duration: 0.8, ease: 'power2.out' }, '>');
  }

  var driftPaths = [
    { x: [0, 30, -20, 0], y: [0, -15, 10, 0] },
    { x: [0, -25, 15, 0], y: [0, 20, -10, 0] },
    { x: [0, 10, -30, 0], y: [0, -25, 15, 0] },
  ];

  leaks.forEach(function(leak, i) {
    var path = driftPaths[i % driftPaths.length];
    tl.to(leak, { x: path.x[1], y: path.y[1], duration: driftDuration / 3, ease: 'sine.inOut' }, '<');
    tl.to(leak, { x: path.x[2], y: path.y[2], duration: driftDuration / 3, ease: 'sine.inOut' });
    tl.to(leak, { x: path.x[3], y: path.y[3], duration: driftDuration / 3, ease: 'sine.inOut' });
  });

  return tl;
}
