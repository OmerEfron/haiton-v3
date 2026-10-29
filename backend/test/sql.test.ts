import { describe, expect, it } from 'vitest'
import { pool } from '../src/db.ts'
import { freshEmail, signIn } from './helpers.ts'

describe('sql injection', () => {
  it('treats injection strings as data', async () => {
    const { agent } = await signIn(freshEmail())

    const article = await agent.get(`/api/articles/${encodeURIComponent("' or 1=1 --")}`)
    expect(article.status).toBe(404)

    const feed = await agent.get('/api/feed').query({ group: "' or 1=1 --" })
    expect(feed.status).toBe(200)
    expect(feed.body).toEqual([])

    const del = await agent.delete(`/api/me/facts/${encodeURIComponent("'; drop table users; --")}`)
    expect(del.status).toBe(204)

    const users = await pool.query<{ name: string | null }>("select to_regclass('public.users')::text as name")
    expect(users.rows[0]?.name).toBe('users')
  })
})
