// typewriter-cursor | Typewriter Cursor with chromatic aberration
// GSAP 3.x — deterministic typewriter reveal with cursor blink + shimmer
function typewriterCursor(tl, container, opts = {}) {
  const { text = '', charInterval = 0.08, cursorChar = '\u258D',
          cursorColor = '#ff3b6f', chromaticPair = ['#ff3b6f', '#00d4ff'],
          chromaticDuration = 0.2, shimmerAtEnd = true } = opts;

  const chars = text.split('');
  const textEl = document.createElement('div');
  textEl.className = 'typewriter-text';
  textEl.style.cssText = 'font-family:Inter Tight,Noto Sans SC,sans-serif;font-weight:700;font-size:6vw;color:#f5f5f7;text-align:center;';

  const cursorEl = document.createElement('span');
  cursorEl.className = 'typewriter-cursor';
  cursorEl.style.cssText = 'display:inline-block;width:3px;height:1em;background:' + cursorColor + ';margin-left:2px;vertical-align:middle;';

  container.appendChild(textEl);
  textEl.appendChild(cursorEl);

  const blinkPattern = [1, 1, 1, 0, 1, 1, 0, 0, 1, 0, 1, 1, 1, 0];

  chars.forEach((ch, i) => {
    const span = document.createElement('span');
    span.textContent = ch;
    span.style.cssText = 'opacity:0;display:inline;';
    textEl.insertBefore(span, cursorEl);
    tl.to(span, { opacity: 1, duration: 0.01, ease: 'steps(1)' }, '>+' + charInterval);
    tl.to(span, { textShadow: '2px 0 ' + chromaticPair[0] + ', -2px 0 ' + chromaticPair[1], duration: 0.01 }, '<');
    tl.to(span, { textShadow: '0 0 0 transparent', duration: chromaticDuration }, '<');
  });

  const totalFlashes = Math.ceil(chars.length * charInterval / 0.5);
  for (let f = 0; f < totalFlashes; f++) {
    tl.to(cursorEl, { opacity: blinkPattern[f % blinkPattern.length] ? 1 : 0, duration: 0.01 }, '>');
  }

  if (shimmerAtEnd) {
    tl.to(cursorEl, { opacity: 0, duration: 0.3 }, '>');
    const shimmer = document.createElement('div');
    shimmer.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;background:linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.15) 50%,transparent 100%);pointer-events:none;';
    container.appendChild(shimmer);
    tl.fromTo(shimmer, { x: '-100%' }, { x: '100%', duration: 0.5, ease: 'power2.inOut' }, '>');
  }
  return { tl, textEl, cursorEl };
}
