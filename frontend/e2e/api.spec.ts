import { expect, test, type APIRequestContext } from '@playwright/test'

const email = () => `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.local`

async function signIn(ctx: APIRequestContext) {
  const res = await ctx.post('/api/auth/google', { data: { email: email() } })
  expect(res.status()).toBe(200)
}

test('reporter rejects missing auth, other users, and empty text', async ({ playwright, baseURL }) => {
  const anon = await playwright.request.newContext({ baseURL })
  const missing = await anon.post('/ai/reporter/sessions')
  expect(missing.status()).toBe(401)
  await anon.dispose()

  const a = await playwright.request.newContext({ baseURL })
  const b = await playwright.request.newContext({ baseURL })
  await signIn(a)
  await signIn(b)
  const created = await a.post('/ai/reporter/sessions')
  expect(created.status()).toBe(200)
  const id = (await created.json()).id as string

  const foreign = await b.post(`/ai/reporter/sessions/${id}/messages`, { data: { text: 'שלום' } })
  expect(foreign.status()).toBe(404)

  const empty = await a.post(`/ai/reporter/sessions/${id}/messages`, { data: { text: '  ' } })
  expect(empty.status()).toBe(400)

  const one = await a.post(`/ai/reporter/sessions/${id}/messages`, { data: { text: 'שלום' } })
  expect(one.status()).toBe(200)
  const early = await a.post('/ai/editor/drafts', { data: { sessionId: id } })
  expect(early.status()).toBe(400)

  await a.dispose()
  await b.dispose()
})
