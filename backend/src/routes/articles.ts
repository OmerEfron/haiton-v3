import { Router } from 'express'
import { z } from 'zod'
import { param, requireAuth } from '../auth.ts'
import { pool } from '../db.ts'
import { HttpError } from '../errors.ts'
import { getVisible, loadFull, summary, type ArticleRow } from '../lib/articles.ts'
import { saveFacts } from '../lib/facts.ts'
import { notify } from '../lib/notify.ts'
import { getUser } from '../lib/users.ts'
import { writeLimit } from '../limits.ts'
import { IN_GROUP, NOT_HIDDEN, NOT_MUTED, VISIBLE } from '../lib/visible.ts'
import { parse } from '../parse.ts'

export const articlesRouter = Router()
const auth = requireAuth

const SELECT = `
  select a.id, a.author_id, u.name as author, a.created_at, a.image_url,
         a.headline, a.sub, a.flash, a.push, a.body, a.prev_id,
         exists (select 1 from articles p where p.id = a.prev_id and p.author_id = a.author_id) as has_prev
  from articles a
  join users u on u.id = a.author_id
`

async function viewer(id: string) {
  const u = await getUser(id)
  if (!u) throw new HttpError(401, 'unauthorized')
  return u
}

articlesRouter.get('/feed', auth, async (req, res) => {
  const u = await viewer(req.userId!)
  const group = typeof req.query.group === 'string' ? req.query.group : undefined
  const owned = group
    ? await pool.query('select 1 from groups where id = $1 and owner_id = $2', [group, u.id])
    : null
  const applyGroup = !!(group && owned?.rowCount)
  const sql = applyGroup
    ? `${SELECT} where ${VISIBLE} and ${NOT_HIDDEN} and ${NOT_MUTED} and ${IN_GROUP} order by a.created_at desc`
    : `${SELECT} where ${VISIBLE} and ${NOT_HIDDEN} and ${NOT_MUTED} order by a.created_at desc`
  const { rows } = await pool.query<ArticleRow>(sql, applyGroup ? [u.id, group] : [u.id])
  res.json(rows.map((a) => summary(a, u.id, u.name)))
})

articlesRouter.get('/articles/:id', auth, async (req, res) => {
  const u = await viewer(req.userId!)
  const a = await getVisible(u.id, param(req, 'id'))
  if (!a) throw new HttpError(404, 'not found')
  res.json(await loadFull(u.id, u.name, a))
})

articlesRouter.get('/users/:id/articles', auth, async (req, res) => {
  const u = await viewer(req.userId!)
  const { rows } = await pool.query<ArticleRow>(
    `${SELECT} where a.author_id = $2 and ${VISIBLE} and ${NOT_HIDDEN} order by a.created_at desc`,
    [u.id, param(req, 'id')],
  )
  res.json(rows.map((a) => summary(a, u.id, u.name)))
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

async function audienceIds(userId: string, aud: z.infer<typeof audience>) {
  const connected = (
    await pool.query<{ other_id: string }>('select other_id from connections where user_id = $1', [userId])
  ).rows.map((r) => r.other_id)
  const set = new Set(connected)
  if (aud.mode === 'people') return (aud.personIds ?? []).filter((id) => set.has(id))
  if (aud.mode === 'group') {
    const { rows } = await pool.query<{ user_id: string }>(
      'select user_id from group_members gm join groups g on g.id = gm.group_id where g.id = $1 and g.owner_id = $2',
      [aud.groupId, userId],
    )
    return rows.map((r) => r.user_id)
  }
  if (aud.mode === 'circle') return connected
  return []
}

articlesRouter.post('/articles', auth, writeLimit, async (req, res) => {
  const u = await viewer(req.userId!)
  const body = parse(publishBody, req.body)
  const aud = await audienceIds(u.id, body.audience)
  if (body.audience.mode !== 'me' && !aud.length) throw new HttpError(400, 'empty audience')
  let draftId: string | null = null
  if (body.draftId) {
    const owned = await pool.query('select 1 from ai_drafts where id = $1 and user_id = $2', [body.draftId, u.id])
    if (owned.rowCount) draftId = body.draftId
  }
  const { rows } = await pool.query<{ id: string }>(
    `insert into articles (author_id, headline, sub, flash, push, body, prev_id, draft_id)
     values ($1, $2, $3, $4, $5, $6, $7, $8) returning id`,
    [u.id, body.content.headline, body.content.sub, body.content.flash, body.content.push ?? null, body.content.body, body.prevId ?? null, draftId],
  )
  const id = rows[0].id
  if (aud.length) {
    await pool.query(
      `insert into article_audience (article_id, user_id) select $1, unnest($2::text[])`,
      [id, aud],
    )
  }
  await saveFacts(u.id, body.saveFacts, 'נוסף היום, מתוך השיחה')
  await pool.query('update users set onboarding = false where id = $1', [u.id])
  const a = await getVisible(u.id, id)
  if (!a) throw new HttpError(500, 'internal error')
  res.json(await loadFull(u.id, u.name, a))
})

async function replaceAudience(articleId: string, userIds: string[]) {
  const client = await pool.connect()
  try {
    await client.query('begin')
    await client.query('delete from article_audience where article_id = $1', [articleId])
    if (userIds.length) {
      await client.query(
        'insert into article_audience (article_id, user_id) select $1, unnest($2::text[])',
        [articleId, userIds],
      )
    }
    await client.query('commit')
  } catch (err) {
    await client.query('rollback')
    throw err
  } finally {
    client.release()
  }
}

articlesRouter.put('/articles/:id/audience', auth, writeLimit, async (req, res) => {
  const u = await viewer(req.userId!)
  const articleId = param(req, 'id')
  const owned = await pool.query('select 1 from articles where id = $1 and author_id = $2', [articleId, u.id])
  if (!owned.rowCount) throw new HttpError(404, 'not found')
  const { audience: next } = parse(z.object({ audience }), req.body)
  const aud = await audienceIds(u.id, next)
  if (next.mode !== 'me' && !aud.length) throw new HttpError(400, 'empty audience')
  await replaceAudience(articleId, aud)
  const a = await getVisible(u.id, articleId)
  if (!a) throw new HttpError(500, 'internal error')
  res.json(await loadFull(u.id, u.name, a))
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
  const a = await getVisible(u.id, param(req, 'id'))
  if (!a) throw new HttpError(404, 'not found')
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
  const a = await getVisible(req.userId!, param(req, 'id'))
  if (!a) throw new HttpError(404, 'not found')
  await pool.query(
    `insert into reports (article_id, user_id, reason, note) values ($1, $2, $3, $4)
     on conflict (article_id, user_id) do nothing`,
    [a.id, req.userId, reason, note],
  )
  res.status(204).end()
})

articlesRouter.post('/articles/:id/hide', auth, async (req, res) => {
  const a = await getVisible(req.userId!, param(req, 'id'))
  if (!a) throw new HttpError(404, 'not found')
  await pool.query('insert into hidden (article_id, user_id) values ($1, $2) on conflict do nothing', [a.id, req.userId])
  res.status(204).end()
})

articlesRouter.delete('/articles/:id/hide', auth, async (req, res) => {
  await pool.query('delete from hidden where article_id = $1 and user_id = $2', [param(req, 'id'), req.userId])
  res.status(204).end()
})
