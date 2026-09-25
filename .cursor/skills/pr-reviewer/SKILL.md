---
name: pr-reviewer
description: >
  Reviews a pull request or branch diff against Cursor rules, the project
  constitution, the feature specification, coding standards, and best practices.
  Use when the user asks for a PR review, pull request review, code review of
  a branch, or to check a change set against the spec and constitution.
---

# PR Reviewer

Review the change set. Do not edit application code, specs, or rules unless the user asks for fixes after the review.

## Change set

1. If the user gives a pull request number or URL, use `gh pr view` and `gh pr diff` for that pull request.
2. Otherwise review the current branch against its base. Default base is `main`. Use `git diff <base>...HEAD` and `git log <base>...HEAD`.
3. Review only files in that diff. Read a file outside the diff only to check a call site, a shared contract, or a rule the diff depends on.

## Rubric

Read these before judging. On conflict, `.specify/memory/constitution.md` wins.

| Source | When |
| --- | --- |
| `.specify/memory/constitution.md` | Every review |
| `.cursor/rules/engineering.mdc` | Every review |
| `.cursor/rules/frontend.mdc` | Diff touches `frontend/**` |
| `.cursor/rules/tests.mdc` | Diff touches tests |
| `AGENTS.md` | Every review, for the rule-to-Copilot map |
| Feature `spec.md` | The spec this change implements |

Find the spec in this order:

1. Path the user names.
2. `specs/<feature>/spec.md` when the diff changes that directory.
3. The `specs/*/` directory whose name matches the branch.
4. If none apply, say so and review against the constitution and Cursor rules only.

When `plan.md` or `tasks.md` sit next to that `spec.md`, check the diff against them too. A task left incomplete, or behaviour the spec does not ask for, is a finding.

## What to check

**Constitution and Cursor rules**

- Backend layers stay Controller/Router → Service → Repository. No business rules or SQL in the controller. No HTTP or SQL in the service. No validation or HTTP in the repository.
- Frontend stays `components/` (presentational) → `pages/` (state and fetching) → `services/` (all HTTP). No `fetch` or Axios in components or pages.
- `.NET`, Python, and Java stay behaviourally identical, same request/response shape. Timestamp key casing may differ (`created_at` vs `createdAt`).
- Schema changes exist only in `database/schema.sql`. No EF migrations, `Base.metadata.create_all()`, or `ddl-auto` other than `none`.
- `created_at` / `updated_at` are set by the database, never the client.
- `status` is only `todo`, `in-progress`, `done`. Frontend values and labels come from `frontend/src/constants.js`.
- `404` for a missing id. `422` for a missing title or an unknown status. No other codes for those cases.
- A new or changed endpoint has a same-layer test: happy path, `404`, and `422`. Tests use the existing in-memory or fixture setup and do not hit a real database. Names describe behaviour.
- No new CSS framework. Styling stays in the existing plain CSS.
- No reads of `.env`, `.env.local`, or other `.env.*` files except `.env.example`. No committed secrets. Configuration goes through the framework.
- Prefer editing an existing file. Match the style of the file. Do not reformat untouched lines.

**Specification**

- Each user-visible change traces to a requirement or scenario in `spec.md`.
- Acceptance criteria the spec states are implemented, including edge cases the spec names.
- Out-of-scope behaviour from the spec is absent.

**Coding standards**

- Match neighbouring code: names, error handling, test framework, and file layout.
- Test stacks stay xUnit + `WebApplicationFactory`, pytest + `httpx.AsyncClient`, JUnit 5 + `@SpringBootTest` / `MockMvc`, Vitest + Testing Library.
- Public behaviour that the other backends already implement is portable without a new JSON shape.

**Best practices**

- Correctness: wrong status mapping, dropped fields, broken empty states, race or null handling on the changed path.
- Security: unvalidated input reaching SQL, secrets in source, client-trusted authorization.
- Tests assert the new behaviour, not only that a call returns 200.
- Complexity the spec does not ask for.

## Report

Lead with the verdict, then findings. Cite `file:line` from the diff. Quote the rule or spec requirement in a few words. Omit an empty severity section.

```markdown
# PR review — <branch or PR title>

Verdict: Approve | Approve with comments | Request changes

Change set: <base>...<head> (<N> files)
Rubric: constitution, Cursor rules, <spec path or "no feature spec">

## Request changes
- **path:line** — <issue>. <which rule or spec requirement>

## Comments
- **path:line** — <issue>. <which standard or practice>

## Notes
- **path:line** — <optional nit>

## Coverage
- Constitution:
- Cursor rules:
- Specification:
- Coding standards:
- Best practices:
```

Verdict:

- **Request changes** — a constitution or Cursor-rule violation, a missing endpoint test, a spec requirement not met, or a correctness/security bug.
- **Approve with comments** — standards or practice issues only.
- **Approve** — no findings.

Under Coverage, one line each: pass, or the finding ids that failed it. Do not restate the whole rubric.
