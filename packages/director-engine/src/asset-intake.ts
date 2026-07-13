import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { extname, isAbsolute, join, relative, resolve } from 'node:path';
import sharp from 'sharp';
import {
  AssetLedgerSchema,
  AssetRecordSchema,
  type AssetLedger,
  type AssetRecord,
} from '@framepack/director-contracts';

const DEFAULT_MAX_BYTES = 512 * 1024 * 1024;
const MEDIA_TYPES: Record<string, { kind: AssetRecord['kind']; mediaType: string }> = {
  '.png': { kind: 'image', mediaType: 'image/png' },
  '.jpg': { kind: 'image', mediaType: 'image/jpeg' },
  '.jpeg': { kind: 'image', mediaType: 'image/jpeg' },
  '.webp': { kind: 'image', mediaType: 'image/webp' },
  '.mp4': { kind: 'video', mediaType: 'video/mp4' },
  '.mov': { kind: 'video', mediaType: 'video/quicktime' },
  '.webm': { kind: 'video', mediaType: 'video/webm' },
  '.md': { kind: 'document', mediaType: 'text/markdown' },
  '.txt': { kind: 'document', mediaType: 'text/plain' },
  '.pdf': { kind: 'document', mediaType: 'application/pdf' },
};

export type UrlCapture = { url: string; localPath: string };
export type AssetInspectionOptions = { maxBytes?: number; urlCaptures?: UrlCapture[] };

function portablePath(projectDir: string, file: string): string {
  const path = relative(projectDir, file);
  if (!path || path.startsWith('..') || isAbsolute(path)) {
    throw new Error('asset path must stay inside the project');
  }
  return path.split('\\').join('/');
}

async function filesBelow(directory: string): Promise<string[]> {
  if (!existsSync(directory)) return [];
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesBelow(path) : entry.isFile() ? [path] : [];
  }));
  return nested.flat().sort();
}

class VideoProbeUnavailableError extends Error {}

function completeImageContainer(extension: string, buffer: Buffer): boolean {
  if (extension === '.png') {
    return buffer.subarray(-12).equals(Buffer.from([0, 0, 0, 0, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82]));
  }
  if (extension === '.jpg' || extension === '.jpeg') return buffer.subarray(-2).equals(Buffer.from([0xff, 0xd9]));
  if (extension === '.webp') return buffer.length >= 12
    && buffer.subarray(0, 4).toString('ascii') === 'RIFF'
    && buffer.subarray(8, 12).toString('ascii') === 'WEBP'
    && buffer.readUInt32LE(4) + 8 === buffer.length;
  return false;
}

function probeVideo(file: string): Promise<boolean> {
  return new Promise((resolveProbe, rejectProbe) => {
    const executable = process.env.HYPERFRAMES_FFPROBE_PATH?.trim() || 'ffprobe';
    const child = spawn(executable, [
      '-v', 'error',
      '-show_entries', 'stream=codec_type',
      '-of', 'json',
      file,
    ], { windowsHide: true });
    let stdout = '';
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill();
      rejectProbe(new VideoProbeUnavailableError('视频探测工具超时；请检查 HYPERFRAMES_FFPROBE_PATH'));
    }, 15_000);
    child.stdout.on('data', (chunk: Buffer) => { stdout += chunk.toString('utf8'); });
    child.once('error', () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      rejectProbe(new VideoProbeUnavailableError('无法启动视频探测工具；请检查 HYPERFRAMES_FFPROBE_PATH'));
    });
    child.once('exit', (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (code !== 0) return resolveProbe(false);
      try {
        const result = JSON.parse(stdout) as { streams?: Array<{ codec_type?: string }> };
        resolveProbe(Boolean(result.streams?.some((stream) => stream.codec_type === 'video')));
      } catch {
        resolveProbe(false);
      }
    });
  });
}

async function validContent(extension: string, buffer: Buffer, file: string): Promise<boolean> {
  if (extension === '.png' || extension === '.jpg' || extension === '.jpeg' || extension === '.webp') {
    try {
      const image = sharp(buffer, { failOn: 'error' });
      const metadata = await image.metadata();
      const decoded = await image.clone().raw().toBuffer({ resolveWithObject: true });
      const expected = extension === '.png' ? 'png' : extension === '.webp' ? 'webp' : 'jpeg';
      return metadata.format === expected
        && Boolean(metadata.width && metadata.height)
        && decoded.info.width === metadata.width
        && decoded.info.height === metadata.height
        && completeImageContainer(extension, buffer);
    } catch {
      return false;
    }
  }
  if (extension === '.mp4' || extension === '.mov' || extension === '.webm') return probeVideo(file);
  if (extension === '.pdf') {
    try {
      const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
      const loadingTask = getDocument({ data: new Uint8Array(buffer), useSystemFonts: false });
      const document = await loadingTask.promise;
      const valid = document.numPages > 0;
      await loadingTask.destroy();
      return valid;
    } catch {
      return false;
    }
  }
  if (extension === '.md' || extension === '.txt') return !buffer.toString('utf8').includes('\ufffd');
  return false;
}

