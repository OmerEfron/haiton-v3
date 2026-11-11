// The Editor turns an Interview into a Draft, and revises a Draft. No database access:
// the route stores the result. `chat` is the model call.
import type { StoryContext } from './context.ts'
import { asDraft } from './draft.ts'
import { transcript } from './interview.ts'
import { SCHEMA, type chat as Chat } from './openai.ts'
import { fill, prompts, reviseBlock, reviseSystem } from './prompts.ts'
import type { ModelDraft, SessionRow } from './types.ts'

type ModelChat = typeof Chat

export const REVISIONS = ['funnier', 'dramatic', 'restrained', 'headline', 'alternate'] as const
const MIN_BODY_CHARS = 350

function bodyChars(body: string[]) {
  return body.reduce((n, p) => n + p.length, 0)
}

// ponytail: one retry, then the longer body wins. A short Interview can still fall short; the upgrade is a second pass that lists the unused details.
async function longerBody(first: ModelDraft, again: (note: string) => Promise<unknown>) {
  const n = bodyChars(first.body)
  if (n >= MIN_BODY_CHARS) return first
  const second = asDraft(await again(
    `Body too short: ${n} chars. Rewrite with 3-5 paragraphs, at least 350 chars, using every detail from the chat. Do not invent facts.`,
  ))
  return bodyChars(second.body) > n ? second : first
}

function ask(chat: ModelChat, system: string, brief: string) {
  return async (note = '') =>
    asDraft(await chat(
      [
        { role: 'system', content: system },
        { role: 'user', content: note ? `${brief}\n\n${note}` : brief },
      ],
      'draft',
      SCHEMA.draft,
    ))
}

/** First Draft from the stored Interview. */
export async function writeDraft(session: SessionRow, context: StoryContext, chat: ModelChat) {
  const editor = fill(prompts.editor, context, { articleType: session.article_type, angle: session.angle })
  const run = ask(chat, editor, 'CHAT:\n' + transcript(session.messages))
  return longerBody(await run(), run)
}

/** Revised Draft. The caller keeps the stored Facts: the revise prompt copies them unchanged, a sloppy completion must not drop them. */
export async function reviseDraft(session: SessionRow, context: StoryContext, current: ModelDraft, kind: (typeof REVISIONS)[number], chat: ModelChat) {
  const editor = fill(prompts.editor, context, { articleType: session.article_type, angle: session.angle })
  const brief = `CHAT:\n${transcript(session.messages)}\n\nCURRENT DRAFT:\n${JSON.stringify(current)}\n\nREVISION INSTRUCTION (${kind}):\n${reviseBlock(kind)}`
  const run = ask(chat, reviseSystem(editor), brief)
  return longerBody(await run(), run)
}
