// Opt-in smoke test. Skipped unless E2E_REAL_AI=1. Uses ai-reporter/.env (the real key), not the stub.
import { spawn, type ChildProcess } from 'node:child_process'
import { createServer } from 'node:net'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'

function freePort() {
  return new Promise<number>((resolve, reject) => {
    const s = createServer()
    s.listen(0, '127.0.0.1', () => {
      const addr = s.address()
      const port = typeof addr === 'object' && addr ? addr.port : 0
      s.close((err) => (err ? reject(err) : resolve(port)))
    })
  })
}

async function waitHealth(port: number) {
  for (let i = 0; i < 50; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/ai/health`)
      if (res.ok) return
    } catch {
      /* still booting */
    }
    await new Promise((r) => setTimeout(r, 100))
  }
  throw new Error('ai reporter did not become healthy')
}

test('one chat and a draft against OpenAI', async ({ request }) => {
  test.skip(process.env.E2E_REAL_AI !== '1', 'set E2E_REAL_AI=1 to call OpenAI')
  test.setTimeout(180_000)

  const email = `e2e-real-${Date.now()}@test.local`
  const signed = await request.post('/api/auth/google', { data: { email } })
  expect(signed.ok()).toBeTruthy()
  await request.patch('/api/me', { data: { name: 'מאיה', gender: 'female', birthYear: 1990 } })
  const cookie = (signed.headers()['set-cookie'] ?? '')
    .split('\n')
    .map((part) => part.split(';')[0])
    .filter(Boolean)
    .join('; ')

  const port = await freePort()
  const env: NodeJS.ProcessEnv = { ...process.env, PORT: String(port) }
  delete env.OPENAI_BASE_URL
  const child: ChildProcess = spawn(process.execPath, ['--env-file-if-exists=.env', '--experimental-strip-types', 'src/server.ts'], {
    cwd: fileURLToPath(new URL('../../ai-reporter/', import.meta.url)),
    env,
    stdio: 'inherit',
  })
  try {
    await waitHealth(port)
    const base = `http://127.0.0.1:${port}`
    const session = await request.post(`${base}/ai/reporter/sessions`, { headers: { cookie } })
    expect(session.ok()).toBeTruthy()
    const id = (await session.json()).id as string
    for (const text of ['סיימתי להרכיב ארון איקאה לבד', 'הארון עומד', 'נשארו שלושה ברגים']) {
      const turn = await request.post(`${base}/ai/reporter/sessions/${id}/messages`, {
        headers: { cookie },
        data: { text },
      })
      expect(turn.ok()).toBeTruthy()
    }
    const draft = await request.post(`${base}/ai/editor/drafts`, { headers: { cookie }, data: { sessionId: id } })
    expect(draft.ok()).toBeTruthy()
    const body = (await draft.json()) as { headline: string; body: string[] }
    expect(body.headline.length).toBeGreaterThan(0)
    expect(body.body.length).toBeGreaterThan(0)
  } finally {
    child.kill()
  }
})
