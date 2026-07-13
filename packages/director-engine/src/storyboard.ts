import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  StoryboardBriefSchema,
  StoryboardSchema,
  type DirectionSelection,
  type Storyboard,
  type StoryboardBrief,
  type StoryboardScene,
} from '@framepack/director-contracts';
import { stableStringify } from './content-hash.js';
import type { ProjectStore } from './project-store.js';

const TITLES: Record<StoryboardScene['purpose'], string> = {
  hook: '第一幕：提出渴望',
  proof: '第二幕：真实产品证明',
  experience: '第三幕：体验展开',
  cta: '终幕：行动定格',
};

const WEIGHTS: Record<StoryboardScene['purpose'], number> = { hook: 0.2, proof: 0.55, experience: 0.25, cta: 0.25 };

export function generateStoryboard(input: StoryboardBrief, direction: DirectionSelection): Storyboard {
  const brief = StoryboardBriefSchema.parse(input);
  const purposes = brief.scenePurposes ?? ['hook', 'proof', 'cta'];
  const weightTotal = purposes.reduce((sum, purpose) => sum + WEIGHTS[purpose], 0);
  const minimumSceneDuration = 0.001;
  const distributableDuration = brief.durationSeconds - purposes.length * minimumSceneDuration;
  let cursor = 0;
  const warm = direction.primaryStyle === 'soft-signal';
  const scenes = purposes.map((purpose, index): StoryboardScene => {
    const durationSeconds = index === purposes.length - 1
      ? round(brief.durationSeconds - cursor)
      : round(minimumSceneDuration + distributableDuration * WEIGHTS[purpose] / weightTotal);
    const scene: StoryboardScene = {
      id: `scene-${index + 1}-${purpose}`,
      title: TITLES[purpose],
      purpose,
      startSeconds: cursor,
      durationSeconds,
      narrativeBeat: narrativeFor(purpose, brief),
      visualFocus: visualFor(purpose, brief, warm),
      layers: layersFor(purpose, warm),
      assetIds: purpose === 'proof' || purpose === 'experience' ? brief.assetIds : [],
      motionGrammar: motionFor(purpose),
      transitionSeed: purpose === 'cta' ? '停住呼吸，让行动信息稳定落版' : '由当前视觉动因自然推入下一幕',
      audioIntent: purpose === 'hook' ? '克制开场，先留半拍再出现主脉冲' : purpose === 'cta' ? '音乐收束并保留清晰尾音' : '节奏跟随真实产品证据推进',
      negativeConstraints: [...new Set([...direction.avoid, 'unsupported-claims'])],
      revisionOf: null,
      revisionReason: null,
    };
    cursor = round(cursor + durationSeconds);
    return scene;
  });
  const payload = { brief, direction, scenes };
  return StoryboardSchema.parse({
    version: '1.0',
    id: `storyboard-${createHash('sha256').update(stableStringify(payload)).digest('hex').slice(0, 12)}`,
    title: brief.title,
    durationSeconds: brief.durationSeconds,
    direction,
    sourceBrief: brief,
    revisionOf: null,
    revisionReason: null,
    createdAt: new Date().toISOString(),
    scenes,
  });
}

export function reviseStoryboard(before: Storyboard, feedback: string, direction: DirectionSelection): Storyboard {
  const source = StoryboardSchema.parse(before);
  const revised = generateStoryboard(source.sourceBrief, direction);
  return StoryboardSchema.parse({
    ...revised,
    id: `storyboard-${createHash('sha256').update(stableStringify({ source: source.id, feedback, direction })).digest('hex').slice(0, 12)}`,
    revisionOf: source.id,
    revisionReason: feedback,
    scenes: revised.scenes.map((scene, index) => ({
      ...scene,
      revisionOf: source.scenes[index]?.id ?? source.id,
      revisionReason: feedback,
    })),
  });
}

