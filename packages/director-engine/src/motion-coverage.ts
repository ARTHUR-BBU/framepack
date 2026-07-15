import { MotionCoverageSchema, type MotionCoverage, type Storyboard, type WeaponLoadPlan } from '@framepack/director-contracts';

type Action = Pick<WeaponLoadPlan['selected'][number], 'sceneId' | 'atSeconds' | 'durationSeconds'>;

export function assessMotionCoverage(buildId: string, storyboard: Pick<Storyboard, 'scenes'>, actions: Action[]): MotionCoverage {
  const scenes = storyboard.scenes.map((scene) => {
    const intervals = actions.filter((action) => action.sceneId === scene.id)
      .map((action) => ({ start: action.atSeconds, end: Math.min(scene.durationSeconds, action.atSeconds + action.durationSeconds) }))
      .sort((left, right) => left.start - right.start);
    if (!intervals.length) return { sceneId: scene.id, activeSeconds: 0, coverageRatio: 1, quietGaps: [], status: 'pass' as const };
    const merged: Array<{ start: number; end: number }> = [];
    for (const interval of intervals) {
      const previous = merged.at(-1);
      if (previous && interval.start <= previous.end) previous.end = Math.max(previous.end, interval.end);
      else merged.push(interval);
    }
    const activeSeconds = merged.reduce((total, interval) => total + Math.max(0, interval.end - interval.start), 0);
    const quietGaps = [{ start: 0, end: merged[0]?.start ?? scene.durationSeconds }, ...merged.map((interval, index) => ({ start: interval.end, end: merged[index + 1]?.start ?? scene.durationSeconds }))]
      .filter((gap) => gap.end - gap.start > 1.5)
      .map((gap) => ({ startSeconds: gap.start, durationSeconds: gap.end - gap.start }));
    const coverageRatio = activeSeconds / scene.durationSeconds;
    const status = coverageRatio >= 0.55 && quietGaps.length === 0 ? 'pass' as const : 'motion-density-low' as const;
    return { sceneId: scene.id, activeSeconds, coverageRatio, quietGaps, status };
  });
  return MotionCoverageSchema.parse({ version: '1.0', buildId, scenes, status: scenes.every((scene) => scene.status === 'pass') ? 'pass' : 'needs_review' });
}
