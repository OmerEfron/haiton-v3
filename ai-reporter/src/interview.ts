// The Reporter's Interview turn algorithm. No database access: the route stores the
// user's message before calling takeTurn, then stores the result. `chat` is the model call.
import type { StoryContext } from './context.ts'
import { asIntro, asReporter } from './draft.ts'
import { HttpError, UpstreamError } from './errors.ts'
import { SCHEMA, type chat as Chat } from './openai.ts'
import { fill, prompts } from './prompts.ts'
import type { ChatMessage, NewFact, ReporterJson, SessionRow } from './types.ts'

type ModelChat = typeof Chat
type ModelMessage = { role: 'system' | 'user' | 'assistant'; content: string }

export const FIXED_OPENER = 'מה קרה?'
export const MIN_QUESTIONS = 2
export const MAX_QUESTIONS = 7
const RETRY_NOTE = `You have asked fewer than ${MIN_QUESTIONS} questions after the opener. Ask another question. reply must be a Hebrew question, not null.`

export const OPENER: ReporterJson = {
  known: 'nothing yet',
  angle: '',
  target: 'what happened',
  articleType: 'feature',
  reply: FIXED_OPENER,
  canDraft: false,
}

/** Reporter lines after the fixed opener. */
export function askedCount(messages: ChatMessage[]) {
  return Math.max(0, messages.filter((m) => m.role === 'reporter').length - 1)
}

/** User answers to those questions. The first user message answers the opener. */
export function answeredCount(messages: ChatMessage[]) {
  return Math.max(0, messages.filter((m) => m.role === 'user').length - 1)
}

export function transcript(messages: ChatMessage[]) {
  return messages.map((m) => `${m.role}: ${m.text.replace(/[\r\n\u2028\u2029]+/g, ' ')}`).join('\n')
}

function modelMessages(system: string, messages: ChatMessage[], turns: ReporterJson[], text: string) {
  const opener = turns[0]
  if (!opener) throw new HttpError(500, 'internal error')
  const msgs: ModelMessage[] = [
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

/**
 * One Reporter turn. `session` is the stored Interview before `text`.
 * `usedModel` is false at the maximum, where nothing is asked and no usage is spent.
 */
export async function takeTurn(session: SessionRow, text: string, context: StoryContext, chat: ModelChat) {
  const messages: ChatMessage[] = [...session.messages, { role: 'user', text }]
  const asked = askedCount(messages)
  const answered = answeredCount(messages)
  if (asked >= MAX_QUESTIONS) {
    return { messages, turns: session.turns, articleType: session.article_type, angle: session.angle, reply: null, canDraft: true, usedModel: false }
  }

  const history = modelMessages(fill(prompts.reporter, context, { asked }), session.messages, session.turns, text)
  let turn = asReporter(await chat(history, 'reporter', SCHEMA.reporter))
  if (!turn.reply && asked < MIN_QUESTIONS) {
    turn = asReporter(await chat([...history, { role: 'system', content: RETRY_NOTE }], 'reporter', SCHEMA.reporter))
    if (!turn.reply) throw new UpstreamError(`reporter stopped before ${MIN_QUESTIONS} questions`)
  }
  if (turn.reply) messages.push({ role: 'reporter', text: turn.reply })
  return {
    messages,
    turns: [...session.turns, turn],
    articleType: turn.articleType,
    angle: turn.angle,
    reply: turn.reply,
    canDraft: answered >= MIN_QUESTIONS,
    usedModel: true,
  }
}

export const INTRO_OPENER = 'ספרו לי קצת על עצמכם. במה אתם עובדים?'
// ponytail: hard stop at 20 answers; a longer intro would need a summary pass instead of the full transcript.
const MAX_INTRO_ANSWERS = 20

export function introFull(messages: ChatMessage[]) {
  return messages.filter((m) => m.role === 'user').length >= MAX_INTRO_ANSWERS
}

function known(facts: { k: string; v: string }[], fresh: NewFact[]) {
  return fresh.filter((f) => !facts.some((x) => x.k === f.k && x.v === f.v))
}

/** One intro turn. `session` is the stored intro before `text`; returns the messages to store and the Facts not yet known. */
export async function takeIntroTurn(session: { messages: ChatMessage[] }, text: string, context: StoryContext, chat: ModelChat) {
  const history: ModelMessage[] = [
    { role: 'system', content: fill(prompts.intro, context) },
    ...session.messages.map((m) => ({ role: m.role === 'reporter' ? ('assistant' as const) : ('user' as const), content: m.text })),
    { role: 'user', content: text },
  ]
  const turn = asIntro(await chat(history, 'intro', SCHEMA.intro))
  const messages: ChatMessage[] = [...session.messages, { role: 'user', text }]
  if (turn.reply) messages.push({ role: 'reporter', text: turn.reply })
  return { messages, reply: turn.reply, newFacts: known(context.facts, turn.newFacts) }
}
