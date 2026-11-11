import { describe, expect, it } from 'vitest'
import { pair, signIn, story } from './helpers.ts'

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

describe('feed and profile lists', () => {
  const publish = async (agent: Awaited<ReturnType<typeof pair>>['a']['agent'], headline: string, audience: object, prevId?: string) =>
    (await agent.post('/api/articles').send({ content: { ...story, headline }, prevId: prevId ?? null, audience, saveFacts: [] }))
      .body.id as string

  it('hides a muted Connection from the feed but still lists them on their profile', async () => {
    const { a, b } = await pair()
    const id = await publish(a.agent, 'ממושתקת', { mode: 'people', personIds: [b.me.id] })
    await b.agent.patch(`/api/connections/${a.me.id}`).send({ muted: true })
    const feed = await b.agent.get('/api/feed')
    expect(feed.body.map((x: { id: string }) => x.id)).not.toContain(id)
    const profile = await b.agent.get(`/api/users/${a.me.id}/articles`)
    expect(profile.body.map((x: { id: string }) => x.id)).toContain(id)
  })

  it('does not hint at a private earlier Article in feed and profile rows', async () => {
    const { a, b } = await pair()
    const first = await publish(a.agent, 'פרטית', { mode: 'me' })
    const visibleFirst = await publish(a.agent, 'גלויה', { mode: 'people', personIds: [b.me.id] })
    const second = await publish(a.agent, 'המשך פרטי', { mode: 'people', personIds: [b.me.id] }, first)
    const third = await publish(a.agent, 'המשך גלוי', { mode: 'people', personIds: [b.me.id] }, visibleFirst)
    const hasPrev = (rows: { id: string; hasPrev: boolean }[], id: string) => rows.find((x) => x.id === id)?.hasPrev
    for (const url of ['/api/feed', `/api/users/${a.me.id}/articles`]) {
      const rows = (await b.agent.get(url)).body
      expect(hasPrev(rows, second)).toBe(false)
      expect(hasPrev(rows, third)).toBe(true)
    }
    const own = (await a.agent.get('/api/feed')).body
    expect(hasPrev(own, second)).toBe(true)
  })
})