async function inspectFile(
  projectDir: string,
  file: string,
  source: AssetRecord['source'],
  maxBytes: number,
  sourceUrl?: string,
): Promise<AssetRecord> {
  const sourcePath = portablePath(projectDir, file);
  const extension = extname(file).toLowerCase();
  const media = MEDIA_TYPES[extension];
  if (!media) throw new Error(`不支持的素材格式：${sourcePath}`);
  let details;
  try {
    details = await stat(file);
  } catch {
    throw new Error(`无法读取素材：${sourcePath}`);
  }
  if (details.size > maxBytes) throw new Error(`素材超过大小限制：${sourcePath}`);
  let buffer: Buffer;
  try {
    buffer = await readFile(file);
  } catch {
    throw new Error(`无法读取素材：${sourcePath}`);
  }
  let valid: boolean;
  try {
    valid = await validContent(extension, buffer, file);
  } catch (error) {
    if (error instanceof VideoProbeUnavailableError) throw new Error(`${error.message}（素材：${sourcePath}）`);
    throw error;
  }
  if (!valid) throw new Error(`素材内容损坏或格式不符：${sourcePath}`);
  const sha256 = createHash('sha256').update(buffer).digest('hex');
  const id = `asset-${createHash('sha256').update(`${source}:${sourcePath}:${sha256}`).digest('hex').slice(0, 16)}`;
  return AssetRecordSchema.parse({
    version: '1.0',
    id,
    ...media,
    status: 'available',
    source,
    sourcePath,
    sourceUrl,
    sha256,
    bytes: details.size,
    assignedSceneIds: [],
    confirmed: false,
  });
}

function renderLedger(ledger: AssetLedger): string {
  const heading = ledger.summary === 'missing' ? '缺少素材' : `已发现 ${ledger.assets.length} 项素材`;
  const rows = ledger.assets.map((asset) => `| ${asset.sourcePath} | ${asset.mediaType} | ${asset.confirmed ? '已确认' : '待确认'} |`).join('\n');
  return `# 素材清单\n\n## ${heading}\n\n${rows ? `| 文件 | 类型 | 使用状态 |\n|---|---|---|\n${rows}` : '请添加产品图片、视频或品牌资料后重新检查。'}\n`;
}

async function writeLedger(projectDir: string, ledger: AssetLedger): Promise<void> {
  const directory = join(projectDir, '.framepack');
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, 'assets.json'), `${JSON.stringify(ledger, null, 2)}\n`, 'utf8');
  await writeFile(join(directory, 'asset-intake.md'), renderLedger(ledger), 'utf8');
}

async function inspectAssetsUnsafe(root: string, options: AssetInspectionOptions): Promise<AssetLedger> {
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
  if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0) throw new Error('maxBytes must be a positive integer');
  const userFiles = await filesBelow(join(root, 'assets'));
  const userAssets = await Promise.all(userFiles.map((file) => inspectFile(root, file, 'user', maxBytes)));
  const capturedAssets = await Promise.all((options.urlCaptures ?? []).map((capture) => {
    const localPath = isAbsolute(capture.localPath) ? resolve(capture.localPath) : resolve(root, capture.localPath);
    return inspectFile(root, localPath, 'captured', maxBytes, capture.url);
  }));
  const assets = [...userAssets, ...capturedAssets];
  const ledger = AssetLedgerSchema.parse({
    version: '1.0',
    summary: assets.length ? 'available' : 'missing',
    assets,
    inspectedAt: new Date().toISOString(),
  });
  await writeLedger(root, ledger);
  return ledger;
}

function portableError(error: unknown, root: string): Error {
  const message = error instanceof Error ? error.message : String(error);
  return new Error(message.split(root).join('.'));
}

export async function inspectAssets(projectDir: string, options: AssetInspectionOptions = {}): Promise<AssetLedger> {
  const root = resolve(projectDir);
  try {
    return await inspectAssetsUnsafe(root, options);
  } catch (error) {
    throw portableError(error, root);
  }
}

async function confirmAssetAssignmentUnsafe(root: string, assetId: string, sceneIds: string[]): Promise<AssetRecord> {
  if (!sceneIds.length || sceneIds.some((id) => !id.trim())) throw new Error('at least one scene ID is required');
  const path = join(root, '.framepack', 'assets.json');
  const ledger = AssetLedgerSchema.parse(JSON.parse(await readFile(path, 'utf8')));
  const asset = ledger.assets.find((item) => item.id === assetId);
  if (!asset) throw new Error(`unknown asset: ${assetId}`);
  asset.assignedSceneIds = [...new Set(sceneIds)];
  asset.confirmed = true;
  const updated = AssetLedgerSchema.parse({ ...ledger, assets: ledger.assets, inspectedAt: new Date().toISOString() });
  await writeLedger(root, updated);
  return AssetRecordSchema.parse(asset);
}

export async function confirmAssetAssignment(projectDir: string, assetId: string, sceneIds: string[]): Promise<AssetRecord> {
  const root = resolve(projectDir);
  try {
    return await confirmAssetAssignmentUnsafe(root, assetId, sceneIds);
  } catch (error) {
    throw portableError(error, root);
  }
}
