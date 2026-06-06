import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/deckgame/',
  plugins: [react()],
  test: {
    environment: 'node',
    globals: true,
  },
})
