// sprite-animation | Sprite Sheet Animation
// GSAP 3.x — deterministic sprite frame playback via backgroundPosition
function spriteAnimation(tl, el, opts = {}, position = '>') {
  const { frameCount = 12, frameWidth = 200, frameHeight = 200,
          fps = 12, direction = 'horizontal', loopCount = 1,
          pingPong = false, spriteUrl = '' } = opts;

  if (spriteUrl) {
    el.style.backgroundImage = 'url(' + spriteUrl + ')';
  }
  el.style.backgroundSize = direction === 'horizontal'
    ? (frameWidth * frameCount) + 'px ' + frameHeight + 'px'
    : frameWidth + 'px ' + (frameHeight * frameCount) + 'px';
  el.style.width = frameWidth + 'px';
  el.style.height = frameHeight + 'px';
  el.style.backgroundRepeat = 'no-repeat';

  const frameDuration = 1 / fps;
  const keyframes = [];

  for (let loop = 0; loop < loopCount; loop++) {
    for (let f = 0; f < frameCount; f++) {
      const offset = direction === 'horizontal'
        ? (-(f * frameWidth)) + 'px 0px'
        : '0px ' + (-(f * frameHeight)) + 'px';
      keyframes.push(offset);
    }
    if (pingPong && loop < loopCount - 1) {
      for (let f = frameCount - 2; f > 0; f--) {
        const offset = direction === 'horizontal'
          ? (-(f * frameWidth)) + 'px 0px'
          : '0px ' + (-(f * frameHeight)) + 'px';
        keyframes.push(offset);
      }
    }
  }

  const animObj = { frame: 0 };
  tl.to(animObj, {
    frame: keyframes.length - 1,
    duration: keyframes.length * frameDuration,
    ease: 'none',
    onUpdate: function() {
      el.style.backgroundPosition = keyframes[Math.round(animObj.frame)];
    }
  }, position);

  return tl;
}
