import { http } from 'msw'
import { API_URL } from '../../config'
import { db, nowIso, uid } from '../db'
import { byNewest, fail, later, route } from './util'

const u = (p: string) => API_URL + p
/** The friend who "joins" a few seconds after any invite is sent (prototype behaviour). */
const NEWBIE = { id: 'noa_new', name: 'נועה ברק' }

export const socialHandlers = [
  http.post(
    u('/invites'),
    route(({ w, body }) => {
      const code = w.me.id
      db.invites[code] ??= { inviterId: w.me.id, inviterName: w.me.name }
      if (body?.channel !== 'link' && !w.joinScheduled) {
        w.joinScheduled = true
        later(w.me.id, 6000, (w2) => {
          if (w2.connections.some((c) => c.id === NEWBIE.id)) return
          w2.connections.push({ ...NEWBIE, muted: false })
          w2.removed = w2.removed.filter((id) => id !== NEWBIE.id)
          if (w2.prefs.joins)
            w2.notifications.unshift({
              id: uid('n'), kind: 'join', personId: NEWBIE.id, unread: true, createdAt: nowIso(),
              text: `${NEWBIE.name} הצטרפה דרך ההזמנה שלכם`,
              sub: 'מעכשיו אפשר לשלוח לה כתבות, והכתבות שלה יופיעו אצלכם בעמוד הראשי.',
            })
        })
      }
      return { code, link: `${location.origin}/i/${code}` }
    }),
  ),

  http.get(
    u('/invites/:code'),
    route(
      ({ params }) => {
        const inv = db.invites[params.code]
        return inv ? { code: params.code, inviterName: inv.inviterName } : fail(404, 'not found')
      },
      { auth: false },
    ),
  ),

  http.post(
    u('/invites/:code/accept'),
    route(({ w, params }) => {
      const inv = db.invites[params.code]
      if (!inv) return fail(404, 'not found')
      if (inv.inviterId !== w.me.id && !w.connections.some((c) => c.id === inv.inviterId)) {
        w.connections.push({ id: inv.inviterId, name: inv.inviterName, muted: false })
        w.removed = w.removed.filter((id) => id !== inv.inviterId)
      }
      if (inv.article && !w.articles.some((a) => a.id === inv.article!.id)) w.articles.push({ ...inv.article })
      return { articleId: inv.article?.id ?? null }
    }),
  ),

  http.post(u('/invites/:code/decline'), route(() => undefined, { auth: false })),

  http.get(u('/notifications'), route(({ w }) => [...w.notifications].sort(byNewest))),
  http.post(u('/notifications/read'), route(({ w }) => { w.notifications.forEach((n) => (n.unread = false)) })),
]
