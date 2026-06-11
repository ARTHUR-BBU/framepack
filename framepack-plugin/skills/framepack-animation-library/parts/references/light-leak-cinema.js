// light-leak-cinema | Cinematic Light Leak
// GSAP 3.x — 35mm grain + warm light leaks + letterbox
function lightLeakCinema(tl, container, opts = {}) {
  const { baseColor = '#1a0d08', leakColors = ['#ffb547', '#d97757', '#fca5a5'],
          leakCount = 3, grainOpacity = 0.14, letterbox = true,
          driftDuration = 12, introUnderexpose = true } = opts;

  container.style.cssText = 'background:' + baseColor + ';overflow:hidden;position:relative;';

  if (letterbox) {
    ['top', 'bottom'].forEach(function(pos) {
      var bar = document.createElement('div');
      bar.style.cssText = 'position:absolute;' + pos + ':0;left:0;width:100%;height:140px;background:#000;z-index:10;';
      container.appendChild(bar);
    });
  }

  var grain = document.createElement('div');
  grain.style.cssText = 'position:absolute;inset:0;z-index:5;pointer-events:none;opacity:' + grainOpacity + ';mix-blend-mode:overlay;background-image:url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")';
  container.appendChild(grain);

  var leaks = [];
  var positions = [
    { top: '-10%', left: '60%', size: '50%' },
    { top: '40%', left: '80%', size: '45%' },
    { top: '60%', left: '10%', size: '40%' },
    { top: '20%', left: '30%', size: '35%' },
    { top: '70%', left: '50%', size: '55%' },
  ];

  for (var i = 0; i < leakCount; i++) {
    var leak = document.createElement('div');
    var color = leakColors[i % leakColors.length];
    var pos = positions[i % positions.length];
    leak.style.cssText = 'position:absolute;z-index:3;pointer-events:none;top:' + pos.top + ';left:' + pos.left + ';width:' + pos.size + ';height:' + pos.size + ';background:radial-gradient(ellipse at center, ' + color + ' 0%, transparent 70%);opacity:0.35;mix-blend-mode:screen';
    container.appendChild(leak);
    leaks.push(leak);
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
