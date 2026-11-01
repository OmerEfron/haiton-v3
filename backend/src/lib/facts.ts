import { pool } from '../db.ts'

export async function saveFacts(userId: string, facts: { k: string; v: string }[], src: string) {
  for (const f of facts) {
    const exists = await pool.query('select 1 from facts where user_id = $1 and k = $2 and v = $3', [userId, f.k, f.v])
    if (!exists.rowCount)
      await pool.query(
        'insert into facts (user_id, k, v, src, is_new) values ($1, $2, $3, $4, true)',
        [userId, f.k, f.v, src],
      )
  }
}
