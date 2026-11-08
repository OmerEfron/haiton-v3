import { describe, expect, it } from 'vitest'
import { api, freshEmail, pair, signIn, story } from './helpers.ts'

type Method = 'get' | 'post' | 'put' | 'patch' | 'delete'

const protectedRoutes: [Method, string][] = [
  ['get', '/api/me'],
  ['patch', '/api/me'],
  ['delete', '/api/me'],
  ['post', '/api/me/photo'],
  ['delete', '/api/me/photo'],
  ['get', '/api/me/notification-prefs'],
  ['patch', '/api/me/notification-prefs'],
  ['get', '/api/me/facts'],
  ['post', '/api/me/facts'],
  ['delete', '/api/me/facts/x'],
  ['get', '/api/me/hidden'],
  ['get', '/api/feed'],
  ['get', '/api/articles/x'],
  ['get', '/api/users/x/articles'],
  ['post', '/api/articles'],
  ['put', '/api/articles/x/audience'],
  ['delete', '/api/articles/x'],
  ['put', '/api/articles/x/reaction'],
  ['post', '/api/articles/x/report'],
  ['post', '/api/articles/x/hide'],
  ['delete', '/api/articles/x/hide'],
  ['get', '/api/connections'],
  ['patch', '/api/connections/x'],
  ['delete', '/api/connections/x'],
  ['get', '/api/users/x'],
  ['get', '/api/groups'],
  ['post', '/api/groups'],
  ['patch', '/api/groups/x'],
  ['delete', '/api/groups/x'],
  ['post', '/api/invites'],
  ['post', '/api/invites/x/accept'],
  ['get', '/api/notifications'],
  ['post', '/api/notifications/read'],
]

const body = {
  text: 'שלום',
  name: 'קבוצה',
  memberIds: ['x'],
  channel: 'link',
  muted: true,
  label: 'אהבתי',
  reason: 'ספאם',
  facts: [{ k: 'עיר', v: 'חיפה' }],
  content: story,
  audience: { mode: 'me' },
}

describe('authorization', () => {
  it('rejects every protected route without a cookie', async () => {
    const anon = api()
    for (const [method, path] of protectedRoutes) {
      const res = await anon[method](path).send(body)
      expect(res.status, `${method} ${path}`).toBe(401)
    }
  })

  it('leaves public routes open', async () => {
    const anon = api()
    expect((await anon.get('/api/health')).status).toBe(200)
    expect((await anon.post('/api/auth/logout')).status).toBe(204)
    expect((await anon.post('/api/invites/nope/decline')).status).toBe(204)
    expect((await anon.get('/api/invites/tamir')).status).toBe(200)
  })

  it('does not let a stranger read or change someone else\'s data', async () => {
    const { a, b } = await pair()
    const stranger = await signIn(freshEmail())
    const fact = await a.agent.post('/api/me/facts').send({ facts: [{ k: 'עיר', v: 'חיפה' }] })
    const factId = fact.body[0].id as string
    const group = await a.agent.post('/api/groups').send({ name: 'חברים', memberIds: [b.me.id] })
    const article = await a.agent.post('/api/articles').send({
      content: story,
      prevId: null,
      audience: { mode: 'people', personIds: [b.me.id] },
      saveFacts: [],
    })
    const id = article.body.id as string

    expect((await stranger.agent.get(`/api/users/${a.me.id}`)).body.isConnection).toBe(false)
    expect((await stranger.agent.get(`/api/users/${a.me.id}/articles`)).body).toEqual([])
    expect((await b.agent.get(`/api/articles/${id}`)).status).toBe(200)
    expect((await stranger.agent.get(`/api/articles/${id}`)).status).toBe(404)
    expect((await stranger.agent.delete(`/api/articles/${id}`)).status).toBe(404)
    expect((await stranger.agent.put(`/api/articles/${id}/audience`).send({ audience: { mode: 'me' } })).status).toBe(404)
    expect((await stranger.agent.put(`/api/articles/${id}/reaction`).send({ label: 'אהבתי' })).status).toBe(404)
    expect((await stranger.agent.post(`/api/articles/${id}/report`).send({ reason: 'ספאם' })).status).toBe(404)
    expect((await stranger.agent.post(`/api/articles/${id}/hide`)).status).toBe(404)
    expect((await stranger.agent.delete(`/api/articles/${id}/hide`)).status).toBe(204)

    expect((await stranger.agent.patch(`/api/groups/${group.body.id}`).send({ name: 'גנוב', memberIds: [b.me.id] })).status).toBe(404)
    expect((await stranger.agent.delete(`/api/groups/${group.body.id}`)).status).toBe(204)
    expect((await a.agent.get('/api/groups')).body.some((g: { id: string }) => g.id === group.body.id)).toBe(true)

    expect((await stranger.agent.delete(`/api/me/facts/${factId}`)).status).toBe(204)
    expect((await a.agent.get('/api/me/facts')).body).toHaveLength(1)

    expect((await stranger.agent.patch(`/api/connections/${a.me.id}`).send({ muted: true })).status).toBe(404)
    expect((await stranger.agent.delete(`/api/connections/${b.me.id}`)).status).toBe(204)
    expect((await a.agent.get('/api/connections')).body.some((c: { id: string }) => c.id === b.me.id)).toBe(true)
    expect((await a.agent.get(`/api/articles/${id}`)).status).toBe(200)
  })
})
