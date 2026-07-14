export type SnapshotPlan = { frames: Array<{ label: string; timeSeconds: number }> };

export function createSnapshotPlan(durationSeconds: number): SnapshotPlan {
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) throw new Error('snapshot duration must be positive');
  const third = durationSeconds / 3;
  return { frames: [
    { label: 'scene-1-settled', timeSeconds: third * 0.6 },
    { label: 'transition-1-midpoint', timeSeconds: third },
    { label: 'scene-2-settled', timeSeconds: third * 1.6 },
    { label: 'transition-2-midpoint', timeSeconds: third * 2 },
    { label: 'scene-3-settled', timeSeconds: third * 2.6 },
    { label: 'final-hold', timeSeconds: Math.max(0, durationSeconds - 0.25) },
  ] };
}