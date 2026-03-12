<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Ability } from '../../../composables/useAbilities.ts'
import { imageUrl } from '../../../utils/imageUrl.ts'

const props = defineProps<{
  ability: Ability
  unitTags: string[]
  keywords: Record<string, string>
}>()

const showTooltip = ref(false)

const iconSrc = computed(() => imageUrl(`/images/icons/${props.ability.type}.png`))

const TYPE_DESCRIPTIONS: Record<string, { label: string; description: string }> = {
  innate:   { label: 'Innate',    description: 'Always active — no Force cost. This ability is in effect at all times and does not need to be triggered.' },
  active:   { label: 'Active',    description: 'Costs Force (⊕) to use. Spend the listed number of Force points to activate this ability during your turn.' },
  reactive: { label: 'Reactive',  description: 'Triggered by an opponent\'s action. Spend Force (⊕) to use this ability in response to a specific game event.' },
  tactic:   { label: 'Tactic',    description: 'A tactical ability. Spend Force (⊕) to gain a strategic advantage outside of normal attacks.' },
  identity: { label: 'Identity',  description: 'A unique ability that defines this character. Spend Force (⊕) as indicated — these abilities reflect the unit\'s signature role.' },
}

const typeInfo = computed(() => TYPE_DESCRIPTIONS[props.ability.type] ?? { label: props.ability.type, description: '' })

const renderedDescription = computed(() => {
  const tags = props.unitTags
  const kwMap = props.keywords

  // Tokenise on [icon_name] patterns
  const parts = props.ability.description.split(/(\[[^\]]+\])/g)

  // Build sorted keyword list (longest first to avoid partial matches)
  const kwKeys = Object.keys(kwMap).sort((a, b) => b.length - a.length)

  return parts.map(part => {
    // Icon token
    const iconMatch = part.match(/^\[([^\]]+)\]$/)
    if (iconMatch) {
      const iconName = iconMatch[1].toLowerCase().replace(/\s+/g, '_')
      const src = imageUrl(`/images/icons/${iconName}.png`)
      return `<img src="${src}" class="inline-block h-4 w-4 align-middle mx-0.5 object-contain" alt="${iconName}" onerror="this.replaceWith(document.createTextNode('[${iconMatch[1]}]'))" />`
    }

    // Text segment — highlight keywords
    let text = part
    for (const kw of kwKeys) {
      // Whole-word match, case-sensitive
      const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp(`\\b${escaped}\\b`, 'g')
      if (regex.test(text)) {
        const cls = tags.includes(kw)
          ? 'font-bold text-amber-400'
          : 'font-bold text-zinc-200'
        text = text.replace(regex, `<strong class="${cls}">${kw}</strong>`)
      }
    }
    return text
  }).join('')
})
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
        @click.stop="showTooltip = !showTooltip"
      />
      <!-- Tap-outside backdrop to dismiss tooltip on mobile -->
      <div
        v-if="showTooltip"
        class="fixed inset-0 z-40"
        @click.stop="showTooltip = false"
      />
      <!-- Tooltip -->
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
    <div>
      <span class="font-bold text-zinc-200 text-sm">{{ ability.name }}</span>
      <p class="text-zinc-400 text-xs leading-relaxed mt-0.5" v-html="renderedDescription" />
    </div>
  </div>
</template>
