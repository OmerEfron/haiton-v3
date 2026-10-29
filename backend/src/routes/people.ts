import { Router } from 'express'
import { z } from 'zod'
import { param, requireAuth } from '../auth.ts'
import { pool } from '../db.ts'
import { HttpError } from '../errors.ts'
import { getUser } from '../lib/users.ts'
import { parse } from '../parse.ts'

export const peopleRouter = Router()

peopleRouter.get('/users/:id/photo', async (req, res) => {
  const u = await getUser(param(req, 'id'))
  if (!u?.photo) throw new HttpError(404, 'not found')
  res.setHeader('Content-Type', u.photo_type || 'image/jpeg')
  res.setHeader('Cache-Control', 'public, max-age=86400')
  res.send(u.photo)
})

const auth = requireAuth
const FRONT = 'עמוד ראשי'

peopleRouter.get('/connections', auth, async (req, res) => {
  const { rows } = await pool.query<{ id: string; name: string; muted: boolean }>(
    `select u.id, u.name, c.muted
     from connections c join users u on u.id = c.other_id
     where c.user_id = $1
     order by u.name`,
    [req.userId],
  )
  res.json(rows)
})

peopleRouter.patch('/connections/:id', auth, async (req, res) => {
  const { muted } = parse(z.object({ muted: z.boolean() }), req.body)
  const { rows } = await pool.query<{ id: string; name: string; muted: boolean }>(
    `update connections c set muted = $3
     from users u
     where c.user_id = $1 and c.other_id = $2 and u.id = c.other_id
     returning u.id, u.name, c.muted`,
    [req.userId, param(req, 'id'), muted],
  )
  if (!rows[0]) throw new HttpError(404, 'not found')
  res.json(rows[0])
})

peopleRouter.delete('/connections/:id', auth, async (req, res) => {
  await pool.query('delete from connections where user_id = $1 and other_id = $2', [req.userId, param(req, 'id')])
  await pool.query(
    `delete from group_members gm using groups g
     where gm.group_id = g.id and g.owner_id = $1 and gm.user_id = $2`,
    [req.userId, param(req, 'id')],
  )
  res.status(204).end()
})

peopleRouter.get('/users/:id', auth, async (req, res) => {
  const u = await getUser(param(req, 'id'))
  if (!u) throw new HttpError(404, 'not found')
  const c = await pool.query<{ muted: boolean }>(
    'select muted from connections where user_id = $1 and other_id = $2',
    [req.userId, u.id],
  )
  res.json({ id: u.id, name: u.name, isConnection: !!c.rowCount, muted: !!c.rows[0]?.muted })
})

peopleRouter.get('/groups', auth, async (req, res) => {
  const { rows } = await pool.query<{ id: string; name: string }>(
    'select id, name from groups where owner_id = $1 order by name',
    [req.userId],
  )
  const members = await pool.query<{ group_id: string; user_id: string }>(
    `select gm.group_id, gm.user_id from group_members gm
     join groups g on g.id = gm.group_id where g.owner_id = $1`,
    [req.userId],
  )
  const by = new Map<string, string[]>()
  for (const m of members.rows) {
    const list = by.get(m.group_id) ?? []
    list.push(m.user_id)
    by.set(m.group_id, list)
  }
  res.json(rows.map((g) => ({ id: g.id, name: g.name, memberIds: by.get(g.id) ?? [] })))
})

const groupBody = z.object({
  name: z.string().trim().min(1, 'name required').max(60, 'name too long'),
  memberIds: z.array(z.string().max(80)).min(1, 'members required').max(200, 'too many members'),
})

async function cleanMembers(userId: string, ids: string[]) {
  const { rows } = await pool.query<{ other_id: string }>(
    'select other_id from connections where user_id = $1 and other_id = any($2::text[])',
    [userId, ids],
  )
  return rows.map((r) => r.other_id)
}

async function validateGroup(userId: string, name: string, memberIds: string[], selfId?: string) {
  if (name === FRONT) throw new HttpError(400, 'duplicate name')
  const q = selfId
    ? await pool.query('select 1 from groups where owner_id = $1 and name = $2 and id <> $3', [userId, name, selfId])
    : await pool.query('select 1 from groups where owner_id = $1 and name = $2', [userId, name])
  if (q.rowCount) throw new HttpError(400, 'duplicate name')
  if (!memberIds.length) throw new HttpError(400, 'members required')
}

peopleRouter.post('/groups', auth, async (req, res) => {
  const body = parse(groupBody, req.body)
  const memberIds = await cleanMembers(req.userId!, body.memberIds)
  await validateGroup(req.userId!, body.name, memberIds)
  const { rows } = await pool.query<{ id: string }>(
    'insert into groups (owner_id, name) values ($1, $2) returning id',
    [req.userId, body.name],
  )
  const id = rows[0].id
  await pool.query('insert into group_members (group_id, user_id) select $1, unnest($2::text[])', [id, memberIds])
  res.json({ id, name: body.name, memberIds })
})

peopleRouter.patch('/groups/:id', auth, async (req, res) => {
  const id = param(req, 'id')
  const g = await pool.query('select 1 from groups where id = $1 and owner_id = $2', [id, req.userId])
  if (!g.rowCount) throw new HttpError(404, 'not found')
  const body = parse(groupBody, req.body)
  const memberIds = await cleanMembers(req.userId!, body.memberIds)
  await validateGroup(req.userId!, body.name, memberIds, id)
  await pool.query('update groups set name = $2 where id = $1', [id, body.name])
  await pool.query('delete from group_members where group_id = $1', [id])
  await pool.query('insert into group_members (group_id, user_id) select $1, unnest($2::text[])', [id, memberIds])
  res.json({ id, name: body.name, memberIds })
})

peopleRouter.delete('/groups/:id', auth, async (req, res) => {
  await pool.query('delete from groups where id = $1 and owner_id = $2', [param(req, 'id'), req.userId])
  res.status(204).end()
})
