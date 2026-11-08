import { expect, test } from '@playwright/test'
import { publish, signUp } from './helpers'

test('edit profile, preferences, an article, and the account', async ({ page }) => {
  await signUp(page, 'מאיה')
  await page.goto('/feed')
  await page.getByRole('button', { name: 'העמוד שלי' }).click()
  await page.getByRole('button', { name: 'הגדרות' }).click()

  const name = page.getByLabel('השם שמופיע על הכתבות שלכם')
  await name.fill('מאיה כהן')
  await name.blur()
  await expect(page.getByText('מאיה כהן').first()).toBeVisible()

  const reactions = page.getByRole('switch', { name: 'תגובות לכתבות שלי' })
  await expect(reactions).toHaveAttribute('aria-checked', 'true')
  await reactions.click()
  await expect(reactions).toHaveAttribute('aria-checked', 'false')

  await publish(page, 'כתבה למחיקה', { mode: 'me' })
  await page.getByRole('button', { name: 'כתבות' }).click()
  await expect(page.getByRole('heading', { name: 'כתבה למחיקה' })).toBeVisible()
  await page.getByRole('button', { name: 'הסרה' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'הסרת הכתבה' }).click()
  await expect(page.getByText('עוד אין כתבות.')).toBeVisible()

  await page.getByRole('button', { name: 'הגדרות' }).click()
  await page.getByRole('button', { name: 'מחיקת החשבון' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'מחיקה לצמיתות' }).click()
  await expect(page.getByText('החשבון נמחק')).toBeVisible()
})
