# Framepack Department Ownership Matrix

> Phase 1 rollout artifact for department architecture. This maps current runtime files to primary ownership without changing behavior.

## Summary

- Director Bible: 9
- Intent & Intake: 4
- Intervention & Railguard: 17
- Knowledge Assets: 13
- Platform Integration: 26
- Production Audit: 14
- Taste Intelligence: 9
- Weapon Production: 11

## Ownership rule

Each file gets one **primary** department. Mixed files may list a note explaining the supporting department, but future refactors should reduce mixed ownership rather than normalize it.

## Matrix

| Path | Primary department | Why / note |
|---|---|---|
| `framepack-plugin/core/__init__.py` | Platform Integration | package boundary / import surface |
| `framepack-plugin/core/arsenal_registry.py` | Weapon Production | weapon matching, arsenal, presets, scorecards, parameter recipes |
| `framepack-plugin/core/asset_detector.py` | Intent & Intake | request routing, asset/source awareness, initial project setup |
| `framepack-plugin/core/audio_cue_ledger.py` | Director Bible | creative source-of-truth, scene/story/timing contracts |
| `framepack-plugin/core/beat_analyzer.py` | Director Bible | creative source-of-truth, scene/story/timing contracts |
| `framepack-plugin/core/builtin_weapons.py` | Weapon Production | weapon matching, arsenal, presets, scorecards, parameter recipes |
| `framepack-plugin/core/case_mining.py` | Knowledge Assets | templates, reusable cases, reference/catalog assets |
| `framepack-plugin/core/case_scaffolder.py` | Intent & Intake | request routing, asset/source awareness, initial project setup |
| `framepack-plugin/core/catalog_decision.py` | Intent & Intake | request routing, asset/source awareness, initial project setup |
| `framepack-plugin/core/catalog_discovery.py` | Knowledge Assets | templates, reusable cases, reference/catalog assets |
| `framepack-plugin/core/context_hydrator.py` | Platform Integration | runtime compatibility, deployment, environment, trusted sources |
| `framepack-plugin/core/control_profile.py` | Director Bible | creative source-of-truth, scene/story/timing contracts |
| `framepack-plugin/core/deliverable_bundle.py` | Knowledge Assets | templates, reusable cases, reference/catalog assets |
| `framepack-plugin/core/environment_doctor.py` | Platform Integration | runtime compatibility, deployment, environment, trusted sources |
| `framepack-plugin/core/execution_manifest.py` | Director Bible | creative source-of-truth, scene/story/timing contracts |
| `framepack-plugin/core/framepack_upgrade_report.py` | Platform Integration | runtime compatibility, deployment, environment, trusted sources |
| `framepack-plugin/core/gate_templates.py` | Intervention & Railguard | gate/intervention workflow and required next actions |
| `framepack-plugin/core/gates/__init__.py` | Platform Integration | package boundary / import surface |
| `framepack-plugin/core/gates/artifacts.py` | Intervention & Railguard | gate/intervention workflow and required next actions |
| `framepack-plugin/core/gates/asset_intake.py` | Intervention & Railguard | gate/intervention workflow and required next actions |
| `framepack-plugin/core/gates/audio_cues.py` | Intervention & Railguard | gate/intervention workflow and required next actions |
| `framepack-plugin/core/gates/control_profile.py` | Director Bible | creative source-of-truth, scene/story/timing contracts |
| `framepack-plugin/core/gates/engine.py` | Intervention & Railguard | gate/intervention workflow and required next actions |
| `framepack-plugin/core/gates/hyperframes_capability_alignment.py` | Intervention & Railguard | gate/intervention workflow and required next actions |
| `framepack-plugin/core/gates/legacy.py` | Intervention & Railguard | gate/intervention workflow and required next actions |
| `framepack-plugin/core/gates/parsers.py` | Intervention & Railguard | gate/intervention workflow and required next actions |
| `framepack-plugin/core/gates/registry.py` | Intervention & Railguard | gate/intervention workflow and required next actions |
| `framepack-plugin/core/gates/scene_continuity.py` | Intervention & Railguard | gate/intervention workflow and required next actions |
| `framepack-plugin/core/gates/source_extraction.py` | Intervention & Railguard | gate/intervention workflow and required next actions |
| `framepack-plugin/core/gates/storyboard_preview.py` | Intervention & Railguard | gate/intervention workflow and required next actions |
| `framepack-plugin/core/gates/types.py` | Intervention & Railguard | gate/intervention workflow and required next actions |
| `framepack-plugin/core/handoff_manifest.py` | Director Bible | creative source-of-truth, scene/story/timing contracts |
| `framepack-plugin/core/hermes_adapter.py` | Platform Integration | runtime compatibility, deployment, environment, trusted sources |
| `framepack-plugin/core/hyperframes_adapter.py` | Platform Integration | runtime compatibility, deployment, environment, trusted sources |
| `framepack-plugin/core/hyperframes_capabilities.py` | Platform Integration | runtime compatibility, deployment, environment, trusted sources |
| `framepack-plugin/core/hyperframes_support.py` | Platform Integration | runtime compatibility, deployment, environment, trusted sources |
| `framepack-plugin/core/intent_router.py` | Intent & Intake | request routing, asset/source awareness, initial project setup |
| `framepack-plugin/core/param_guard.py` | Weapon Production | weapon matching, arsenal, presets, scorecards, parameter recipes |
| `framepack-plugin/core/path_utils.py` | Platform Integration | runtime compatibility, deployment, environment, trusted sources |
| `framepack-plugin/core/pipeline_progress.py` | Intervention & Railguard | gate/intervention workflow and required next actions |
| `framepack-plugin/core/placeholder_audit.py` | Production Audit | artifact/proof/readiness/upstream warning verification |
| `framepack-plugin/core/pre_render_audit.py` | Production Audit | artifact/proof/readiness/upstream warning verification |
| `framepack-plugin/core/promotion_candidates.py` | Knowledge Assets | templates, reusable cases, reference/catalog assets |
| `framepack-plugin/core/proof_audit.py` | Production Audit | artifact/proof/readiness/upstream warning verification |
| `framepack-plugin/core/quality_audit.py` | Production Audit | artifact/proof/readiness/upstream warning verification |
| `framepack-plugin/core/render_artifacts.py` | Production Audit | artifact/proof/readiness/upstream warning verification |
| `framepack-plugin/core/render_readiness.py` | Production Audit | artifact/proof/readiness/upstream warning verification |
| `framepack-plugin/core/restraint_audit.py` | Taste Intelligence | taste grammar, taste debt, commercial anti-slop checks |
| `framepack-plugin/core/shell_utils.py` | Platform Integration | runtime compatibility, deployment, environment, trusted sources |
| `framepack-plugin/core/skill_install_manager.py` | Platform Integration | runtime compatibility, deployment, environment, trusted sources |
| `framepack-plugin/core/skill_overlay_manager.py` | Platform Integration | runtime compatibility, deployment, environment, trusted sources |
| `framepack-plugin/core/skill_overlay_planner.py` | Platform Integration | runtime compatibility, deployment, environment, trusted sources |
| `framepack-plugin/core/skill_upgrade_manager.py` | Platform Integration | runtime compatibility, deployment, environment, trusted sources |
| `framepack-plugin/core/taste_audit.py` | Taste Intelligence | taste grammar, taste debt, commercial anti-slop checks |
| `framepack-plugin/core/taste_control.py` | Taste Intelligence | taste grammar, taste debt, commercial anti-slop checks |
| `framepack-plugin/core/taste_grammar.py` | Taste Intelligence | taste grammar, taste debt, commercial anti-slop checks |
| `framepack-plugin/core/taste_read.py` | Taste Intelligence | taste grammar, taste debt, commercial anti-slop checks |
| `framepack-plugin/core/taste_rules.py` | Taste Intelligence | taste grammar, taste debt, commercial anti-slop checks |
| `framepack-plugin/core/taste_specimens.py` | Taste Intelligence | taste grammar, taste debt, commercial anti-slop checks |
| `framepack-plugin/core/taste_text_detectors.py` | Taste Intelligence | taste grammar, taste debt, commercial anti-slop checks |
| `framepack-plugin/core/templates/__init__.py` | Platform Integration | package boundary / import surface |
| `framepack-plugin/core/templates/arsenal.py` | Knowledge Assets | templates, reusable cases, reference/catalog assets |
| `framepack-plugin/core/templates/builtin.py` | Knowledge Assets | templates, reusable cases, reference/catalog assets |
| `framepack-plugin/core/templates/markdown.py` | Knowledge Assets | templates, reusable cases, reference/catalog assets |
| `framepack-plugin/core/templates/productize.py` | Knowledge Assets | templates, reusable cases, reference/catalog assets |
| `framepack-plugin/core/templates/registry.py` | Knowledge Assets | templates, reusable cases, reference/catalog assets |
| `framepack-plugin/core/templates/scaffold.py` | Knowledge Assets | templates, reusable cases, reference/catalog assets |
| `framepack-plugin/core/templates/types.py` | Knowledge Assets | templates, reusable cases, reference/catalog assets |
| `framepack-plugin/core/timeline_manifest.py` | Director Bible | creative source-of-truth, scene/story/timing contracts |
| `framepack-plugin/core/tone_presets.py` | Director Bible | creative source-of-truth, scene/story/timing contracts |
| `framepack-plugin/core/trusted_sources.py` | Platform Integration | runtime compatibility, deployment, environment, trusted sources |
| `framepack-plugin/core/warning_classifier.py` | Production Audit | artifact/proof/readiness/upstream warning verification |
| `framepack-plugin/core/weapon_bench.py` | Weapon Production | weapon matching, arsenal, presets, scorecards, parameter recipes |
| `framepack-plugin/core/weapon_enforcement.py` | Intervention & Railguard | weapon-originated post-write gate; business source is Weapon Production |
| `framepack-plugin/core/weapon_load_plan.py` | Weapon Production | weapon matching, arsenal, presets, scorecards, parameter recipes |
| `framepack-plugin/core/weapon_matcher.py` | Weapon Production | weapon matching, arsenal, presets, scorecards, parameter recipes |
| `framepack-plugin/core/weapon_presets.py` | Weapon Production | weapon matching, arsenal, presets, scorecards, parameter recipes |
| `framepack-plugin/core/weapon_scorecard.py` | Weapon Production | weapon matching, arsenal, presets, scorecards, parameter recipes |
| `framepack-plugin/core/weapon_sources.py` | Weapon Production | weapon matching, arsenal, presets, scorecards, parameter recipes |
| `framepack-plugin/core/workflow_overlay.py` | Director Bible | creative source-of-truth, scene/story/timing contracts |
| `framepack-plugin/hooks/__init__.py` | Platform Integration | hook package boundary |
| `framepack-plugin/hooks/guardrails.py` | Platform Integration | guardrail distribution / runtime alignment |
| `framepack-plugin/hooks/on_post_tool_call.py` | Intervention & Railguard | runtime hook intervention surface; delegates business logic to departments |
| `framepack-plugin/hooks/on_pre_tool_call.py` | Intervention & Railguard | runtime hook intervention surface; delegates business logic to departments |
| `framepack-plugin/scripts/apply_skill_overlays.py` | Platform Integration | runtime/deploy/compat CLI helper |
| `framepack-plugin/scripts/framepack_doctor.py` | Platform Integration | runtime/deploy/compat CLI helper |
| `framepack-plugin/scripts/framepack_extract_proof_frames.py` | Production Audit | audit/readiness/proof CLI helper |
| `framepack-plugin/scripts/framepack_hydrate.py` | Platform Integration | runtime/deploy/compat CLI helper |
| `framepack-plugin/scripts/framepack_hyperframes_capabilities.py` | Platform Integration | runtime/deploy/compat CLI helper |
| `framepack-plugin/scripts/framepack_make_contact_sheet.py` | Production Audit | contact sheet / proof review helper |
| `framepack-plugin/scripts/framepack_match_weapons.py` | Weapon Production | weapon CLI helper |
| `framepack-plugin/scripts/framepack_probe_media.py` | Production Audit | audit/readiness/proof CLI helper |
| `framepack-plugin/scripts/framepack_quality_audit.py` | Production Audit | audit/readiness/proof CLI helper |
| `framepack-plugin/scripts/framepack_readiness.py` | Production Audit | audit/readiness/proof CLI helper |
| `framepack-plugin/scripts/framepack_scaffold_case.py` | Knowledge Assets | template/case asset CLI helper |
| `framepack-plugin/scripts/framepack_taste_audit.py` | Taste Intelligence | Taste CLI / proof helper |
| `framepack-plugin/scripts/framepack_template.py` | Knowledge Assets | template/case asset CLI helper |
| `framepack-plugin/scripts/framepack_timeline_manifest.py` | Production Audit | audit/readiness/proof CLI helper |
| `framepack-plugin/scripts/framepack_update.py` | Platform Integration | runtime/deploy/compat CLI helper |
| `framepack-plugin/scripts/framepack_upgrade_report.py` | Platform Integration | runtime/deploy/compat CLI helper |
| `framepack-plugin/scripts/framepack_weapon_bench.py` | Weapon Production | weapon CLI helper |
| `framepack-plugin/scripts/hyperframes_upstream_report.py` | Platform Integration | runtime/deploy/compat CLI helper |
| `framepack-plugin/scripts/test_team_auto_test.py` | Production Audit | acceptance/testing automation helper |

## Review-required items

- `framepack-plugin/scripts/framepack_make_contact_sheet.py` — needs manual ownership decision

## Next use

Use this matrix before refactors: if a module changes behavior, load the skill/process for its owning department and keep Intervention mechanics separate from business findings.
