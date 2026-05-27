# Framepack Director Agentic Workflow Design

Design ID: `DIRECTOR-AGENTIC-WORKFLOW-01`

Date: 2026-05-27

Status: design approved for implementation planning

## Purpose

Framepack 0.5 should not be positioned as a simple agent plugin, a command wrapper, or a pile of video helper functions.

Framepack is an agentic video workflow harness for general-purpose coding agents such as Codex, Claude Code, and Hermes. Its job is to help those agents turn a human's fuzzy creative wish into a professional, executable, iterative video production plan for HyperFrames and related tools.

This design upgrades the product center from:

```text
user idea -> files -> commands
```

to:

```text
user fuzzy wish
  -> creative interpretation
  -> director proposal
  -> human-in-the-loop decision
  -> technical decomposition
  -> catalog/template/library assembly
  -> HyperFrames composition plan
  -> preview feedback loop
  -> final production package
```

The goal is simple: an outsider should be able to say "make this more business, sharper, more dynamic, more premium, like a launch film", and Framepack should help the agent translate that into a video plan that sounds directed, looks technically executable, and can improve through iteration.

## Strategic Position

Framepack is installed into an agent platform, but it is not trying to replace the agent.

The correct role split is:

| Layer | Role |
| --- | --- |
| Human user | Provides goals, taste words, examples, assets, approvals, and revision feedback. |
| Codex / Claude Code / Hermes | General-purpose reasoning brain and execution agent. |
| Framepack | Domain-specific agentic workflow harness for programmatic video production. |
| HyperFrames | Primary video runtime and rendering body. |
| HyperFrames Catalog | Official prefab supply layer for blocks, components, effects, and reusable composition parts. |
| Template Market / Packs | Scenario-level creative routes and reusable production patterns. |
| Animation libraries | Technical motion engines such as GSAP, Anime.js, CSS, Three.js, and related browser/runtime tools. |

Framepack should therefore provide:

- structured workflow state
- creative translation guidance
- route and template recommendations
- technical module recommendations
- human decision checkpoints
- package/version memory
- validation and visual QA hooks

It should not pretend to be:

- a full video editor UI
- a hosted video model
- a closed rendering runtime
- an automatic taste oracle with no user feedback
- a replacement for HyperFrames Catalog

## Product Thesis

Framepack 0.5 should be described as:

> An agentic video workflow harness that translates fuzzy creative intent into executable HyperFrames-ready video production plans.

This has three consequences.

First, Framepack must treat creative language as input, not noise. Words such as "premium", "business", "cool", "fast", "big text", "like a launch video", or "more cinematic" are not vague leftovers. They are the raw signals that must be converted into professional direction.

Second, Framepack must bridge creative direction and technical execution. It is not enough to say "make it dynamic". The harness must decompose that into scene rhythm, typography, transitions, caption components, prefab blocks, animation libraries, and acceptance criteria.

Third, Framepack must support looped collaboration. Programmatic video production is rarely correct in one pass. The product must preserve iterations, decisions, evidence, and next actions so the agent and human can converge.

## Core Workflow

The first-class workflow is:

```text
Initialize -> Propose -> Decide -> Decompose -> Assemble -> Verify -> Iterate
```

### Initialize

The Initializer turns the user's raw signal into a structured creative field.

Inputs:

- idea
- goal
- audience
- format
- duration
- style words
- reference links or descriptions
- available user assets
- selected workflow pack, if any
- selected creative direction pack, if any

Outputs:

- project intent
- audience promise
- emotional energy
- narrative pattern
- constraints
- unresolved creative questions

This stage should preserve uncertainty. If a user only says "make it cooler", Framepack should not fake precision. It should surface a small set of decision choices for the agent to ask.

### Propose

The Proposer generates one or more professional directions.

Each proposal should include:

- concept title
- narrative structure
- opening hook
- scene sequence
- visual language
- motion language
- asset strategy
- template and Catalog fit
- risks and tradeoffs
- why this route fits the user's goal

