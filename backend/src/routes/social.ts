import { Router } from 'express'
import { z } from 'zod'
import { param, requireAuth } from '../auth.ts'
import { pool } from '../db.ts'
import { HttpError } from '../errors.ts'
import { getUser } from '../lib/users.ts'
import { notify } from '../lib/notify.ts'
import { parse } from '../parse.ts'

export const socialRouter = Router()

socialRouter.get('/invites/:code', async (req, res) => {
  const { rows } = await pool.query<{ code: string; name: string }>(
    'select i.code, u.name from invites i join users u on u.id = i.inviter_id where i.code = $1',
    [param(req, 'code')],
  )
  if (!rows[0]) throw new HttpError(404, 'not found')
  res.json({ code: rows[0].code, inviterName: rows[0].name })
})

socialRouter.post('/invites/:code/decline', (_req, res) => {
  res.status(204).end()
})

const auth = requireAuth

socialRouter.post('/invites', auth, async (req, res) => {
  parse(z.object({ channel: z.enum(['whatsapp', 'email', 'link']) }), req.body)
  const u = await getUser(req.userId!)
  if (!u) throw new HttpError(401, 'unauthorized')
  const existing = await pool.query<{ code: string }>('select code from invites where inviter_id = $1 limit 1', [u.id])
  let code = existing.rows[0]?.code
  if (!code) {
    const ins = await pool.query<{ code: string }>(
      'insert into invites (code, inviter_id) values ($1, $2) on conflict (code) do nothing returning code',
      [u.id, u.id],
    )
    code = ins.rows[0]?.code ?? u.id
  }
  const origin = req.get('origin') ?? `${req.protocol}://${req.get('x-forwarded-host') ?? req.get('host')}`
  res.json({ code, link: `${origin}/i/${code}` })
})

socialRouter.post('/invites/:code/accept', auth, async (req, res) => {
  const u = await getUser(req.userId!)
  if (!u) throw new HttpError(401, 'unauthorized')
  const { rows } = await pool.query<{ inviter_id: string; article_id: string | null; name: string }>(
    `select i.inviter_id, i.article_id, inv.name
     from invites i join users inv on inv.id = i.inviter_id
     where i.code = $1`,
    [param(req, 'code')],
  )
  const inv = rows[0]
  if (!inv) throw new HttpError(404, 'not found')
  if (inv.inviter_id !== u.id) {
    await pool.query(
      `insert into connections (user_id, other_id) values ($1, $2), ($2, $1)
       on conflict do nothing`,
      [u.id, inv.inviter_id],
    )
    if (inv.article_id) {
      await pool.query(
        'insert into article_audience (article_id, user_id) values ($1, $2) on conflict do nothing',
        [inv.article_id, u.id],
      )
    }
    const inviter = await getUser(inv.inviter_id)
    if (inviter?.pref_joins) {
      await notify({
        userId: inv.inviter_id,
        kind: 'join',
        text: `${u.name} הצטרפה דרך ההזמנה שלכם`,
        sub: 'מעכשיו אפשר לשלוח לה כתבות, והכתבות שלה יופיעו אצלכם בעמוד הראשי.',
        personId: u.id,
      })
    }
  }
  res.json({ articleId: inv.article_id })
})

socialRouter.get('/notifications', auth, async (req, res) => {
  const { rows } = await pool.query<{
    id: string
    kind: 'join' | 'react'
    text: string
    sub: string
    created_at: Date
    unread: boolean
    person_id: string | null
    article_id: string | null
  }>('select * from notifications where user_id = $1 order by created_at desc', [req.userId])
  res.json(
    rows.map((n) => ({
      id: n.id,
      kind: n.kind,
      text: n.text,
      sub: n.sub,
      createdAt: n.created_at.toISOString(),
      unread: n.unread,
      personId: n.person_id ?? undefined,
      articleId: n.article_id ?? undefined,
    })),
  )
})

socialRouter.post('/notifications/read', auth, async (req, res) => {
  await pool.query('update notifications set unread = false where user_id = $1', [req.userId])
  res.status(204).end()
})
