import { Router } from 'express'
import type Database from 'better-sqlite3'

type Sqlite = InstanceType<typeof Database>

export function rowToMission(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    swp: row.swp,
    spt: row.spt ?? undefined,
    card: row.card,
    struggles: {
      struggle1: [row.struggle1a, row.struggle1b, row.struggle1c].filter(Boolean) as string[],
      struggle2: [row.struggle2a, row.struggle2b, row.struggle2c].filter(Boolean) as string[],
      struggle3: [row.struggle3a, row.struggle3b, row.struggle3c].filter(Boolean) as string[],
    },
  }
}

export function createMissionsRouter(sqlite: Sqlite) {
  const router = Router()

  router.get('/', (_req, res) => {
    const rows = sqlite.prepare('SELECT * FROM missions ORDER BY id').all() as Record<string, unknown>[]
    res.json(rows.map(rowToMission))
  })

  router.get('/:id', (req, res) => {
    const row = sqlite.prepare('SELECT * FROM missions WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined
    if (!row) {
      res.status(404).json({ error: 'Not found' })
      return
    }
    res.json(rowToMission(row))
  })

  return router
}
