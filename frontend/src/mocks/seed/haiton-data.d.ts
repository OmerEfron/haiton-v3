export interface SeedArticle {
  id: string
  authorId: string
  author: string
  time: string
  clock: string
  img?: string
  noPhoto?: boolean
  headline: string
  sub: string
  flash: string
  body: string[]
  prev?: string
}

export interface SeedPersona {
  label: string
  meId: string
  meName: string
  email?: string
  onboard?: boolean
  facts: { k: string; v: string; src: string }[]
  usedFacts?: string[]
  basisPrev?: string
  newFacts?: { k: string; v: string }[]
  people: { id: string; name: string }[]
  groups: { name: string; members: string[] }[]
  replies: string[]
  versions?: { headline: string; sub: string }[]
  alts?: string[]
  body?: string[]
  summary?: string
  flash?: string
  push?: string
  inviter?: string
  inviteArticle?: string
  feed: SeedArticle[]
}

export const DATA: Record<'maya' | 'tamar' | 'mom' | 'omri' | 'shlomo', SeedPersona>
