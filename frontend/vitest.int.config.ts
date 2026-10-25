import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['src/api/core/core.int.test.ts'],
    fileParallelism: false,
    globalSetup: './src/api/core/int-setup.ts',
    env: {
      DATABASE_URL: process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
      COOKIE_SECRET: process.env.COOKIE_SECRET ?? 'dev-cookie-secret',
    },
  },
})
