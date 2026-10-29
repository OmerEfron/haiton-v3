import { pool } from './db.ts'
import type { ChatMessage, ReporterJson, SessionRow } from './types.ts'

export const FIXED_OPENER = 'מה קרה?'
export const MIN_QUESTIONS = 2
export const MAX_QUESTIONS = 7

/** Reporter lines after the fixed opener. */
export function askedCount(messages: ChatMessage[]) {
  return Math.max(0, messages.filter((m) => m.role === 'reporter').length - 1)
}

/** User answers to those questions. The first user message answers the opener. */
export function answeredCount(messages: ChatMessage[]) {
  return Math.max(0, messages.filter((m) => m.role === 'user').length - 1)
}

export const OPENER: ReporterJson = {
  known: 'nothing yet',
  angle: '',
  target: 'what happened',
  articleType: 'feature',
  reply: FIXED_OPENER,
  canDraft: false,
}

export function transcript(messages: ChatMessage[]) {
  return messages.map((m) => `${m.role}: ${m.text.replace(/[\r\n\u2028\u2029]+/g, ' ')}`).join('\n')
}

export async function insertSession(userId: string) {
  const messages: ChatMessage[] = [{ role: 'reporter', text: FIXED_OPENER }]
  const { rows } = await pool.query<{ id: string }>(
    `insert into ai_sessions (user_id, messages, turns) values ($1, $2::jsonb, $3::jsonb) returning id`,
    [userId, JSON.stringify(messages), JSON.stringify([OPENER])],
  )
  return { id: rows[0].id, messages }
}

export async function getSession(id: string, userId: string) {
  const { rows } = await pool.query<SessionRow>(
    'select id, user_id, messages, turns, article_type, angle from ai_sessions where id = $1 and user_id = $2',
    [id, userId],
  )
  return rows[0] ?? null
}

export async function saveSession(id: string, userId: string, messages: ChatMessage[], turns: ReporterJson[], articleType: string, angle: string) {
  await pool.query(
    `update ai_sessions
     set messages = $3::jsonb, turns = $4::jsonb, article_type = $5, angle = $6
     where id = $1 and user_id = $2`,
    [id, userId, JSON.stringify(messages), JSON.stringify(turns), articleType, angle],
  )
}
