import { http } from 'msw'
import type { Draft, DraftContent, RevisionKind } from '../../api/types'
import { AI_API_URL } from '../../config'
import { db, uid, type DbDraft, type DbSession, type World } from '../db'
import { byNewest, fail, route, summary } from './util'

const u = (p: string) => AI_API_URL + p
const REV_INDEX: Partial<Record<RevisionKind, number>> = { funnier: 1, dramatic: 2, restrained: 3, concise: 4 }
const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n).trimEnd() + '…' : s)

function content(w: World, s: DbSession, d: DbDraft): DraftContent {
  const sc = w.script
  if (sc.versions?.length && sc.body) {
    const v = sc.versions[d.rev % sc.versions.length]
    const body = d.rev === 4 ? [sc.body[0], sc.body[sc.body.length - 1]] : sc.body
    const headline = d.hl >= 0 && sc.alts?.length ? sc.alts[d.hl % sc.alts.length] : v.headline
    return { headline, sub: v.sub, summary: sc.summary ?? '', body, flash: sc.flash ?? headline, push: sc.push ?? headline }
  }
  // Unscripted account: build a plain story from what the user said.
  const said = s.messages.filter((m) => m.role === 'user').map((m) => m.text)
  const headline = clip(said[0] ?? '', 70)
  return {
    headline,
    sub: said[1] ?? '',
    summary: said[0] ?? '',
    body: d.rev === 4 ? said.slice(0, 1) : said,
    flash: headline,
    push: headline,
  }
}

function toDraft(w: World, id: string, d: DbDraft): Draft {
  const s = db.sessions[d.sessionId]
  const prev = w.articles.filter((a) => a.authorId === w.me.id).sort(byNewest)[0]
  const used = new Set(w.script.usedFacts ?? [])
  return {
    id,
    sessionId: d.sessionId,
    ...content(w, s, d),
    basis: { prevArticle: prev ? summary(w, prev) : null, facts: w.facts.filter((f) => used.has(f.k)) },
    newFacts: (w.script.newFacts ?? []).filter((f) => !w.facts.some((x) => x.k === f.k && x.v === f.v)),
  }
}

export const aiHandlers = [
  http.post(
    u('/reporter/sessions'),
    route(({ w }) => {
      const id = uid('s')
      db.sessions[id] = { userId: w.me.id, messages: [{ role: 'reporter', text: 'מה קרה?' }] }
      return { id, messages: db.sessions[id].messages }
    }),
  ),

  http.post(
    u('/reporter/sessions/:id/messages'),
    route(
      ({ w, params, body }) => {
        const s = db.sessions[params.id]
        const text = String(body?.text ?? '').trim()
        if (!s || s.userId !== w.me.id) return fail(404, 'session not found')
        if (!text) return fail(400, 'text required')
        s.messages.push({ role: 'user', text })
        const n = s.messages.filter((m) => m.role === 'user').length
        const reply = w.script.replies[n - 1] ?? null
        if (reply) s.messages.push({ role: 'reporter', text: reply })
        return { reply, canDraft: n >= 1 }
      },
      { latency: 1300 },
    ),
  ),

  http.post(
    u('/editor/drafts'),
    route(
      ({ w, body }) => {
        const s = db.sessions[body?.sessionId]
        if (!s || s.userId !== w.me.id) return fail(404, 'session not found')
        if (!s.messages.some((m) => m.role === 'user')) return fail(400, 'nothing to write about')
        const id = uid('d')
        db.drafts[id] = { userId: w.me.id, sessionId: body.sessionId, rev: 0, hl: -1 }
        return toDraft(w, id, db.drafts[id])
      },
      { latency: 3400 },
    ),
  ),

  http.post(
    u('/editor/drafts/:id/revise'),
    route(
      ({ w, params, body }) => {
        const d = db.drafts[params.id]
        if (!d || d.userId !== w.me.id) return fail(404, 'draft not found')
        const kind = body?.kind as RevisionKind
        const versions = w.script.versions?.length ?? 1
        if (kind === 'headline') d.hl = d.hl + 1
        else if (kind === 'alternate') Object.assign(d, { rev: (d.rev + 1) % versions, hl: -1 })
        else if (REV_INDEX[kind] != null) Object.assign(d, { rev: REV_INDEX[kind], hl: -1 })
        else return fail(400, 'unknown revision')
        return toDraft(w, params.id, d)
      },
      { latency: 1400 },
    ),
  ),
]
