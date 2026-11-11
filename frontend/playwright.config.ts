import { defineConfig, devices } from '@playwright/test'

const stub = 'http://127.0.0.1:4099'
const ai = 'http://127.0.0.1:4100'
const api = 'http://127.0.0.1:4000'
const web = 'http://127.0.0.1:5174'
const mockWeb = 'http://127.0.0.1:5175'

function env(extra: Record<string, string>) {
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(process.env)) if (value !== undefined) out[key] = value
  return { ...out, ...extra }
}

// Writing and publishing a Draft spends 5 model calls. The quota spec needs the cap low enough that
// follow-up messages still record usage (the 8th turn in a session does not), so keep this between 6 and 10.
const uiIgnore = [/api\.spec\.ts/, /real-ai\.spec\.ts/, /\.mock\.spec\.ts/]

export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  use: { baseURL: web, trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] }, testIgnore: uiIgnore },
    { name: 'mobile', use: { ...devices['Pixel 7'] }, testIgnore: uiIgnore },
    // Mock mode: MSW answers in the browser, so these specs need no backend. Mock quota limit is 3 (see the vite server below).
    { name: 'mock', testMatch: /\.mock\.spec\.ts/, use: { ...devices['Desktop Chrome'], baseURL: mockWeb } },
    { name: 'api', testMatch: /api\.spec\.ts|real-ai\.spec\.ts/ },
  ],
  webServer: [
    {
      command: 'node --experimental-strip-types ../ai-reporter/test/openai-stub.ts',
      url: `${stub}/health`,
      name: 'openai-stub',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      stdout: 'pipe',
    },
    {
      command: 'node --env-file-if-exists=.env --experimental-strip-types src/server.ts',
      cwd: '../backend',
      url: `${api}/api/health`,
      name: 'backend',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      stdout: 'pipe',
      env: env({ AUTH_LIMIT: '1000', API_LIMIT: '10000' }),
    },
    {
      command: 'node --env-file-if-exists=.env --experimental-strip-types src/server.ts',
      cwd: '../ai-reporter',
      url: `${ai}/ai/health`,
      name: 'ai-reporter',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      stdout: 'pipe',
      env: env({ OPENAI_BASE_URL: stub, OPENAI_API_KEY: 'test', PORT: '4100', AI_DAILY_CALLS: '8', AI_LIMIT: '10000' }),
    },
    {
      command: 'npx vite --host 127.0.0.1 --port 5174 --strictPort',
      url: web,
      name: 'vite',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      stdout: 'pipe',
      env: env({ VITE_MOCK_AI: 'false', VITE_MOCK_CORE: 'false' }),
    },
    {
      command: 'npx vite --host 127.0.0.1 --port 5175 --strictPort',
      url: mockWeb,
      name: 'vite-mock',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      stdout: 'pipe',
      env: env({ VITE_MOCK_AI: 'true', VITE_MOCK_CORE: 'true', VITE_MOCK_AI_LIMIT: '3' }),
    },
  ],
})
