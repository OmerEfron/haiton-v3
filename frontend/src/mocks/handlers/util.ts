import { delay, HttpResponse } from 'msw'
import type { ArticleSummary, Id } from '../../api/types'
import { db, save, type DbArticle, type World } from '../db'

export interface Ctx {
  w: World
  params: Record<string, string>
  body: any
  url: URL
}

export const fail = (status: number, message: string) => HttpResponse.json({ message }, { status })

async function readBody(request: Request) {
  const type = request.headers.get('content-type') ?? ''
  if (type.includes('application/json')) return request.json()
  if (type.includes('multipart/form-data')) return request.formData()
  return null
}

/**
 * Wraps a mock route: fake latency, session check, body parsing, persistence and JSON encoding.
 * Returning undefined -> 204, a Response -> passthrough, anything else -> JSON.
 */
export function route(fn: (c: Ctx) => unknown, opts: { auth?: boolean; latency?: number } = {}) {
  return async ({ request, params }: { request: Request; params: Record<string, unknown> }) => {
    await delay(opts.latency ?? 200 + Math.random() * 300)
    const w = db.session ? db.worlds[db.session] : undefined
    if (!w && opts.auth !== false) return fail(401, 'unauthorized')
    const out = await fn({ w: w as World, params: params as Record<string, string>, body: await readBody(request), url: new URL(request.url) })
    save()
    if (out instanceof Response) return out
    return out === undefined ? new HttpResponse(null, { status: 204 }) : HttpResponse.json(out as object)
  }
}

/** Server-side delayed side effect against a specific account (e.g. a reaction arriving later). */
export function later(userId: Id, ms: number, fn: (w: World) => void) {
  setTimeout(() => {
    const w = db.worlds[userId]
    if (!w) return
    fn(w)
    save()
  }, ms)
}

export const findPrev = (w: World, a: DbArticle) =>
  (a.prevId && w.articles.find((x) => x.id === a.prevId && x.authorId === a.authorId)) || null

export const byNewest = (a: { createdAt: string }, b: { createdAt: string }) => b.createdAt.localeCompare(a.createdAt)

export function summary(w: World, a: DbArticle): ArticleSummary {
  return {
    id: a.id,
    authorId: a.authorId,
    author: a.authorId === w.me.id ? w.me.name : a.author,
    createdAt: a.createdAt,
    imageUrl: a.imageUrl,
    headline: a.headline,
    sub: a.sub,
    flash: a.flash,
    hasPrev: !!findPrev(w, a),
  }
}

export const personName = (w: World, id: Id) =>
  id === w.me.id ? w.me.name : w.connections.find((c) => c.id === id)?.name ?? w.articles.find((a) => a.authorId === id)?.author

export function feedFor(w: World, groupId?: string) {
  const muted = new Set(w.connections.filter((c) => c.muted).map((c) => c.id))
  const group = groupId ? w.groups.find((g) => g.id === groupId) : undefined
  return w.articles
    .filter((a) => !w.hidden.includes(a.id))
    .filter((a) => a.authorId === w.me.id || (!muted.has(a.authorId) && !w.removed.includes(a.authorId)))
    .filter((a) => !group || (a.authorId === w.me.id ? group.memberIds.some((m) => (a.audienceIds ?? []).includes(m)) : group.memberIds.includes(a.authorId)))
    .sort(byNewest)
}
