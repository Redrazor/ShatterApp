export const SW_NAMES = [
  // Prequel era
  'Anakin', 'Ahsoka', 'Obi-Wan', 'Yoda', 'Mace', 'Qui-Gon', 'Padme', 'Maul',
  // Villains / dark side
  'Vader', 'Palpatine', 'Dooku', 'Grievous', 'Tarkin', 'Thrawn', 'Ventress',
  // Original Trilogy
  'Luke', 'Leia', 'Han', 'Chewie', 'Lando', 'Wedge', 'Ackbar', 'Rex',
  // Clone Wars / Bad Batch
  'Cody', 'Wolffe', 'Fives', 'Boba', 'Jango', 'Omega',
  // Sequel Trilogy
  'Rey', 'Finn', 'Poe', 'Kylo', 'Phasma',
  // Rebels
  'Ezra', 'Kanan', 'Hera', 'Sabine',
  // Mandalorian era
  'Bo-Katan', 'Mando', 'Grogu', 'Fennec', 'Cad', 'Cassian',
  // Rogue One / Andor / other
  'Jyn', 'Saw', 'Cara', 'Aayla', 'Plo', 'Hondo',
]

export function randomSwName(): string {
  return SW_NAMES[Math.floor(Math.random() * SW_NAMES.length)]
}
