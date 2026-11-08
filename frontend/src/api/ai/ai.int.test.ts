import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { signInWithGoogle } from '../core/me'
import { createDraft, reviseDraft } from './editor'
import { sendMessage, startSession } from './reporter'

const cookies = new Map<string, string>()

function installJar(apiPort: string, aiPort: string) {
  const orig = globalThis.fetch
  globalThis.fetch = async (input, init) => {
    const raw = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    const port = raw.startsWith('/ai') ? aiPort : apiPort
    const url = raw.startsWith('/') ? `http://127.0.0.1:${port}${raw}` : raw
    const headers = new Headers(init?.headers)
    if (cookies.size) headers.set('cookie', [...cookies.values()].join('; '))
    const res = await orig(url, { ...init, headers })
    for (const c of res.headers.getSetCookie()) {
      const [pair] = c.split(';')
      const eq = pair.indexOf('=')
      cookies.set(pair.slice(0, eq).trim(), pair)
    }
    return res
  }
}

beforeAll(() => {
  const api = process.env.HAITON_API_PORT
  const ai = process.env.HAITON_AI_PORT
  if (!api || !ai) throw new Error('int-setup did not start the api and ai-reporter')
  installJar(api, ai)
})

afterEach(() => cookies.clear())

const email = () => `ai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.local`

describe('frontend ai client against ai-reporter', () => {
  it('chats, drafts, and revises with the stub', async () => {
    await signInWithGoogle(email())
    const session = await startSession()
    expect(session.messages[0]?.text).toBe('מה קרה?')

    const first = await sendMessage(session.id, 'סיימתי להרכיב ארון')
    expect(first).toMatchObject({ reply: 'רגע, ומה קרה אחר כך?', canDraft: false })
    await sendMessage(session.id, 'הארון עומד')
    const third = await sendMessage(session.id, 'נשארו ברגים')
    expect(third.canDraft).toBe(true)

    const draft = await createDraft(session.id)
    expect(draft.sessionId).toBe(session.id)
    expect(draft.headline).toBe('אחרי השיחה: כותרת ראשונה לבדיקה')
    expect(draft.body.length).toBeGreaterThan(0)
    expect(draft.newFacts).toEqual([{ k: 'עיר', v: 'תל אביב' }])

    const revised = await reviseDraft(draft.id, 'headline')
    expect(revised.headline).toBe('אחרי השיחה: כותרת מתוקנת לבדיקה')
  })
})
