import { expect, type BrowserContext, type Page } from '@playwright/test'

export function freshEmail() {
  return `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.local`
}

export async function fillProfile(page: Page, name: string) {
  await page.getByLabel('איך תרצו שיקראו לכם?').fill(name)
  await page.getByRole('button', { name: 'נקבה' }).click()
  await page.getByLabel('שנת לידה').fill('1990')
  await page.getByRole('button', { name: 'המשך' }).click()
}

export async function useOtherAccount(page: Page, email = freshEmail()) {
  await page.getByRole('button', { name: 'שימוש בחשבון אחר' }).click()
  await page.getByLabel('כתובת מייל').fill(email)
  await page.getByRole('button', { name: 'המשך' }).click()
  return email
}

/** Lands on the welcome screen of a new account. */
export async function signUp(page: Page, name = 'מאיה') {
  await page.goto('/')
  await page.getByRole('button', { name: 'כניסה' }).click()
  await useOtherAccount(page)
  await fillProfile(page, name)
  await expect(page.getByText(`ברוכים הבאים, ${name}`)).toBeVisible()
}

export async function dismissTip(page: Page, step: string) {
  await expect(page.getByText(step)).toBeVisible()
  await page.getByRole('button', { name: 'הבנתי' }).click()
}

export async function otherPage(page: Page) {
  const browser = page.context().browser()
  if (!browser) throw new Error('browser missing')
  const context: BrowserContext = await browser.newContext({
    baseURL: 'http://127.0.0.1:5174',
    viewport: page.viewportSize() ?? undefined,
  })
  return { context, page: await context.newPage() }
}

export async function apiSignIn(page: Page, name: string) {
  const res = await page.request.post('/api/auth/google', { data: { email: freshEmail() } })
  expect(res.ok()).toBeTruthy()
  const me = (await res.json()) as { id: string; name: string }
  const patch = await page.request.patch('/api/me', { data: { name, gender: 'female', birthYear: 1990 } })
  expect(patch.ok()).toBeTruthy()
  return { ...me, name }
}

export async function publish(page: Page, headline: string, audience: { mode: string; personIds?: string[]; groupId?: string }) {
  const res = await page.request.post('/api/articles', {
    data: {
      content: {
        headline,
        sub: 'תת כותרת',
        summary: 'סיכום',
        body: ['פסקה אחת'],
        flash: `מבזק ${headline}`,
        push: 'פוש',
      },
      prevId: null,
      audience,
      saveFacts: [],
    },
  })
  expect(res.ok()).toBeTruthy()
  return (await res.json()) as { id: string }
}
