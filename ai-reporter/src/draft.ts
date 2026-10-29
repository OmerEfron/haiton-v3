import { UpstreamError } from './errors.ts'
import { TYPES } from './openai.ts'
import type { StoryContext } from './context.ts'
import type { Draft, DraftContent, ModelDraft, NewFact, ReporterJson } from './types.ts'

export function asReporter(raw: unknown): ReporterJson {
  if (!raw || typeof raw !== 'object') throw new UpstreamError('bad reporter json')
  const o = raw as Record<string, unknown>
  const articleType = o.articleType
  if (typeof o.known !== 'string' || typeof o.angle !== 'string' || typeof o.target !== 'string') throw new UpstreamError('bad reporter json')
  if (typeof articleType !== 'string' || !(TYPES as readonly string[]).includes(articleType)) throw new UpstreamError('bad reporter json')
  if (!(typeof o.reply === 'string' || o.reply === null) || typeof o.canDraft !== 'boolean') throw new UpstreamError('bad reporter json')
  return {
    known: o.known.slice(0, 500),
    angle: o.angle.slice(0, 300),
    target: o.target.slice(0, 300),
    articleType,
    reply: o.reply,
    canDraft: o.canDraft,
  }
}

function strings(v: unknown, label: string) {
  if (typeof v !== 'string') throw new UpstreamError(`bad draft ${label}`)
  return v
}

export function asDraft(raw: unknown): ModelDraft {
  if (!raw || typeof raw !== 'object') throw new UpstreamError('bad draft json')
  const o = raw as Record<string, unknown>
  if (!Array.isArray(o.body) || o.body.length < 1 || o.body.some((p) => typeof p !== 'string')) throw new UpstreamError('bad draft body')
  if (!Array.isArray(o.usedFacts) || o.usedFacts.some((k) => typeof k !== 'string')) throw new UpstreamError('bad draft facts')
  if (!Array.isArray(o.newFacts)) throw new UpstreamError('bad draft facts')
  const newFacts: NewFact[] = []
  for (const f of o.newFacts) {
    if (newFacts.length >= 10) break
    if (!f || typeof f !== 'object') throw new UpstreamError('bad draft facts')
    const fact = f as Record<string, unknown>
    if (typeof fact.k !== 'string' || typeof fact.v !== 'string' || !fact.k || !fact.v) throw new UpstreamError('bad draft facts')
    newFacts.push({ k: fact.k.slice(0, 40), v: fact.v.slice(0, 200) })
  }
  const headline = strings(o.headline, 'headline')
  if (!headline.trim()) throw new UpstreamError('bad draft headline')
  return {
    headline,
    sub: strings(o.sub, 'sub'),
    summary: strings(o.summary, 'summary'),
    body: o.body as string[],
    flash: strings(o.flash, 'flash'),
    push: strings(o.push, 'push'),
    usedFacts: o.usedFacts as string[],
    newFacts,
  }
}

export function contentOf(d: ModelDraft): DraftContent {
  return { headline: d.headline, sub: d.sub, summary: d.summary, body: d.body, flash: d.flash, push: d.push }
}

export function toDraft(id: string, sessionId: string, content: DraftContent, usedFacts: string[], newFacts: NewFact[], ctx: StoryContext): Draft {
  const used = new Set(usedFacts)
  return {
    id,
    sessionId,
    ...content,
    basis: { prevArticle: ctx.prevArticle, facts: ctx.facts.filter((f) => used.has(f.k)) },
    newFacts: newFacts.filter((f) => !ctx.facts.some((x) => x.k === f.k && x.v === f.v)),
  }
}
