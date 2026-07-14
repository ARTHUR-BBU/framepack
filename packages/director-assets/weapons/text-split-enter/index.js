export function textSplitEnter(tl, textEl, opts = {}, position = '>') {
  const target = typeof textEl === 'string' ? document.querySelector(textEl) : textEl;
  if (!target) throw new Error('textSplitEnter target not found');
  const { splitMode = 'horizontal', direction = 'inward', travelDistance = 40, staggerPerChar = 0.03, duration = 0.5 } = opts;
  const sign = direction === 'inward' ? -1 : 1;
  if (splitMode === 'char') {
    const chars = target.querySelectorAll('.char');
    if (!chars.length) throw new Error('textSplitEnter requires .char children');
    tl.fromTo(chars, { opacity: 0, y: sign * -60, rotateX: -40 }, { opacity: 1, y: 0, rotateX: 0, duration, ease: 'back.out(1.2)', stagger: staggerPerChar }, position);
    return tl;
  }
  const first = target.querySelector(splitMode === 'vertical' ? '.split-top' : '.split-left');
  const second = target.querySelector(splitMode === 'vertical' ? '.split-bottom' : '.split-right');
  if (!first || !second) throw new Error(`textSplitEnter requires split children for ${splitMode}`);
  const axis = splitMode === 'vertical' ? 'y' : 'x';
  tl.fromTo(first, { [axis]: sign * -travelDistance, opacity: 0 }, { [axis]: 0, opacity: 1, duration, ease: 'power3.out' }, position);
  tl.fromTo(second, { [axis]: sign * travelDistance, opacity: 0 }, { [axis]: 0, opacity: 1, duration, ease: 'power3.out' }, position);
  return tl;
}
