import { describe, expect, it } from 'vitest'
import { pool } from '../src/db.ts'
import { answer, signIn } from './helpers.ts'

const FIRST = 'אחרי השיחה: כותרת ראשונה לבדיקה'

async function usage(userId: string) {
  const { rows } = await pool.query<{ n: number }>('select count(*)::int as n from ai_usage where user_id = $1', [userId])
  return rows[0].n
}

describe('reporter', () => {
  it('rejects empty text and drafts before two answers', async () => {
    const a = await signIn()
    const session = await a.post('/ai/reporter/sessions')
    const id = session.body.id as string
    expect(session.body.messages[0].text).toBe('מה קרה?')

    expect((await a.post(`/ai/reporter/sessions/${id}/messages`).send({ text: '  ' })).status).toBe(400)
    expect((await a.post('/ai/editor/drafts').send({ sessionId: id })).status).toBe(400)

    const first = await answer(a, id, 'סיימתי להרכיב ארון')
    expect(first.status).toBe(200)
    expect(first.body).toMatchObject({ reply: 'רגע, ומה קרה אחר כך?', canDraft: false })

    const second = await answer(a, id, 'הארון עומד')
    expect(second.body.canDraft).toBe(false)
    expect((await a.post('/ai/editor/drafts').send({ sessionId: id })).status).toBe(400)

    const third = await answer(a, id, 'נשארו ברגים')
    expect(third.body.canDraft).toBe(true)
    expect(await usage(a.me.id)).toBe(3)
  })

  it('keeps the user message in the Interview when the model fails', async () => {
    const a = await signIn()
    const id = (await a.post('/ai/reporter/sessions')).body.id as string
    const failed = await answer(a, id, 'STUB:badjson')
    expect(failed.status).toBe(502)
    expect(await usage(a.me.id)).toBe(0)

    const stored = (await a.get('/ai/reporter/sessions')).body.find((s: { id: string }) => s.id === id)
    expect(stored.messages).toEqual([
      { role: 'reporter', text: 'מה קרה?' },
      { role: 'user', text: 'STUB:badjson' },
    ])
  })

  it('stops asking at the maximum and does not spend quota on that turn', async () => {
    const a = await signIn()
    const id = (await a.post('/ai/reporter/sessions')).body.id as string
    for (let i = 0; i < 7; i++) {
      const res = await answer(a, id, `תשובה ${i}`)
      expect(res.status).toBe(200)
      expect(res.body.reply).toBe('רגע, ומה קרה אחר כך?')
    }
    expect(await usage(a.me.id)).toBe(7)

    const last = await answer(a, id, 'עוד אחת')
    expect(last.status).toBe(200)
    expect(last.body).toEqual({ reply: null, canDraft: true })
    expect(await usage(a.me.id)).toBe(7)

    const listed = await a.get('/ai/reporter/sessions')
    expect(listed.body.some((s: { id: string }) => s.id === id)).toBe(true)
  })

  it('writes a draft and a revision, and rejects an unknown revision', async () => {
    const a = await signIn()
    const id = (await a.post('/ai/reporter/sessions')).body.id as string
    await answer(a, id, 'א')
    await answer(a, id, 'ב')
    await answer(a, id, 'ג')

    const draft = await a.post('/ai/editor/drafts').send({ sessionId: id })
    expect(draft.status).toBe(200)
    expect(draft.body.headline).toBe(FIRST)
    expect(draft.body.sessionId).toBe(id)
    expect(draft.body.newFacts).toEqual([{ k: 'עיר', v: 'תל אביב' }])

    const revised = await a.post(`/ai/editor/drafts/${draft.body.id}/revise`).send({ kind: 'headline' })
    expect(revised.status).toBe(200)
    expect(revised.body.headline).toBe('אחרי השיחה: כותרת מתוקנת לבדיקה')

    const bad = await a.post(`/ai/editor/drafts/${draft.body.id}/revise`).send({ kind: 'concise' })
    expect(bad.status).toBe(400)
    expect(bad.body.message).toBe('unknown revision')

    const stranger = await signIn()
    expect((await stranger.post(`/ai/editor/drafts/${draft.body.id}/revise`).send({ kind: 'headline' })).status).toBe(404)
  })
})
