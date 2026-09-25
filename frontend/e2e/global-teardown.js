import { execSync } from 'node:child_process'

const dbName = 'taskboard_e2e'

export default async function globalTeardown() {
  try {
    execSync(
      `PGPASSWORD=postgres psql -h localhost -U postgres -v ON_ERROR_STOP=1 -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${dbName}' AND pid <> pg_backend_pid()"`,
      { stdio: 'pipe' },
    )
    execSync(
      `PGPASSWORD=postgres psql -h localhost -U postgres -v ON_ERROR_STOP=1 -c "DROP DATABASE IF EXISTS ${dbName}"`,
      { stdio: 'inherit' },
    )
  } catch {
    // Best-effort cleanup; report via test run if drop fails.
  }
}
