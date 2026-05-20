# Animation Capability Atlas Design

## Purpose

The Animation Capability Atlas is Framepack's structured knowledge layer for video-production capabilities.

It answers a different question from `CAPABILITY_GRAPH.json`:

- The atlas describes the wider capability world Framepack understands.
- The graph describes the capabilities a specific generated package actually uses, lacks, recommends, or blocks on.

Framepack should not become every animation library, media model, skill, plugin, renderer, or creative tool. It should understand those capabilities well enough to classify them, recommend them, compose them, route agents toward them, and verify their outputs.

The atlas turns "what technology should we use?" into a structured, inspectable, and updateable decision surface for agents.

## Core Thesis

Video production for agents has two major material sources:

1. **Generative audio/video material**
   Frontier multimodal video models such as Seedance 2.0, Gemini Omni, and Kling 3.0 can create or edit video-like media directly from text, image, audio, and video references.

2. **Programmatic animation material**
   Web, runtime, and animation technologies such as Anime.js, GSAP, WAAPI, SVG, Canvas, PixiJS, Three.js, Lottie, Rive, sprite sheets, Remotion, FFmpeg, and HyperFrames create controllable motion from structured code, assets, and timelines.

Framepack's output is not only either of those material types. Framepack produces an **engineered video package**: source interpretation, scene planning, asset requirements, materialized or pending media assets, animation/composition decisions, runtime entrypoints, and verification evidence.

In short:

```text
generative media material
+ programmatic animation material
+ composition/runtime orchestration
+ agent workflow and verification
= engineered video package
```

## Relationship To Existing Framepack Concepts

| Concept | Role |
| --- | --- |
| Workflow Pack | Describes the production job, such as product explainer, game ad, course promo, or investor update. |
| Creative Direction Pack | Describes taste: visual language, motion language, pacing, density, and acceptance criteria. |
| Capability Atlas | Describes available and recommended technology capabilities across models, libraries, runtimes, skills, MCP tools, plugins, and manual handoffs. |
| Capability Graph | Describes the selected and detected capability state of one package. |
| Runtime Manifest | Describes how one package becomes active in a runtime such as HyperFrames. |
| Asset Execution Plan | Describes concrete asset materialization tasks. |

The atlas is the stable bridge between ecosystem knowledge and per-package capability graphs.

## Taxonomy

The atlas should use a layered taxonomy so it can represent broad technology stacks and precise invocation surfaces without collapsing them into one flat list.

```text
domain
  -> category
    -> technique
      -> provider
        -> library / model / runtime / tool / skill / plugin
          -> API / CLI / MCP tool / skill command / human handoff
            -> input contract
            -> output contract
            -> verification contract
            -> recommendation score
            -> lifecycle state
```

Recommended top-level domains:

1. `source-understanding`
2. `planning`
3. `generative-media`
4. `programmatic-animation`
5. `asset-forge`
6. `composition-runtime`
7. `post-production`
8. `agent-interface`
9. `verification`
10. `creative-direction`

## Capability Node Shape

Atlas nodes should be structured enough for recommendation and automation, but not so detailed that every third-party API change forces a protocol break.

```ts
export interface CapabilityAtlasNode {
  id: string;
  name: string;
  domain: CapabilityDomain;
  category: string;
  layer:
    | "stack"
    | "technique"
    | "model"
    | "library"
    | "runtime"
    | "cli"
    | "mcp-tool"
    | "skill"
    | "plugin"
    | "manual";
  provider: string;
  deliveryModes: CapabilityDeliveryMode[];
  invocationSurfaces: InvocationSurface[];
  techniques: string[];
  inputContracts: string[];
  outputContracts: string[];
  verificationContracts: string[];
  bestUseCases: string[];
  notFor: string[];
  compatibleWith: string[];
  risks: string[];
  lifecycle: "emerging" | "recommended" | "stable" | "watch" | "deprecated" | "blocked";
  localFirst: boolean;
  requiresNetwork: boolean;
  requiresAccount: boolean;
  requiresApiKey: boolean;
  agentFriendliness: number;
  verifiability: number;
  creativeRange: number;
  controllability: number;
  operationalCost: number;
  maturity: number;
  score: number;
  sourceRefs: SourceReference[];
  lastVerifiedAt: string;
}
```

