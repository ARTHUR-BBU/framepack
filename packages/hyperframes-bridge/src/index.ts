export { generatePreviewHtml, type PreviewTemplateSpec } from './template.js';

export type Inspection = { codes: string[] };

export function inspectPreviewHtml(html: string): Inspection {
  const codes = new Set<string>();
  const root = html.match(/<div[^>]*id=["']root["'][^>]*>/)?.[0] ?? '';
  if (!/data-start=["']0["']/.test(root)) codes.add('root-start-missing');
  if (!/data-duration=/.test(root)) codes.add('root-duration-missing');
  for (const clip of html.matchAll(/<div[^>]*class=["'][^"']*\bclip\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/g)) {
    const tag = clip[0].slice(0, clip[0].indexOf('>') + 1);
    if (!/data-start=/.test(tag) || !/data-duration=/.test(tag) || !/data-track-index=/.test(tag)) codes.add('clip-timing-missing');
    if (!/class=["'][^"']*scene-inner/.test(clip[1])) codes.add('clip-inner-missing');
  }
  if (!/window\.__timelines\[['"]main['"]\]/.test(html)) codes.add('timeline-registration-missing');
  if (/https?:\/\//.test(html)) codes.add('external-resource');
  if (/font-family\s*:\s*var\(/.test(html)) codes.add('font-variable');
  if (/repeat\s*:\s*-1/.test(html)) codes.add('infinite-repeat');
  if (/\.clip['"]?\s*,?\s*\{?[^}]*?(opacity|filter|transform)/.test(html) || /gsap\.(?:to|fromTo)\(['"]\.clip/.test(html)) codes.add('clip-root-animation');
  if (/\.set\([^)]*(?:opacity\s*:\s*0|opacity:\s*0)/.test(html)) codes.add('timeline-set-hidden');
  for (const video of html.matchAll(/<video\b([^>]*)>/g)) {
    const position = video.index ?? 0;
    const before = html.slice(0, position);
    const latestClip = before.lastIndexOf('class="clip"');
    if (latestClip >= 0 && html.lastIndexOf('</div>', position) < latestClip) codes.add('video-nested');
    if (!/z-index\s*:/.test(video[1]) && !/class=["'][^"']*media-proof/.test(video[1])) codes.add('video-z-index-missing');
  }
  return { codes: [...codes].sort() };
}
