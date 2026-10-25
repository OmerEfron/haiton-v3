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

  it('starts without gender or birth year, then accepts both', async () => {
    const { agent, me } = await signIn(freshEmail())
    expect(me.gender).toBeNull()
    expect(me.birthYear).toBeNull()

    const bad = await agent.patch('/api/me').send({ gender: 'nope' })
    expect(bad.status).toBe(400)

    const blank = await agent.patch('/api/me').send({ name: '   ' })
    expect(blank.status).toBe(400)

    const birthYear = new Date().getFullYear() - 30
    const ok = await agent.patch('/api/me').send({ name: 'מאיה', gender: 'female', birthYear })
    expect(ok.status).toBe(200)
    expect(ok.body.name).toBe('מאיה')
    expect(ok.body.gender).toBe('female')
    expect(ok.body.birthYear).toBe(birthYear)
  })
})
