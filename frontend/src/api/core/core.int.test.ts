import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { acceptInvite, getNotifications } from '../core/social'
import { getArticle, getFeed, publishArticle, setReaction } from '../core/articles'
import { signInWithGoogle } from '../core/me'

const cookies = new Map<string, string>()

function installJar(port: string) {
  const orig = globalThis.fetch
  globalThis.fetch = async (input, init) => {
    const raw = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
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
  const port = process.env.HAITON_API_PORT
  if (!port) throw new Error('HAITON_API_PORT missing — int-setup did not start the api')
  installJar(port)
})

afterEach(() => cookies.clear())

describe('frontend client against the real api', () => {
  it('maya publishes to tamar, tamar reacts, maya is notified', async () => {
    await signInWithGoogle('maya.cohen@gmail.com')
    const article = await publishArticle({
      draftId: 'ignored',
      content: {
        headline: 'הטחינה שוב על הרצפה',
        sub: 'סיבוב בדיקה',
        summary: 'סיכום',
        body: ['פסקה'],
        flash: 'מבזק',
        push: 'דחיפה',
      },
      prevId: 'mx',
      audience: { mode: 'people', personIds: ['tamar'] },
      saveFacts: [],
    })
    expect(article.headline).toContain('טחינה')
    cookies.clear()

    await signInWithGoogle('tamar.golan@gmail.com')
    const feed = await getFeed()
    expect(feed.some((a) => a.id === article.id)).toBe(true)
    await setReaction(article.id, 'אהבתי')
    cookies.clear()

    await signInWithGoogle('maya.cohen@gmail.com')
    const notes = await getNotifications()
    expect(notes.some((n) => n.kind === 'react' && n.articleId === article.id)).toBe(true)
  })

  it('ilana accepts tamir\'s invite and reads tm1', async () => {
    await signInWithGoogle('ilana.levi@gmail.com')
    const accepted = await acceptInvite('tamir')
    expect(accepted.articleId).toBe('tm1')
    const tm1 = await getArticle('tm1')
    expect(tm1.authorId).toBe('tamir')
    expect(tm1.body.length).toBeGreaterThan(0)
  })
})
