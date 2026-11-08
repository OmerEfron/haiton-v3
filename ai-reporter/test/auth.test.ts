import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app.ts'
import { signIn } from './helpers.ts'

const anon = () => request(createApp())

const protectedRoutes = [
  ['get', '/ai/quota'],
  ['get', '/ai/reporter/sessions'],
  ['post', '/ai/reporter/sessions'],
  ['post', '/ai/reporter/sessions/x/messages'],
  ['post', '/ai/editor/drafts'],
  ['post', '/ai/editor/drafts/x/revise'],
  ['post', '/ai/intro/sessions'],
  ['post', '/ai/intro/sessions/x/messages'],
] as const

describe('ai auth', () => {
  it('rejects every protected route without a cookie', async () => {
    for (const [method, path] of protectedRoutes) {
      const res = await anon()[method](path).send({ text: 'שלום', sessionId: 'x', kind: 'headline' })
      expect(res.status, `${method} ${path}`).toBe(401)
    }
  })

  it('hides another user\'s session, draft, and intro', async () => {
    const a = await signIn()
    const b = await signIn()
    const session = await a.post('/ai/reporter/sessions')
    expect(session.status).toBe(200)
    const id = session.body.id as string

    expect((await a.post(`/ai/reporter/sessions/${id}/messages`).send({ text: 'שלום' })).status).toBe(200)
    expect((await b.post(`/ai/reporter/sessions/${id}/messages`).send({ text: 'שלום' })).status).toBe(404)
    expect((await b.post('/ai/editor/drafts').send({ sessionId: id })).status).toBe(404)
    const hidden = await b.get('/ai/reporter/sessions')
    expect(hidden.body.some((s: { id: string }) => s.id === id)).toBe(false)
    expect((await a.get('/ai/reporter/sessions')).body.some((s: { id: string }) => s.id === id)).toBe(true)

    const intro = await a.post('/ai/intro/sessions')
    expect(intro.status).toBe(200)
    expect((await b.post(`/ai/intro/sessions/${intro.body.id}/messages`).send({ text: 'שלום' })).status).toBe(404)
  })
})
