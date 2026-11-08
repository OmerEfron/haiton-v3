import { expect, test } from '@playwright/test'
import { apiSignIn, otherPage, publish } from './helpers'

const PERSON = 'הסיפור של מאיה'
const GROUP = 'סיפור הקבוצה'

test('a story reaches a person and a group', async ({ page }) => {
  const author = await apiSignIn(page, 'מאיה')
  const guest = await otherPage(page)
  const reader = await apiSignIn(guest.page, 'נועה')

  await page.request.post('/api/invites', { data: { channel: 'link' } })
  expect((await guest.page.request.post(`/api/invites/${author.id}/accept`)).ok()).toBeTruthy()

  const group = await page.request.post('/api/groups', { data: { name: 'משפחה', memberIds: [reader.id] } })
  expect(group.ok()).toBeTruthy()
  const groupId = ((await group.json()) as { id: string }).id

  await publish(page, PERSON, { mode: 'people', personIds: [reader.id] })
  await publish(page, GROUP, { mode: 'group', groupId })

  await page.goto('/feed')
  await page.getByRole('button', { name: 'משפחה' }).click()
  await expect(page.getByRole('heading', { name: GROUP }).first()).toBeVisible()

  await guest.page.goto('/feed')
  await guest.page.getByRole('heading', { name: PERSON }).first().click()
  await guest.page.getByRole('button', { name: 'אהבתי' }).click()
  await expect(guest.page.getByText(/שלחתם ל/)).toBeVisible()

  await page.getByRole('button', { name: 'התראות' }).click()
  await expect(page.getByText(/תגובה חדשה/)).toBeVisible()
  await page.getByRole('button', { name: 'סגירה' }).click()

  await guest.page.getByRole('button', { name: 'דיווח על הכתבה' }).click()
  await guest.page.getByRole('radio', { name: 'ספאם' }).click()
  await guest.page.getByRole('button', { name: 'שליחת דיווח' }).click()
  await guest.page.getByRole('button', { name: 'הסתרת הכתבה מהפיד שלי' }).click()
  await expect(guest.page.getByRole('heading', { name: PERSON })).toHaveCount(0)
  await expect(guest.page.getByRole('heading', { name: GROUP }).first()).toBeVisible()
  await guest.context.close()
})
