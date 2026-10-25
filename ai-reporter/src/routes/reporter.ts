import { Router } from 'express'
import { z } from 'zod'
import { param, requireAuth } from '../auth.ts'
import { loadContext } from '../context.ts'
import { asReporter } from '../draft.ts'
import { HttpError } from '../errors.ts'
import { chat, SCHEMA } from '../openai.ts'
import { parse } from '../parse.ts'
import { fill, prompts } from '../prompts.ts'
import { getSession, insertSession, MAX_TURNS, saveSession } from '../sessions.ts'
import type { ChatMessage, ReporterJson } from '../types.ts'

export const reporterRouter = Router()

const textBody = z.object({ text: z.string().trim().min(1, 'text required') })

function modelMessages(system: string, messages: ChatMessage[], turns: ReporterJson[], text: string) {
  const opener = turns[0]
  if (!opener) throw new HttpError(500, 'internal error')
  const msgs: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
    { role: 'system', content: system },
    { role: 'assistant', content: JSON.stringify(opener) },
  ]
  // Turns line up with user messages, not visible reporter lines: a null reply is still a turn.
  messages
    .filter((m) => m.role === 'user')
    .forEach((m, i) => {
      msgs.push({ role: 'user', content: m.text })
      const turn = turns[i + 1]
      if (turn) msgs.push({ role: 'assistant', content: JSON.stringify(turn) })
    })
  msgs.push({ role: 'user', content: text })
  return msgs
}

reporterRouter.post('/reporter/sessions', requireAuth, async (req, res) => {
  const ctx = await loadContext(req.userId!)
  if (!ctx) throw new HttpError(401, 'unauthorized')
  res.json(await insertSession(req.userId!))
})

reporterRouter.post('/reporter/sessions/:id/messages', requireAuth, async (req, res) => {
  const text = parse(textBody, req.body).text
  const session = await getSession(param(req, 'id'), req.userId!)
  if (!session) throw new HttpError(404, 'session not found')
  const ctx = await loadContext(req.userId!)
  if (!ctx) throw new HttpError(401, 'unauthorized')

  const messages: ChatMessage[] = [...session.messages, { role: 'user', text }]
  // ponytail: last write wins if two sends overlap; the chat UI sends one message at a time.
  const generated = session.turns.length - 1
  await saveSession(session.id, req.userId!, messages, session.turns, session.article_type, session.angle)
  if (generated >= MAX_TURNS) {
    res.json({ reply: null, canDraft: true })
    return
  }

  const system = fill(prompts.reporter, ctx)
  const raw = await chat(modelMessages(system, session.messages, session.turns, text), 'reporter', SCHEMA.reporter)
  const turn = asReporter(raw)
  const turns = [...session.turns, turn]
  if (turn.reply) messages.push({ role: 'reporter', text: turn.reply })
  await saveSession(session.id, req.userId!, messages, turns, turn.articleType, turn.angle)
  res.json({ reply: turn.reply, canDraft: turn.canDraft })
})
