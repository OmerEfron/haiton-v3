import { Router } from 'express'
import { z } from 'zod'
import { param, requireAuth } from '../auth.ts'
import { loadContext } from '../context.ts'
import { HttpError } from '../errors.ts'
import { takeTurn } from '../interview.ts'
import { aiMinute, sessionLimit } from '../limits.ts'
import { chat } from '../openai.ts'
import { getQuota, recordUsage, requireQuota } from '../quota.ts'
import { parse } from '../parse.ts'
import { getSession, insertSession, listSessions, saveMessages, saveSession } from '../sessions.ts'

export const reporterRouter = Router()

const textBody = z.object({ text: z.string().trim().min(1, 'text required').max(1000, 'text too long') })

reporterRouter.get('/quota', requireAuth, async (req, res) => {
  res.json(await getQuota(req.userId!))
})

reporterRouter.get('/reporter/sessions', requireAuth, async (req, res) => {
  res.json(await listSessions(req.userId!))
})

reporterRouter.post('/reporter/sessions', requireAuth, sessionLimit, async (req, res) => {
  const ctx = await loadContext(req.userId!)
  if (!ctx) throw new HttpError(401, 'unauthorized')
  res.json(await insertSession(req.userId!))
})

reporterRouter.post('/reporter/sessions/:id/messages', requireAuth, aiMinute, requireQuota, async (req, res) => {
  const text = parse(textBody, req.body).text
  const session = await getSession(param(req, 'id'), req.userId!)
  if (!session) throw new HttpError(404, 'session not found')
  const ctx = await loadContext(req.userId!)
  if (!ctx) throw new HttpError(401, 'unauthorized')

  // Store the answer first so a failed model call does not lose it.
  // ponytail: last write wins if two sends overlap; the chat UI sends one message at a time.
  await saveMessages('interview', session.id, req.userId!, [...session.messages, { role: 'user', text }])
  const turn = await takeTurn(session, text, ctx, chat)
  await saveSession(session.id, req.userId!, turn.messages, turn.turns, turn.articleType, turn.angle)
  if (turn.usedModel) await recordUsage(req.userId!, 'reporter')
  res.json({ reply: turn.reply, canDraft: turn.canDraft })
})
