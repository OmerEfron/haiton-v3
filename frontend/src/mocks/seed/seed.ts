import type { Db, DbArticle, World } from '../db'
import { DATA, type SeedArticle, type SeedPersona } from './haiton-data.js'

const HOURS: Record<string, number> = {
  'עכשיו': 0.05, 'לפני שעה': 1, 'לפני שעתיים': 2, 'לפני 3 שעות': 3, 'לפני 5 שעות': 5, 'אתמול': 24,
  'לפני יומיים': 48, 'לפני 3 ימים': 72, 'לפני 4 ימים': 96, 'לפני 5 ימים': 120, 'לפני שבוע': 168,
}

const EMAILS: Record<keyof typeof DATA, string> = {
  maya: 'maya.cohen@gmail.com',
  tamar: 'tamar.golan@gmail.com',
  omri: 'omri.dahan@gmail.com',
  mom: 'ilana.levi@gmail.com',
  shlomo: 'shlomo.ohayon@gmail.com',
}

const PROFILES: Record<keyof typeof DATA, { gender: 'male' | 'female'; birthYear: number }> = {
  maya: { gender: 'female', birthYear: 1994 },
  tamar: { gender: 'female', birthYear: 1991 },
  omri: { gender: 'male', birthYear: 1988 },
  mom: { gender: 'female', birthYear: 1962 },
  shlomo: { gender: 'male', birthYear: 1954 },
}

/** Striped placeholder like the prototype's, served as an image URL so the UI treats it as a real photo. */
export function placeholderImage(label: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><defs><pattern id="p" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="16" fill="#e6dfd1"/><rect x="8" width="8" height="16" fill="#ddd5c5"/></pattern></defs><rect width="800" height="600" fill="url(#p)"/><text x="400" y="310" font-family="monospace" font-size="28" fill="#6f665a" text-anchor="middle">${label}</text></svg>`
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
}

function toArticle(a: SeedArticle, now: number): DbArticle {
  return {
    id: a.id,
    authorId: a.authorId,
    author: a.author,
    createdAt: new Date(now - (HOURS[a.time] ?? 0) * 3_600_000).toISOString(),
    imageUrl: a.img ? placeholderImage(a.img) : null,
    headline: a.headline,
    sub: a.sub,
    flash: a.flash,
    body: a.body,
    prevId: a.prev ?? null,
    audienceIds: null,
  }
}

function toWorld(key: keyof typeof DATA, P: SeedPersona, now: number): World {
  const groupIds = P.groups.map((_, i) => `${P.meId}_g${i + 1}`)
  return {
    me: { id: P.meId, name: P.meName, email: EMAILS[key], photoUrl: null, onboarding: !!P.onboard, ...PROFILES[key] },
    prefs: { articles: true, joins: true, reactions: true },
    facts: P.facts.map((f, i) => ({ id: `${P.meId}_f${i + 1}`, ...f })),
    connections: P.people.map((p) => ({ ...p, muted: false })),
    removed: [],
    groups: P.groups.map((g, i) => ({ id: groupIds[i], name: g.name, memberIds: g.members })),
    articles: P.feed.filter((a) => a.id !== P.inviteArticle).map((a) => toArticle(a, now)),
    hidden: [],
    reactions: {},
    reported: [],
    received: {},
    notifications: [],
    script: {
      replies: P.replies,
      versions: P.versions,
      alts: P.alts,
      body: P.body,
      summary: P.summary,
      flash: P.flash,
      push: P.push,
      usedFacts: P.usedFacts,
      newFacts: P.newFacts,
    },
  }
}

export function seedDb(): Db {
  const now = Date.now()
  const db: Db = { session: null, accounts: {}, worlds: {}, invites: {}, sessions: {}, drafts: {} }
  for (const key of Object.keys(DATA) as (keyof typeof DATA)[]) {
    const P = DATA[key]
    db.worlds[P.meId] = toWorld(key, P, now)
    db.accounts[EMAILS[key]] = P.meId
    const inviteArticle = P.feed.find((a) => a.id === P.inviteArticle)
    if (P.inviter && inviteArticle) {
      db.invites[inviteArticle.authorId] = {
        inviterId: inviteArticle.authorId,
        inviterName: P.inviter,
        article: toArticle(inviteArticle, now),
      }
    }
  }
  return db
}

/** Accounts offered on the mock Google chooser. */
export const SEED_ACCOUNTS = (Object.keys(DATA) as (keyof typeof DATA)[]).map((k) => ({
  email: EMAILS[k],
  name: DATA[k].meName,
}))