export async function persistStoryboard(projectDir: string, input: Storyboard, store: ProjectStore): Promise<void> {
  const storyboard = StoryboardSchema.parse(input);
  const framepackDir = join(projectDir, '.framepack');
  await mkdir(framepackDir, { recursive: true });
  await Promise.all([
    writeFile(join(framepackDir, 'storyboard.json'), `${JSON.stringify(storyboard, null, 2)}\n`),
    writeFile(join(framepackDir, 'storyboard.md'), renderChineseStoryboard(storyboard)),
  ]);
  const fingerprint = await store.readFingerprint();
  const { createdAt: _createdAt, ...semanticStoryboard } = storyboard;
  await store.updateFingerprint({ ...fingerprint, storyboard: semanticStoryboard });
}

function renderChineseStoryboard(storyboard: Storyboard): string {
  const scenes = storyboard.scenes.map((scene) => [
    `## ${scene.title}（${scene.startSeconds}–${round(scene.startSeconds + scene.durationSeconds)} 秒）`,
    '',
    `- 这一幕要完成：${scene.narrativeBeat}`,
    `- 观众首先看到：${scene.visualFocus}`,
    `- 真实素材：${scene.assetIds.length ? scene.assetIds.join('、') : '本幕不强行使用，避免伪造素材'}`,
    `- 三层构图：背景层 ${scene.layers.background.join('、')}；中景层 ${scene.layers.midground.join('、')}；前景层 ${scene.layers.foreground.join('、')}`,
    `- 动作逻辑：${scene.motionGrammar}`,
    `- 转场种子：${scene.transitionSeed}`,
    `- 声音意图：${scene.audioIntent}`,
    `- 禁止事项：${scene.negativeConstraints.join('、')}`,
    `- 修订来源：${scene.revisionOf ? `${scene.revisionOf}（${scene.revisionReason}）` : '初稿'}`,
  ].join('\n')).join('\n\n');
  return `# 导演分镜：${storyboard.title}\n\n总时长：${storyboard.durationSeconds} 秒  \n主风格：${storyboard.direction.primaryStyle}  \n辅助风格：${storyboard.direction.supportingStyle}\n\n${scenes}\n`;
}

function narrativeFor(purpose: StoryboardScene['purpose'], brief: StoryboardBrief): string {
  if (purpose === 'hook') return `把“${brief.corePromise}”先变成一个观众能感受到的问题`;
  if (purpose === 'proof') return `用真实产品素材证明：${brief.benefits.join('、')}`;
  if (purpose === 'experience') return `让观众顺着产品体验理解：${brief.benefits.join('、')}`;
  return `把兴趣收束为明确行动：“${brief.cta}”`;
}

function visualFor(purpose: StoryboardScene['purpose'], brief: StoryboardBrief, warm: boolean): string {
  const world = warm ? '温暖留白与真实纸张触感' : '精密信号网格与数据脉冲';
  if (purpose === 'proof' || purpose === 'experience') return `${world}中的真实产品界面，产品始终是主角`;
  if (purpose === 'cta') return `${world}中稳定清晰的“${brief.cta}”行动落版`;
  return `${world}包围的核心承诺：“${brief.corePromise}”`;
}

function layersFor(purpose: StoryboardScene['purpose'], warm: boolean): StoryboardScene['layers'] {
  return {
    background: [warm ? '暖灰纸张纹理与柔和自然阴影' : '低对比信号网格与缓慢漂移的坐标'],
    midground: [purpose === 'proof' || purpose === 'experience' ? '真实产品画面与核心功能关系' : '核心文案与空间主形'],
    foreground: [warm ? '克制的手写标记与呼吸留白' : '少量刻度、游标与证据标注'],
  };
}

function motionFor(purpose: StoryboardScene['purpose']): StoryboardScene['motionGrammar'] {
  if (purpose === 'hook') return 'tension-release';
  if (purpose === 'proof') return 'cause-reveal';
  if (purpose === 'experience') return 'follow-through';
  return 'breath-punch-silence';
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}
