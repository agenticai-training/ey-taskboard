import { execSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '../..')
const schemaPath = path.join(repoRoot, 'database/schema.sql')
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
}
