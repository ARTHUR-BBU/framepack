import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';

export type NpxInvocation = { executable: string; args: string[]; shell: false };

export function resolveNpxInvocation(args: string[], platform: NodeJS.Platform = process.platform): NpxInvocation {
  return platform === 'win32'
    ? { executable: process.execPath, args: [resolve(dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npx-cli.js'), ...args], shell: false }
    : { executable: 'npx', args, shell: false };
}

export async function runHyperframes(command: string, projectDir: string, options: { runner?: (args: string[]) => Promise<void>; args?: string[] } = {}): Promise<void> {
  const args = [command, projectDir, ...(options.args ?? [])];
  if (options.runner) return options.runner(args);
  const invocation = resolveNpxInvocation(['--no-install', 'hyperframes', ...args]);
  await new Promise<void>((resolve, reject) => {
    const child = spawn(invocation.executable, invocation.args, { stdio: 'inherit', shell: invocation.shell });
    child.once('error', reject);
    child.once('exit', (code) => code === 0 ? resolve() : reject(new Error(`hyperframes ${command} failed with exit code ${code}`)));
  });
}