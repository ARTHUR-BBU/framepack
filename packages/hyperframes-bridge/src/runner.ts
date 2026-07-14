import { spawn } from 'node:child_process';

export async function runHyperframes(command: string, projectDir: string, options: { runner?: (args: string[]) => Promise<void>; args?: string[] } = {}): Promise<void> {
  const args = [command, projectDir, ...(options.args ?? [])];
  if (options.runner) return options.runner(args);
  await new Promise<void>((resolve, reject) => {
    const executable = process.platform === 'win32' ? 'npx.cmd' : 'npx';
    const child = spawn(executable, ['--no-install', 'hyperframes', ...args], { stdio: 'inherit', shell: process.platform === 'win32' });
    child.once('error', reject);
    child.once('exit', (code) => code === 0 ? resolve() : reject(new Error(`hyperframes ${command} failed with exit code ${code}`)));
  });
}