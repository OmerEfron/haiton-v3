import { Router } from 'express'
import { z } from 'zod'
import { param, requireAuth } from '../auth.ts'
import { loadContext } from '../context.ts'
import { pool } from '../db.ts'
import { contentOf, toDraft } from '../draft.ts'
import { reviseDraft, REVISIONS, writeDraft } from '../editor.ts'
import { HttpError } from '../errors.ts'
import { aiMinute } from '../limits.ts'
import { chat } from '../openai.ts'
import { recordUsage, requireQuota } from '../quota.ts'
import { parse } from '../parse.ts'
import { answeredCount, MIN_QUESTIONS } from '../interview.ts'
import { getSession } from '../sessions.ts'
import type { DraftContent, ModelDraft, NewFact } from '../types.ts'

export const editorRouter = Router()

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
  return { session, ctx }
}

editorRouter.post('/editor/drafts', requireAuth, aiMinute, requireQuota, async (req, res) => {
  const { sessionId } = parse(z.object({ sessionId: z.string().min(1, 'sessionId required') }), req.body)
  const { session, ctx } = await requireStory(req.userId!, sessionId)
  const draft = await writeDraft(session, ctx, chat)
  const { rows } = await pool.query<{ id: string }>(
    `insert into ai_drafts (session_id, user_id, content, used_facts, new_facts)
     values ($1, $2, $3::jsonb, $4::text[], $5::jsonb) returning id`,
    [session.id, req.userId, JSON.stringify(contentOf(draft)), draft.usedFacts, JSON.stringify(draft.newFacts)],
  )
  await recordUsage(req.userId!, 'draft')
  res.json(toDraft(rows[0].id, session.id, contentOf(draft), draft.usedFacts, draft.newFacts, ctx))
})

editorRouter.post('/editor/drafts/:id/revise', requireAuth, aiMinute, requireQuota, async (req, res) => {
  const { kind } = parse(z.object({ kind: z.enum(REVISIONS, { error: 'unknown revision' }) }), req.body)
  const { rows } = await pool.query<DraftRow>(
    'select id, session_id, content, used_facts, new_facts from ai_drafts where id = $1 and user_id = $2',
    [param(req, 'id'), req.userId],
  )
  const row = rows[0]
  if (!row) throw new HttpError(404, 'draft not found')
  const { session, ctx } = await requireStory(req.userId!, row.session_id)
  const revised = await reviseDraft(session, ctx, modelDraft(row.content, row.used_facts, row.new_facts), kind, chat)
  // The revise prompt copies facts unchanged. Keep the stored ones so a sloppy completion cannot drop them.
  const content = contentOf(revised)
  await pool.query('update ai_drafts set content = $2::jsonb where id = $1', [row.id, JSON.stringify(content)])
  await recordUsage(req.userId!, 'revise')
  res.json(toDraft(row.id, row.session_id, content, row.used_facts, row.new_facts, ctx))
})
