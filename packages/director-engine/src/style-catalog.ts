import { readFileSync } from 'node:fs';
import {
  DirectionSelectionSchema,
  StyleCatalogSchema,
  type DirectionSelection,
  type StyleCatalog,
  type VisualStyle,
} from '@framepack/director-contracts';

let cachedCatalog: StyleCatalog | undefined;

export function loadStyleCatalog(): StyleCatalog {
  if (!cachedCatalog) {
    const path = new URL('../../director-assets/styles/catalog.json', import.meta.url);
    cachedCatalog = StyleCatalogSchema.parse(JSON.parse(readFileSync(path, 'utf8')));
  }
  return cachedCatalog;
}

function style(id: VisualStyle['id']): VisualStyle {
  const result = loadStyleCatalog().styles.find((item) => item.id === id);
  if (!result) throw new Error(`style catalog is missing ${id}`);
  return result;
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

export function chooseDirection(input: { goal: string; feedback: string[] }): DirectionSelection {
  const text = `${input.goal} ${input.feedback.join(' ')}`.toLowerCase();
  const wantsWarmth = /降低科技感|增加温度|温暖|有人味|柔和|生活方式/.test(text);
  const isPremium = /高端|高级|奢侈|仪式|enterprise|企业/.test(text);
  const isCommunity = /食品|社区|文化|餐饮|消费/.test(text);
  const isSecurity = /安全|security|揭秘|风险/.test(text);
  const isAiOrData = /\bai\b|人工智能|机器学习|数据/.test(text);
  const isSaas = /saas|软件|开发工具|效率/.test(text);
  const isLoud = /重大发布|活动|促销|宣言|炸/.test(text);

  let primaryStyle: VisualStyle['id'] = 'velvet-standard';
  let supportingStyle: VisualStyle['id'] = 'soft-signal';
  let tasteMoves: DirectionSelection['tasteMoves'] = ['object-worship', 'product-reveal-ritual'];
  let rationale = '以克制的产品仪式感建立价值，再用柔和细节补充亲近感。';

  if (isSaas || isAiOrData) {
    primaryStyle = isAiOrData ? 'data-drift' : 'swiss-pulse';
    supportingStyle = isAiOrData ? 'swiss-pulse' : 'data-drift';
    tasteMoves = isAiOrData ? ['data-cathedral', 'system-awakening'] : ['editorial-punch', 'interface-ballet'];
    rationale = '用清晰结构建立可信度，让技术信息成为空间而不是装饰。';
  }
  if (isSecurity) {
    primaryStyle = 'shadow-cut';
    supportingStyle = 'deconstructed';
    tasteMoves = ['cold-open', 'silence-before-drop'];
    rationale = '通过局部显形和蓄力释放制造悬念，同时保持信息可核对。';
  } else if (isCommunity) {
    primaryStyle = 'folk-frequency';
    supportingStyle = 'soft-signal';
    tasteMoves = ['human-imperfection', 'motif-reincarnation'];
    rationale = '用手作感和鲜活节拍表达社区温度，避免通用科技蓝。';
  } else if (isLoud && !isPremium) {
    primaryStyle = 'maximalist-type';
    supportingStyle = 'deconstructed';
    tasteMoves = ['kinetic-typography-attack', 'editorial-punch'];
    rationale = '让文字本身承担发布冲击，减少无意义装饰。';
  } else if (isPremium) {
    primaryStyle = 'velvet-standard';
    supportingStyle = 'shadow-cut';
    tasteMoves = ['product-reveal-ritual', 'object-worship', 'silence-before-drop'];
    rationale = '用产品崇拜和揭幕仪式塑造高级感，靠静默而不是堆特效蓄力。';
  }
  if (wantsWarmth) {
    primaryStyle = 'soft-signal';
    supportingStyle = 'velvet-standard';
    tasteMoves = ['human-imperfection', 'object-worship'];
    rationale = '主动降低界面科技符号，用真实材质、呼吸和轻微不规则增加温度。';
  }

  const surpriseOperators: DirectionSelection['surpriseOperators'] = /惊喜|反转|意外/.test(text)
    ? ['motif-reversal']
    : [];
  const avoid = unique([
    ...style(primaryStyle).avoid,
    ...style(supportingStyle).avoid,
    ...(wantsWarmth ? ['neon-interface-cliches'] : []),
  ]);

  return DirectionSelectionSchema.parse({
    version: '1.0',
    primaryStyle,
    supportingStyle,
    tasteMoves,
    surpriseOperators,
    avoid,
    rationale,
  });
}
