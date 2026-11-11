import { Router } from 'express'
import { z } from 'zod'
import { param, requireAuth } from '../auth.ts'
import { pool } from '../db.ts'
import { HttpError } from '../errors.ts'
import { articlesBy, changeAudience, feed, findVisible, publish, read } from '../lib/articles.ts'
import { notify } from '../lib/notify.ts'
import { getUser } from '../lib/users.ts'
import { writeLimit } from '../limits.ts'
import { parse } from '../parse.ts'

export const articlesRouter = Router()
const auth = requireAuth

async function viewer(id: string) {
  const u = await getUser(id)
  if (!u) throw new HttpError(401, 'unauthorized')
  return u
}

articlesRouter.get('/feed', auth, async (req, res) => {
  const group = typeof req.query.group === 'string' ? req.query.group : undefined
  res.json(await feed(await viewer(req.userId!), group))
})

articlesRouter.get('/articles/:id', auth, async (req, res) => {
  res.json(await read(await viewer(req.userId!), param(req, 'id')))
})

articlesRouter.get('/users/:id/articles', auth, async (req, res) => {
  res.json(await articlesBy(await viewer(req.userId!), param(req, 'id')))
})

const id = z.string().max(80)

const audience = z.object({
  mode: z.enum(['circle', 'me', 'people', 'group']),
  personIds: z.array(id).max(200).optional(),
  groupId: id.optional(),
})

const publishBody = z.object({
  draftId: id.optional(),
  content: z.object({
    headline: z.string().min(1, 'content required').max(200),
    sub: z.string().max(400).default(''),
    summary: z.string().max(300).optional(),
    body: z.array(z.string().max(4000)).min(1, 'content required').max(12),
    flash: z.string().max(200).default(''),
    push: z.string().max(200).optional(),
  }),
  prevId: id.nullable().optional(),
  audience,
  saveFacts: z.array(z.object({ k: z.string().max(40), v: z.string().max(200) })).max(20).default([]),
})

articlesRouter.post('/articles', auth, writeLimit, async (req, res) => {
  res.json(await publish(await viewer(req.userId!), parse(publishBody, req.body)))
})

articlesRouter.put('/articles/:id/audience', auth, writeLimit, async (req, res) => {
  res.json(await changeAudience(await viewer(req.userId!), param(req, 'id'), () => parse(z.object({ audience }), req.body).audience))
})

articlesRouter.delete('/articles/:id', auth, async (req, res) => {
  const { rowCount } = await pool.query('delete from articles where id = $1 and author_id = $2', [
    param(req, 'id'),
    req.userId,
  ])
  if (!rowCount) throw new HttpError(404, 'not found')
  res.status(204).end()
})

articlesRouter.put('/articles/:id/reaction', auth, writeLimit, async (req, res) => {
  const { label } = parse(z.object({ label: z.string().max(20, 'label too long').nullable() }), req.body)
  const u = await viewer(req.userId!)
  const a = await findVisible(u.id, param(req, 'id'))
  if (label) {
    await pool.query(
      `insert into reactions (article_id, user_id, label) values ($1, $2, $3)
       on conflict (article_id, user_id) do update set label = excluded.label`,
      [a.id, u.id, label],
    )
    if (a.author_id !== u.id) {
      const author = await getUser(a.author_id)
      if (author?.pref_reactions) {
        await notify({
          userId: a.author_id,
          kind: 'react',
          text: `תגובה חדשה מ${u.name}: ${label}`,
          sub: a.headline,
          personId: u.id,
          articleId: a.id,
        })
      }
    }
  } else {
    await pool.query('delete from reactions where article_id = $1 and user_id = $2', [a.id, u.id])
  }
  res.status(204).end()
})

articlesRouter.post('/articles/:id/report', auth, writeLimit, async (req, res) => {
  const { reason, note } = parse(
    z.object({
      reason: z.string().min(1, 'reason required').max(80),
      note: z.string().max(500).default(''),
    }),
    req.body,
  )
  const a = await findVisible(req.userId!, param(req, 'id'))
  await pool.query(
    `insert into reports (article_id, user_id, reason, note) values ($1, $2, $3, $4)
     on conflict (article_id, user_id) do nothing`,
    [a.id, req.userId, reason, note],
  )
  res.status(204).end()
})

articlesRouter.post('/articles/:id/hide', auth, async (req, res) => {
  const a = await findVisible(req.userId!, param(req, 'id'))
  await pool.query('insert into hidden (article_id, user_id) values ($1, $2) on conflict do nothing', [a.id, req.userId])
  res.status(204).end()
})

articlesRouter.delete('/articles/:id/hide', auth, async (req, res) => {
  await pool.query('delete from hidden where article_id = $1 and user_id = $2', [param(req, 'id'), req.userId])
  res.status(204).end()
})
