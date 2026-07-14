import { spawn } from 'node:child_process';
import { constants } from 'node:fs';
import { existsSync } from 'node:fs';
import { access } from 'node:fs/promises';
import { createServer } from 'node:net';
import { join } from 'node:path';
import { resolveNpxInvocation } from '../../hyperframes-bridge/src/index.js';

export type DoctorCheck = { id: string; status: 'pass' | 'warn'; detail: string; remediation?: string };
export type DoctorReport = { status: 'ready' | 'attention'; checks: DoctorCheck[] };

export async function doctor(projectRoot: string): Promise<DoctorReport> {
  const checks: DoctorCheck[] = [];
  checks.push({ id: 'node', status: Number(process.versions.node.split('.')[0]) >= 20 ? 'pass' : 'warn', detail: `Node ${process.versions.node}`, remediation: '请安装 Node.js 20 或更高版本。' });
  try { await access(projectRoot, constants.W_OK); checks.push({ id: 'project-root', status: 'pass', detail: '项目目录可写' }); }
  catch { checks.push({ id: 'project-root', status: 'warn', detail: '项目目录不可写', remediation: '请为 Codex 授权一个可写项目目录。' }); }
  checks.push(await commandCheck('hyperframes', resolveNpxInvocation(['--no-install', 'hyperframes', '--version']).executable, resolveNpxInvocation(['--no-install', 'hyperframes', '--version']).args, '请在当前环境安装 HyperFrames 0.7.56。', /0\.7\.56/));
  checks.push(await commandCheck('ffprobe', process.env.HYPERFRAMES_FFPROBE_PATH?.trim() || 'ffprobe', ['-version'], '请安装 ffmpeg/ffprobe，或设置 HYPERFRAMES_FFPROBE_PATH。'));
  const runtimeAssetsReady = existsSync(join(projectRoot, 'public', 'vendor', 'gsap.min.js')) && existsSync(join(projectRoot, 'public', 'fonts'));
  checks.push(runtimeAssetsReady
    ? { id: 'runtime-assets', status: 'pass', detail: '本地 GSAP 与字体目录已就绪' }
    : { id: 'runtime-assets', status: 'warn', detail: '项目尚无本地 GSAP 或字体', remediation: '先运行 init/direct；Framepack 会把运行时资源放进项目，不依赖 CDN。' });
  checks.push({ id: 'browser-port', status: await portAvailable() ? 'pass' : 'warn', detail: '本地浏览器端口探测完成', remediation: '请关闭占用端口的程序后重试。' });
  return { status: checks.every((check) => check.status === 'pass') ? 'ready' : 'attention', checks };
}

export function renderDoctorChinese(report: DoctorReport): string {
  return `Framepack 环境检查：${report.status === 'ready' ? '可以开工' : '需要处理'}\n${report.checks.map((check) => `${check.status === 'pass' ? '✓' : '△'} ${check.id}：${check.detail}${check.status === 'warn' && check.remediation ? `\n  处理办法：${check.remediation}` : ''}`).join('\n')}`;
}

function commandCheck(id: string, executable: string, args: string[], remediation: string, expected?: RegExp): Promise<DoctorCheck> {
  return new Promise((resolve) => {
    const child = spawn(executable, args, { windowsHide: true, shell: false });
    let output = '';
    child.stdout?.on('data', (chunk: Buffer) => { output += chunk.toString('utf8'); });
    child.stderr?.on('data', (chunk: Buffer) => { output += chunk.toString('utf8'); });
    child.once('error', () => resolve({ id, status: 'warn', detail: `${id} 不可用`, remediation }));
    child.once('exit', (code) => resolve(code === 0 && (!expected || expected.test(output))
      ? { id, status: 'pass', detail: output.trim().split(/\r?\n/)[0] || `${id} 可用` }
      : { id, status: 'warn', detail: output.trim().split(/\r?\n/)[0] || `${id} 版本不符合要求`, remediation }));
  });
}

function portAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer();
    server.once('error', () => resolve(false));
    server.listen(0, '127.0.0.1', () => server.close(() => resolve(true)));
  });
}
