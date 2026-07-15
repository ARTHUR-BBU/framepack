import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';
import sharp from 'sharp';
import { AssetRecordSchema } from '../packages/director-contracts/src/index.js';
import {
  confirmAssetAssignment,
  inspectAssets,
} from '../packages/director-engine/src/index.js';

const projects: string[] = [];

async function project(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'framepack-assets-'));
  projects.push(root);
  return root;
}

afterEach(async () => {
  await Promise.all(projects.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});

describe('truthful asset intake', () => {
  test('an empty asset folder is missing, never strong', async () => {
    const root = await project();
    await mkdir(join(root, 'assets'));
    const result = await inspectAssets(root);

    expect(result.summary).toBe('missing');
    expect(result.assets).toEqual([]);
    expect(await readFile(join(root, '.framepack', 'asset-intake.md'), 'utf8')).toContain('缺少素材');
  });

  test('a PNG is hashed but assigned to a scene only after confirmation', async () => {
    const root = await project();
    await mkdir(join(root, 'assets'));
    await writeFile(
      join(root, 'assets', 'product.png'),
      await sharp({ create: { width: 2, height: 2, channels: 4, background: '#e9dfcf' } }).png().toBuffer(),
    );

    const result = await inspectAssets(root);
    expect(result.summary).toBe('available');
    expect(result.assets[0]).toMatchObject({
      mediaType: 'image/png',
      status: 'available',
      sourcePath: 'assets/product.png',
      confirmed: false,
      assignedSceneIds: [],
    });
    expect(result.assets[0].sha256).toMatch(/^[a-f0-9]{64}$/);

    const confirmed = await confirmAssetAssignment(root, result.assets[0].id, ['scene-1']);
    expect(confirmed).toMatchObject({ confirmed: true, assignedSceneIds: ['scene-1'] });
  });

  test('corrupt and oversized files fail with their exact portable path', async () => {
    const corruptRoot = await project();
    await mkdir(join(corruptRoot, 'assets'));
    await writeFile(join(corruptRoot, 'assets', 'broken.png'), Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00,
    ]));
    await expect(inspectAssets(corruptRoot)).rejects.toThrow('assets/broken.png');

    const largeRoot = await project();
    await mkdir(join(largeRoot, 'assets'));
    await writeFile(join(largeRoot, 'assets', 'notes.txt'), '1234');
    await expect(inspectAssets(largeRoot, { maxBytes: 3 })).rejects.toThrow('assets/notes.txt');
  });

  test('a truncated image is rejected even when its metadata header is readable', async () => {
    const root = await project();
    await mkdir(join(root, 'assets'));
    const png = await sharp({ create: { width: 8, height: 8, channels: 4, background: '#112233' } }).png().toBuffer();
    await writeFile(join(root, 'assets', 'truncated.png'), png.subarray(0, png.length - 12));

    await expect(inspectAssets(root)).rejects.toThrow('assets/truncated.png');
  });

  test('URL capture provenance is localized without leaking an absolute path', async () => {
    const root = await project();
    await mkdir(join(root, 'capture'), { recursive: true });
    const localPath = join(root, 'capture', 'brand.md');
    await writeFile(localPath, '# 品牌资料');

    const result = await inspectAssets(root, {
      urlCaptures: [{ url: 'https://example.com/product', localPath }],
    });
    expect(result.assets[0]).toMatchObject({
      source: 'captured',
      sourcePath: 'capture/brand.md',
      sourceUrl: 'https://example.com/product',
    });
    expect(JSON.stringify(result)).not.toContain(root);
  });

  test('missing capture errors never expose a private absolute path', async () => {
    const root = await project();
    const missing = join(root, 'capture', 'missing.png');
    const error = await inspectAssets(root, {
      urlCaptures: [{ url: 'https://example.com/missing', localPath: missing }],
    }).catch((reason: unknown) => reason);

    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain('capture/missing.png');
    expect((error as Error).message).not.toContain(root);
  });

  test('the asset contract rejects traversal and impossible assignment states', () => {
    const base = {
      version: '1.0',
      id: 'asset-1',
      kind: 'image',
      mediaType: 'image/png',
      status: 'available',
      source: 'user',
      sourcePath: 'assets/product.png',
      sha256: 'a'.repeat(64),
      bytes: 42,
      assignedSceneIds: [],
      confirmed: false,
    } as const;

    expect(() => AssetRecordSchema.parse({ ...base, sourcePath: '../secret.png' })).toThrow();
    expect(() => AssetRecordSchema.parse({ ...base, sourcePath: '\\secret.png' })).toThrow();
    expect(() => AssetRecordSchema.parse({ ...base, assignedSceneIds: ['scene-1'] })).toThrow();
    expect(() => AssetRecordSchema.parse({ ...base, source: 'captured' })).toThrow();
  });

  test.each([
    ['fake.mp4', Buffer.concat([
      Buffer.from([0, 0, 0, 8]), Buffer.from('ftyp'),
      Buffer.from([0, 0, 0, 8]), Buffer.from('mdat'),
    ])],
    ['fake.webm', Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 0x18, 0x53, 0x80, 0x67])],
    ['fake.pdf', Buffer.from('%PDF-1.7\n%%EOF')],
  ])('%s requires real parseable content, not marker bytes', async (name, bytes) => {
    const root = await project();
    await mkdir(join(root, 'assets'));
    await writeFile(join(root, 'assets', name as string), bytes);
    await expect(inspectAssets(root)).rejects.toThrow(`assets/${name}`);
  });

  test('directory and ledger failures stay inside the portable error boundary', async () => {
    const root = await project();
    await writeFile(join(root, 'assets'), 'not a directory');
    const error = await inspectAssets(root).catch((reason: unknown) => reason);

    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain('assets');
    expect((error as Error).message).not.toContain(root);
  });

  test('a missing configured ffprobe is reported as an environment problem, not corrupt media', async () => {
    const root = await project();
    await mkdir(join(root, 'assets'));
    await writeFile(join(root, 'assets', 'video.mp4'), Buffer.from('not relevant before probe startup'));
    const previous = process.env.HYPERFRAMES_FFPROBE_PATH;
    process.env.HYPERFRAMES_FFPROBE_PATH = join(root, 'tools', 'missing-ffprobe');
    try {
      const error = await inspectAssets(root).catch((reason: unknown) => reason);
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain('HYPERFRAMES_FFPROBE_PATH');
      expect((error as Error).message).toContain('assets/video.mp4');
      expect((error as Error).message).not.toContain('素材内容损坏');
      expect((error as Error).message).not.toContain(root);
    } finally {
      if (previous === undefined) delete process.env.HYPERFRAMES_FFPROBE_PATH;
      else process.env.HYPERFRAMES_FFPROBE_PATH = previous;
    }
  });
});
