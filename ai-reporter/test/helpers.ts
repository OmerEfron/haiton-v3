import request from 'supertest'
import { createApp as createApi } from '../../backend/src/app.ts'
import { createApp } from '../src/app.ts'

function cookieOf(res: { headers: Record<string, unknown> }) {
  const raw = res.headers['set-cookie']
  const list = Array.isArray(raw) ? raw : typeof raw === 'string' ? [raw] : []
  return list.map((c) => String(c).split(';')[0]).join('; ')
}

export function freshEmail() {
  return `u${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.local`
}

/** Signs in through the API so the cookie is the one the backend actually issues. */
export async function signIn(email = freshEmail()) {
  const api = request(createApi())
  const res = await api.post('/api/auth/google').send({ email })
  if (res.status !== 200) throw new Error(`sign-in failed: ${res.status} ${res.text}`)
  const cookie = cookieOf(res)
  const http = request(createApp())
  const send = (method: 'get' | 'post' | 'put' | 'patch' | 'delete', url: string) => http[method](url).set('Cookie', cookie)
  return {
    me: res.body as { id: string; name: string; email: string },
    get: (url: string) => send('get', url),
    post: (url: string) => send('post', url),
    put: (url: string) => send('put', url),
    patch: (url: string) => send('patch', url),
    delete: (url: string) => send('delete', url),
  }
}

export async function answer(user: Awaited<ReturnType<typeof signIn>>, id: string, text: string) {
  const res = await user.post(`/ai/reporter/sessions/${id}/messages`).send({ text })
  return res
}
