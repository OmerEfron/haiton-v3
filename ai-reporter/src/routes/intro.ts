import { Router } from 'express'
import { z } from 'zod'
import { param, requireAuth } from '../auth.ts'
import { loadContext } from '../context.ts'
import { pool } from '../db.ts'
import { asIntro } from '../draft.ts'
import { HttpError } from '../errors.ts'
import { aiDay, aiMinute, sessionLimit } from '../limits.ts'
import { chat, SCHEMA } from '../openai.ts'
import { parse } from '../parse.ts'
import { fill, prompts } from '../prompts.ts'
import type { ChatMessage, NewFact } from '../types.ts'

export const introRouter = Router()

const OPENER = 'ספרו לי קצת על עצמכם. במה אתם עובדים?'
const MAX_ANSWERS = 20
const textBody = z.object({ text: z.string().trim().min(1, 'text required').max(1000, 'text too long') })

interface IntroRow {
  id: string
  messages: ChatMessage[]
}

function known(facts: { k: string; v: string }[], fresh: NewFact[]) {
  return fresh.filter((f) => !facts.some((x) => x.k === f.k && x.v === f.v))
}

async function getIntro(id: string, userId: string) {
  const { rows } = await pool.query<IntroRow>(
    'select id, messages from ai_intros where id = $1 and user_id = $2',
    [id, userId],
  )
  return rows[0] ?? null
}

async function saveIntro(id: string, userId: string, messages: ChatMessage[]) {
  await pool.query('update ai_intros set messages = $3::jsonb where id = $1 and user_id = $2', [
    id,
    userId,
    JSON.stringify(messages),
  ])
}

introRouter.post('/intro/sessions', requireAuth, sessionLimit, async (req, res) => {
  const messages: ChatMessage[] = [{ role: 'reporter', text: OPENER }]
  const { rows } = await pool.query<{ id: string }>(
    'insert into ai_intros (user_id, messages) values ($1, $2::jsonb) returning id',
    [req.userId, JSON.stringify(messages)],
  )
  res.json({ id: rows[0].id, messages })
})

introRouter.post('/intro/sessions/:id/messages', requireAuth, aiMinute, aiDay, async (req, res) => {
  const text = parse(textBody, req.body).text
  const session = await getIntro(param(req, 'id'), req.userId!)
  if (!session) throw new HttpError(404, 'session not found')
  const ctx = await loadContext(req.userId!)
  if (!ctx) throw new HttpError(401, 'unauthorized')

  // ponytail: hard stop at 20 answers; a longer intro would need a summary pass instead of the full transcript.
  if (session.messages.filter((m) => m.role === 'user').length >= MAX_ANSWERS) {
    res.json({ reply: null, newFacts: [] })
    return
  }

  const messages: ChatMessage[] = [...session.messages, { role: 'user', text }]
  // ponytail: last write wins if two sends overlap; the chat UI sends one message at a time.
  await saveIntro(session.id, req.userId!, messages)

  const history: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
    { role: 'system', content: fill(prompts.intro, ctx) },
    ...session.messages.map((m) => ({
      role: (m.role === 'reporter' ? 'assistant' : 'user') as 'assistant' | 'user',
      content: m.text,
    })),
    { role: 'user', content: text },
  ]
  const turn = asIntro(await chat(history, 'intro', SCHEMA.intro))
  if (turn.reply) messages.push({ role: 'reporter', text: turn.reply })
  await saveIntro(session.id, req.userId!, messages)
  res.json({ reply: turn.reply, newFacts: known(ctx.facts, turn.newFacts) })
})
