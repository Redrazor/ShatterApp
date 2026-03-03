<script setup lang="ts">
import { ref, onMounted } from 'vue'

const PDF_URL = 'https://cdn.svc.asmodee.net/production-amgcom/uploads/2026/02/SWP01_CoreRules_01.09.26.pdf'

const pdfBlocked = ref(false)

// Detect X-Frame-Options / CSP blocking via a HEAD request.
// If the server sends headers that forbid embedding, show the fallback.
onMounted(async () => {
  try {
    const res = await fetch(PDF_URL, { method: 'HEAD', mode: 'no-cors' })
    // no-cors returns opaque response — can't inspect headers.
    // We optimistically try the iframe; the error handler on the iframe itself
    // will flip pdfBlocked if embedding fails.
    void res
  } catch {
    pdfBlocked.value = true
  }
})

function onIframeError() {
  pdfBlocked.value = true
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <!-- Toolbar -->
    <div class="flex flex-wrap gap-2">
      <a
        :href="PDF_URL"
        download="Shatterpoint-Rulebook.pdf"
        class="rounded-lg border border-sw-gold/30 px-3 py-1.5 text-sm text-sw-text/70 hover:border-sw-gold hover:text-sw-gold transition-colors"
      >
        ⬇ Download
      </a>
      <a
        :href="PDF_URL"
        target="_blank"
        rel="noopener noreferrer"
        class="rounded-lg border border-sw-gold/30 px-3 py-1.5 text-sm text-sw-text/70 hover:border-sw-gold hover:text-sw-gold transition-colors"
      >
        ↗ Open in tab
      </a>
    </div>

    <!-- PDF iframe (may be blocked by browser X-Frame-Options) -->
    <div v-if="!pdfBlocked" class="rounded-lg overflow-hidden border border-sw-gold/10">
      <iframe
        :src="PDF_URL"
        class="w-full bg-sw-dark border-0"
        style="height: calc(100vh - 200px); min-height: 480px"
        title="Shatterpoint Rulebook"
        @error="onIframeError"
      />
    </div>

    <!-- Fallback when embedding is blocked -->
    <div v-else class="rounded-lg border border-sw-gold/10 bg-sw-card/40 p-8 text-center space-y-3">
      <p class="text-4xl">📖</p>
      <p class="text-sw-text/70">The rulebook PDF can't be embedded in-app due to browser security restrictions.</p>
      <p class="text-sm text-sw-text/40">Use the buttons above to download or open it in a new tab.</p>
    </div>
  </div>
</template>
