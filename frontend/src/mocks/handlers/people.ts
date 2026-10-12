import { http } from 'msw'
import { API_URL } from '../../config'
import { uid, type World } from '../db'
import { fail, personName, route } from './util'

const u = (p: string) => API_URL + p
const FRONT = 'עמוד ראשי'

function validateGroup(w: World, name: string, memberIds: string[], selfId?: string) {
  if (!name) return 'name required'
  if (name === FRONT || w.groups.some((g) => g.name === name && g.id !== selfId)) return 'duplicate name'
  if (!memberIds.length) return 'members required'
  return null
}

const cleanMembers = (w: World, ids: unknown) =>
  (Array.isArray(ids) ? ids : []).filter((id) => w.connections.some((c) => c.id === id))

export const peopleHandlers = [
  http.get(u('/connections'), route(({ w }) => w.connections)),

  http.patch(
    u('/connections/:id'),
    route(({ w, params, body }) => {
      const c = w.connections.find((x) => x.id === params.id)
      if (!c) return fail(404, 'not found')
      c.muted = !!body?.muted
      return c
    }),
  ),

  http.delete(
    u('/connections/:id'),
    route(({ w, params }) => {
      w.connections = w.connections.filter((c) => c.id !== params.id)
      if (!w.removed.includes(params.id)) w.removed.push(params.id)
      w.groups = w.groups.map((g) => ({ ...g, memberIds: g.memberIds.filter((m) => m !== params.id) }))
    }),
  ),

  http.get(
    u('/users/:id'),
    route(({ w, params }) => {
      const name = personName(w, params.id)
      if (!name) return fail(404, 'not found')
      const c = w.connections.find((x) => x.id === params.id)
      return { id: params.id, name, isConnection: !!c, muted: !!c?.muted }
    }),
  ),

  http.get(u('/groups'), route(({ w }) => w.groups)),

  http.post(
    u('/groups'),
    route(({ w, body }) => {
      const name = String(body?.name ?? '').trim(), memberIds = cleanMembers(w, body?.memberIds)
      const err = validateGroup(w, name, memberIds)
      if (err) return fail(400, err)
      const g = { id: uid('g'), name, memberIds }
      w.groups.push(g)
      return g
    }),
  ),

  http.patch(
    u('/groups/:id'),
    route(({ w, params, body }) => {
      const g = w.groups.find((x) => x.id === params.id)
      if (!g) return fail(404, 'not found')
      const name = String(body?.name ?? '').trim(), memberIds = cleanMembers(w, body?.memberIds)
      const err = validateGroup(w, name, memberIds, g.id)
      if (err) return fail(400, err)
      Object.assign(g, { name, memberIds })
      return g
    }),
  ),

  http.delete(u('/groups/:id'), route(({ w, params }) => { w.groups = w.groups.filter((g) => g.id !== params.id) })),
]
