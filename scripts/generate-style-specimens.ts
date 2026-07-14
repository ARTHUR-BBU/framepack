import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { dirname } from 'node:path';
import { join, resolve } from 'node:path';
import { vendorNotoSansSc } from '../packages/director-engine/src/font-vendor.js';

type Style = { id:string; chineseName:string; palette:{ background:string; surface:string; primary:string; accent:string }; atmosphere:string[]; suitableIntents:string[] };
const root = resolve(import.meta.dirname, '..');
const target = join(root, 'packages', 'director-assets', 'specimens', 'styles');
const catalog = JSON.parse(await readFile(join(root, 'packages', 'director-assets', 'styles', 'catalog.json'), 'utf8')) as { styles:Style[] };

await rm(target, { recursive:true, force:true });
await mkdir(target, { recursive:true });
for (const style of catalog.styles) {
  const dir = join(target, style.id);
  await mkdir(join(dir, 'fonts'), { recursive:true });
  await mkdir(join(dir, 'vendor'), { recursive:true });
  await Promise.all([
    cp(join(root, 'packages', 'director-assets', 'fonts', 'noto-sans-sc', 'wght.css'), join(dir, 'fonts', 'wght.css')),
    cp(join(root, 'node_modules', 'gsap', 'dist', 'gsap.min.js'), join(dir, 'vendor', 'gsap.min.js')),
    writeFile(join(dir, 'frame.md'), `# ${style.chineseName} 中文风格样板\n\n- 视觉关键词：${style.atmosphere.join(' / ')}\n- 适用：${style.suitableIntents.join('、')}\n- 字体：本地 Noto Sans SC Variable\n`, 'utf8'),
    writeFile(join(dir, 'index.html'), html(style).replace(/@font-face\{[^}]+\}/, ''), 'utf8'),
  ]);
  await vendorNotoSansSc(join(dir, 'fonts'), `FRAMEPACK ${style.chineseName} ${style.atmosphere.join(' ')} ${style.suitableIntents.join(' ')} 让创意成为画面 中文视觉样板 适用场景`);
  const npxArgs = process.platform === 'win32' ? [join(dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npx-cli.js')] : ['npx'];
  const run = (args:string[]) => execFileSync(process.platform === 'win32' ? process.execPath : 'npx', [...npxArgs.slice(process.platform === 'win32' ? 0 : 1), ...args], { stdio:'pipe' });
  run(['hyperframes', 'lint', dir, '--json']);
  run(['hyperframes', 'check', dir, '--json']);
  run(['hyperframes', 'snapshot', dir, '--at', '0.3,1.5,3.5', '--json']);
}
process.stdout.write(`Generated ${catalog.styles.length} Chinese style specimens\n`);

function html(style:Style): string {
  const motif = motifs(style.id);
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=1920,height=1080"><title>${style.chineseName}｜Framepack</title><link rel="stylesheet" href="./fonts/wght.css"><script src="./vendor/gsap.min.js"></script><style>
@font-face{font-family:'Noto Sans SC Variable';src:url('./fonts/files/noto-sans-sc-4-wght-normal.woff2') format('woff2-variations');font-weight:100 900}*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden;background:${style.palette.background};color:${style.palette.primary};font-family:'Noto Sans SC Variable',sans-serif}#root{position:relative;width:1920px;height:1080px;overflow:hidden}.clip{position:absolute;inset:0}.scene-inner{position:absolute;inset:0;padding:76px 96px;overflow:hidden}.top{display:flex;justify-content:space-between;font-size:22px;letter-spacing:.14em}.name{font-weight:800}.tag{opacity:.65}.hero{position:absolute;left:96px;bottom:92px;max-width:1320px}.hero h1{margin:0;font-size:clamp(110px,10vw,206px);line-height:.88;letter-spacing:-.075em;font-weight:900}.hero p{margin:32px 0 0;font-size:34px;max-width:720px;line-height:1.35}.motif{position:absolute;inset:0;pointer-events:none}.rule{position:absolute;background:${style.palette.accent};opacity:.92}.stamp{position:absolute;right:96px;bottom:96px;width:310px;font-size:25px;line-height:1.45;border-top:2px solid currentColor;padding-top:16px}.shape{position:absolute;background:${style.palette.surface};border:1px solid color-mix(in srgb,${style.palette.primary} 20%,transparent)}
${motif.css}.motif>*{position:absolute}.top{position:relative;z-index:3}.hero,.stamp{z-index:2}.hero{bottom:170px}.hero h1{max-width:1120px;font-size:170px;line-height:.92}.hero p{margin-top:38px;background:${style.palette.background};padding:8px 12px;display:inline-block}.motif{pointer-events:auto;z-index:1}</style></head><body><main id="root" data-composition-id="style-${style.id}" data-start="0" data-width="1920" data-height="1080" data-duration="5"><section id="style-scene" class="clip" data-start="0" data-duration="5" data-track-index="0"><div class="scene-inner"><div class="top"><span class="name">FRAMEPACK / ${style.chineseName}</span><span class="tag">中文视觉样板 · 01</span></div><div class="motif" data-layout-allow-overlap>${motif.markup}</div><div class="hero"><h1>${motif.headline.replace('\n','<br>')}</h1><p>${motif.copy}</p></div><div class="stamp">适用场景<br>${style.suitableIntents.join(' · ')}</div></div></section></main><script>window.__timelines=window.__timelines||{};const tl=gsap.timeline({paused:true});${motif.motion}window.__timelines['style-${style.id}']=tl;</script></body></html>`;
}

function motifs(id:string) {
  const common = { headline:'让创意，\n成为画面。', copy:'同一条中文信息，也应该拥有一眼可辨的导演语言。' };
  const all:Record<string, typeof common & { markup:string; css:string; motion:string }> = {
    'swiss-pulse':{...common,headline:'清晰，\n就是力量。',copy:'用严格网格和大尺度信息，把复杂产品讲得一目了然。',markup:'<i class="rule r1"></i><i class="rule r2"></i><b class="index">01<br>08</b>',css:'.r1{left:48%;top:0;width:2px;height:100%}.r2{left:0;top:37%;width:100%;height:2px}.index{position:absolute;right:110px;top:220px;font-size:190px;line-height:.72;color:#185ADB}',motion:"tl.from('.hero',{x:-80,autoAlpha:0,duration:.7,ease:'power3.out'},.2).from('.index',{y:100,autoAlpha:0,duration:.65,ease:'power4.out'},.35);"},
    'velvet-standard':{...common,headline:'价值，\n缓慢显形。',copy:'深色舞台留给产品和一句真正重要的话。',markup:'<i class="halo"></i><i class="orb"></i>',css:'.halo{position:absolute;left:50%;top:45%;width:900px;height:900px;transform:translate(-50%,-50%);border-radius:50%;background:radial-gradient(circle,rgba(201,169,110,.25),transparent 62%)}.orb{position:absolute;right:230px;top:180px;width:390px;height:520px;border-radius:52% 48% 45% 55%;background:linear-gradient(135deg,#2a241b,#c9a96e,#14110d);box-shadow:0 30px 100px rgba(201,169,110,.3)}',motion:"tl.from('.orb',{scale:.7,autoAlpha:0,duration:1.2,ease:'power2.out'},.2).from('.hero',{y:45,autoAlpha:0,duration:.9},.45);"},
    'deconstructed':{...common,headline:'不必完整，\n也能有力。',copy:'切割、偏轴和工业标记，为硬核叙事保留锋利感。',markup:'<i class="slash s1"></i><i class="slash s2"></i><b class="code">/ 07<br>RAW</b>',css:'.slash{position:absolute;width:760px;height:180px;background:#F0442E;transform:rotate(-22deg)}.s1{right:-140px;top:110px}.s2{left:-180px;bottom:110px;background:#141414}.code{position:absolute;right:110px;bottom:280px;font-size:50px;line-height:.82}',motion:"tl.from('.slash',{x:300,autoAlpha:0,stagger:.12,duration:.55,ease:'power4.out'},.1).from('.hero',{x:-80,autoAlpha:0,duration:.65},.28);"},
    'maximalist-type':{...common,headline:'现在，\n就被看见。',copy:'让文字本身承担发布瞬间的冲击。',markup:'<i class="block b1"></i><i class="block b2"></i>',css:'.b1{position:absolute;right:110px;top:125px;width:550px;height:420px;background:#FF5C35}.b2{position:absolute;right:430px;bottom:-80px;width:620px;height:360px;background:#4C2BFF}.hero h1{font-size:220px;position:relative;z-index:1}',motion:"tl.from('.block',{scale:0,rotation:18,stagger:.1,duration:.45,ease:'back.out(1.5)'},.1).from('.hero',{scale:1.35,autoAlpha:0,duration:.5,ease:'power4.out'},.25);"},
    'data-drift':{...common,headline:'让数据，\n自己说话。',copy:'低亮度信号和柔性轨迹，让技术感变成可信的空间。',markup:'<svg class="path" viewBox="0 0 1920 1080"><path d="M90 820 C480 440 820 860 1120 410 S1600 260 1850 160" fill="none" stroke="#54D6C6" stroke-width="4"/></svg><i class="dot"></i>',css:'.path{position:absolute;inset:0;width:100%;height:100%;opacity:.7}.dot{left:90px;top:820px;width:28px;height:28px;border-radius:50%;background:#54D6C6;box-shadow:0 0 45px #54D6C6}',motion:"tl.from('.path',{autoAlpha:0,scale:.96,duration:1.2},.2).to('.dot',{x:1360,y:-660,duration:2.4,ease:'power1.inOut'},.35).from('.hero',{autoAlpha:0,y:35,duration:.7},.55);"},
    'soft-signal':{...common,headline:'温柔，\n也很有力量。',copy:'自然纸感和缓慢呼吸，让科技重新有了人的温度。',markup:'<i class="sun"></i><i class="paper"></i>',css:'.sun{right:180px;top:145px;width:520px;height:520px;border-radius:50%;background:radial-gradient(circle,#f6d6bc 0,rgba(246,214,188,.1) 64%,transparent 70%)}.paper{right:300px;top:320px;width:500px;height:360px;border-radius:48% 52% 56% 44%;background:#FFF9F1;transform:rotate(-8deg)}',motion:"tl.from('.paper',{y:60,autoAlpha:0,duration:1,ease:'power2.out'},.2).to('.sun',{scale:1.08,duration:1.4,yoyo:true,repeat:1,ease:'sine.inOut'},.35).from('.hero',{y:30,autoAlpha:0,duration:.8},.45);"},
    'folk-frequency':{...common,headline:'一起，\n热烈发生。',copy:'手作色块和社区节拍，让每个参与者都有位置。',markup:'<i class="tile t1"></i><i class="tile t2"></i><i class="tile t3"></i><i class="tile t4"></i>',css:'.tile{width:210px;height:210px;transform:rotate(45deg);background:#E85A3F}.t1{right:300px;top:170px}.t2{right:110px;top:390px;background:#173B35}.t3{right:370px;top:610px;background:#F6F0D8}.t4{right:580px;top:390px;background:#E85A3F}',motion:"tl.from('.tile',{scale:0,rotation:0,autoAlpha:0,stagger:.1,duration:.55,ease:'back.out(1.4)'},.2).from('.hero',{x:-45,autoAlpha:0,duration:.65},.4);"},
    'shadow-cut':{...common,headline:'真相，\n从暗处出现。',copy:'硬边光切开黑场，让悬念变成可以被看见的证据。',markup:'<i class="beam"></i><i class="cut"></i>',css:'.beam{right:0;top:0;width:58%;height:100%;background:linear-gradient(115deg,transparent 35%,rgba(182,32,42,.6) 36%,transparent 56%)}.cut{right:260px;top:160px;width:350px;height:720px;background:#F4F1EA;clip-path:polygon(40% 0,100% 0,60% 100%,0 100%)}',motion:"tl.from('.beam',{x:500,autoAlpha:0,duration:.8,ease:'power3.out'},.2).from('.cut',{clipPath:'polygon(40% 0,40% 0,60% 100%,60% 100%)',duration:.9,ease:'power2.inOut'},.45).from('.hero',{autoAlpha:0,duration:.65},.65);"},
  };
  return all[id];
}
