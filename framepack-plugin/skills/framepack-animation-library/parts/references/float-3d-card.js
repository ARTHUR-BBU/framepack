// float-3d-card | Float 3D Card
// GSAP 3.x — subtle floating card with shadow depth
function float3DCard(tl, card, opts = {}, position = '>') {
  const { floatDistance = 15, rotationRange = 3,
          duration = 4, shadowDepth = 40 } = opts;
  tl.to(card, {
    y: floatDistance,
    rotationX: rotationRange,
    boxShadow: '0 ' + shadowDepth + 'px ' + (shadowDepth * 1.5) + 'px rgba(0,0,0,0.2)',
    duration: duration / 2,
    ease: 'sine.inOut',
    yoyo: true,
    repeat: 1
  }, position);
  return tl;
}