The scores should be simple and inspectable at first. A weighted formula is enough for v1:

```text
score =
  agentFriendliness * 0.22
+ verifiability * 0.22
+ controllability * 0.18
+ maturity * 0.14
+ creativeRange * 0.12
+ localFirstBonus
- operationalCost * 0.12
- integrationRiskPenalty
```

The point is not to pretend that taste is fully objective. The point is to make recommendations auditable and adjustable.

## Example Node: Anime.js

Anime.js is the anchor example for the first programmatic animation category.

```json
{
  "id": "library.animejs",
  "name": "Anime.js",
  "domain": "programmatic-animation",
  "category": "web-motion",
  "layer": "library",
  "provider": "animejs",
  "deliveryModes": ["npm-local", "cdn-runtime"],
  "invocationSurfaces": ["typescript-api", "browser-runtime"],
  "techniques": [
    "timeline-animation",
    "stagger-animation",
    "svg-animation",
    "text-animation",
    "draggable-interaction",
    "spring-easing",
    "waapi-adjacent-animation"
  ],
  "inputContracts": ["dom-elements", "svg-elements", "css-properties", "timeline-spec"],
  "outputContracts": ["browser-motion", "runtime-observable-animation"],
  "verificationContracts": ["runtime-inspect", "runtime-snapshot", "text-overflow-check"],
  "bestUseCases": [
    "kinetic-typography",
    "logo-motion",
    "icon-motion",
    "ui-micro-animation",
    "agent-generated-motion-prototype"
  ],
  "notFor": [
    "photorealistic-video-generation",
    "long-form-cinematic-generation",
    "full-render-pipeline-by-itself"
  ],
  "compatibleWith": ["video-runtime.hyperframes", "browser-snapshot", "svg-assets"],
  "lifecycle": "recommended",
  "localFirst": true,
  "requiresNetwork": false,
  "requiresAccount": false,
  "requiresApiKey": false,
  "agentFriendliness": 0.86,
  "verifiability": 0.82,
  "creativeRange": 0.78,
  "controllability": 0.88,
  "operationalCost": 0.18,
  "maturity": 0.82,
  "score": 0.84,
  "lastVerifiedAt": "2026-05-20"
}
```

Anime.js should be treated as programmatic animation material, not as a full video runtime. Its strength is controllable motion that an agent can generate, inspect, revise, and combine with HyperFrames.

## Example Node: Frontier Video Model

Frontier video models should be represented differently from local libraries.

```json
{
  "id": "model.gemini-omni-flash",
  "name": "Gemini Omni Flash",
  "domain": "generative-media",
  "category": "frontier-video-model",
  "layer": "model",
  "provider": "google-deepmind",
  "deliveryModes": ["remote-api", "hosted-product"],
  "invocationSurfaces": ["remote-api", "hosted-ui"],
  "techniques": ["text-to-video", "image-to-video", "audio-video-reference", "conversational-video-editing"],
  "inputContracts": ["text", "image", "audio", "video"],
  "outputContracts": ["video-with-audio"],
  "verificationContracts": ["asset-exists", "license-policy-check", "visual-review", "runtime-ingest-check"],
  "bestUseCases": ["cinematic-source-material", "video-reference-editing", "concept-visualization"],
  "notFor": ["local-first-repeatable-rendering", "deterministic-motion-timing"],
  "lifecycle": "watch",
  "localFirst": false,
  "requiresNetwork": true,
  "requiresAccount": true,
  "requiresApiKey": true,
  "lastVerifiedAt": "2026-05-20"
}
```

The atlas should track frontier models, but Framepack should not assume they are always available, stable, affordable, policy-compatible, or locally executable.

## Recommended Stack Shape

The atlas should recommend combinations, not just individual tools.

