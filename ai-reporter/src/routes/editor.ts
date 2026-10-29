import { Router } from 'express'
import { z } from 'zod'
import { param, requireAuth } from '../auth.ts'
import { loadContext } from '../context.ts'
import { pool } from '../db.ts'
import { asDraft, contentOf, toDraft } from '../draft.ts'
import { HttpError } from '../errors.ts'
import { aiDay, aiMinute } from '../limits.ts'
import { chat, SCHEMA } from '../openai.ts'
import { parse } from '../parse.ts'
import { fill, prompts, reviseBlock, reviseSystem } from '../prompts.ts'
import { answeredCount, getSession, MIN_QUESTIONS, transcript } from '../sessions.ts'
import type { DraftContent, ModelDraft, NewFact } from '../types.ts'

export const editorRouter = Router()

const KINDS = ['funnier', 'dramatic', 'restrained', 'headline', 'alternate'] as const
const MIN_BODY_CHARS = 350

function bodyChars(body: string[]) {
  return body.reduce((n, p) => n + p.length, 0)
}

// ponytail: one retry, then the longer body wins. A thin chat can still fall short; the upgrade is a second pass that lists the unused details.
async function longerBody(first: ModelDraft, again: (note: string) => Promise<unknown>) {
  const n = bodyChars(first.body)
  if (n >= MIN_BODY_CHARS) return first
  const second = asDraft(await again(
    `Body too short: ${n} chars. Rewrite with 3-5 paragraphs, at least 350 chars, using every detail from the chat. Do not invent facts.`,
  ))
  return bodyChars(second.body) > n ? second : first
}

interface DraftRow {
  id: string
  session_id: string
  content: DraftContent
  used_facts: string[]
  new_facts: NewFact[]
}

function modelDraft(content: DraftContent, usedFacts: string[], newFacts: NewFact[]): ModelDraft {
  return { ...content, usedFacts, newFacts }
}

async function requireStory(userId: string, sessionId: string) {
  const session = await getSession(sessionId, userId)
  if (!session) throw new HttpError(404, 'session not found')
  if (answeredCount(session.messages) < MIN_QUESTIONS) throw new HttpError(400, 'interview too short')
  const ctx = await loadContext(userId)
  if (!ctx) throw new HttpError(401, 'unauthorized')
  const editor = fill(prompts.editor, ctx, { articleType: session.article_type, angle: session.angle })
  return { session, ctx, editor }
}

editorRouter.post('/editor/drafts', requireAuth, aiMinute, aiDay, async (req, res) => {
  const { sessionId } = parse(z.object({ sessionId: z.string().min(1, 'sessionId required') }), req.body)
  const { session, ctx, editor } = await requireStory(req.userId!, sessionId)
  const chatText = 'CHAT:\n' + transcript(session.messages)
  const ask = (note = '') => chat(
    [
      { role: 'system', content: editor },
      { role: 'user', content: note ? `${chatText}\n\n${note}` : chatText },
    ],
    'draft',
    SCHEMA.draft,
  )
  const draft = await longerBody(asDraft(await ask()), ask)
  const { rows } = await pool.query<{ id: string }>(
    `insert into ai_drafts (session_id, user_id, content, used_facts, new_facts)
     values ($1, $2, $3::jsonb, $4::text[], $5::jsonb) returning id`,
    [session.id, req.userId, JSON.stringify(contentOf(draft)), draft.usedFacts, JSON.stringify(draft.newFacts)],
  )
  res.json(toDraft(rows[0].id, session.id, contentOf(draft), draft.usedFacts, draft.newFacts, ctx))
})

editorRouter.post('/editor/drafts/:id/revise', requireAuth, aiMinute, aiDay, async (req, res) => {
  const { kind } = parse(z.object({ kind: z.enum(KINDS, { error: 'unknown revision' }) }), req.body)
  const { rows } = await pool.query<DraftRow>(
    'select id, session_id, content, used_facts, new_facts from ai_drafts where id = $1 and user_id = $2',
    [param(req, 'id'), req.userId],
  )
  const row = rows[0]
  if (!row) throw new HttpError(404, 'draft not found')
  const { session, ctx, editor } = await requireStory(req.userId!, row.session_id)
  const current = modelDraft(row.content, row.used_facts, row.new_facts)
  const brief = `CHAT:\n${transcript(session.messages)}\n\nCURRENT DRAFT:\n${JSON.stringify(current)}\n\nREVISION INSTRUCTION (${kind}):\n${reviseBlock(kind)}`
  const ask = (note = '') => chat(
    [
      { role: 'system', content: reviseSystem(editor) },
      { role: 'user', content: note ? `${brief}\n\n${note}` : brief },
    ],
    'draft',
    SCHEMA.draft,
  )
  const revised = await longerBody(asDraft(await ask()), ask)
  // The revise prompt copies facts unchanged. Keep the stored ones so a sloppy completion cannot drop them.
  const content = contentOf(revised)
  await pool.query('update ai_drafts set content = $2::jsonb where id = $1', [row.id, JSON.stringify(content)])
  res.json(toDraft(row.id, row.session_id, content, row.used_facts, row.new_facts, ctx))
})
