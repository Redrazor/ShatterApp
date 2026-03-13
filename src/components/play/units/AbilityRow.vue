<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Ability } from '../../../composables/useAbilities.ts'
import { imageUrl } from '../../../utils/imageUrl.ts'

const props = defineProps<{
  ability: Ability
  unitTags: string[]
  keywords: Record<string, string>
  activeTag?: string | null
}>()

const showTooltip = ref(false)
const activeRuleKw = ref<string | null>(null)

const iconSrc = computed(() => imageUrl(`/images/icons/${props.ability.type}.png`))

const TYPE_DESCRIPTIONS: Record<string, { label: string; description: string }> = {
  innate:   { label: 'Innate',    description: 'Always active — no Force cost. This ability is in effect at all times and does not need to be triggered.' },
  active:   { label: 'Active',    description: 'Costs Force (⊕) to use. Spend the listed number of Force points to activate this ability during your turn.' },
  reactive: { label: 'Reactive',  description: 'Triggered by an opponent\'s action. Spend Force (⊕) to use this ability in response to a specific game event.' },
  tactic:   { label: 'Tactic',    description: 'A tactical ability. Spend Force (⊕) to gain a strategic advantage outside of normal attacks.' },
  identity: { label: 'Identity',  description: 'A unique ability that defines this character. Spend Force (⊕) as indicated — these abilities reflect the unit\'s signature role.' },
}

const RULE_KEYWORDS: Record<string, { label: string; description: string }> = {
  'Immunity':     { label: 'Immunity [X]',     description: 'This Unit can\'t suffer the listed condition. If a Unit has a condition and gains Immunity to it, the Unit removes the condition.' },
  'Impact':       { label: 'Impact [X]',       description: 'When this character makes a focus action it adds X additional dice to its next Melee attack in addition to the 1 attack die added by the focus action.' },
  'Protection':   { label: 'Protection',       description: 'When this character is defending, before applying the Damage Pool, remove 1 damage from the Damage Pool.' },
  'Scale':        { label: 'Scale',            description: 'When this character would advance or dash it may climb instead.' },
  'Sharpshooter': { label: 'Sharpshooter [X]', description: 'When this character makes a focus action it adds X additional dice to its next Ranged attack in addition to the 1 attack die added by the focus action.' },
  'Steadfast':    { label: 'Steadfast',        description: 'When this character is defending, it is not moved by the first Shove effect from the attacking character\'s chosen Combat Tree Options.' },
}

const typeInfo = computed(() => TYPE_DESCRIPTIONS[props.ability.type] ?? { label: props.ability.type, description: '' })
const activeRuleKwInfo = computed(() => activeRuleKw.value ? RULE_KEYWORDS[activeRuleKw.value] : null)