```ts
export interface RecommendedCapabilityStack {
  id: string;
  name: string;
  appliesTo: {
    workflowPackIds: string[];
    creativeDirectionPackIds: string[];
    outputTypes: string[];
    formats: string[];
  };
  nodes: {
    capabilityId: string;
    role: "source" | "asset-forge" | "motion" | "composition" | "verification" | "handoff";
    required: boolean;
    alternatives: string[];
  }[];
  rationale: string[];
  acceptanceCriteria: string[];
  riskNotes: string[];
}
```

Example:

```text
game-ad-sprite-video-stack
- Asset forge: agent-sprite-forge
- Sprite material: transparent PNG sprite sheets and FX packs
- Programmatic motion: Anime.js or PixiJS for small controllable loops
- Runtime composition: HyperFrames
- Verification: validate, status, runtime inspect, runtime snapshot
- Fallback: manual assets or custom forge backend
```

## Update And Deprecation Governance

The atlas must be designed for change.

Each source signal should carry a trust level:

| Source | Use |
| --- | --- |
| Official docs, model cards, release notes | Primary fact source for current capabilities and access modes. |
| GitHub repository and releases | Primary source for library maturity, API changes, and maintenance status. |
| Papers and technical reports | Primary source for model architecture, evaluations, and claimed capabilities. |
| X/Twitter, Reddit, Discord, community posts | Trend and pain-point discovery; never the only source for a durable fact. |
| Local Framepack tests and smoke runs | Highest-confidence evidence for whether Framepack can actually use a capability. |

Every node should support:

- `lastVerifiedAt`
- `sourceRefs`
- `lifecycle`
- `replacementCandidates`
- `knownBreakages`
- `policyNotes`
- `communitySignals`
- `framepackSupportLevel`

Lifecycle transitions should be explicit:

```text
emerging -> watch -> recommended -> stable
recommended -> watch
watch -> deprecated
deprecated -> blocked
```

## Framepack Support Levels

The atlas should not imply that every known technology is already implemented.

Use explicit support levels:

| Support level | Meaning |
| --- | --- |
| `known` | Framepack knows the capability and can describe it. |
| `recommended` | Framepack may recommend it for a route. |
| `contracted` | Framepack can write a task or package contract for it. |
| `detectable` | Framepack can detect whether it exists locally or in package state. |
| `invokable` | Framepack can call it through CLI, MCP, skill, plugin, or runtime adapter. |
| `verifiable` | Framepack can verify its output with structured checks. |

This keeps the product honest while still allowing the atlas to grow ahead of implementation.

## Atlas v1 Scope

The first implementation should stay small:

1. Built-in atlas registry in TypeScript.
2. Programmatic animation category with Anime.js as the anchor node.
3. Existing HyperFrames runtime node.
4. Existing agent-sprite-forge backend node.
5. Frontier model watchlist entries for Seedance 2.0, Gemini Omni, and Kling 3.0.
6. Recommended stack entries for:
   - `game-ad-sprite-video`
   - `clean-saas-explainer`
   - `web-motion-explainer`
7. MCP and CLI read-only surfaces:
   - list atlas nodes
   - get atlas node
   - recommend capability stack
   - explain why a capability was or was not recommended

Atlas v1 should not install external skills, call hosted models, or rewrite project packages automatically.

## Product Rule

Framepack should know enough about animation technologies to guide agents professionally, but it should not pretend to own every animation engine.

The product boundary is:

```text
Framepack owns capability classification, recommendation, contracts, package state, and verification evidence.

Backends own actual media generation, animation execution, rendering, and external service behavior.
```

This keeps Framepack agent-native, backend-neutral, and open to community expansion.

## References

- Anime.js documentation: https://animejs.com/documentation/
- ByteDance Seedance 2.0 official launch: https://seed.bytedance.com/blog/seedance-2-0-official-launch
- Google DeepMind Gemini Omni: https://deepmind.google/models/gemini-omni/
- Google DeepMind Gemini Omni Flash model card: https://deepmind.google/models/model-cards/gemini-omni-flash/
- Kuaishou Kling AI 3.0 launch release: https://ir.kuaishou.com/news-releases/news-release-details/kling-ai-launches-30-model-ushering-era-where-everyone-can-be
