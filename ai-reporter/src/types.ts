export interface ChatMessage {
  role: 'reporter' | 'user'
  text: string
}

export interface Fact {
  id: string
  k: string
  v: string
  src: string
  isNew: boolean
}

export interface NewFact {
  k: string
  v: string
}

export interface ArticleSummary {
  id: string
  authorId: string
  author: string
  createdAt: string
  imageUrl: string | null
  headline: string
  sub: string
  flash: string
  hasPrev: boolean
}

/** Fields the editor model returns. usedFacts and newFacts are not part of the published story. */
export interface ModelDraft {
  headline: string
  sub: string
  summary: string
  body: string[]
  flash: string
  push: string
  usedFacts: string[]
  newFacts: NewFact[]
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
  id: string
  sessionId: string
  basis: { prevArticle: ArticleSummary | null; facts: Fact[] }
  newFacts: NewFact[]
}

/** One reporter model turn. The opener is stored as the first turn and was not generated. */
export interface ReporterJson {
  known: string
  angle: string
  target: string
  articleType: string
  reply: string | null
  canDraft: boolean
}

export interface SessionRow {
  id: string
  user_id: string
  messages: ChatMessage[]
  turns: ReporterJson[]
  article_type: string
  angle: string
}
