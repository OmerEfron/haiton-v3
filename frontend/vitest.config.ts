import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    exclude: ['src/api/core/core.int.test.ts', 'node_modules/**'],
  },
})
