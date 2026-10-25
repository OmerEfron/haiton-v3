import request from 'supertest'
import { createApp } from '../src/app.ts'

export function api() {
  return request(createApp())
}

export async function signIn(email: string) {
  const agent = request.agent(createApp())
  const res = await agent.post('/api/auth/google').send({ email })
  if (res.status !== 200) throw new Error(`sign-in failed: ${res.status} ${res.text}`)
  return { agent, me: res.body as { id: string; name: string; email: string; onboarding: boolean } }
}

export function freshEmail() {
  return `u${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.local`
}

export async function pair() {
  const a = await signIn(freshEmail())
  const b = await signIn(freshEmail())
  await a.agent.post('/api/invites').send({ channel: 'link' })
  const code = a.me.id
  await b.agent.post(`/api/invites/${code}/accept`)
  return { a, b }
}

export const story = {
  headline: 'כותרת בדיקה',
  sub: 'תת',
  summary: 'סיכום',
  body: ['פסקה אחת'],
  flash: 'מבזק',
  push: 'דחיפה',
}
