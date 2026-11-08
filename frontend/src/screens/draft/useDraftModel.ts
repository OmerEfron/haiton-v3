import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { QUOTA_MESSAGE } from '../../api/ai/reporter'
import { ApiError } from '../../api/http'
import { useMe } from '../../api/queries'
import type { RevisionKind } from '../../api/types'
import { useCompose } from '../../state/ComposeContext'

export function useDraftModel() {
  const c = useCompose()
  const nav = useNavigate()
  const me = useMe().data
  const [failed, setFailed] = useState<string | null>(null)
  const [reviseError, setReviseError] = useState<string | null>(null)
  const { makeDraft, draftReady, userCount } = c

  useEffect(() => {
    if (draftReady || !userCount) return
    const ctl = new AbortController()
    makeDraft(ctl.signal).catch((err: unknown) => {
      if (ctl.signal.aborted) return
      setFailed(err instanceof ApiError && err.status === 429 ? QUOTA_MESSAGE : 'העורך לא הצליח לכתוב את הכתבה')
    })
    return () => ctl.abort()
  }, [draftReady, userCount, makeDraft])

  const revise = (kind: RevisionKind, label: string) => {
    setReviseError(null)
    return c.revise(kind, label).catch((err: unknown) => {
      setReviseError(err instanceof ApiError && err.status === 429 ? QUOTA_MESSAGE : 'העורך לא זמין כרגע. נסו שוב.')
    })
  }

  return {
    redirect: !userCount,
    failed,
    draftReady,
    draft: c.draft,
    meName: me?.name,
    revising: c.revising,
    reviseError,
    toggleFact: c.toggleFact,
    isFactSaved: c.isFactSaved,
    revise,
    goChat: () => nav('/compose'),
    goPublish: () => {
      if (!c.revising) nav('/compose/publish')
    },
  }
}

export type DraftModel = ReturnType<typeof useDraftModel>
