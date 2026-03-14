export interface RuleKeyword {
  label: string
  description: string
}

export const RULE_KEYWORDS: Record<string, RuleKeyword> = {
  'Immunity':     { label: 'Immunity [X]',     description: 'This Unit can\'t suffer the listed condition. If a Unit has a condition and gains Immunity to it, the Unit removes the condition.' },
  'Impact':       { label: 'Impact [X]',       description: 'When this character makes a focus action it adds X additional dice to its next Melee attack in addition to the 1 attack die added by the focus action.' },
  'Protection':   { label: 'Protection',       description: 'When this character is defending, before applying the Damage Pool, remove 1 damage from the Damage Pool.' },
  'Scale':        { label: 'Scale',            description: 'When this character would advance or dash it may climb instead.' },
  'Sharpshooter': { label: 'Sharpshooter [X]', description: 'When this character makes a focus action it adds X additional dice to its next Ranged attack in addition to the 1 attack die added by the focus action.' },
  'Steadfast':    { label: 'Steadfast',        description: 'When this character is defending, it is not moved by the first Shove effect from the attacking character\'s chosen Combat Tree Options.' },
}