The Proposer is not a renderer. It is the director, producer, and technical director draft.

### Decide

The human-in-the-loop checkpoint lets the user pick or modify the direction.

The checkpoint should be lightweight:

- choose A/B/C direction
- approve or reject energy level
- confirm format and duration
- confirm whether to use existing assets, generated assets, or Catalog prefabs
- mark references as "match closely" or "inspiration only"

Framepack should not over-question the user. The agent can ask only what blocks a better next step.

### Decompose

The Technical Decomposer translates the approved direction into executable modules.

Example:

```text
"premium SaaS launch, fast and confident"
```

becomes:

- workflow route: `saas-launch`
- scene pattern: hook -> product reveal -> proof -> workflow -> CTA
- Catalog blocks: app showcase, data chart, logo outro
- Catalog components: caption editorial emphasis, caption clip wipe
- animation techniques: GSAP timeline, kinetic typography, controlled push-in
- assets: product screenshots, logo, proof numbers, UI cards
- verification: text readable, no empty scenes, visible CTA, key proof moment captured

This is the layer where Framepack proves it is not just a prompt formatter.

### Assemble

The Composition Orchestrator writes the plan the agent can execute.

It should explain:

- which HyperFrames Catalog items to inspect or install
- which parts should stay custom
- which animation library or runtime technique should be used
- where user assets enter the composition
- how the timeline should be staged
- what fallback should exist if a Catalog item is unavailable

The orchestrator should prefer official HyperFrames Catalog prefabs when they fit. It should not force Catalog use where custom composition is better.

### Verify

The Verifier checks both protocol readiness and creative readiness.

Protocol checks ask:

```text
Are files present and structurally valid?
```

Creative checks ask:

```text
Does the package describe a video that can be imagined, built, previewed, and improved?
```

Minimum creative checks:

- the direction is not generic
- each scene has a role
- motion language changes by scene purpose
- Catalog/template recommendations are tied to scene needs
- user assets are respected
- there are clear acceptance criteria
- the next action is obvious to an agent

### Iterate

Every preview or user reaction should produce a new loop entry:

- what the user reacted to
- what changed
- which files were affected
- which version is current
- what remains uncertain
- whether another preview is needed

The iteration loop is a product feature, not an afterthought.

## Director Translation

Director Translation is the core differentiator.

It converts non-professional words into professional video decisions.

### Input Classes

Framepack should understand at least these user signal types:

| Signal type | Example | Translation target |
| --- | --- | --- |
| Mood | "premium", "exciting", "serious" | emotional energy and visual tone |
| Business goal | "sell a course", "launch a product" | narrative pattern and CTA |
| Motion wish | "more dynamic", "fast rhythm" | motion language and timing |
| Visual wish | "big text", "more white space" | layout density and typography |
| Reference | "like this video" | style extraction and fit notes |
| Constraint | "use my assets" | asset strategy |
| Dislike | "not too template-like" | negative guardrails |

### Translation Output

The translation output should be written in professional but agent-readable language:

```text
Creative intent:
Make a 20-second founder-facing SaaS launch spot that feels confident,
fast, and commercially credible.

Narrative:
Open with a market pain hook, reveal the product as the operating system,
prove it with one quantified outcome, then close with a clean CTA.

Visual language:
High-contrast interface-first layout, large kinetic headline,
glass-like proof panels, tight whitespace, minimal decoration.

Motion language:
Fast hook reveal, controlled push-in on proof, caption emphasis on numbers,
light transition into CTA, no chaotic camera movement.
```

This language should appear in `DIRECTION.md` and inform `COMPOSITION.md`.

## HyperFrames Catalog Relationship

HyperFrames Catalog changes Framepack's execution strategy.

Catalog is the official prefab supply layer. It can provide:

- complete blocks with fixed timing and size
- reusable animation components
- social cards
- map/data blocks
- app showcase blocks
- caption effects
- logo outros
- shader transitions
- notification/widgets/liquid glass visuals

