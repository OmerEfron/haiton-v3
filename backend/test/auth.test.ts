import { describe, expect, it } from 'vitest'
import { api, freshEmail, signIn } from './helpers.ts'

describe('auth', () => {
  it('rejects invalid email', async () => {
    const res = await api().post('/api/auth/google').send({ email: 'nope' })
    expect(res.status).toBe(400)
    expect(res.body.message).toBe('invalid email')
  })

  it('returns 401 without a session', async () => {
    const res = await api().get('/api/me')
    expect(res.status).toBe(401)
    expect(res.body.message).toBe('unauthorized')
  })

  it('signs in, reads me, and logs out', async () => {
    const email = freshEmail()
    const { agent, me } = await signIn(email)
    expect(me.email).toBe(email)
    expect(me.onboarding).toBe(true)
    const again = await agent.get('/api/me')
    expect(again.status).toBe(200)
    expect(again.body.id).toBe(me.id)
    await agent.post('/api/auth/logout')
    const after = await agent.get('/api/me')
    expect(after.status).toBe(401)
  })
})
