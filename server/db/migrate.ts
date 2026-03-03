import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { db, sqlite } from './index.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))

migrate(db, { migrationsFolder: join(__dirname, 'migrations') })
console.log('Migrations applied successfully')
sqlite.close()
