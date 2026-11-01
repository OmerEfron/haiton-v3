import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { sendIntro, startIntro } from '../../api/ai/reporter'
import { addFacts } from '../../api/core/me'
import { useAction, useFacts } from '../../api/queries'
import type { ChatMessage, NewFact } from '../../api/types'
import { useBack } from '../../lib/useBack'
import { useUiActions } from '../../state/UiProvider'

const key = (f: NewFact) => f.k + '|' + f.v

function merge(prev: NewFact[], incoming: NewFact[], known: { k: string; v: string }[]) {
  const seen = new Set(prev.map(key))
  const next = [...prev]
  for (const f of incoming) {
    const id = key(f)
    if (seen.has(id) || known.some((x) => x.k === f.k && x.v === f.v)) continue
    seen.add(id)
    next.push(f)
  }
  return next
}

export function useIntroModel() {
  const back = useBack()
  const ui = useUiActions()
  const known = useFacts().data ?? []
  const save = useAction(addFacts)
  const knownRef = useRef(known)
  knownRef.current = known
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [candidates, setCandidates] = useState<NewFact[]>([])
  const [skip, setSkip] = useState<string[]>([])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [startError, setStartError] = useState(false)
  const scroller = useRef<HTMLDivElement>(null)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    startIntro()
      .then((s) => {
        setSessionId(s.id)
        setMessages(s.messages)
      })
      .catch(() => setStartError(true))
  }, [])

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight })
  }, [messages.length, typing, candidates.length])

  const canSend = !!input.trim() && !typing && !!sessionId
  const send = () => {
    const text = input.trim()
    if (!text || !sessionId || typing) return
    setInput('')
    setError(null)
    setMessages((p) => [...p, { role: 'user', text }])
    setTyping(true)
    sendIntro(sessionId, text)
      .then((turn) => {
        if (turn.reply) setMessages((p) => [...p, { role: 'reporter', text: turn.reply! }])
        setCandidates((prev) => merge(prev, turn.newFacts, knownRef.current))
      })
      .catch(() => setError('הכתב לא זמין כרגע. נסו שוב.'))
      .finally(() => setTyping(false))
  }
  const onInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') send()
  }

  const visible = candidates.filter((f) => !known.some((x) => x.k === f.k && x.v === f.v))
  const picked = visible.filter((f) => !skip.includes(key(f)))

  const toggle = useCallback((f: NewFact) => {
    const id = key(f)
    setSkip((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
  }, [])

  const onSave = () => {
    if (!picked.length || save.isPending) return
    const saving = picked
    save.mutate(saving, {
      onSuccess: () => {
        const saved = new Set(saving.map(key))
        setCandidates((prev) => prev.filter((f) => !saved.has(key(f))))
        setSkip((p) => p.filter((id) => !saved.has(id)))
        ui.showToast({ title: 'הפרטים נשמרו בכרטסת' })
      },
    })
  }

  return {
    back,
    messages,
    typing,
    error,
    startError,
    scroller,
    input,
    setInput,
    onInputKeyDown,
    canSend,
    send,
    candidates: visible,
    isSaved: (f: NewFact) => !skip.includes(key(f)),
    toggle,
    canSave: picked.length > 0 && !save.isPending,
    onSave,
    saveError: save.isError,
  }
}

export type IntroModel = ReturnType<typeof useIntroModel>
