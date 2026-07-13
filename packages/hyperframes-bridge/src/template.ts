export type PreviewTemplateSpec = {
  title: string;
  aspectRatio: '16:9' | '9:16';
  durationSeconds: number;
  width: number;
  height: number;
};

export function generatePreviewHtml(spec: PreviewTemplateSpec): string {
  const sceneDuration = spec.durationSeconds / 3;
  const scene = (number: number, label: string, start: number) => `
    <div id="s${number}" class="clip" data-start="${start}" data-duration="${sceneDuration}" data-track-index="${number}">
      <div id="s${number}-inner" class="scene-inner">
        <div class="orb orb-a"></div><div class="orb orb-b"></div><div class="grid"></div>
        <p class="eyebrow">FRAMEPACK / DIRECTOR PREVIEW</p><h1>${label}</h1><p class="body">A programmable moving image, ready for review.</p>
      </div>
    </div>`;
  return `<!doctype html><html><head><meta charset="utf-8"><title>${spec.title}</title>
  <style>
    @font-face { font-family:'Director Sans'; src:url('public/fonts/director-sans.woff2'); }
    *{box-sizing:border-box}.clip,.scene-inner{position:absolute;inset:0;overflow:hidden}.scene-inner{background:#08111f;color:#f4f7fb;font-family:'Director Sans',sans-serif;padding:9%;display:flex;flex-direction:column;justify-content:center}.orb{position:absolute;border-radius:50%;filter:blur(8px);opacity:.65}.orb-a{width:42%;aspect-ratio:1;background:#5f56ff;top:8%;right:8%}.orb-b{width:30%;aspect-ratio:1;background:#11d6b6;bottom:8%;left:10%}.grid{position:absolute;inset:0;background-image:linear-gradient(#ffffff10 1px,transparent 1px),linear-gradient(90deg,#ffffff10 1px,transparent 1px);background-size:52px 52px}.eyebrow,h1,.body{position:relative;z-index:2}.eyebrow{font-size:22px;letter-spacing:.15em}h1{font-size:clamp(72px,9vw,180px);max-width:10ch;margin:.15em 0}.body{font-size:32px;max-width:28ch}
  </style></head><body><div id="root" data-composition-id="main" data-start="0" data-duration="${spec.durationSeconds}" data-width="${spec.width}" data-height="${spec.height}">
  ${scene(1, 'Make it felt.', 0)}${scene(2, 'Show the proof.', sceneDuration)}${scene(3, 'Ready to render.', sceneDuration * 2)}
  </div><script src="public/vendor/gsap.min.js"></script><script>window.__timelines=window.__timelines||{};const tl=gsap.timeline({paused:true});tl.fromTo('#s1-inner .eyebrow',{opacity:0,y:28},{opacity:1,y:0,duration:.5,ease:'power2.out'},0).fromTo('#s1-inner h1',{opacity:0,y:70},{opacity:1,y:0,duration:.8,ease:'power3.out'},.15).fromTo('#s2-inner h1',{opacity:0,x:-90},{opacity:1,x:0,duration:.8,ease:'power3.out'},${sceneDuration}).fromTo('#s3-inner h1',{opacity:0,scale:.92},{opacity:1,scale:1,duration:.8,ease:'power3.out'},${sceneDuration * 2});window.__timelines['main']=tl;</script></body></html>`;
}
