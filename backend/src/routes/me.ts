import { Router } from 'express'
import multer from 'multer'
import { z } from 'zod'
import { COOKIE, cookieOpts, param, requireAuth } from '../auth.ts'
import { pool } from '../db.ts'
import { HttpError } from '../errors.ts'
import { summary, type ArticleRow } from '../lib/articles.ts'
import { getUser, toMe } from '../lib/users.ts'
import { parse } from '../parse.ts'

export const meRouter = Router()
const photo = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } })
const auth = requireAuth

async function me(id: string) {
  const u = await getUser(id)
  if (!u) throw new HttpError(401, 'unauthorized')
  return u
}

meRouter.get('/me', auth, async (req, res) => {
  res.json(toMe(await me(req.userId!)))
})

meRouter.patch('/me', auth, async (req, res) => {
  const year = new Date().getFullYear()
  const patch = parse(
    z.object({
      name: z.string().trim().min(1, 'name required').max(60, 'name too long').optional(),
      gender: z.enum(['male', 'female', 'other'], { error: 'invalid gender' }).optional(),
      birthYear: z
        .int('invalid birth year')
        .min(year - 120, 'invalid birth year')
        .max(year, 'invalid birth year')
        .optional(),
    }),
    req.body,
  )
  await pool.query(
    'update users set name = coalesce($2, name), gender = coalesce($3, gender), birth_year = coalesce($4, birth_year) where id = $1',
    [req.userId, patch.name ?? null, patch.gender ?? null, patch.birthYear ?? null],
  )
  res.json(toMe(await me(req.userId!)))
})

meRouter.delete('/me', auth, async (req, res) => {
  await pool.query('delete from users where id = $1', [req.userId])
  res.clearCookie(COOKIE, cookieOpts())
  res.status(204).end()
})

meRouter.post('/me/photo', auth, photo.single('photo'), async (req, res) => {
  const file = req.file
  if (!file) throw new HttpError(400, 'photo required')
  await pool.query('update users set photo = $2, photo_type = $3, photo_updated_at = now() where id = $1', [
    req.userId,
    file.buffer,
    file.mimetype || 'image/jpeg',
  ])
  res.json(toMe(await me(req.userId!)))
})

meRouter.delete('/me/photo', auth, async (req, res) => {
  await pool.query('update users set photo = null, photo_type = null, photo_updated_at = null where id = $1', [
    req.userId,
  ])
  res.json(toMe(await me(req.userId!)))
})

meRouter.get('/me/notification-prefs', auth, async (req, res) => {
  const u = await me(req.userId!)
  res.json({ articles: u.pref_articles, joins: u.pref_joins, reactions: u.pref_reactions })
})

meRouter.patch('/me/notification-prefs', auth, async (req, res) => {
  const patch = parse(
    z.object({
      articles: z.boolean().optional(),
      joins: z.boolean().optional(),
      reactions: z.boolean().optional(),
    }),
    req.body,
  )
  const u = await me(req.userId!)
  const next = {
    articles: patch.articles ?? u.pref_articles,
    joins: patch.joins ?? u.pref_joins,
    reactions: patch.reactions ?? u.pref_reactions,
  }
  await pool.query('update users set pref_articles = $2, pref_joins = $3, pref_reactions = $4 where id = $1', [
    req.userId,
    next.articles,
    next.joins,
    next.reactions,
  ])
  res.json(next)
})

meRouter.get('/me/facts', auth, async (req, res) => {
  const { rows } = await pool.query<{ id: string; k: string; v: string; src: string; is_new: boolean }>(
    'select id, k, v, src, is_new from facts where user_id = $1',
    [req.userId],
  )
  res.json(rows.map((f) => ({ id: f.id, k: f.k, v: f.v, src: f.src, isNew: f.is_new })))
})

meRouter.delete('/me/facts/:id', auth, async (req, res) => {
  await pool.query('delete from facts where id = $1 and user_id = $2', [param(req, 'id'), req.userId])
  res.status(204).end()
})

meRouter.get('/me/hidden', auth, async (req, res) => {
  const u = await me(req.userId!)
  const { rows } = await pool.query<ArticleRow>(
    `select a.id, a.author_id, au.name as author, a.created_at, a.image_url,
            a.headline, a.sub, a.flash, a.push, a.body, a.prev_id,
            exists (select 1 from articles p where p.id = a.prev_id and p.author_id = a.author_id) as has_prev
     from hidden h
     join articles a on a.id = h.article_id
     join users au on au.id = a.author_id
     where h.user_id = $1
     order by a.created_at desc`,
    [req.userId],
  )
  res.json(rows.map((a) => summary(a, u.id, u.name)))
})