Framepack's role is to decide when these prefabs are appropriate and how an agent should use them.

### Stable Boundary

Framepack Template Market answers:

```text
What kind of video are we making?
```

HyperFrames Catalog answers:

```text
What official video parts can help build it?
```

Animation libraries answer:

```text
What low-level motion technique should implement the custom parts?
```

HyperFrames runtime answers:

```text
How does the assembled project preview and render?
```

### Catalog Bridge Rules

Framepack should:

- recommend Catalog candidates based on route, style, format, and scene need
- tell the agent to inspect `npx hyperframes catalog --json`
- suggest `npx hyperframes add <id>` only after the candidate is relevant
- distinguish blocks from components
- preserve fallback instructions if a Catalog item is unavailable
- avoid automatically installing Catalog items without explicit execution by the agent/user

Framepack should not:

- scrape the remote Catalog during every project creation
- assume every documented Catalog item is locally available
- replace custom brand-critical composition with generic prefabs
- hide where a prefab came from

## Template Market Relationship

Framepack's own Template Market remains important.

It sits above Catalog:

- `saas-launch`: launch route and commercial structure
- `course-promo`: education offer route
- `news-explainer`: information route
- `game-ad`: playful conversion route
- `founder-story`: trust and identity route
- `data-shock`: proof and numbers route

Catalog items should be attached to these routes as recommended building blocks.

Example:

| Template route | Catalog fit |
| --- | --- |
| `saas-launch` | app showcase, macOS notification, liquid glass widgets, logo outro |
| `course-promo` | caption emphasis, light leak, logo outro, social follow |
| `news-explainer` | reddit post card, data chart, map block, editorial captions |
| `data-shock` | data chart, money count, caption emphasis, flowchart |
| `game-ad` | transitions, captions, logo outro; custom sprite assets remain core |
| `founder-story` | editorial captions, clean title cards, logo outro |

## Recommended Package Shape

The 0.5 Workbench should keep the lean file model, but make each file more purposeful.

### `FRAMEPACK.md`

Project control surface.

Should include:

- current project state
- selected workflow
- selected direction
- current iteration
- next agent action

### `ASSETS.md`

Asset inventory and production notes.

Should include:

- user-provided assets
- desired assets
- Catalog-derived assets or prefabs
- manual/generative/custom asset routes
- unresolved asset decisions

### `DIRECTION.md`

Director Translation surface.

Should include:

- user wish summary
- professional creative interpretation
- narrative pattern
- emotional energy
- visual language
- motion language
- guardrails
- questions for user when needed

### `COMPOSITION.md`

Technical decomposition and assembly surface.

Should include:

- scene-by-scene timeline
- template route
- Catalog block/component recommendations
- animation library recommendations
- HyperFrames commands to inspect or install prefabs
- fallback strategy
- acceptance criteria

### `ITERATIONS.md`

Loop memory.

Should include:

- proposals
- user decisions
- preview feedback
- revision history
- version notes
- next validation target

### `.framepack/state.json`

Machine-readable state.

Should include:

- selected route
- selected direction
- recommended templates
- recommended Catalog items
- current iteration
- pending decisions
- package version

## HITL Checkpoints

Framepack should support these human decision points.

### Direction Choice

Used when the idea is fuzzy.

The agent can present 2-3 directions, for example:

- A: premium launch film
- B: proof-heavy data explainer
- C: social-first kinetic promo

### Asset Choice

Used when asset sources differ.

The user can choose:

- use existing assets only
- use HyperFrames Catalog prefabs where possible
- generate missing assets through external tools
- leave asset slots pending

### Polish Choice

Used when taste is subjective.

The user can choose:

- cleaner and more business
- faster and more energetic
- more cinematic
- more data/proof heavy
- more playful/game-like

### Preview Feedback

Used after a composition or rendered draft exists.

