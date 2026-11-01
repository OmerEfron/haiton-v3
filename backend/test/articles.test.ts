import { describe, expect, it } from 'vitest'
import { pool } from '../src/db.ts'
import { freshEmail, pair, signIn, story } from './helpers.ts'

describe('articles', () => {
  it('rejects an empty audience', async () => {
    const { a } = await pair()
    const res = await a.agent.post('/api/articles').send({
      content: story,
      prevId: null,
      audience: { mode: 'people', personIds: [] },
      saveFacts: [],
    })
    expect(res.status).toBe(400)
    expect(res.body.message).toBe('empty audience')
  })

  it('publishes to a person, shows history, and notifies on reaction', async () => {
    const { a, b } = await pair()
    const first = await a.agent.post('/api/articles').send({
      content: { ...story, headline: 'ראשונה' },
      prevId: null,
      audience: { mode: 'me' },
      saveFacts: [{ k: 'עיר', v: 'חולון' }],
    })
    expect(first.status).toBe(200)
    expect(first.body.audienceIds).toEqual([])

    const second = await a.agent.post('/api/articles').send({
      content: { ...story, headline: 'שנייה' },
      prevId: first.body.id,
      audience: { mode: 'people', personIds: [b.me.id] },
      saveFacts: [],
    })
    expect(second.status).toBe(200)
    expect(second.body.history[0].id).toBe(first.body.id)
    expect(second.body.audienceIds).toEqual([b.me.id])

    const feed = await b.agent.get('/api/feed')
    expect(feed.body.some((x: { id: string }) => x.id === second.body.id)).toBe(true)

    const react = await b.agent.put(`/api/articles/${second.body.id}/reaction`).send({ label: 'אהבתי' })
    expect(react.status).toBe(204)

    const notes = await a.agent.get('/api/notifications')
    expect(notes.body[0].kind).toBe('react')
    expect(notes.body[0].articleId).toBe(second.body.id)

    const facts = await a.agent.get('/api/me/facts')
    expect(facts.body.some((f: { k: string }) => f.k === 'עיר')).toBe(true)

    const me = await a.agent.get('/api/me')
    expect(me.body.onboarding).toBe(false)
  })

  it('publishes to circle and group', async () => {
    const { a, b } = await pair()
    const g = await a.agent.post('/api/groups').send({ name: 'חברים', memberIds: [b.me.id] })
    expect(g.status).toBe(200)

    const circle = await a.agent.post('/api/articles').send({
      content: { ...story, headline: 'מעגל' },
      prevId: null,
      audience: { mode: 'circle' },
      saveFacts: [],
    })
    expect(circle.status).toBe(200)
    expect(circle.body.audienceIds).toContain(b.me.id)

    const grouped = await a.agent.post('/api/articles').send({
      content: { ...story, headline: 'קבוצה' },
      prevId: null,
      audience: { mode: 'group', groupId: g.body.id },
      saveFacts: [],
    })
    expect(grouped.status).toBe(200)
    expect(grouped.body.audienceIds).toEqual([b.me.id])

    const filtered = await a.agent.get(`/api/feed?group=${g.body.id}`)
    expect(filtered.body.some((x: { id: string }) => x.id === grouped.body.id)).toBe(true)
  })

  it('hides an article from the viewer feed', async () => {
    const { a, b } = await pair()
    const pub = await a.agent.post('/api/articles').send({
      content: story,
      prevId: null,
      audience: { mode: 'people', personIds: [b.me.id] },
      saveFacts: [],
    })
    await b.agent.post(`/api/articles/${pub.body.id}/hide`)
    const feed = await b.agent.get('/api/feed')
    expect(feed.body.some((x: { id: string }) => x.id === pub.body.id)).toBe(false)
    const hidden = await b.agent.get('/api/me/hidden')
    expect(hidden.body[0].id).toBe(pub.body.id)
  })

  it('changes who can see an article and ignores a foreign draft', async () => {
    const { a, b } = await pair()
    const c = await signIn(freshEmail())
    await c.agent.post(`/api/invites/${a.me.id}/accept`)

    const foreign = await pool.query<{ id: string }>(
      `insert into ai_sessions (user_id, messages, turns) values ($1, '[]'::jsonb, '[]'::jsonb) returning id`,
      [b.me.id],
    )
    const foreignDraft = await pool.query<{ id: string }>(
      `insert into ai_drafts (session_id, user_id, content) values ($1, $2, '{}'::jsonb) returning id`,
      [foreign.rows[0].id, b.me.id],
    )

    const pub = await a.agent.post('/api/articles').send({
      content: story,
      prevId: null,
      audience: { mode: 'circle' },
      saveFacts: [],
      draftId: foreignDraft.rows[0].id,
    })
    expect(pub.status).toBe(200)
    expect(pub.body.audienceIds).toHaveLength(2)
    expect(pub.body.audienceIds).toEqual(expect.arrayContaining([b.me.id, c.me.id]))
    const stored = await pool.query<{ draft_id: string | null }>('select draft_id from articles where id = $1', [pub.body.id])
    expect(stored.rows[0].draft_id).toBeNull()

    const own = await pool.query<{ id: string }>(
      `insert into ai_sessions (user_id, messages, turns) values ($1, '[]'::jsonb, '[]'::jsonb) returning id`,
      [a.me.id],
    )
    const ownDraft = await pool.query<{ id: string }>(
      `insert into ai_drafts (session_id, user_id, content) values ($1, $2, '{}'::jsonb) returning id`,
      [own.rows[0].id, a.me.id],
    )
    const kept = await a.agent.post('/api/articles').send({
      content: { ...story, headline: 'שלי' },
      prevId: null,
      audience: { mode: 'me' },
      saveFacts: [],
      draftId: ownDraft.rows[0].id,
    })
    expect(kept.status).toBe(200)
    const keptRow = await pool.query<{ draft_id: string | null }>('select draft_id from articles where id = $1', [kept.body.id])
    expect(keptRow.rows[0].draft_id).toBe(ownDraft.rows[0].id)

    const edit = await a.agent.put(`/api/articles/${pub.body.id}/audience`).send({
      audience: { mode: 'people', personIds: [b.me.id] },
    })
    expect(edit.status).toBe(200)
    expect(edit.body.audienceIds).toEqual([b.me.id])
    expect((await c.agent.get(`/api/articles/${pub.body.id}`)).status).toBe(404)
    expect((await b.agent.put(`/api/articles/${pub.body.id}/audience`).send({ audience: { mode: 'me' } })).status).toBe(404)
  })
})
