import { pool } from '../db.ts'
import { VISIBLE } from './visible.ts'

export interface ArticleRow {
  id: string
  author_id: string
  author: string
  created_at: Date
  image_url: string | null
  headline: string
  sub: string
  flash: string
  push: string | null
  body: string[]
  prev_id: string | null
  has_prev: boolean
}

const SELECT = `
  select a.id, a.author_id, u.name as author, a.created_at, a.image_url,
         a.headline, a.sub, a.flash, a.push, a.body, a.prev_id,
         exists (
           select 1 from articles p
           where p.id = a.prev_id and p.author_id = a.author_id
         ) as has_prev
  from articles a
  join users u on u.id = a.author_id
`

export function summary(a: ArticleRow, viewerId: string, viewerName: string) {
  return {
    id: a.id,
    authorId: a.author_id,
    author: a.author_id === viewerId ? viewerName : a.author,
    createdAt: a.created_at.toISOString(),
    imageUrl: a.image_url,
    headline: a.headline,
    sub: a.sub,
    flash: a.flash,
    hasPrev: a.has_prev,
  }
}

export async function getVisible(viewerId: string, id: string) {
  const { rows } = await pool.query<ArticleRow>(`${SELECT} where a.id = $2 and ${VISIBLE}`, [viewerId, id])
  return rows[0] ?? null
}

export async function loadFull(viewerId: string, viewerName: string, a: ArticleRow) {
  const mine = a.author_id === viewerId
  // Earlier Articles the viewer can see, stopping at the first one they can't.
  // One extra step past the history limit tells us whether the last entry has an earlier Article.
  const chain: ArticleRow[] = [a]
  while (chain.length < 7) {
    const prevId = chain[chain.length - 1].prev_id
    const p = prevId ? await getVisible(viewerId, prevId) : null
    if (!p || p.author_id !== a.author_id) break
    chain.push(p)
  }
  const [head, ...history] = chain.map((x, i) => ({ ...x, has_prev: i + 1 < chain.length }))
  history.length = Math.min(history.length, 5)
  const audience = mine
    ? (await pool.query<{ user_id: string }>('select user_id from article_audience where article_id = $1', [a.id])).rows.map(
        (r) => r.user_id,
      )
    : null
  const received = mine
    ? (
        await pool.query<{ person_id: string; name: string; label: string }>(
          `select r.user_id as person_id, u.name, r.label
           from reactions r join users u on u.id = r.user_id
           where r.article_id = $1`,
          [a.id],
        )
      ).rows.map((r) => ({ personId: r.person_id, name: r.name, label: r.label }))
    : []
  const my = await pool.query<{ label: string }>('select label from reactions where article_id = $1 and user_id = $2', [
    a.id,
    viewerId,
  ])
  const reported = await pool.query('select 1 from reports where article_id = $1 and user_id = $2', [a.id, viewerId])
  return {
    ...summary(head, viewerId, viewerName),
    body: a.body,
    history: history.map((h) => summary(h, viewerId, viewerName)),
    audienceIds: audience,
    received,
    myReaction: my.rows[0]?.label ?? null,
    reported: reported.rowCount !== 0,
  }
}
