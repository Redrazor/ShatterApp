import type { Character, Mission, Squad } from '../types/index.ts'

export function encodeSPT(
  squads: Squad[],
  extraSquads: Squad[],
  mission: Mission | null,
  characters: Character[],
): string {
  const charById = new Map(characters.map(c => [c.id, c]))

  const allSquads = [...squads, ...extraSquads]
  const unitIds: number[] = []
  for (const squad of allSquads) {
    for (const role of ['primary', 'secondary', 'support'] as const) {
      const c = squad[role]
      if (c) unitIds.push(c.id)
    }
  }

  const codes: string[] = []

  if (mission?.spt) codes.push(mission.spt)

  for (const id of unitIds) {
    const spt = charById.get(id)?.spt
    if (spt) codes.push(spt)
  }

  return `spt[${codes.join(',')}]`
}
