import { expect, test, type Page } from '@playwright/test'
import { dismissTip, signUp } from './helpers'

const FIRST = 'אחרי השיחה: כותרת ראשונה לבדיקה'
const REVISED = 'אחרי השיחה: כותרת מתוקנת לבדיקה'
const REPLY = 'רגע, ומה קרה אחר כך?'

async function openChat(page: Page) {
  await signUp(page)
  await page.getByRole('button', { name: 'לכתבה הראשונה שלי' }).click()
  await dismissTip(page, 'שלב 1 מתוך 4')
}

test('chat, revise, and publish a story', async ({ page }) => {
  await openChat(page)
  await page.getByLabel('הודעה לכתב').fill('סיימתי להרכיב ארון')
  await expect(page.getByRole('button', { name: 'שליחה' })).toBeEnabled()
  await page.getByRole('button', { name: 'שליחה' }).click()
  await expect(page.getByText(REPLY)).toBeVisible()
  await expect(page.getByRole('button', { name: 'די, תיצור טיוטה' })).toHaveCount(0)
  await page.getByLabel('הודעה לכתב').fill('הארון עומד')
  await page.getByRole('button', { name: 'שליחה' }).click()
  await expect(page.getByText(REPLY)).toHaveCount(2)
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

test('shows an error when the reporter fails', async ({ page }) => {
  await openChat(page)
  await page.getByLabel('הודעה לכתב').fill('STUB:500')
  await page.getByRole('button', { name: 'שליחה' }).click()
  await expect(page.getByText('הכתב לא זמין כרגע. נסו שוב.')).toBeVisible({ timeout: 15_000 })
})

test('shows the daily quota message when article calls are used up', async ({ page }) => {
  await openChat(page)
  for (const [text, n] of [
    ['סיימתי להרכיב ארון', 1],
    ['הארון עומד', 2],
    ['נשארו ברגים', 3],
  ] as const) {
    await page.getByLabel('הודעה לכתב').fill(text)
    await page.getByRole('button', { name: 'שליחה' }).click()
    await expect(page.getByText(REPLY)).toHaveCount(n)
  }
  await expect(page.getByRole('button', { name: 'די, תיצור טיוטה' })).toBeEnabled()

  const created = await page.request.post('/ai/reporter/sessions')
  expect(created.ok()).toBeTruthy()
  const id = ((await created.json()) as { id: string }).id
  let blocked = false
  for (let i = 0; i < 12; i++) {
    const res = await page.request.post(`/ai/reporter/sessions/${id}/messages`, { data: { text: `מילוי ${i}` } })
    if (res.status() === 429) {
      blocked = true
      break
    }
    expect(res.status()).toBe(200)
  }
  expect(blocked).toBe(true)

  await page.goto('/compose/draft')
  await expect(page.getByText('הגעתם למכסה היומית. אפשר להמשיך מחר.')).toBeVisible()
})
