import { Router } from 'express'
import { z } from 'zod'
import { param, requireAuth } from '../auth.ts'
import { loadContext } from '../context.ts'
import { HttpError } from '../errors.ts'
import { introFull, takeIntroTurn } from '../interview.ts'
import { introMinute, sessionLimit } from '../limits.ts'
import { chat } from '../openai.ts'
import { parse } from '../parse.ts'
import { getIntro, insertIntro, saveMessages } from '../sessions.ts'

export const introRouter = Router()

const textBody = z.object({ text: z.string().trim().min(1, 'text required').max(1000, 'text too long') })

introRouter.post('/intro/sessions', requireAuth, sessionLimit, async (req, res) => {
  res.json(await insertIntro(req.userId!))
})

introRouter.post('/intro/sessions/:id/messages', requireAuth, introMinute, async (req, res) => {
  const text = parse(textBody, req.body).text
  const session = await getIntro(param(req, 'id'), req.userId!)
  if (!session) throw new HttpError(404, 'session not found')
  const ctx = await loadContext(req.userId!)
  if (!ctx) throw new HttpError(401, 'unauthorized')

  if (introFull(session.messages)) {
    res.json({ reply: null, newFacts: [] })
    return
  }

  // Store the answer first so a failed model call does not lose it.
  // ponytail: last write wins if two sends overlap; the chat UI sends one message at a time.
  await saveMessages('intro', session.id, req.userId!, [...session.messages, { role: 'user', text }])
  const turn = await takeIntroTurn(session, text, ctx, chat)
  await saveMessages('intro', session.id, req.userId!, turn.messages)
  res.json({ reply: turn.reply, newFacts: turn.newFacts })
})
