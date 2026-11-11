import { expect, test, type Page } from '@playwright/test'
import { dismissTip, signUp } from './helpers'

// Runs against the mock backend (MSW, VITE_MOCK_AI_LIMIT=3), see the `mock` project in playwright.config.ts.
// The mock Reporter returns canDraft from the third answer on. That third message has no scripted reply
// (the maximum) and spends nothing, so three messages fit the quota limit of 3.
const DRAFT_BUTTON = 'די, תיצור טיוטה'

async function say(page: Page, text: string, reply?: string) {
  await page.getByLabel('הודעה לכתב').fill(text)
  await page.getByRole('button', { name: 'שליחה' }).click()
  if (reply) await expect(page.getByText(reply)).toBeVisible()
}

test('Draft button appears once the Reporter says canDraft, and survives a reload', async ({ page }) => {
  await signUp(page)
  await page.getByRole('button', { name: 'לכתבה הראשונה שלי' }).click()
  await dismissTip(page, 'שלב 1 מתוך 4')

  await say(page, 'אחד', 'איזה יופי. ספרו עוד, איך זה התחיל?')
  await say(page, 'שניים', 'ואיך הרגשתם כשזה קרה?')
  await expect(page.getByRole('button', { name: DRAFT_BUTTON })).toHaveCount(0)

  await say(page, 'שלושה')
  await expect(page.getByRole('button', { name: DRAFT_BUTTON })).toBeVisible()

  await page.reload()
  await expect(page.getByText('ואיך הרגשתם כשזה קרה?')).toBeVisible()
  await expect(page.getByRole('button', { name: DRAFT_BUTTON })).toBeVisible()
})
