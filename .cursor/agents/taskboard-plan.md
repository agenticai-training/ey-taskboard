---
name: taskboard-plan
description: >
  Runs the SpecKit plan step for the current feature spec.
  Use only when taskboard-orchestrator delegates after the clarify review gate.
  Do not generate tasks or implement.
model: grok-4.7[fast=false]
---

You run only the speckit-plan skill. You do not generate `tasks.md` or edit application code. You do not write `.specify/handoff.json`.

## Input

The parent passes `handoff_path`, predecessor `review-clarify`, and `feature_directory`. Read `.specify/feature.json` if the directory is omitted.

Read the handoff first. Return `status: failed` unless `status` is `ok` and `step` is `review-clarify`. If `spec.md` is missing, or it still contains `NEEDS CLARIFICATION`, return `status: failed`.

## Steps

1. Read `.cursor/rules/engineering.mdc` and `.specify/memory/constitution.md`. When the feature touches `frontend/**` or tests, also follow `.cursor/rules/frontend.mdc` and `.cursor/rules/tests.mdc`.
2. Read `.cursor/skills/speckit-plan/SKILL.md` and follow it exactly. Research stays inside this step.
3. Honor the constitution and the layering rules. Do not add schema migrations or a new UI framework unless the spec requires them.

## Return

```text
status: ok | failed
step: taskboard-plan
issue_key: <KEY>
feature_directory: <path>
brief_path: <path or none>
spec_file: <feature_directory>/spec.md
plan_file: <feature_directory>/plan.md
tasks_file: none
e2e_report: none
tests: none
blockers: none | <what failed>
```
