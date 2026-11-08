import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    exclude: ['src/**/*.int.test.ts', 'e2e/**', 'node_modules/**'],
  },
})
