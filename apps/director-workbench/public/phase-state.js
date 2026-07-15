export function resolvePhase(state) {
  if (state.activeJobName === 'build') return 4;
  if (state.activeJobName === 'snapshot') return 5;
  if (state.activeJobName === 'audit') return 6;
  if (state.activeJobName === 'handoff' || state.project?.files?.handedOff) return 8;
  if (state.project?.decision) return 7;
  if (state.review) return 6;
  if (state.project?.files?.built) return 4;
  const usableAssets = state.assets?.assets?.filter((asset) => asset.status === 'available' && asset.confirmed) ?? [];
  if (!usableAssets.length) return 0;
  if (!state.direction) return 1;
  if (!state.storyboard?.scenes?.length) return 2;
  return 3;
}

export function hasStaleEvidence(current, decision, scorecard) {
  if (!current) return false;
  return [decision, scorecard].filter(Boolean).some((evidence) => {
    const buildId = evidence.previewBuildId ?? evidence.buildId;
    return buildId !== current.buildId || evidence.contentHash !== current.contentHash;
  });
}
