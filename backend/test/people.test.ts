import { describe, expect, it } from 'vitest'
import { pair } from './helpers.ts'

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
})
