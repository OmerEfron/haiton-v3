import { describe, expect, it } from 'vitest'
import { api, freshEmail, signIn } from './helpers.ts'

describe('invites', () => {
  it('reads the seeded tamir invite without auth', async () => {
    const res = await api().get('/api/invites/tamir')
    expect(res.status).toBe(200)
    expect(res.body.inviterName).toBe('תמיר לוי')
  })

  it('connects two users on accept and notifies the inviter', async () => {
    const a = await signIn(freshEmail())
    const b = await signIn(freshEmail())
    const created = await a.agent.post('/api/invites').send({ channel: 'whatsapp' })
    expect(created.status).toBe(200)
    expect(created.body.code).toBe(a.me.id)

    const info = await api().get(`/api/invites/${created.body.code}`)
    expect(info.body.inviterName).toBe(a.me.name)

    const accept = await b.agent.post(`/api/invites/${created.body.code}/accept`)
    expect(accept.status).toBe(200)
    expect(accept.body.articleId).toBe(null)

    const cons = await b.agent.get('/api/connections')
    expect(cons.body.some((c: { id: string }) => c.id === a.me.id)).toBe(true)

    const notes = await a.agent.get('/api/notifications')
    expect(notes.body[0].kind).toBe('join')
    expect(notes.body[0].personId).toBe(b.me.id)
  })
})
