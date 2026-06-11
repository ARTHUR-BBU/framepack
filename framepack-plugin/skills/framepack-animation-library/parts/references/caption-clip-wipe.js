// caption-clip-wipe | Caption Clip Wipe
// GSAP 3.x — text reveal via clip-path wipe
// HTML requires pre-split words: <span class="word" style="clip-path:inset(0 100% 0 0)">word</span>
function captionClipWipe(tl, textEl, opts = {}, position = '>') {
  textEl = typeof textEl === 'string' ? document.querySelector(textEl) : textEl;
  const { direction = 'left-to-right', staggerPerWord = 0.1,
          durationPerWord = 0.4 } = opts;
  const words = textEl.querySelectorAll('.word');
  if (!words.length) return tl;
  const clipMap = {
    'left-to-right':  'inset(0 100% 0 0)',
    'right-to-left':  'inset(0 0 0 100%)',
    'top-to-bottom':  'inset(100% 0 0 0)',
    'center-out':     'inset(0 50% 0 50%)'
  };
  words.forEach(function(word, i) {
    tl.fromTo(word,
      { clipPath: clipMap[direction], opacity: 0 },
      { clipPath: 'inset(0 0 0 0)', opacity: 1,
        duration: durationPerWord, ease: 'power2.out' },
      position + (i > 0 ? '+=' + staggerPerWord : '')
    );
  });
  return tl;
}
