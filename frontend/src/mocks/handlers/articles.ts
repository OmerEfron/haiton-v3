import { http } from 'msw'
import type { Article, Id, PublishRequest } from '../../api/types'
import { API_URL } from '../../config'
import { nowIso, uid, type DbArticle, type World } from '../db'
import { byNewest, fail, feedFor, findPrev, later, personName, route, summary } from './util'

const u = (p: string) => API_URL + p

function full(w: World, a: DbArticle): Article {
  const history = []
  for (let p = findPrev(w, a); p && history.length < 5; p = findPrev(w, p)) history.push(summary(w, p))
  const mine = a.authorId === w.me.id
  return {
    ...summary(w, a),
    body: a.body,
    history,
    audienceIds: mine ? a.audienceIds : null,
    received: mine ? (w.received[a.id] ?? []).map((r) => ({ ...r, name: personName(w, r.personId) ?? '' })) : [],
    myReaction: w.reactions[a.id] ?? null,
    reported: w.reported.includes(a.id),
  }
}

function audienceIds(w: World, req: PublishRequest): Id[] {
  const { mode, personIds = [], groupId } = req.audience
  const connected = new Set(w.connections.map((c) => c.id))
  if (mode === 'people') return personIds.filter((id) => connected.has(id))
  if (mode === 'group') return w.groups.find((g) => g.id === groupId)?.memberIds ?? []
  if (mode === 'circle') return [...connected]
  return []
}

export const articleHandlers = [
  http.get(u('/feed'), route(({ w, url }) => feedFor(w, url.searchParams.get('group') ?? undefined).map((a) => summary(w, a)))),

  http.get(
    u('/articles/:id'),
    route(({ w, params }) => {
      const a = w.articles.find((x) => x.id === params.id)
      return a ? full(w, a) : fail(404, 'not found')
    }),
  ),

  http.get(
    u('/users/:id/articles'),
    route(({ w, params }) =>
      w.articles.filter((a) => a.authorId === params.id && !w.hidden.includes(a.id)).sort(byNewest).map((a) => summary(w, a)),
    ),
  ),

  http.post(
    u('/articles'),
    route(({ w, body }) => {
      const req = body as PublishRequest
      const c = req.content
      if (!c?.headline || !c.body?.length) return fail(400, 'content required')
      const aud = audienceIds(w, req)
      if (req.audience.mode !== 'me' && !aud.length) return fail(400, 'empty audience')
      const art: DbArticle = {
        id: uid('a'),
        authorId: w.me.id,
        author: w.me.name,
        createdAt: nowIso(),
        imageUrl: null,
        headline: c.headline,
        sub: c.sub,
        flash: c.flash,
        push: c.push,
        body: c.body,
        prevId: req.prevId,
        audienceIds: aud,
      }
      w.articles.unshift(art)
      for (const f of req.saveFacts ?? []) {
        if (!w.facts.some((x) => x.k === f.k && x.v === f.v))
          w.facts.push({ id: uid('f'), k: f.k, v: f.v, isNew: true, src: 'נוסף היום, מתוך השיחה' })
      }
      w.me.onboarding = false
      if (aud.length) {
        later(w.me.id, 8000, (w2) => {
          if (!w2.articles.some((a) => a.id === art.id)) return
          const who = aud[0], label = 'אהבתי'
          w2.received[art.id] = [...(w2.received[art.id] ?? []), { personId: who, label }]
          if (w2.prefs.reactions)
            w2.notifications.unshift({
              id: uid('n'), kind: 'react', articleId: art.id, unread: true, createdAt: nowIso(),
              text: `תגובה חדשה מ${personName(w2, who) ?? ''}: ${label}`, sub: art.headline,
            })
        })
      }
      return full(w, art)
    }),
  ),

  http.delete(
    u('/articles/:id'),
    route(({ w, params }) => {
      const a = w.articles.find((x) => x.id === params.id)
      if (!a || a.authorId !== w.me.id) return fail(404, 'not found')
      w.articles = w.articles.filter((x) => x.id !== a.id)
      w.notifications = w.notifications.filter((n) => n.articleId !== a.id)
      delete w.received[a.id]
    }),
  ),

  http.put(
    u('/articles/:id/reaction'),
    route(({ w, params, body }) => {
      if (body?.label) w.reactions[params.id] = body.label
      else delete w.reactions[params.id]
    }),
  ),

  http.post(
    u('/articles/:id/report'),
    route(({ w, params, body }) => {
      if (!body?.reason) return fail(400, 'reason required')
      if (!w.reported.includes(params.id)) w.reported.push(params.id)
    }),
  ),

  http.post(u('/articles/:id/hide'), route(({ w, params }) => { if (!w.hidden.includes(params.id)) w.hidden.push(params.id) })),
  http.delete(u('/articles/:id/hide'), route(({ w, params }) => { w.hidden = w.hidden.filter((id) => id !== params.id) })),
]
