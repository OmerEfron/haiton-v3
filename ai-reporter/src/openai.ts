// Port of docs/ai-reporter/evals/lib/openai.mjs + schemas.mjs.
// Strict json_schema, reasoning_effort low, one retry. Base URL is overridable for the test stub.
import { UpstreamError } from './errors.ts'
import { logger } from './log.ts'

const KEY = process.env.OPENAI_API_KEY
const BASE = (process.env.OPENAI_BASE_URL || 'https://api.openai.com').replace(/\/$/, '')
export const MODEL = process.env.AI_MODEL || 'gpt-6.1-sol'

export const TYPES = ['feature', 'profile', 'interview', 'column', 'sports_report', 'quirky'] as const

const str = { type: 'string' }
const arr = (items: object) => ({ type: 'array', items })
const obj = (properties: Record<string, object>) => ({
  type: 'object',
  properties,
  required: Object.keys(properties),
  additionalProperties: false,
})
const enm = (...v: string[]) => ({ type: 'string', enum: v })

export const SCHEMA = {
  // key order matters: the model writes the reasoning fields before the reply
  reporter: {
    known: str,
    angle: str,
    target: str,
    articleType: enm(...TYPES),
    reply: { type: ['string', 'null'] },
    canDraft: { type: 'boolean' },
  },
  draft: {
    headline: str,
    sub: str,
    summary: str,
    body: arr(str),
    flash: str,
    push: str,
    usedFacts: arr(str),
    newFacts: arr(obj({ k: str, v: str })),
  },
  intro: {
    reply: str,
    newFacts: arr(obj({ k: str, v: str })),
  },
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export async function chat(messages: ChatMessage[], name: string, props: Record<string, object>, attempt = 0): Promise<unknown> {
  if (!KEY) throw new UpstreamError('OPENAI_API_KEY missing')
  const started = Date.now()
  const body = {
    model: MODEL,
    messages,
    reasoning_effort: 'low',
    response_format: { type: 'json_schema', json_schema: { name, strict: true, schema: obj(props) } },
  }
  let res: Response
  try {
    res = await fetch(`${BASE}/v1/chat/completions`, {
      method: 'POST',
      signal: AbortSignal.timeout(45_000),
      headers: { 'content-type': 'application/json', authorization: `Bearer ${KEY}` },
      body: JSON.stringify(body),
    })
  } catch (err) {
    logger.warn({ model: MODEL, name, ms: Date.now() - started, err }, 'openai error')
    throw new UpstreamError(err instanceof Error ? err.message : 'openai request failed')
  }
  const ms = Date.now() - started
  if (!res.ok) {
    const t = await res.text()
    if (attempt < 1 && (res.status === 429 || res.status >= 500)) {
      logger.warn({ model: MODEL, name, status: res.status, ms }, 'openai retry')
      await new Promise((s) => setTimeout(s, 3000))
      return chat(messages, name, props, 1)
    }
    logger.warn({ model: MODEL, name, status: res.status, ms }, 'openai error')
    throw new UpstreamError(`${MODEL} ${res.status}: ${t.slice(0, 300)}`)
  }
  logger.info({ model: MODEL, name, status: res.status, ms }, 'openai')
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] }
  const content = json.choices?.[0]?.message?.content
  if (!content) throw new UpstreamError('empty completion')
  try {
    return JSON.parse(content)
  } catch {
    throw new UpstreamError('completion was not json')
  }
}
