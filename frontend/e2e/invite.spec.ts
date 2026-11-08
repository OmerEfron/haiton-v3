import { expect, test } from '@playwright/test'
import { fillProfile, otherPage, signUp, useOtherAccount } from './helpers'

test('an invite links two people', async ({ page }) => {
  await signUp(page, 'מאיה')
  await page.goto('/feed')
  await page.getByRole('button', { name: 'הזמנת חברים' }).click()
  const shown = page.locator('span[dir="ltr"]').filter({ hasText: '/i/' })
  await expect(shown).toBeVisible()
  const code = (await shown.innerText()).split('/i/')[1]?.trim()
  expect(code).toBeTruthy()

  const guest = await otherPage(page)
  await guest.page.goto(`/i/${code}`)
  await guest.page.getByRole('button', { name: 'המשך עם Google' }).click()
  await useOtherAccount(guest.page)
  await guest.page.getByRole('button', { name: 'קבלת ההזמנה' }).click()
  await fillProfile(guest.page, 'נועה')
  await expect(guest.page.getByRole('button', { name: 'העמוד שלי' })).toBeVisible()

  await page.getByRole('button', { name: 'סגירה' }).click()
  await page.getByRole('button', { name: 'העמוד שלי' }).click()
  await page.getByRole('button', { name: 'הגדרות' }).click()
  await expect(page.getByText('נועה')).toBeVisible()

  await guest.page.getByRole('button', { name: 'העמוד שלי' }).click()
  await guest.page.getByRole('button', { name: 'הגדרות' }).click()
  await expect(guest.page.getByText('מאיה')).toBeVisible()
  await guest.context.close()
})
