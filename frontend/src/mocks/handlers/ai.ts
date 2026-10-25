import { delay, http, HttpResponse } from 'msw'
import type { ArticleSummary, Draft, DraftContent, Fact, Me, RevisionKind } from '../../api/types'
import { AI_API_URL, API_URL } from '../../config'
import { db, save, uid, type DbDraft, type DbSession, type Script } from '../db'
import { fail } from './util'
import { DATA } from '../seed/haiton-data.js'

const u = (p: string) => AI_API_URL + p
const REV_INDEX: Partial<Record<RevisionKind, number>> = { funnier: 1, dramatic: 2, restrained: 3, concise: 4 }
const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n).trimEnd() + '…' : s)
const GENERIC: Script = { replies: ['איזה יופי. ספרו עוד, איך זה התחיל?', 'ואיך הרגשתם כשזה קרה?'] }

function scriptFor(meId: string): Script {
  const P = Object.values(DATA).find((p) => p.meId === meId)
  if (!P) return GENERIC
  return {
    replies: P.replies,
    versions: P.versions,
    alts: P.alts,
    body: P.body,
    summary: P.summary,
    flash: P.flash,
    push: P.push,
    usedFacts: P.usedFacts,
    newFacts: P.newFacts,
  }
}

async function coreGet<T>(path: string, request: Request): Promise<T | null> {
  const res = await fetch(API_URL + path, { credentials: 'include', headers: { cookie: request.headers.get('cookie') ?? '' } })
  if (!res.ok) return null
  return res.json() as Promise<T>
}

function content(sc: Script, s: DbSession, d: DbDraft): DraftContent {
  if (sc.versions?.length && sc.body) {
    const v = sc.versions[d.rev % sc.versions.length]
    const body = d.rev === 4 ? [sc.body[0], sc.body[sc.body.length - 1]] : sc.body
    const headline = d.hl >= 0 && sc.alts?.length ? sc.alts[d.hl % sc.alts.length] : v.headline
    return { headline, sub: v.sub, summary: sc.summary ?? '', body, flash: sc.flash ?? headline, push: sc.push ?? headline }
  }
  const said = s.messages.filter((m) => m.role === 'user').map((m) => m.text)
  const headline = clip(said[0] ?? '', 70)
  return { headline, sub: said[1] ?? '', summary: said[0] ?? '', body: d.rev === 4 ? said.slice(0, 1) : said, flash: headline, push: headline }
}

function toDraft(me: Me, facts: Fact[], articles: ArticleSummary[], id: string, d: DbDraft): Draft {
  const s = db.sessions[d.sessionId]
  const sc = scriptFor(me.id)
  const prev = articles[0] ?? null
  const used = new Set(sc.usedFacts ?? [])
  return {
    id,
    sessionId: d.sessionId,
    ...content(sc, s, d),
    basis: { prevArticle: prev, facts: facts.filter((f) => used.has(f.k)) },
    newFacts: (sc.newFacts ?? []).filter((f) => !facts.some((x) => x.k === f.k && x.v === f.v)),
  }
}

function aiRoute(fn: (c: { me: Me; params: Record<string, string>; body: any; request: Request }) => unknown, latency?: number) {
  return async ({ request, params }: { request: Request; params: Record<string, unknown> }) => {
    await delay(latency ?? 200 + Math.random() * 300)
    const me = await coreGet<Me>('/me', request)
    if (!me) return fail(401, 'unauthorized')
    const type = request.headers.get('content-type') ?? ''
    const body = type.includes('application/json') ? await request.json() : null
    const out = await fn({ me, params: params as Record<string, string>, body, request })
    save()
    if (out instanceof Response) return out
    return out === undefined ? new HttpResponse(null, { status: 204 }) : HttpResponse.json(out as object)
  }
}

export const aiHandlers = [
  http.post(
    u('/reporter/sessions'),
    aiRoute(({ me }) => {
      const id = uid('s')
      db.sessions[id] = { userId: me.id, messages: [{ role: 'reporter', text: 'מה קרה?' }] }
      return { id, messages: db.sessions[id].messages }
    }),
  ),

  http.post(
    u('/reporter/sessions/:id/messages'),
    aiRoute(({ me, params, body }) => {
      const s = db.sessions[params.id]
      const text = String(body?.text ?? '').trim()
      if (!s || s.userId !== me.id) return fail(404, 'session not found')
      if (!text) return fail(400, 'text required')
      s.messages.push({ role: 'user', text })
      const n = s.messages.filter((m) => m.role === 'user').length
      const reply = scriptFor(me.id).replies[n - 1] ?? null
      if (reply) s.messages.push({ role: 'reporter', text: reply })
      return { reply, canDraft: n >= 1 }
    }, 1300),
  ),

  http.post(
    u('/editor/drafts'),
    aiRoute(async ({ me, body, request }) => {
      const s = db.sessions[body?.sessionId]
      if (!s || s.userId !== me.id) return fail(404, 'session not found')
      if (!s.messages.some((m) => m.role === 'user')) return fail(400, 'nothing to write about')
      const [facts, articles] = await Promise.all([
        coreGet<Fact[]>('/me/facts', request),
        coreGet<ArticleSummary[]>(`/users/${me.id}/articles`, request),
      ])
      const id = uid('d')
      db.drafts[id] = { userId: me.id, sessionId: body.sessionId, rev: 0, hl: -1 }
      return toDraft(me, facts ?? [], articles ?? [], id, db.drafts[id])
    }, 3400),
  ),

  http.post(
    u('/editor/drafts/:id/revise'),
    aiRoute(async ({ me, params, body, request }) => {
      const d = db.drafts[params.id]
      if (!d || d.userId !== me.id) return fail(404, 'draft not found')
      const kind = body?.kind as RevisionKind
      const versions = scriptFor(me.id).versions?.length ?? 1
      if (kind === 'headline') d.hl = d.hl + 1
      else if (kind === 'alternate') Object.assign(d, { rev: (d.rev + 1) % versions, hl: -1 })
      else if (REV_INDEX[kind] != null) Object.assign(d, { rev: REV_INDEX[kind], hl: -1 })
      else return fail(400, 'unknown revision')
      const [facts, articles] = await Promise.all([
        coreGet<Fact[]>('/me/facts', request),
        coreGet<ArticleSummary[]>(`/users/${me.id}/articles`, request),
      ])
      return toDraft(me, facts ?? [], articles ?? [], params.id, d)
    }, 1400),
  ),
]
