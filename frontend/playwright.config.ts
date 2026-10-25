import { defineConfig, devices } from '@playwright/test'

const stub = 'http://127.0.0.1:4099'
const ai = 'http://127.0.0.1:4100'
const api = 'http://127.0.0.1:4000'
const web = 'http://127.0.0.1:5174'

function env(extra: Record<string, string>) {
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(process.env)) if (value !== undefined) out[key] = value
  return { ...out, ...extra }
}

export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  use: { ...devices['Desktop Chrome'], baseURL: web },
  webServer: [
    {
      command: 'node --experimental-strip-types e2e/openai-stub.ts',
      url: `${stub}/health`,
      name: 'openai-stub',
      reuseExistingServer: true,
    },
    {
      command: 'node --env-file-if-exists=.env --experimental-strip-types src/server.ts',
      cwd: '../backend',
      url: `${api}/api/health`,
      name: 'backend',
      reuseExistingServer: true,
    },
    {
      command: 'node --env-file-if-exists=.env --experimental-strip-types src/server.ts',
      cwd: '../ai-reporter',
      url: `${ai}/ai/health`,
      name: 'ai-reporter',
      reuseExistingServer: true,
      env: env({ OPENAI_BASE_URL: stub, PORT: '4100' }),
    },
    {
      command: 'npx vite --port 5174 --strictPort',
      url: web,
      name: 'vite',
      reuseExistingServer: true,
      env: env({ VITE_MOCK_AI: 'false', VITE_MOCK_CORE: 'false' }),
    },
  ],
})
