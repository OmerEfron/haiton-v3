import { Router } from 'express'
import { z } from 'zod'
import { COOKIE, cookieOpts, optionalAuth } from '../auth.ts'
import { pool } from '../db.ts'
import { HttpError } from '../errors.ts'
import { getUser, toMe } from '../lib/users.ts'
import { parse } from '../parse.ts'

export const authRouter = Router()

const emailBody = z.object({
  email: z.email({ error: 'invalid email' }).transform((e) => e.trim().toLowerCase()),
})

authRouter.post('/auth/google', async (req, res) => {
  // ponytail: email-only login; replace with Supabase Auth / Google OAuth in cloud
  const { email } = parse(emailBody, req.body)
  const found = await pool.query<{ id: string }>('select id from users where email = $1', [email])
  let id = found.rows[0]?.id
  if (!id) {
    const local = email.split('@')[0].replace(/[._-]+/g, ' ')
    const created = await pool.query<{ id: string }>(
      'insert into users (email, name, onboarding) values ($1, $2, true) returning id',
      [email, local],
    )
    id = created.rows[0].id
  }
  const user = await getUser(id)
  if (!user) throw new HttpError(500, 'internal error')
  res.cookie(COOKIE, id, cookieOpts())
  res.json(toMe(user))
})

authRouter.post('/auth/logout', optionalAuth, (_req, res) => {
  res.clearCookie(COOKIE, cookieOpts())
  res.status(204).end()
})
