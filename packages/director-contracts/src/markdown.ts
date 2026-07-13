export function renderStoryboardMarkdown(input: { title: string; scenes: string[] }): string {
  const scenes = input.scenes.map((scene, index) => `## Scene ${index + 1} — ${scene}\n\n- Visual focus:\n- Motion beat:\n- Transition out:`);
  return `# ${input.title} Storyboard\n\n${scenes.join('\n\n')}`;
}

export function renderAssetIntakeMarkdown(title: string): string {
  return `# ${title} Asset Intake\n\n- Goal:\n- Available assets:\n- Missing assets:\n- Audio / subtitle intent:`;
}

export function renderPreviewReportMarkdown(): string {
  return '# Preview Report\n\n| Time | Expected state | Observed state | Result |\n| --- | --- | --- | --- |';
}

export function renderTasteAuditMarkdown(): string {
  return '# Taste Audit\n\n- commercial_quality:\n- ppt_feel:\n- motion_quality:\n- visual_density:\n- material_usage:\n- audio_readiness:\n- recommend_handoff_to_hyperframes:';
}

export function renderRenderPlanMarkdown(): string {
  return '# HyperFrames Render Plan\n\n1. lint\n2. check\n3. render\n4. ffprobe\n5. snapshot-review';
}
