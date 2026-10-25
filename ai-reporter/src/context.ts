import { pool } from './db.ts'
import type { ArticleSummary, Fact } from './types.ts'
import type { FillUser } from './prompts.ts'

interface UserRow {
  name: string
  gender: string | null
}

interface FactRow {
  id: string
  k: string
  v: string
  src: string
  is_new: boolean
}

interface ArticleRow {
  id: string
  author_id: string
  author: string
  created_at: Date | string
  image_url: string | null
  headline: string
  sub: string
  flash: string
  body: string[]
  has_prev: boolean
}

export interface StoryContext extends FillUser {
  facts: Fact[]
  prevArticle: ArticleSummary | null
}

function summary(a: ArticleRow): ArticleSummary {
  return {
    id: a.id,
    authorId: a.author_id,
    author: a.author,
    createdAt: new Date(a.created_at).toISOString(),
    imageUrl: a.image_url,
    headline: a.headline,
    sub: a.sub,
    flash: a.flash,
    hasPrev: a.has_prev,
  }
}

export async function loadContext(userId: string): Promise<StoryContext | null> {
  const user = await pool.query<UserRow>('select name, gender from users where id = $1', [userId])
  const row = user.rows[0]
  if (!row) return null
  const [facts, articles] = await Promise.all([
    pool.query<FactRow>('select id, k, v, src, is_new from facts where user_id = $1', [userId]),
    pool.query<ArticleRow>(
      `select a.id, a.author_id, u.name as author, a.created_at, a.image_url,
              a.headline, a.sub, a.flash, a.body,
              exists (
                select 1 from articles p where p.id = a.prev_id and p.author_id = a.author_id
              ) as has_prev
       from articles a
       join users u on u.id = a.author_id
       where a.author_id = $1
       order by a.created_at desc
       limit 1`,
      [userId],
    ),
  ])
  const prev = articles.rows[0] ?? null
  const gender = row.gender === 'male' || row.gender === 'female' ? row.gender : 'unknown'
  return {
    name: row.name,
    gender,
    facts: facts.rows.map((f) => ({ id: f.id, k: f.k, v: f.v, src: f.src, isNew: f.is_new })),
    previous: prev ? [prev.headline, prev.sub, ...prev.body].filter((s) => s.trim()).join('\n') : '',
    prevArticle: prev ? summary(prev) : null,
  }
}
