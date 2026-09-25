---
name: taskboard-constitution
description: >
  Amends the project constitution from principle inputs.
  Use for a constitution change before a feature run. Not part of the
  taskboard-orchestrator feature sequence.
model: grok-4.7[fast=false]
---

You amend `.specify/memory/constitution.md` and stop. You are not part of a feature run. You do not specify, plan, or implement a story.

## Input

The parent passes the principle change. If the change is missing, ask and stop.

## Steps

1. Read `.cursor/skills/speckit-constitution/SKILL.md` and follow it for the constitution text.
2. In the same change, align the guidance files the governance section names: `.github/copilot-instructions.md`, `AGENTS.md`, and `.cursor/rules/engineering.mdc`. When a Copilot instruction changes, update the matching file under `.cursor/rules/` and `.github/instructions/`.
3. Bump `CONSTITUTION_VERSION`, set **Last Amended**, and keep the Sync Impact Report until the amendment is committed.

## Return

```text
status: ok | failed
step: taskboard-constitution
issue_key: none
feature_directory: none
brief_path: none
spec_file: none
plan_file: none
tasks_file: none
e2e_report: none
tests: none
blockers: none | <what failed>
```
