/**
 * Elastic Scale Enter — 弹性缩放入场
 *
 * @param {gsap.core.Timeline} tl
 * @param {Element|Element[]} targets
 * @param {object} opts
 * @param {string|number} position - GSAP position param ('>', '+=0.1', etc.)
 * @returns {gsap.core.Timeline}
 */
function elasticScaleEnter(tl, targets, opts = {}, position = '>') {
  const {
    fromScale = 0.6,
    bounceAmount = 1.15,
    duration = 0.55,
    ease = 'back.out(1.4)',
    applyTo = 'scale_and_opacity'
  } = opts;

  // 映射 bounceAmount 到 back.out 的 overshoot 参数
  // back.out(1.4) 的 1.4 即 overshoot — bounceAmount 1.15 时用 1.4
  // 简化：直接让调用方传 ease 字符串，bounceAmount 仅作文档提示
  const fromVars = {
    scale: fromScale,
    transformOrigin: 'center center'
  };
  if (applyTo === 'scale_and_opacity') {
    fromVars.opacity = 0;
  }

  const toVars = {
    scale: 1,
    duration,
    ease,
    overwrite: 'auto'
  };
  if (applyTo === 'scale_and_opacity') {
    toVars.opacity = 1;
  }

  return tl.fromTo(targets, fromVars, toVars, position);
}
