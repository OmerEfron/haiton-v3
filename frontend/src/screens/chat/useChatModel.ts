import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router'
import { useFacts, useMe, useQuota } from '../../api/queries'
import { useCompose } from '../../state/ComposeContext'
import { useStartStory } from '../../state/useStartStory'

export function useChatModel() {
  const c = useCompose()
  const nav = useNavigate()
  const startStory = useStartStory()
  const me = useMe().data
  const facts = useFacts().data ?? []
  const quota = useQuota().data
  const quotaLeft = quota ? Math.max(0, quota.limit - quota.used) : null
  const [input, setInput] = useState('')
  const [startError, setStartError] = useState(false)
  const scroller = useRef<HTMLDivElement>(null)

  const { ensureSession } = c
  useEffect(() => {
    ensureSession().catch(() => setStartError(true))
  }, [ensureSession])

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight })
  }, [c.messages.length, c.typing])

  const canSend = !!input.trim() && !c.typing && !!c.sessionId && quotaLeft !== 0
  const send = () => {
    if (!canSend) return
    c.send(input.trim())
    setInput('')
  }
  const onInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') send()
  }

  return {
    messages: c.messages,
    typing: c.typing,
    error: c.error,
    startError,
    draftReady: c.draftReady,
    canDraft: c.canDraft,
    factsCount: facts.length,
    input,
    setInput,
    onInputKeyDown,
    canSend,
    quotaLeft,
    quotaLabel: quota ? `נותרו ${quotaLeft} מתוך ${quota.limit} פעולות היום` : null,
    send,
    scroller,
    openHistory: () => nav('/compose/history'),
    openFacts: () => {
      if (me) nav(`/u/${me.id}?tab=facts`)
    },
    startNew: () => startStory(),
    goDraft: () => nav('/compose/draft'),
  }
}

export type ChatModel = ReturnType<typeof useChatModel>
