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
  const history: ArticleRow[] = []
  let prevId = a.prev_id
  while (prevId && history.length < 5) {
    const { rows } = await pool.query<ArticleRow>(
      `${SELECT} where a.id = $1 and a.author_id = $2`,
      [prevId, a.author_id],
    )
    const p = rows[0]
    if (!p) break
    history.push(p)
    prevId = p.prev_id
  }
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
    ...summary(a, viewerId, viewerName),
    body: a.body,
    history: history.map((h) => summary(h, viewerId, viewerName)),
    audienceIds: audience,
    received,
    myReaction: my.rows[0]?.label ?? null,
    reported: reported.rowCount !== 0,
  }
}
