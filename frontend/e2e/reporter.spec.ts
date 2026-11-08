import { spawn, type ChildProcess } from 'node:child_process'
import { createServer } from 'node:net'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'
import type { APIResponse, Page } from '@playwright/test'

const FIRST = 'אחרי השיחה: כותרת ראשונה לבדיקה'
const REVISED = 'אחרי השיחה: כותרת מתוקנת לבדיקה'

async function dismissTip(page: Page, step: string) {
  await expect(page.getByText(step)).toBeVisible()
  await page.getByRole('button', { name: 'הבנתי' }).click()
}

test('chat, revise, and publish a story', async ({ page }) => {
  const address = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.local`

  await page.goto('/')
  await page.getByRole('button', { name: 'כניסה' }).click()
  await page.getByRole('button', { name: 'שימוש בחשבון אחר' }).click()
  await page.getByLabel('כתובת מייל').fill(address)
  await page.getByRole('button', { name: 'המשך' }).click()

  await page.getByLabel('איך תרצו שיקראו לכם?').fill('מאיה')
  await page.getByRole('button', { name: 'נקבה' }).click()
  await page.getByLabel('שנת לידה').fill('1990')
  await page.getByRole('button', { name: 'המשך' }).click()
  await page.getByRole('button', { name: 'לכתבה הראשונה שלי' }).click()

  await dismissTip(page, 'שלב 1 מתוך 4')
  await expect(page.getByText('מה קרה?')).toBeVisible()
  await page.getByLabel('הודעה לכתב').fill('סיימתי להרכיב ארון')
  await expect(page.getByRole('button', { name: 'שליחה' })).toBeEnabled()
  await page.getByRole('button', { name: 'שליחה' }).click()
  await expect(page.getByText('רגע, ומה קרה אחר כך?')).toBeVisible()
  await expect(page.getByRole('button', { name: 'די, תיצור טיוטה' })).toHaveCount(0)
  await page.getByLabel('הודעה לכתב').fill('הארון עומד')
  await page.getByRole('button', { name: 'שליחה' }).click()
  await expect(page.getByText('רגע, ומה קרה אחר כך?')).toHaveCount(2)
  await page.getByLabel('הודעה לכתב').fill('נשארו ברגים')
  await page.getByRole('button', { name: 'שליחה' }).click()
  await page.getByRole('button', { name: 'די, תיצור טיוטה' }).click()

  await expect(page.getByRole('heading', { name: FIRST })).toBeVisible()
  await dismissTip(page, 'שלב 2 מתוך 4')
  await page.getByRole('button', { name: 'כותרת חדשה' }).click()
  await expect(page.getByRole('heading', { name: REVISED })).toBeVisible()
  await page.getByRole('button', { name: 'המשך לפרסום' }).click()

  await dismissTip(page, 'שלב 3 מתוך 4')
  await page.getByRole('button', { name: 'שמירה לעצמי' }).click()
  await expect(page.getByText('שלב 4 מתוך 4')).toBeVisible()
  await page.mouse.click(8, 8)
  await expect(page.getByRole('heading', { name: REVISED })).toBeVisible()
})

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

function cookieOf(res: APIResponse) {
  return (res.headers()['set-cookie'] ?? '')
    .split('\n')
    .map((part) => part.split(';')[0])
    .filter(Boolean)
    .join('; ')
}

test('daily quota blocks article calls and not the intro', async ({ playwright, baseURL }) => {
  const ctx = await playwright.request.newContext({ baseURL })
  const signed = await ctx.post('/api/auth/google', {
    data: { email: `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.local` },
  })
  expect(signed.status()).toBe(200)

  const port = await freePort()
  const child: ChildProcess = spawn(process.execPath, ['--env-file-if-exists=.env', '--experimental-strip-types', 'src/server.ts'], {
    cwd: fileURLToPath(new URL('../../ai-reporter/', import.meta.url)),
    env: { ...process.env, PORT: String(port), OPENAI_BASE_URL: 'http://127.0.0.1:4099', AI_DAILY_CALLS: '1' },
    stdio: 'inherit',
  })
  const headers = { cookie: cookieOf(signed) }
  try {
    await waitHealth(port)
    const base = `http://127.0.0.1:${port}`
    const created = await ctx.post(`${base}/ai/reporter/sessions`, { headers })
    expect(created.status()).toBe(200)
    const id = (await created.json()).id as string

    const first = await ctx.post(`${base}/ai/reporter/sessions/${id}/messages`, { headers, data: { text: 'סיימתי להרכיב ארון' } })
    expect(first.status()).toBe(200)

    const quota = await ctx.get(`${base}/ai/quota`, { headers })
    expect(quota.status()).toBe(200)
    const body = (await quota.json()) as { used: number; limit: number; resetsAt: string | null }
    expect(body).toMatchObject({ used: 1, limit: 1 })
    expect(typeof body.resetsAt).toBe('string')

    const blocked = await ctx.post(`${base}/ai/reporter/sessions/${id}/messages`, { headers, data: { text: 'הארון עומד' } })
    expect(blocked.status()).toBe(429)

    const intro = await ctx.post(`${base}/ai/intro/sessions`, { headers })
    expect(intro.status()).toBe(200)
    const introId = (await intro.json()).id as string
    const introMsg = await ctx.post(`${base}/ai/intro/sessions/${introId}/messages`, { headers, data: { text: 'אני עובד בגן' } })
    expect(introMsg.status()).toBe(200)

    const after = await ctx.get(`${base}/ai/quota`, { headers })
    expect(await after.json()).toMatchObject({ used: 1, limit: 1 })
  } finally {
    child.kill()
    await ctx.dispose()
  }
})
