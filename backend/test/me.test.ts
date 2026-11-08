import { describe, expect, it } from 'vitest'
import { pool } from '../src/db.ts'
import { freshEmail, pair, signIn, story } from './helpers.ts'

describe('me', () => {
  it('stores a photo, serves it, and removes it', async () => {
    const a = await signIn(freshEmail())
    expect((await a.agent.post('/api/me/photo')).status).toBe(400)

    const tooBig = await a.agent.post('/api/me/photo').attach('photo', Buffer.alloc(2 * 1024 * 1024 + 1), 'big.jpg')
    expect(tooBig.status).toBe(400)
    expect(tooBig.body.message).toBe('photo too large')

    const up = await a.agent
      .post('/api/me/photo')
      .attach('photo', Buffer.from('not-a-real-image'), { filename: 'pic.jpg', contentType: 'image/jpeg' })
    expect(up.status).toBe(200)
    expect(up.body.photoUrl).toMatch(/^\/api\/users\/.+\/photo\?v=/)

    const img = await a.agent.get(up.body.photoUrl)
    expect(img.status).toBe(200)
    expect(img.headers['content-type']).toMatch(/^image\//)

    const gone = await a.agent.delete('/api/me/photo')
    expect(gone.status).toBe(200)
    expect(gone.body.photoUrl).toBeNull()
    expect((await a.agent.get(up.body.photoUrl)).status).toBe(404)
  })

  it('updates notification preferences', async () => {
    const a = await signIn(freshEmail())
    const before = await a.agent.get('/api/me/notification-prefs')
    expect(before.body).toEqual({ articles: true, joins: true, reactions: true })

    const patch = await a.agent.patch('/api/me/notification-prefs').send({ reactions: false })
    expect(patch.status).toBe(200)
    expect(patch.body).toEqual({ articles: true, joins: true, reactions: false })
  })

  it('deletes the account and everything other people could see', async () => {
    const { a, b } = await pair()
    const pub = await a.agent.post('/api/articles').send({
      content: story,
      prevId: null,
      audience: { mode: 'people', personIds: [b.me.id] },
      saveFacts: [],
    })
    expect(pub.status).toBe(200)

    expect((await a.agent.delete('/api/me')).status).toBe(204)
    expect((await a.agent.get('/api/me')).status).toBe(401)
    expect((await b.agent.get('/api/feed')).body).toEqual([])
    expect((await b.agent.get('/api/connections')).body).toEqual([])
    const left = await pool.query('select 1 from users where id = $1', [a.me.id])
    expect(left.rowCount).toBe(0)
  })
})