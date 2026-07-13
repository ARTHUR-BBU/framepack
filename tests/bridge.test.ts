import { expect, test } from 'vitest';
import { generatePreviewHtml, inspectPreviewHtml } from '../packages/hyperframes-bridge/src/index.js';

const spec = { title: 'Pulse', aspectRatio: '16:9' as const, durationSeconds: 30, width: 1920, height: 1080 };

test('generated 16:9 and 9:16 previews satisfy every structural rule', () => {
  expect(inspectPreviewHtml(generatePreviewHtml(spec)).codes).toEqual([]);
  expect(inspectPreviewHtml(generatePreviewHtml({ ...spec, aspectRatio: '9:16', width: 1080, height: 1920 })).codes).toEqual([]);
});

test('flags the known HyperFrames structural hazards', () => {
  const invalid = `<div id="root" data-duration="30"><div class="clip"><video src="https://cdn.example/video.mp4"></video></div></div>
  <style>.title{font-family:var(--heading)}</style><script>tl.set('#x',{opacity:0}); gsap.to('.clip',{opacity:0,repeat:-1});</script>`;
  expect(inspectPreviewHtml(invalid).codes).toEqual(expect.arrayContaining([
    'root-start-missing', 'clip-timing-missing', 'clip-inner-missing', 'video-nested',
    'video-z-index-missing', 'external-resource', 'font-variable', 'timeline-set-hidden',
    'infinite-repeat', 'clip-root-animation', 'timeline-registration-missing',
  ]));
});
