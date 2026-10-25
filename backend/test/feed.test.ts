import { describe, expect, it } from 'vitest'
import { signIn } from './helpers.ts'

describe('seeded maya feed', () => {
  it('lists maya\'s circle stories', async () => {
    const { agent } = await signIn('maya.cohen@gmail.com')
    const res = await agent.get('/api/feed')
    expect(res.status).toBe(200)
    const ids = res.body.map((a: { id: string }) => a.id)
    expect(ids).toContain('m1')
    expect(ids).toContain('orit1')
    expect(ids).toContain('mx')
    expect(ids).toContain('maya')
    expect(ids).not.toContain('tm1')
  })

  it('filters the family group', async () => {
    const { agent } = await signIn('maya.cohen@gmail.com')
    const res = await agent.get('/api/feed?group=maya_g1')
    expect(res.status).toBe(200)
    const authors = new Set(res.body.map((a: { authorId: string }) => a.authorId))
    expect(authors.has('mom')).toBe(true)
    expect(authors.has('dad')).toBe(true)
    expect(authors.has('shachar')).toBe(true)
    expect(authors.has('orit')).toBe(false)
  })

  it('walks orit\'s history chain', async () => {
    const { agent } = await signIn('maya.cohen@gmail.com')
    const res = await agent.get('/api/articles/orit1')
    expect(res.status).toBe(200)
    expect(res.body.history[0].id).toBe('orit0')
    expect(res.body.hasPrev).toBe(true)
  })
})
