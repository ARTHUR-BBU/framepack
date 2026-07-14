import { expect, test } from 'vitest';
import {
  createHandoffManifest,
  createSnapshotPlan,
  generatePreviewHtml,
  inspectPreviewHtml,
  runHyperframes,
} from '../packages/hyperframes-bridge/src/index.js';

const spec = { title: 'Pulse', aspectRatio: '16:9' as const, durationSeconds: 30, width: 1920, height: 1080 };

test('generated 16:9 and 9:16 previews satisfy every structural rule', () => {
  expect(inspectPreviewHtml(generatePreviewHtml(spec)).codes).toEqual([]);
  expect(inspectPreviewHtml(generatePreviewHtml({ ...spec, aspectRatio: '9:16', width: 1080, height: 1920 })).codes).toEqual([]);
});

test('compatibility preview is project-specific and contains no fixed English fallback', () => {
  const html = generatePreviewHtml({ ...spec, title: '让每一次协作更轻松' });
  expect(html).toContain('让每一次协作更轻松');
  expect(html).not.toMatch(/Make it felt|Show the proof|Ready to render|programmable moving image/i);
});

test('flags the known HyperFrames structural hazards', () => {
  const invalid = `<div id="root" data-duration="30"><div class="clip"><video src="https://cdn.example/video.mp4"></video></div></div>
  <style>.title{font-family:var(--heading)}</style><script>tl.set('#x',{opacity:0}); gsap.to('.clip',{opacity:0,repeat:-1});</script>`;
  expect(inspectPreviewHtml(invalid).codes).toEqual(expect.arrayContaining([
    'root-start-missing', 'root-dimensions-missing', 'clip-timing-missing', 'clip-inner-missing', 'video-nested',
    'video-z-index-missing', 'external-resource', 'font-variable', 'timeline-set-hidden',
    'infinite-repeat', 'clip-root-animation', 'timeline-registration-missing',
  ]));
});

test('flags non-seek-safe and non-local production timelines', () => {
  const invalid = `<div id="root" data-start="0" data-duration="10" data-width="1920" data-height="1080"><div class="clip" data-start="0" data-duration="10" data-track-index="0"><div class="scene-inner"></div></div></div><script src="https://cdn.example/gsap.min.js"></script><script>const tl=gsap.timeline();ScrollTrigger.create({trigger:'#root'});window.__timelines['main']=tl;</script>`;
  expect(inspectPreviewHtml(invalid).codes).toEqual(expect.arrayContaining([
    'external-resource', 'timeline-not-paused', 'scrolltrigger-main-timeline', 'local-gsap-missing',
  ]));
});

test('bridge exposes deterministic runner, snapshot planning, and handoff records', async () => {
  const calls: string[][] = [];
  await runHyperframes('lint', 'C:/work/demo', { runner: async (args) => { calls.push(args); } });
  expect(calls).toEqual([['lint', 'C:/work/demo']]);
  expect(createSnapshotPlan(10).frames.at(-1)).toEqual({ label: 'final-hold', timeSeconds: 9.75 });
  expect(createHandoffManifest({ buildId: 'b1', contentHash: 'a'.repeat(64), hyperframesVersion: '0.7.56' })).toMatchObject({ version: '1.0', buildId: 'b1' });
});
test('inspects production CSS alongside HTML', () => {
  const html = generatePreviewHtml(spec);
  expect(inspectPreviewHtml(html, `.clip{transform:scale(.9)} .x{font-family:var(--heading);background:url(https://cdn.example/x.png)}`).codes).toEqual(expect.arrayContaining(['clip-root-animation', 'font-variable', 'external-resource']));
});