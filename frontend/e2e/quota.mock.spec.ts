import { expect, test } from '@playwright/test'
import { dismissTip, signUp } from './helpers'

// Runs against the mock backend (MSW, VITE_MOCK_AI_LIMIT=3), see the `mock` project in playwright.config.ts.

const QUOTA = 'הגעתם למכסה היומית. אפשר להמשיך מחר.'

test('mock quota counts Reporter calls and hits the 429 path at the limit', async ({ page }) => {
  await signUp(page)
  await page.getByRole('button', { name: 'לכתבה הראשונה שלי' }).click()
  await dismissTip(page, 'שלב 1 מתוך 4')
  await expect(page.getByText('נותרו 3 מתוך 3 פעולות היום')).toBeVisible()

  for (const [text, left] of [['אחד', 2], ['שניים', 1]] as const) {
    await page.getByLabel('הודעה לכתב').fill(text)
    await page.getByRole('button', { name: 'שליחה' }).click()
    await expect(page.getByText(`נותרו ${left} מתוך 3 פעולות היום`)).toBeVisible()
  }

  // The 3rd message gets no scripted reply, so the counter stays at 1. The Draft button is what shows it landed.
  await page.getByLabel('הודעה לכתב').fill('שלושה')
  await page.getByRole('button', { name: 'שליחה' }).click()
  await page.getByRole('button', { name: 'די, תיצור טיוטה' }).click()

  // The Draft spends the last action. A doubled request (React strict mode) can spend it on the way in,
  // which shows the quota message immediately; otherwise the next revision does.
  const quota = page.getByText(QUOTA)
  const tip = page.getByText('שלב 2 מתוך 4')
  await expect(quota.or(tip)).toBeVisible()
  if (await tip.isVisible()) {
    await page.getByRole('button', { name: 'הבנתי' }).click()
    await page.getByRole('button', { name: 'כותרת חדשה' }).click()
    await expect(quota).toBeVisible()
  }
})

test('mock Article read returns 404 once the author is no longer a Connection', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'כניסה' }).click()
  await page.getByRole('button', { name: 'מאיה כהן' }).click()

  await page.getByRole('link', { name: 'עונת הלימונים נפתחה' }).click()
  await expect(page.getByRole('heading', { name: 'עונת הלימונים נפתחה' })).toBeVisible()

  await page.getByRole('link', { name: 'רינה כהן' }).click()
  await page.getByRole('button', { name: 'הסרה מהחיבורים' }).click()
  await page.getByRole('button', { name: 'הסרה', exact: true }).click()

  await page.goto('/article/m1')
  await expect(page.getByText('הכתבה הזו הוסרה או שאין לכם גישה אליה.')).toBeVisible()
})
