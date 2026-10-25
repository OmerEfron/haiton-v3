import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    fileParallelism: false,
    globalSetup: './test/global-setup.ts',
    env: {
      DATABASE_URL: process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
      COOKIE_SECRET: process.env.COOKIE_SECRET ?? 'dev-cookie-secret',
    },
  },
})
