import type { RequestHandler } from 'express'
import { pool } from './db.ts'
import { HttpError } from './errors.ts'

export const DAILY = Number(process.env.AI_DAILY_CALLS) || 60

export interface Quota {
  used: number
  limit: number
  resetsAt: string | null
}

const DAY_MS = 24 * 60 * 60_000

export async function getQuota(userId: string): Promise<Quota> {
  const { rows } = await pool.query<{ used: number; oldest: Date | null }>(
    `select count(*)::int as used, min(created_at) as oldest
     from ai_usage
     where user_id = $1 and created_at > now() - interval '24 hours'`,
    [userId],
  )
  const row = rows[0]
  const used = Number(row?.used ?? 0)
  const oldest = row?.oldest ? new Date(row.oldest) : null
  const resetsAt = oldest && !Number.isNaN(oldest.getTime()) ? new Date(oldest.getTime() + DAY_MS).toISOString() : null
  return { used, limit: DAILY, resetsAt }
}

// ponytail: the check and insert are not atomic, so overlapping requests can overshoot by a few calls.
// Fine while the UI sends one at a time. Upgrade: one counter row, `update ... where used < limit`.
export const requireQuota: RequestHandler = (req, _res, next) => {
  getQuota(req.userId!)
    .then((quota) => (quota.used >= quota.limit ? next(new HttpError(429, 'daily quota reached')) : next()))
    .catch(next)
}

export async function recordUsage(userId: string, kind: string) {
  await pool.query('insert into ai_usage (user_id, kind) values ($1, $2)', [userId, kind])
}
