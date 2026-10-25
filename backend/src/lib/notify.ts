import { pool } from '../db.ts'

export async function notify(opts: {
  userId: string
  kind: 'join' | 'react'
  text: string
  sub?: string
  personId?: string
  articleId?: string
}) {
  await pool.query(
    `insert into notifications (user_id, kind, text, sub, person_id, article_id)
     values ($1, $2, $3, $4, $5, $6)`,
    [opts.userId, opts.kind, opts.text, opts.sub ?? '', opts.personId ?? null, opts.articleId ?? null],
  )
}
