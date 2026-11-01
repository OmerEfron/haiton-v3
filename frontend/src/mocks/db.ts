import type { Connection, Fact, Group, Id, Me, NewFact, Notification, NotificationPrefs } from '../api/types'
import { seedDb } from './seed/seed'

export interface DbArticle {
  id: Id
  authorId: Id
  author: string
  createdAt: string
  imageUrl: string | null
  headline: string
  sub: string
  flash: string
  push?: string
  body: string[]
  prevId: Id | null
  /** my articles only: who it was sent to (empty = only me) */
  audienceIds: Id[] | null
  draftId?: Id
}

/** Canned AI behaviour for an account (the prototype's scripted conversation). */
export interface Script {
  replies: string[]
  versions?: { headline: string; sub: string }[]
  alts?: string[]
  body?: string[]
  summary?: string
  flash?: string
  push?: string
  usedFacts?: string[]
  newFacts?: NewFact[]
}

export interface World {
  me: Me
  prefs: NotificationPrefs
  facts: Fact[]
  connections: Connection[]
  /** ids of removed connections; their articles leave the feed */
  removed: Id[]
  groups: Group[]
  articles: DbArticle[]
  hidden: Id[]
  reactions: Record<Id, string>
  reported: Id[]
  received: Record<Id, { personId: Id; label: string }[]>
  notifications: Notification[]
  script: Script
  joinScheduled?: boolean
}

export interface DbInvite {
  inviterId: Id
  inviterName: string
  article?: DbArticle
}

export interface DbSession {
  userId: Id
  createdAt?: string
  messages: { role: 'reporter' | 'user'; text: string }[]
}

export interface DbDraft {
  userId: Id
  sessionId: Id
  rev: number
  hl: number
}

export interface Db {
  session: Id | null
  accounts: Record<string, Id>
  worlds: Record<Id, World>
  invites: Record<string, DbInvite>
  sessions: Record<Id, DbSession>
  drafts: Record<Id, DbDraft>
}

const KEY = 'haiton-mock-db-v1'

function load(): Db {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* corrupted or unavailable storage: reseed */
  }
  return seedDb()
}

export const db: Db = load()

export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(db))
  } catch {
    /* quota exceeded (large photo): keep running in memory */
  }
}

export function resetDb() {
  localStorage.removeItem(KEY)
  Object.assign(db, seedDb())
}

export const uid = (prefix: string) => prefix + '_' + Math.random().toString(36).slice(2, 9)
export const nowIso = () => new Date().toISOString()

export function emptyWorld(me: Me): World {
  return {
    me,
    prefs: { articles: true, joins: true, reactions: true },
    facts: [],
    connections: [],
    removed: [],
    groups: [],
    articles: [],
    hidden: [],
    reactions: {},
    reported: [],
    received: {},
    notifications: [],
    script: { replies: ['איזה יופי. ספרו עוד, איך זה התחיל?', 'ואיך הרגשתם כשזה קרה?'] },
  }
}
