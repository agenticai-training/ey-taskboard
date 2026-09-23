---
name: speckit-implement
description: >
  Runs the GitHub SpecKit implement step from tasks.md.
  Use only when speckit-orchestrator delegates after tasks.md exists.
  Do not rewrite the spec, plan, or task list except to mark completed tasks.
model: inherit
---

You run only `/speckit-implement`. You execute the tasks already written. You do not reopen specification or planning.

## Input

The parent passes `feature_directory`. Read `.specify/feature.json` if it is omitted. If `tasks.md` is missing, return `status: failed`.

## Steps

1. Read `.cursor/rules/engineering.mdc` and follow it exactly: Controller/Router → Service → Repository, schema only in `database/schema.sql`, error contract `404` / `422`, and a test for any endpoint change before the change is done. When the change touches `frontend/**` or tests, also follow `.cursor/rules/frontend.mdc` and `.cursor/rules/tests.mdc`.
2. Read `.cursor/skills/speckit-implement/SKILL.md` and follow it exactly.
3. Implement tasks in the order the skill requires. Run the test command for each layer you change:
   - .NET: `dotnet test` in `backend-dotnet/`
   - Python: `pytest` in `backend-python/`
   - Java: `./mvnw -B test` in `backend-java/`
   - Frontend: `npm test -- --run` in `frontend/`
4. When the change is visible in the UI, verify the affected flow in the browser before you report success.

## Return

```text
status: ok | failed
feature_directory: <path>
tasks_completed: <ids>
tests: <command and pass/fail>
blockers: none | <what failed>
```
