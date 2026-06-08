/**
 * Transition Effects Pack — HyperFrames-safe GSAP/CSS transitions
 *
 * No WebGL shader dependency. All effects use GSAP + CSS transforms/filters/clip-paths.
 * Deterministic, HyperFrames renderable.
 */

function applyTransition(tl, sceneOut, sceneIn, opts = {}) {
  const {
    type = 'whip-pan',
    direction = 'left',
    intensity = 'medium',
    duration = 0.5
  } = opts;

  const distMap = { subtle: 300, medium: 500, heavy: 800 };
  const blurMap = { subtle: 8, medium: 16, heavy: 24 };

  switch (type) {

    // ── Whip Pan ───────────────────────────────────
    case 'whip-pan': {
      const dir = direction === 'left' ? -1 : (direction === 'right' ? 1 : 0);
      const dist = distMap[intensity] || 500;
      tl.to(sceneOut, {
        x: dir * -dist,
        filter: 'blur(12px)',
        opacity: 0,
        duration,
        ease: 'power3.in'
      }, '<');
      tl.fromTo(sceneIn,
        { x: dir * dist, filter: 'blur(12px)', opacity: 0 },
        { x: 0, filter: 'blur(0px)', opacity: 1,
          duration: duration * 0.9, ease: 'power3.out' },
        '<'
      );
      break;
    }

    // ── Cinematic Zoom ─────────────────────────────
    case 'cinematic-zoom': {
      const blurAmt = blurMap[intensity] || 16;
      tl.to(sceneOut, {
        scale: 1.3,
        filter: `blur(${blurAmt}px)`,
        opacity: 0,
        transformOrigin: 'center center',
        duration,
        ease: 'power2.in'
      }, '<');
      tl.fromTo(sceneIn,
        { scale: 0.8, filter: `blur(${blurAmt}px)`, opacity: 0,
          transformOrigin: 'center center' },
        { scale: 1, filter: 'blur(0px)', opacity: 1,
          duration: duration * 0.7, ease: 'power2.out' },
        `+=${duration * 0.3}`
      );
      break;
    }

    // ── Flash White ────────────────────────────────
    case 'flash-white': {
      // Create a white overlay, flash it, then remove
      const flash = document.createElement('div');
      flash.style.cssText = [
        'position:absolute;inset:0;z-index:999',
        'background:#fff;opacity:0;pointer-events:none'
      ].join(';');
      sceneOut.parentNode.appendChild(flash);

      tl.to(flash, { opacity: 1, duration: duration * 0.2, ease: 'power2.in' }, '<');
      tl.set(sceneOut, { display: 'none' });
      tl.set(sceneIn, { display: 'block' });
      tl.to(flash, { opacity: 0, duration: duration * 0.3, ease: 'power2.out',
                     onComplete: () => flash.remove() });
      break;
    }

    // ── Glitch ─────────────────────────────────────
    case 'glitch': {
      // 3 rapid clip-path shifts + RGB color split on sceneOut
      const clips = [
        'inset(20% 0 60% 0)', 'inset(40% -10% 50% 10%)',
        'inset(0 0 0 0)'
      ];
      tl.to(sceneOut, {
        clipPath: clips[0], filter: 'hue-rotate(90deg)',
        duration: duration * 0.15, ease: 'steps(1)'
      }, '<');
      tl.to(sceneOut, {
        clipPath: clips[1], filter: 'hue-rotate(-90deg)',
        duration: duration * 0.15, ease: 'steps(1)'
      });
      // Show sceneIn with slight glitch
      tl.set(sceneOut, { display: 'none' });
      tl.fromTo(sceneIn,
        { clipPath: clips[1], filter: 'hue-rotate(45deg)', opacity: 1 },
        { clipPath: clips[2], filter: 'hue-rotate(0deg)',
          duration: duration * 0.4, ease: 'power2.out' }
      );
      break;
    }

    // ── Slide Up ───────────────────────────────────
    case 'slide-up': {
      const yDist = direction === 'up' ? -800 : 800;
      tl.to(sceneOut, {
        y: -yDist, opacity: 0, duration, ease: 'power3.in'
      }, '<');
      tl.fromTo(sceneIn,
        { y: yDist, opacity: 0 },
        { y: 0, opacity: 1, duration, ease: 'power2.out' },
        '<'
      );
      break;
    }

    // ── Circle Reveal ──────────────────────────────
    case 'circle-reveal': {
      tl.to(sceneOut, {
        clipPath: 'circle(0% at 50% 50%)',
        duration, ease: 'power3.in'
      }, '<');
      tl.fromTo(sceneIn,
        { clipPath: 'circle(0% at 50% 50%)', opacity: 1 },
        { clipPath: 'circle(100% at 50% 50%)',
          duration: duration * 0.8, ease: 'power2.out' },
        `+=${duration * 0.1}`
      );
      break;
    }

    default:
      // simple crossfade
      tl.to(sceneOut, { opacity: 0, duration }, '<');
      tl.fromTo(sceneIn, { opacity: 0 }, { opacity: 1, duration }, '<');
  }

  return tl;
}
