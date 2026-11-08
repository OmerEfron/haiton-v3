import { expect, test } from '@playwright/test'
import { dismissTip, signUp } from './helpers'

test('login, profile, welcome, and the first chat', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'מה שקרה לכם היום ראוי לכותרת' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'הצטרפות' })).toBeVisible()

  await signUp(page, 'מאיה')
  await page.getByRole('button', { name: 'לכתבה הראשונה שלי' }).click()
  await dismissTip(page, 'שלב 1 מתוך 4')
  await expect(page.getByText('מה קרה?')).toBeVisible()
})
