import { execSync } from 'node:child_process'

const dbName = 'taskboard_e2e'

export function resetDatabase() {
  execSync(
    `PGPASSWORD=postgres psql -h localhost -U postgres -d ${dbName} -v ON_ERROR_STOP=1 -c "TRUNCATE comments, tasks RESTART IDENTITY CASCADE"`,
    { stdio: 'pipe' },
  )
}
