import { Router } from 'express'
import { z } from 'zod'
import { param, requireAuth } from '../auth.ts'
import { loadContext } from '../context.ts'
import { asReporter } from '../draft.ts'
import { HttpError, UpstreamError } from '../errors.ts'
import { chat, SCHEMA } from '../openai.ts'
import { parse } from '../parse.ts'
import { fill, prompts } from '../prompts.ts'
import { askedCount, answeredCount, getSession, insertSession, MAX_QUESTIONS, MIN_QUESTIONS, saveSession } from '../sessions.ts'
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
  const asked = askedCount(messages)
  const answered = answeredCount(messages)
  // ponytail: last write wins if two sends overlap; the chat UI sends one message at a time.
  await saveSession(session.id, req.userId!, messages, session.turns, session.article_type, session.angle)
  if (asked >= MAX_QUESTIONS) {
    res.json({ reply: null, canDraft: true })
    return
  }

  const system = fill(prompts.reporter, ctx, { asked })
  const history = modelMessages(system, session.messages, session.turns, text)
  let turn = asReporter(await chat(history, 'reporter', SCHEMA.reporter))
  if (!turn.reply && asked < MIN_QUESTIONS) {
    turn = asReporter(await chat(
      [...history, { role: 'system', content: 'You have asked fewer than 2 questions after the opener. Ask another question. reply must be a Hebrew question, not null.' }],
      'reporter',
      SCHEMA.reporter,
    ))
    if (!turn.reply) throw new UpstreamError('reporter stopped before 2 questions')
  }
  const turns = [...session.turns, turn]
  if (turn.reply) messages.push({ role: 'reporter', text: turn.reply })
  await saveSession(session.id, req.userId!, messages, turns, turn.articleType, turn.angle)
  res.json({ reply: turn.reply, canDraft: answered >= MIN_QUESTIONS })
})
