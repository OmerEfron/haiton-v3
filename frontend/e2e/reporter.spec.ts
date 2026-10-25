import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

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