const renderedDescription = computed(() => {
  const tags = props.unitTags
  const kwMap = props.keywords
  const kwKeys = Object.keys(kwMap).sort((a, b) => b.length - a.length)

  let text = props.ability.description

  // Pass 1: Replace rule keywords (including optional [X] suffix) with placeholders.
  // Must run before icon tokenisation so "Immunity [exposed]" is captured as a unit.
  const ruleKwMatches: { match: string; kw: string }[] = []
  for (const kw of Object.keys(RULE_KEYWORDS)) {
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(`\\b${escaped}(?:\\s*\\[[^\\]]+\\])?`, 'g')
    text = text.replace(regex, (match) => {
      const idx = ruleKwMatches.length
      ruleKwMatches.push({ match, kw })
      return `\x00RK${idx}\x00`
    })
  }

  // Pass 2: Tokenise on [icon_name] brackets, then process each segment.
  const parts = text.split(/(\[[^\]]+\])/g)
  const result = parts.map(part => {
    // Icon token
    const iconMatch = part.match(/^\[([^\]]+)\]$/)
    if (iconMatch) {
      const iconName = iconMatch[1].toLowerCase().replace(/\s+/g, '_')
      const src = imageUrl(`/images/icons/${iconName}.png`)
      return `<img src="${src}" class="inline-block h-4 w-4 align-middle mx-0.5 object-contain" alt="${iconName}" onerror="this.replaceWith(document.createTextNode('[${iconMatch[1]}]'))" />`
    }

    // Text segment — highlight regular keywords
    let seg = part
    for (const kw of kwKeys) {
      const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp(`\\b${escaped}\\b`, 'g')
      if (regex.test(seg)) {
        const cls = tags.includes(kw) || kw === props.activeTag
          ? 'font-bold text-amber-400'
          : 'font-bold text-zinc-200'
        seg = seg.replace(new RegExp(`\\b${escaped}\\b`, 'g'), `<strong class="${cls}">${kw}</strong>`)
      }
    }
    return seg
  }).join('')

  // Pass 3: Restore rule keyword placeholders as clickable buttons.
  return result.replace(/\x00RK(\d+)\x00/g, (_, idx) => {
    const { match, kw } = ruleKwMatches[parseInt(idx)]
    return `<button data-rule-kw="${kw}" class="font-bold text-amber-400 cursor-pointer">${match}</button>`
  })
})

function onDescriptionClick(e: MouseEvent) {
  const kw = (e.target as HTMLElement).dataset?.ruleKw
  if (kw) {
    activeRuleKw.value = activeRuleKw.value === kw ? null : kw
  }
}
</script>

<template>
  <div class="flex items-start gap-2">
    <!-- Ability type icon with tooltip -->
    <div class="relative flex-shrink-0">
      <img
        :src="iconSrc"
        class="h-6 w-6 mt-0.5 object-contain cursor-pointer"
        :alt="ability.type"
        onerror="this.style.display='none'"
        @mouseenter="showTooltip = true"
        @mouseleave="showTooltip = false"
        @click.stop="showTooltip = !showTooltip; activeRuleKw = null"
      />
      <!-- Tap-outside backdrop -->
      <div
        v-if="showTooltip"
        class="fixed inset-0 z-40"
        @click.stop="showTooltip = false"
      />
      <!-- Type tooltip -->
      <div
        v-if="showTooltip"
        class="absolute left-8 top-0 z-50 w-64 rounded-lg border border-zinc-700 bg-zinc-900 p-2.5 shadow-xl text-xs text-zinc-300 leading-relaxed"
        @mouseenter="showTooltip = true"
        @mouseleave="showTooltip = false"
      >
        <div class="flex items-center gap-1.5 mb-1">
          <img :src="iconSrc" class="h-5 w-5 object-contain flex-shrink-0" />
          <span class="font-bold text-zinc-100 text-sm">{{ typeInfo.label }}</span>
        </div>
        <p class="text-zinc-400">{{ typeInfo.description }}</p>
      </div>
    </div>

    <div class="flex-1 min-w-0">
      <span class="font-bold text-zinc-200 text-sm">{{ ability.name }}</span>
      <p
        class="text-zinc-400 text-xs leading-relaxed mt-0.5"
        v-html="renderedDescription"
        @click.stop="onDescriptionClick"
      />
      <!-- Rule keyword tooltip (inline, below description) -->
      <div
        v-if="activeRuleKwInfo"
        class="mt-1.5 rounded-lg border border-amber-900/40 bg-zinc-800/60 px-2.5 py-2 text-xs leading-relaxed"
      >
        <div class="font-bold text-amber-400 mb-0.5">{{ activeRuleKwInfo.label }}</div>
        <p class="text-zinc-400">{{ activeRuleKwInfo.description }}</p>
      </div>
      <!-- Backdrop to dismiss rule keyword tooltip -->
      <div
        v-if="activeRuleKw"
        class="fixed inset-0 z-40"
        @click.stop="activeRuleKw = null"
      />
    </div>
  </div>
</template>
