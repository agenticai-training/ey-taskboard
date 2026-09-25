# Agent Instructions

Cursor rules in [`.cursor/rules/`](.cursor/rules/) are the agent equivalent of the GitHub Copilot instructions. Follow the rules.

| Cursor rule | Copilot source | Applies |
| --- | --- | --- |
| [`.cursor/rules/engineering.mdc`](.cursor/rules/engineering.mdc) | [`.github/copilot-instructions.md`](.github/copilot-instructions.md) | Every session |
| [`.cursor/rules/frontend.mdc`](.cursor/rules/frontend.mdc) | [`.github/instructions/frontend.instructions.md`](.github/instructions/frontend.instructions.md) | `frontend/**` |
| [`.cursor/rules/tests.mdc`](.cursor/rules/tests.mdc) | [`.github/instructions/tests.instructions.md`](.github/instructions/tests.instructions.md) | Test files |

When a Copilot instruction changes, update the matching Cursor rule in the same change.

## Quick reference
- Three layers: Controller/Router → Service → Repository. No layer-skipping.
- Schema is owned only by `database/schema.sql`. No migrations.
- Error contract: 404 missing id, 422 missing title / unknown status.
- Add or update a test before considering an endpoint change done.

## Build & test
- Backend (.NET): `cd backend-dotnet && dotnet test`
- Backend (Python): `cd backend-python && pytest`
- Backend (Java): `cd backend-java && ./mvnw -B test`
- Frontend: `cd frontend && npm test -- --run`
- End-to-end: Playwright in `frontend/e2e/`, run separately from `npm test -- --run`. This is the only suite allowed to hit a real database. Unit and API suites stay in-memory.
