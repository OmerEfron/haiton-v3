import { describe, expect, it } from 'vitest'
import { freshEmail, pair, signIn } from './helpers.ts'

describe('people and groups', () => {
  it('validates groups and drops a member when the connection is removed', async () => {
    const { a, b } = await pair()
    const empty = await a.agent.post('/api/groups').send({ name: 'ריק', memberIds: [] })
    expect(empty.status).toBe(400)
    expect(empty.body.message).toBe('members required')

    const front = await a.agent.post('/api/groups').send({ name: 'עמוד ראשי', memberIds: [b.me.id] })
    expect(front.status).toBe(400)
    expect(front.body.message).toBe('duplicate name')

    const g = await a.agent.post('/api/groups').send({ name: 'חברים', memberIds: [b.me.id] })
    expect(g.status).toBe(200)
    const dup = await a.agent.post('/api/groups').send({ name: 'חברים', memberIds: [b.me.id] })
    expect(dup.status).toBe(400)

    await a.agent.delete(`/api/connections/${b.me.id}`)
    const groups = await a.agent.get('/api/groups')
    expect(groups.body[0].memberIds).toEqual([])
    const cons = await a.agent.get('/api/connections')
    expect(cons.body.some((c: { id: string }) => c.id === b.me.id)).toBe(false)
  })

  it('mutes a connection', async () => {
    const { a, b } = await pair()
    const res = await a.agent.patch(`/api/connections/${b.me.id}`).send({ muted: true })
    expect(res.status).toBe(200)
    expect(res.body.muted).toBe(true)
  })

  it('renames a group, rejects a duplicate name, and deletes it', async () => {
    const { a, b } = await pair()
    const first = await a.agent.post('/api/groups').send({ name: 'חברים', memberIds: [b.me.id] })
    const second = await a.agent.post('/api/groups').send({ name: 'משפחה', memberIds: [b.me.id] })
    expect(first.status).toBe(200)

    const renamed = await a.agent.patch(`/api/groups/${first.body.id}`).send({ name: 'קרובים', memberIds: [b.me.id] })
    expect(renamed.status).toBe(200)
    expect(renamed.body).toMatchObject({ name: 'קרובים', memberIds: [b.me.id] })

    const dup = await a.agent.patch(`/api/groups/${first.body.id}`).send({ name: 'משפחה', memberIds: [b.me.id] })
    expect(dup.status).toBe(400)
    expect(dup.body.message).toBe('duplicate name')

    expect((await a.agent.delete(`/api/groups/${second.body.id}`)).status).toBe(204)
    const left = await a.agent.get('/api/groups')
    expect(left.body.map((g: { id: string }) => g.id)).toEqual([first.body.id])
  })

  it('shows a user who is not a connection', async () => {
    const { a } = await pair()
    const c = await signIn(freshEmail())
    const res = await c.agent.get(`/api/users/${a.me.id}`)
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ id: a.me.id, name: a.me.name, isConnection: false, muted: false })
    expect((await c.agent.get('/api/users/missing-user')).status).toBe(404)
  })
})
