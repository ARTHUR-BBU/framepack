function captionClipWipe(tl, textEl, opts = {}, position = '>') {
  const target = typeof textEl === 'string' ? document.querySelector(textEl) : textEl;
  if (!target) throw new Error('captionClipWipe target not found');
  const { direction = 'left-to-right', staggerPerWord = 0.1, durationPerWord = 0.4 } = opts;
  const words = target.querySelectorAll('.word');
  if (!words.length) throw new Error('captionClipWipe requires .word children');
  const clips = { 'left-to-right': 'inset(0 100% 0 0)', 'right-to-left': 'inset(0 0 0 100%)', 'top-to-bottom': 'inset(100% 0 0 0)', 'center-out': 'inset(0 50% 0 50%)' };
  words.forEach((word, index) => tl.fromTo(word, { clipPath: clips[direction], autoAlpha: 0 }, { clipPath: 'inset(0 0 0 0)', autoAlpha: 1, duration: durationPerWord, ease: 'power2.out' }, `${position}${index ? `+=${staggerPerWord}` : ''}`));
  return tl;
}
