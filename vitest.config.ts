import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      thresholds: { lines: 75, functions: 75, branches: 75, statements: 75 },
      include: [
        'src/**/*.{ts,vue}',
        'scraper/normalise.ts',
        'server/routes/**/*.ts',
        'server/db/seed.ts',
      ],
      exclude: ['src/main.ts', 'src/router/index.ts'],
    },
  },
})
