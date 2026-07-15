import { describe, expect, test } from 'vitest';
import {
  ApprovalSchema,
  AssetRecordSchema,
  DirectionProposalSchema,
  DirectorEventSchema,
  ProjectStateSchema,
  ReviewScorecardSchema,
} from '../packages/director-contracts/src/index.js';

describe('versioned director contracts', () => {
  test('a brief event preserves Chinese intent', () => {
    const event = DirectorEventSchema.parse({
      version: '1.0',
      id: 'evt-1',
      type: 'brief.updated',
      at: '2026-07-13T00:00:00.000Z',
      payload: { goal: '突出产品，降低科技感', audience: '第一次接触产品的人' },
    });

    expect(event.type).toBe('brief.updated');
    if (event.type === 'brief.updated') {
      expect(event.payload.goal).toContain('降低科技感');
    }
  });

  test('project state carries an exact schema version', () => {
    expect(ProjectStateSchema.parse({
      version: '1.0',
      projectId: 'project-1',
      phase: 'direction',
      currentBuildId: null,
      contentHash: null,
      updatedAt: '2026-07-13T00:00:00.000Z',
    }).version).toBe('1.0');

    expect(() => ProjectStateSchema.parse({
      version: 'latest',
      projectId: 'project-1',
      phase: 'direction',
      currentBuildId: null,
      contentHash: null,
      updatedAt: '2026-07-13T00:00:00.000Z',
    })).toThrow();
  });

  test('assets and direction proposals retain provenance', () => {
    expect(AssetRecordSchema.parse({
      version: '1.0',
      id: 'asset-1',
      kind: 'image',
      mediaType: 'image/png',
      status: 'available',
      source: 'user',
      sourcePath: 'assets/product.png',
      sha256: 'a'.repeat(64),
      bytes: 42,
      assignedSceneIds: [],
      confirmed: false,
    }).source).toBe('user');

    expect(DirectionProposalSchema.parse({
      version: '1.0',
      id: 'direction-1',
      title: '克制的产品首映',
      summary: '先让产品被看见，再让技术成为支撑。',
      visualStyleId: 'editorial-dark',
      rhythm: 'hook-breathe-proof-cta',
      assetIds: ['asset-1'],
    }).title).toContain('产品');
  });

  test('review evidence is bound to one content hash and seven explained scores', () => {
    const scorecard = {
      version: '1.0',
      buildId: 'build-1',
      contentHash: 'b'.repeat(64),
      source: 'codex',
      reviewer: 'codex:gpt-5',
      reviewedAt: '2026-07-13T00:00:00.000Z',
      scores: {
        intentClarity: 5,
        productFocus: 4,
        visualHierarchy: 4,
        materialQuality: 4,
        motionChoreography: 3,
        rhythm: 4,
        restraint: 5,
      },
      reasons: {
        intentClarity: '开场立刻说明核心价值。',
        productFocus: '产品始终是画面主角。',
        visualHierarchy: '主副信息层次清楚。',
        materialQuality: '真实素材多于装饰。',
        motionChoreography: '转场仍可更有呼吸。',
        rhythm: '快慢段落有清晰变化。',
        restraint: '没有为了炫技堆叠效果。',
      },
      evidenceFrames: ['.framepack/evidence/build-1/frame-001.png'],
      average: 4.14,
      verdict: 'needs_review',
    } as const;

    expect(ReviewScorecardSchema.parse(scorecard).scores.restraint).toBe(5);
    expect(() => ReviewScorecardSchema.parse({ ...scorecard, contentHash: '' })).toThrow();
    expect(() => ReviewScorecardSchema.parse({
      ...scorecard,
      reasons: { ...scorecard.reasons, rhythm: '' },
    })).toThrow();
    expect(() => ReviewScorecardSchema.parse({
      ...scorecard,
      scores: {
        intentClarity: 1,
        productFocus: 1,
        visualHierarchy: 1,
        materialQuality: 1,
        motionChoreography: 1,
        rhythm: 1,
        restraint: 1,
      },
      average: 5,
      verdict: 'pass',
    })).toThrow(/average/);
  });

  test('approval and decision events preserve the reviewed content hash', () => {
    const approval = {
      state: 'approved',
      reason: '方向确认',
      previewBuildId: 'build-1',
      contentHash: 'c'.repeat(64),
      decidedAt: '2026-07-13T00:00:00.000Z',
    } as const;

    expect(ApprovalSchema.parse(approval).contentHash).toBe('c'.repeat(64));
    expect(() => ApprovalSchema.parse({ ...approval, contentHash: '' })).toThrow();
    expect(() => ApprovalSchema.parse({
      state: approval.state,
      reason: approval.reason,
      previewBuildId: approval.previewBuildId,
      decidedAt: approval.decidedAt,
    })).toThrow();

    const event = DirectorEventSchema.parse({
      version: '1.0',
      id: 'evt-decision-1',
      type: 'decision.recorded',
      at: '2026-07-13T00:00:00.000Z',
      payload: approval,
    });
    expect(event.type === 'decision.recorded' && event.payload.contentHash).toBe('c'.repeat(64));
  });
});
