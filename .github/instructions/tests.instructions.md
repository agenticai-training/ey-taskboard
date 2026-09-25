---
applyTo: "**/*{test,Test,tests,Tests,_test}*.{cs,py,js,jsx,java}"
---
# Writing tests for the Task Board

- Mirror the structure of the neighbouring existing test file — same framework,
  same naming, same arrange/act/assert rhythm.
  - .NET: xUnit + `WebApplicationFactory` for controller tests.
  - Python: pytest + `httpx.AsyncClient` against the FastAPI app.
  - Java: JUnit 5 + `@SpringBootTest` / `MockMvc`.
  - Frontend: Vitest + Testing Library.
- Every endpoint test covers: the happy path, `404` for a missing id, and
  `422` for a missing title or an unknown status.
- Unit and API tests do not hit a real database. Use the existing in-memory /
  fixture setup from `conftest.py`, the test factory, or the repository fake
  already in the suite. Playwright specs in `frontend/e2e/` are the end-to-end
  suite, run separately from `npm test -- --run`, and are the only tests
  allowed to use a real database.
- Name tests for the behaviour, not the method: `returns_422_when_title_missing`.