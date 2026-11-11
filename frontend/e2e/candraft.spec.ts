import { expect, test, type Page } from '@playwright/test'
import { dismissTip, signUp } from './helpers'

const DRAFT_BUTTON = 'די, תיצור טיוטה'

/** Mocks the Reporter's replies in the browser so each test picks the server's `canDraft` per reply. */
async function mockReporter(page: Page, canDraftPerReply: boolean[]) {
  let turn = 0
  await page.route('**/ai/reporter/sessions', (route) =>
    route.fulfill({ json: { id: 's_mock', messages: [{ role: 'reporter', text: 'מה קרה?' }] } }),
  )
  await page.route('**/ai/reporter/sessions/s_mock/messages', (route) =>
    route.fulfill({ json: { reply: `תשובה ${turn + 1}`, canDraft: canDraftPerReply[turn++] ?? true } }),
  )
}

async function say(page: Page, text: string, n: number) {
  await page.getByLabel('הודעה לכתב').fill(text)
  await page.getByRole('button', { name: 'שליחה' }).click()
  await expect(page.getByText(`תשובה ${n}`)).toBeVisible()
}

async function openChat(page: Page, canDraftPerReply: boolean[]) {
  await mockReporter(page, canDraftPerReply)
  await signUp(page)
  await page.getByRole('button', { name: 'לכתבה הראשונה שלי' }).click()
  await dismissTip(page, 'שלב 1 מתוך 4')
}

test('Draft button appears as soon as the Reporter says canDraft, and survives a reload', async ({ page }) => {
  await openChat(page, [false, true])
  await say(page, 'אחד', 1)
  await expect(page.getByRole('button', { name: DRAFT_BUTTON })).toHaveCount(0)
  await say(page, 'שניים', 2)
  await expect(page.getByRole('button', { name: DRAFT_BUTTON })).toBeVisible()

  await page.reload()
  await expect(page.getByText('תשובה 2')).toBeVisible()
  await expect(page.getByRole('button', { name: DRAFT_BUTTON })).toBeVisible()
})

test('Draft button stays hidden after three messages while the Reporter says canDraft is false', async ({ page }) => {
  await openChat(page, [false, false, false])
  await say(page, 'אחד', 1)
  await say(page, 'שניים', 2)
  await say(page, 'שלושה', 3)
  await expect(page.getByRole('button', { name: DRAFT_BUTTON })).toHaveCount(0)
})
