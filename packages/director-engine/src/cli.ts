import { approveProject, auditProject, buildProject, handoffProject, initProject, snapshotProject, waiveProject } from './index.js';

function option(args: string[], name: string, fallback?: string): string | undefined {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : fallback;
}

async function run(): Promise<void> {
  const [command, project] = process.argv.slice(2);
  if (!command || !project) throw new Error('usage: framepack director <init|build|snapshot|audit|approve|waive|handoff> <project>');
  if (command === 'init') {
    await initProject(project, { title: option(process.argv, '--title', 'Untitled Director Preview')!, aspectRatio: option(process.argv, '--aspect', '16:9') as '16:9' | '9:16', durationSeconds: Number(option(process.argv, '--duration', '30')) });
    console.log(`initialized ${project}`);
    return;
  }
  if (command === 'build') { console.log(JSON.stringify(await buildProject(project))); return; }
  if (command === 'snapshot') { console.log(JSON.stringify(await snapshotProject(project))); return; }
  if (command === 'audit') { console.log(JSON.stringify(await auditProject(project))); return; }
  if (command === 'approve') { console.log(JSON.stringify(await approveProject(project, option(process.argv, '--reason', 'Approved in Codex Director Workbench')!))); return; }
  if (command === 'waive') { console.log(JSON.stringify(await waiveProject(project, option(process.argv, '--reason', 'Waived in Codex Director Workbench')!))); return; }
  if (command === 'handoff') { console.log(JSON.stringify(await handoffProject(project))); return; }
  throw new Error(`unknown director command: ${command}`);
}

run().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