The agent should translate feedback into:

- timing changes
- scene changes
- asset changes
- text changes
- motion changes
- Catalog/template substitutions

## Minimal Implementation Scope

The first implementation should stay small.

### Include

- Director Translation fields in Workbench recommendation output
- stronger `DIRECTION.md` generation
- stronger `COMPOSITION.md` generation
- HyperFrames Catalog recommendation surface
- route-to-Catalog mapping
- CLI/MCP-readable recommendation data where cheap
- tests proving recommendations appear in generated Workbench files

### Exclude

- automatic Catalog installation
- remote Catalog scraping
- full marketplace backend
- paid template commerce
- visual UI
- multi-agent orchestration engine
- hosted model calls
- automatic video rendering

This keeps Framepack lean while giving it a much stronger director brain.

## Implementation Sequence

Recommended sequence:

1. `DIRECTOR-TRANSLATION-01`
   - Add structured translation from fuzzy user signals to professional direction.
   - Upgrade `DIRECTION.md`.

2. `CATALOG-BRIDGE-01`
   - Add a lightweight HyperFrames Catalog registry and recommendation function.
   - Upgrade `COMPOSITION.md`.

3. `ARSENAL-ORCHESTRATION-02`
   - Merge Template Market, Catalog Bridge, and animation library recommendations into a single Polish Arsenal output.

4. `HITL-LOOP-01`
   - Add explicit proposal/decision/iteration prompts and state fields.

5. `WORKBENCH-QA-01`
   - Add checks that generated Markdown is not empty, generic, or missing next actions.

## Testing Strategy

Tests should verify behavior rather than internal wording.

Minimum tests:

- Workbench creation writes a director-style `DIRECTION.md`.
- `COMPOSITION.md` includes Catalog recommendations for fitting routes.
- Recommendations distinguish templates, Catalog blocks, Catalog components, and animation techniques.
- `.framepack/state.json` includes machine-readable selected direction and recommended modules.
- CLI recommendation output remains valid JSON.
- Existing template market tests still pass.
- Generated docs avoid old package-file bloat.

Manual tests:

- vague SaaS launch idea
- course promotion idea
- data shock short video idea
- game-ad idea
- user-provided asset scenario
- "make it cooler/faster/more premium" feedback loop scenario

## Acceptance Criteria

This design is successful when:

- Framepack no longer reads like a generic project generator.
- `DIRECTION.md` sounds like a professional director brief.
- `COMPOSITION.md` explains a credible technical assembly plan.
- HyperFrames Catalog is treated as an official prefab supply layer.
- The agent can see when to ask the user a HITL question.
- The user can read the output and imagine the video.
- The implementation remains lean and avoids recreating a full editor.

## Risks

### Risk: Too much language, too little execution

Mitigation: every direction must map to modules, scene roles, commands, or acceptance criteria.

### Risk: Catalog becomes a static stale list

Mitigation: treat built-in Catalog candidates as suggestions, and instruct agents to inspect the live HyperFrames Catalog before use.

### Risk: Framepack becomes too fat again

Mitigation: keep the Workbench output to five core Markdown files plus compact machine state. Add knowledge through registries and recommendation functions, not large generated folders.

### Risk: User taste remains subjective

Mitigation: use HITL checkpoints and iteration memory instead of pretending one pass can solve taste.

## Plain-Language Summary

Framepack is becoming a video director workflow for coding agents.

The user does not need to know which HyperFrames block, animation component, template, or motion library to use. The user can speak like a normal person: "make it more premium", "make it faster", "make it look like a launch video", or "use my assets and make the product feel stronger".

Framepack's job is to translate that into a professional video plan: what story to tell, what scenes to use, what motion language fits, which HyperFrames Catalog parts can help, where custom work is needed, how to assemble it, and how to improve it after feedback.

In short:

```text
Human taste words
  -> agentic director workflow
  -> technical video assembly plan
  -> HyperFrames-ready production loop
```

