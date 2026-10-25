import { http } from 'msw'
import { API_URL } from '../../config'
import { db, emptyWorld, uid } from '../db'
import { byNewest, fail, route, summary } from './util'

const u = (p: string) => API_URL + p

const readAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = reject
    r.readAsDataURL(file)
  })

export const accountHandlers = [
  http.get(u('/me'), route(({ w }) => w.me)),

  http.post(
    u('/auth/google'),
    route(
      ({ body }) => {
        const email = String(body?.email ?? '').trim().toLowerCase()
        if (!/\S+@\S+\.\S+/.test(email)) return fail(400, 'invalid email')
        let id = db.accounts[email]
        if (!id || !db.worlds[id]) {
          id = uid('u')
          const local = email.split('@')[0].replace(/[._-]+/g, ' ')
          db.accounts[email] = id
          db.worlds[id] = emptyWorld({
            id,
            name: local,
            email,
            photoUrl: null,
            onboarding: true,
            gender: null,
            birthYear: null,
          })
        }
        db.session = id
        return db.worlds[id].me
      },
      { auth: false },
    ),
  ),

  http.post(u('/auth/logout'), route(() => { db.session = null }, { auth: false })),

  http.delete(
    u('/me'),
    route(({ w }) => {
      delete db.worlds[w.me.id]
      delete db.accounts[w.me.email]
      db.session = null
    }),
  ),

  http.patch(
    u('/me'),
    route(({ w, body }) => {
      const patch = body ?? {}
      if ('name' in patch) {
        const name = String(patch.name ?? '').trim()
        if (!name) return fail(400, 'name required')
        w.me.name = name
      }
      if ('gender' in patch) {
        if (patch.gender !== 'male' && patch.gender !== 'female' && patch.gender !== 'other') {
          return fail(400, 'invalid gender')
        }
        w.me.gender = patch.gender
      }
      if ('birthYear' in patch) {
        const now = new Date().getFullYear()
        const birthYear = patch.birthYear
        if (typeof birthYear !== 'number' || !Number.isInteger(birthYear) || birthYear < now - 120 || birthYear > now) {
          return fail(400, 'invalid birth year')
        }
        w.me.birthYear = birthYear
      }
      return w.me
    }),
  ),

  http.post(
    u('/me/photo'),
    route(async ({ w, body }) => {
      const file = (body as FormData | null)?.get('photo')
      if (!(file instanceof File)) return fail(400, 'photo required')
      w.me.photoUrl = await readAsDataUrl(file)
      return w.me
    }),
  ),

  http.delete(u('/me/photo'), route(({ w }) => { w.me.photoUrl = null; return w.me })),

  http.get(u('/me/notification-prefs'), route(({ w }) => w.prefs)),
  http.patch(u('/me/notification-prefs'), route(({ w, body }) => Object.assign(w.prefs, body))),

  http.get(u('/me/facts'), route(({ w }) => w.facts)),
  http.delete(u('/me/facts/:id'), route(({ w, params }) => { w.facts = w.facts.filter((f) => f.id !== params.id) })),

  http.get(u('/me/hidden'), route(({ w }) => w.articles.filter((a) => w.hidden.includes(a.id)).sort(byNewest).map((a) => summary(w, a)))),
]
