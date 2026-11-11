import { expect, test } from '@playwright/test'
import { dismissTip, signUp } from './helpers'

// Runs against the mock backend (MSW, VITE_MOCK_AI_LIMIT=3), see the `mock` project in playwright.config.ts.

test('mock quota counts Reporter calls and hits the 429 path at the limit', async ({ page }) => {
  await signUp(page)
  await page.getByRole('button', { name: 'לכתבה הראשונה שלי' }).click()
  await dismissTip(page, 'שלב 1 מתוך 4')
  await expect(page.getByText('נותרו 3 מתוך 3 פעולות היום')).toBeVisible()

  for (const [text, left] of [['אחד', 2], ['שניים', 1], ['שלושה', 0]] as const) {
    await page.getByLabel('הודעה לכתב').fill(text)
    await page.getByRole('button', { name: 'שליחה' }).click()
    await expect(page.getByText(`נותרו ${left} מתוך 3 פעולות היום`)).toBeVisible()
  }

  await page.goto('/compose/draft')
  await expect(page.getByText('הגעתם למכסה היומית. אפשר להמשיך מחר.')).toBeVisible()
})

test('mock Article read returns 404 once the author is no longer a Connection', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'כניסה' })).toBeVisible()
  const statuses = await page.evaluate(async () => {
    const send = (method: string, path: string, body?: object) =>
      fetch(`/api${path}`, { method, headers: { 'content-type': 'application/json' }, body: body && JSON.stringify(body) })
    const me: { id: string } = await (await send('POST', '/auth/google', { email: 'maya.cohen@gmail.com' })).json()
    const feed: { id: string; authorId: string }[] = await (await send('GET', '/feed')).json()
    const { id, authorId } = feed.find((a) => a.authorId !== me.id)!
    const before = (await send('GET', `/articles/${id}`)).status
    await send('DELETE', `/connections/${authorId}`)
    return { before, after: (await send('GET', `/articles/${id}`)).status }
  })
  expect(statuses).toEqual({ before: 200, after: 404 })
})
