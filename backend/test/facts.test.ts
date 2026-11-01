import { describe, expect, it } from 'vitest'
import { freshEmail, signIn } from './helpers.ts'

describe('facts', () => {
  it('saves a fact once and lists it', async () => {
    const a = await signIn(freshEmail())
    const body = { facts: [{ k: 'עיר', v: 'חיפה' }] }
    const first = await a.agent.post('/api/me/facts').send(body)
    expect(first.status).toBe(200)
    expect(first.body).toHaveLength(1)

    const second = await a.agent.post('/api/me/facts').send(body)
    expect(second.status).toBe(200)
    expect(second.body).toHaveLength(1)
    expect(second.body[0]).toMatchObject({ k: 'עיר', v: 'חיפה', src: 'מתוך היכרות עם הכתב', isNew: true })

    const facts = await a.agent.get('/api/me/facts')
    expect(facts.body).toEqual(second.body)
  })
})
