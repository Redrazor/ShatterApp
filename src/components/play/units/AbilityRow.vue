<script setup lang="ts">
import { computed } from 'vue'
import type { Ability } from '../../../composables/useAbilities.ts'
import { imageUrl } from '../../../utils/imageUrl.ts'

const props = defineProps<{
  ability: Ability
  unitTags: string[]
  keywords: Record<string, string>
}>()

const iconSrc = computed(() => imageUrl(`/images/icons/${props.ability.type}.png`))

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
      return `<img src="${src}" class="inline h-3.5 w-3.5 align-middle mx-0.5" alt="${iconName}" onerror="this.replaceWith(document.createTextNode('[${iconMatch[1]}]'))" />`
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
  <div class="flex items-start gap-1.5 text-xs">
    <img
      :src="iconSrc"
      class="h-4 w-4 flex-shrink-0 mt-0.5"
      :alt="ability.type"
      onerror="this.style.display='none'"
    />
    <div>
      <span class="font-bold text-zinc-200 text-[11px]">{{ ability.name }}</span>
      <p class="text-zinc-500 leading-relaxed mt-0.5" v-html="renderedDescription" />
    </div>
  </div>
</template>
