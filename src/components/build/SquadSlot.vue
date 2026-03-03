<script setup lang="ts">
import { computed } from 'vue'
import type { Squad } from '../../types/index.ts'
import { isSquadValid } from '../../types/index.ts'

const props = defineProps<{
  squad: Squad
  squadIndex: number
}>()

const emit = defineEmits<{
  (e: 'pick', role: keyof Squad): void
  (e: 'clear', role: keyof Squad): void
}>()

const validResult = computed(() => isSquadValid(props.squad))
const valid = computed(() => validResult.value.valid)
const reason = computed(() => validResult.value.reason)

const pcSum = computed(() => {
  const sec = props.squad.secondary?.pc ?? 0
  const sup = props.squad.support?.pc ?? 0
  return sec + sup
})

const roles = [
  { key: 'primary' as const, label: 'Primary', icon: '⭐' },
  { key: 'secondary' as const, label: 'Secondary', icon: '🔵' },
  { key: 'support' as const, label: 'Support', icon: '🟢' },
]
</script>

<template>
  <div
    :class="[
      'rounded-xl border p-4 space-y-3 transition-colors',
      valid ? 'border-green-500/50 bg-green-900/10' : 'border-red-500/50 bg-red-900/10',
    ]"
  >
    <!-- Squad header -->
    <div class="flex items-center justify-between">
      <h3 class="font-semibold text-sw-text">Squad {{ squadIndex + 1 }}</h3>
      <div
        :class="[
          'flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium',
          valid ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400',
        ]"
      >
        <span>{{ squad.primary ? `SP: ${squad.primary.sp}` : 'SP: –' }}</span>
        <span>|</span>
        <span>PC: {{ pcSum }}</span>
        <span :class="valid ? 'text-green-400' : 'text-red-400'">
          {{ valid ? '✓' : '✗' }}
        </span>
      </div>
    </div>

    <!-- Validation reason -->
    <p v-if="!valid && reason !== 'Squad incomplete'" class="text-xs text-red-400/80">{{ reason }}</p>

    <!-- Slots -->
    <div class="space-y-2">
      <div
        v-for="role in roles"
        :key="role.key"
        class="flex items-center gap-2"
      >
        <span class="w-20 shrink-0 text-xs text-sw-text/50">{{ role.icon }} {{ role.label }}</span>

        <div
          v-if="squad[role.key]"
          class="flex flex-1 items-center gap-2 rounded-lg border border-sw-gold/30 bg-sw-dark px-3 py-2 transition-colors hover:border-sw-gold cursor-pointer"
          role="button"
          tabindex="0"
          @click="emit('pick', role.key)"
          @keydown.enter="emit('pick', role.key)"
        >
          <img
            v-if="squad[role.key]!.thumbnail"
            :src="squad[role.key]!.thumbnail"
            :alt="squad[role.key]!.name"
            class="h-8 w-8 rounded object-cover"
          />
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium text-sw-text">{{ squad[role.key]!.name }}</p>
            <p class="text-xs text-sw-gold">
              {{ role.key === 'primary' ? `SP: ${squad[role.key]!.sp}` : `PC: ${squad[role.key]!.pc}` }}
            </p>
          </div>
          <button
            class="ml-auto shrink-0 rounded p-1 text-sw-text/40 hover:text-red-400"
            @click.stop="emit('clear', role.key)"
            aria-label="Remove unit"
          >
            ✕
          </button>
        </div>

        <button
          v-else
          class="flex flex-1 items-center gap-2 rounded-lg border border-dashed border-sw-gold/20 px-3 py-2 text-sw-text/40 transition-colors hover:border-sw-gold/50 hover:text-sw-text/60"
          @click="emit('pick', role.key)"
        >
          <span class="text-lg">+</span>
          <span class="text-sm">Add {{ role.label }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
