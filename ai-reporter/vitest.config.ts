import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const repo = join(dirname(fileURLToPath(import.meta.url)), '..')

export default defineConfig({
  server: { fs: { allow: [repo] } },
  test: {
    include: ['test/**/*.test.ts'],
    setupFiles: ['./test/env.ts'],
    fileParallelism: false,
    globalSetup: './test/global-setup.ts',
    testTimeout: 20_000,
    env: {
      DATABASE_URL: process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
      COOKIE_SECRET: process.env.COOKIE_SECRET ?? 'dev-cookie-secret',
      OPENAI_BASE_URL: 'http://127.0.0.1:4099',
      OPENAI_API_KEY: 'test',
      AI_DAILY_CALLS: '8',
    },
  },
})
