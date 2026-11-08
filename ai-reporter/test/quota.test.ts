import { describe, expect, it } from 'vitest'
import { pool } from '../src/db.ts'
import { DAILY } from '../src/quota.ts'
import { answer, signIn } from './helpers.ts'

describe('quota', () => {
  it('blocks article calls at the daily limit and leaves the intro alone', async () => {
    const a = await signIn()
    await pool.query(
      `insert into ai_usage (user_id, kind) select $1, 'reporter' from generate_series(1, $2)`,
      [a.me.id, DAILY],
    )

    const before = await a.get('/ai/quota')
    expect(before.body).toMatchObject({ used: DAILY, limit: DAILY })
    expect(typeof before.body.resetsAt).toBe('string')

    const id = (await a.post('/ai/reporter/sessions')).body.id as string
    const blocked = await answer(a, id, 'עוד סיפור')
    expect(blocked.status).toBe(429)
    expect(blocked.body.message).toBe('daily quota reached')

    const intro = await a.post('/ai/intro/sessions')
    expect(intro.status).toBe(200)
    const introMsg = await a.post(`/ai/intro/sessions/${intro.body.id}/messages`).send({ text: 'אני עובד בגן' })
    expect(introMsg.status).toBe(200)
    expect(introMsg.body.reply).toBe('רגע, ומה קרה אחר כך?')

    const after = await a.get('/ai/quota')
    expect(after.body).toMatchObject({ used: DAILY, limit: DAILY })
  })

  it('does not count a failed model call', async () => {
    const a = await signIn()
    const id = (await a.post('/ai/reporter/sessions')).body.id as string

    const bad = await answer(a, id, 'STUB:badjson')
    expect(bad.status).toBe(502)
    expect(bad.body.message).toBe('reporter unavailable')

    const down = await answer(a, id, 'STUB:500')
    expect(down.status).toBe(502)
    const limited = await answer(a, id, 'STUB:429')
    expect(limited.status).toBe(502)

    const quota = await a.get('/ai/quota')
    expect(quota.body.used).toBe(0)

    const ok = await answer(a, id, 'סיימתי להרכיב ארון')
    expect(ok.status).toBe(200)
    expect((await a.get('/ai/quota')).body.used).toBe(1)
  })
})
