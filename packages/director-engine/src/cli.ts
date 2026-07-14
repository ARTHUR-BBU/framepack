import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { BriefSchema, DirectionProposalSchema, ReviewScorecardSchema } from '@framepack/director-contracts';
import { approveProject, auditProject, buildProject, handoffProject, initProject, inspectAssets, runProjectProposal, snapshotProject, waiveProject } from './index.js';
import { doctor, renderDoctorChinese } from './doctor.js';

function option(args: string[], name: string, fallback?: string): string | undefined {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : fallback;
}

async function run(): Promise<void> {
  const [command, project] = process.argv.slice(2);
  if (!command) throw new Error('usage: framepack-director <doctor|init|brief|assets|direct|revise|serve|review|build|snapshot|audit|approve|waive|handoff> [project]');
  if (command === 'doctor') { console.log(renderDoctorChinese(await doctor(project ?? process.cwd()))); return; }
  if (!project) throw new Error(`project path is required for ${command}`);
  if (command === 'init') {
    await initProject(project, { title: option(process.argv, '--title', 'Untitled Director Preview')!, aspectRatio: option(process.argv, '--aspect', '16:9') as '16:9' | '9:16', durationSeconds: Number(option(process.argv, '--duration', '30')) });
    console.log(`initialized ${project}`);
    return;
  }
  if (command === 'build') { console.log(JSON.stringify(await buildProject(project))); return; }
  if (command === 'brief') {
    const brief = BriefSchema.parse({ goal: option(process.argv, '--goal'), audience: option(process.argv, '--audience', '未指定受众'), constraints: [] });
    await writeFile(join(project, '.framepack', 'brief.json'), `${JSON.stringify(brief, null, 2)}\n`, 'utf8');
    console.log(JSON.stringify(brief)); return;
  }
  if (command === 'assets') {
    if (process.argv[4] !== 'add') throw new Error('assets requires: assets <project> add <paths...>');
    const sources = process.argv.slice(5);
    if (!sources.length) throw new Error('assets add requires at least one path');
    await mkdir(join(project, 'assets'), { recursive: true });
    for (const source of sources) await cp(source, join(project, 'assets', source.split(/[\\/]/).at(-1)!));
    console.log(JSON.stringify(await inspectAssets(project))); return;
  }
  if (command === 'direct') {
    const proposalPath = option(process.argv, '--proposal-file');
    if (!proposalPath) throw new Error('direct requires --proposal-file <UTF-8 JSON path>');
    const proposalText = await readFile(proposalPath, 'utf8');
    const proposal = DirectionProposalSchema.parse(JSON.parse(proposalText));
    const brief = await readBriefOrProposal(project, proposal);
    const result = await runProjectProposal({ projectDir: project, brief, proposal, retryCount: Number(option(process.argv, '--retry-count', '0')), cancelled: process.argv.includes('--cancelled') });
    console.log(JSON.stringify(result)); return;
  }
  if (command === 'revise') {
    const feedback = option(process.argv, '--feedback');
    const proposalPath = option(process.argv, '--proposal-file');
    if (!feedback || !proposalPath) throw new Error('revise requires --feedback and --proposal-file');
    const proposalText = await readFile(proposalPath, 'utf8');
    const proposal = DirectionProposalSchema.parse(JSON.parse(proposalText));
    const result = await runProjectProposal({ projectDir: project, brief: await readBriefOrProposal(project, proposal), proposal, feedback, retryCount: Number(option(process.argv, '--retry-count', '0')), cancelled: process.argv.includes('--cancelled') });
    console.log(JSON.stringify(result)); return;
  }
  if (command === 'review') {
    const scorecardPath = option(process.argv, '--scorecard');
    if (!scorecardPath) throw new Error('review requires --scorecard <JSON path>');
    const scorecard = ReviewScorecardSchema.parse(JSON.parse(await readFile(scorecardPath, 'utf8')));
    console.log(JSON.stringify(await auditProject(project, { scorecard }))); return;
  }
  if (command === 'serve') {
    const { startWorkbenchServer } = await import('../../../apps/director-workbench/src/server.js');
    const server = await startWorkbenchServer(project, Number(option(process.argv, '--port', '0')));
    console.log(`Framepack 导演台：${server.url}`); return;
  }
  if (command === 'snapshot') { console.log(JSON.stringify(await snapshotProject(project))); return; }
  if (command === 'audit') { console.log(JSON.stringify(await auditProject(project))); return; }
  if (command === 'approve') { console.log(JSON.stringify(await approveProject(project, option(process.argv, '--reason', 'Approved in Codex Director Workbench')!))); return; }
  if (command === 'waive') { console.log(JSON.stringify(await waiveProject(project, option(process.argv, '--reason', 'Waived in Codex Director Workbench')!))); return; }
  if (command === 'handoff') { console.log(JSON.stringify(await handoffProject(project))); return; }
  throw new Error(`unknown director command: ${command}`);
}

async function readBriefOrProposal(project: string, proposal: { title: string; summary: string }): Promise<ReturnType<typeof BriefSchema.parse>> {
  try { return BriefSchema.parse(JSON.parse(await readFile(join(project, '.framepack', 'brief.json'), 'utf8'))); }
  catch { return BriefSchema.parse({ goal: proposal.summary, audience: '未指定受众', constraints: [] }); }
}

run().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
