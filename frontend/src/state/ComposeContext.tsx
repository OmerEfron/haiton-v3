import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { createDraft, reviseDraft } from '../api/ai/editor'
import { sendMessage, startSession } from '../api/ai/reporter'
import type { ChatMessage, Draft, Id, NewFact, RevisionKind } from '../api/types'
import type { AudienceState } from '../lib/audience'

interface Stored {
  sessionId: Id | null
  messages: ChatMessage[]
  draft: Draft | null
  /** number of user messages the draft was written from */
  draftAt: number
  /** new facts the user unticked (key = k|v); everything else is saved on publish */
  skipFacts: string[]
  audience: AudienceState
}

const KEY = 'haiton-compose'
const factKey = (f: NewFact) => f.k + '|' + f.v
const fresh = (audience?: Partial<AudienceState>): Stored => ({
  sessionId: null,
  messages: [],
  draft: null,
  draftAt: 0,
  skipFacts: [],
  // 'people' is the default when connections exist; Publish falls back to 'me' when there are none.
  audience: { mode: 'people', selected: [], groupId: null, ...audience },
})

function load(): Stored {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* ignore */
  }
  return fresh()
}

function useComposeState() {
  const [s, setS] = useState<Stored>(load)
  const [typing, setTyping] = useState(false)
  const [revising, setRevising] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => sessionStorage.setItem(KEY, JSON.stringify(s)), [s])

  const userCount = s.messages.filter((m) => m.role === 'user').length
  const draftReady = !!s.draft && s.draftAt === userCount

  const ensureSession = useCallback(async () => {
    if (s.sessionId) return
    const session = await startSession()
    setS((p) => (p.sessionId ? p : { ...p, sessionId: session.id, messages: session.messages }))
  }, [s.sessionId])

  const send = useCallback(
    async (text: string) => {
      if (!s.sessionId || typing) return
      setError(null)
      setS((p) => ({ ...p, messages: [...p.messages, { role: 'user', text }] }))
      setTyping(true)
      try {
        const turn = await sendMessage(s.sessionId, text)
        if (turn.reply) setS((p) => ({ ...p, messages: [...p.messages, { role: 'reporter', text: turn.reply! }] }))
      } catch {
        setError('הכתב לא זמין כרגע. נסו שוב.')
      } finally {
        setTyping(false)
      }
    },
    [s.sessionId, typing],
  )

  const makeDraft = useCallback(
    async (signal: AbortSignal) => {
      if (!s.sessionId) throw new Error('no session')
      const draft = await createDraft(s.sessionId, signal)
      setS((p) => ({ ...p, draft, draftAt: p.messages.filter((m) => m.role === 'user').length, skipFacts: [] }))
    },
    [s.sessionId],
  )

  const revise = useCallback(
    async (kind: RevisionKind, label: string) => {
      if (!s.draft || revising) return
      setRevising(label)
      try {
        const draft = await reviseDraft(s.draft.id, kind)
        setS((p) => ({ ...p, draft }))
      } finally {
        setRevising(null)
      }
    },
    [s.draft, revising],
  )

  const reset = useCallback((audience?: Partial<AudienceState>) => {
    setTyping(false)
    setS(fresh(audience))
  }, [])

  const setAudience = useCallback(
    (patch: Partial<AudienceState>) => setS((p) => ({ ...p, audience: { ...p.audience, ...patch } })),
    [],
  )

  const toggleFact = useCallback(
    (f: NewFact) =>
      setS((p) => {
        const k = factKey(f)
        return { ...p, skipFacts: p.skipFacts.includes(k) ? p.skipFacts.filter((x) => x !== k) : [...p.skipFacts, k] }
      }),
    [],
  )

  return {
    ...s,
    typing,
    revising,
    error,
    userCount,
    draftReady,
    ensureSession,
    send,
    makeDraft,
    revise,
    reset,
    setAudience,
    toggleFact,
    isFactSaved: (f: NewFact) => !s.skipFacts.includes(factKey(f)),
  }
}

type Compose = ReturnType<typeof useComposeState>
const Ctx = createContext<Compose | null>(null)

export function ComposeProvider({ children }: { children: ReactNode }) {
  return <Ctx.Provider value={useComposeState()}>{children}</Ctx.Provider>
}

export function useCompose() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useCompose outside ComposeProvider')
  return c
}
