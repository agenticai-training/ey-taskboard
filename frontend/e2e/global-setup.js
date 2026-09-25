import { execSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '../..')
const schemaPath = path.join(repoRoot, 'database/schema.sql')
const envLocalPath = path.join(repoRoot, 'frontend/.env.local')
const dbName = 'taskboard_e2e'

function psql(sql) {
  execSync(`PGPASSWORD=postgres psql -h localhost -U postgres -v ON_ERROR_STOP=1 -c ${JSON.stringify(sql)}`, {
    stdio: 'inherit',
  })
}

export default async function globalSetup() {
  psql(`DROP DATABASE IF EXISTS ${dbName}`)
  psql(`CREATE DATABASE ${dbName}`)
  execSync(
    `PGPASSWORD=postgres psql -h localhost -U postgres -d ${dbName} -v ON_ERROR_STOP=1 -f ${JSON.stringify(schemaPath)}`,
    { stdio: 'inherit' },
  )
  writeFileSync(envLocalPath, 'VITE_API_BASE_URL=http://localhost:8000\n', 'utf8')
}
