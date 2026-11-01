export type Id = string

export type Gender = 'male' | 'female' | 'other'

export interface Me {
  id: Id
  name: string
  email: string
  photoUrl: string | null
  /** true until the first article is published; drives tips and the step-4 invite sheet */
  onboarding: boolean
  gender: Gender | null
  birthYear: number | null
}

export interface NotificationPrefs {
  articles: boolean
  joins: boolean
  reactions: boolean
}

export interface Fact {
  id: Id
  k: string
  v: string
  src: string
  isNew?: boolean
}

export interface NewFact {
  k: string
  v: string
}

export interface Connection {
  id: Id
  name: string
  muted: boolean
}

export interface UserProfile {
  id: Id
  name: string
  isConnection: boolean
  muted: boolean
}

export interface Group {
  id: Id
  name: string
  memberIds: Id[]
}

export interface ArticleSummary {
  id: Id
  authorId: Id
  author: string
  createdAt: string
  imageUrl: string | null
  headline: string
  sub: string
  flash: string
  hasPrev: boolean
}

export interface Reaction {
  personId: Id
  name: string
  label: string
}

export interface Article extends ArticleSummary {
  body: string[]
  /** previous stories of the same author, newest first */
  history: ArticleSummary[]
  /** only for my own articles: ids it was sent to; empty = saved for me only */
  audienceIds: Id[] | null
  received: Reaction[]
  myReaction: string | null
  reported: boolean
}

export type AudienceMode = 'circle' | 'me' | 'people' | 'group'

export interface Audience {
  mode: AudienceMode
  personIds?: Id[]
  groupId?: Id
}

export interface PublishRequest {
  draftId: Id
  content: DraftContent
  prevId: Id | null
  audience: Audience
  saveFacts: NewFact[]
}

export interface Notification {
  id: Id
  kind: 'join' | 'react'
  text: string
  sub: string
  createdAt: string
  unread: boolean
  personId?: Id
  articleId?: Id
}

export interface InviteLink {
  code: string
  link: string
}

export interface InviteInfo {
  code: string
  inviterName: string
}

export interface AcceptInviteResult {
  articleId: Id | null
}

/* ---------- AI API ---------- */

export interface ChatMessage {
  role: 'reporter' | 'user'
  text: string
}

export interface ReporterSession {
  id: Id
  messages: ChatMessage[]
}

export interface PastSession {
  id: Id
  createdAt: string
  messages: ChatMessage[]
  draft: DraftContent | null
  articleId: Id | null
}

export interface ReporterTurn {
  reply: string | null
  canDraft: boolean
}

export interface DraftContent {
  headline: string
  sub: string
  summary: string
  body: string[]
  flash: string
  push: string
}

export interface Draft extends DraftContent {
  id: Id
  sessionId: Id
  basis: { prevArticle: ArticleSummary | null; facts: Fact[] }
  newFacts: NewFact[]
}

export type RevisionKind = 'funnier' | 'dramatic' | 'restrained' | 'headline' | 'alternate'
