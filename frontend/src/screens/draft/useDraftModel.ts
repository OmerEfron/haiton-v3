import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { useMe } from '../../api/queries'
import { useCompose } from '../../state/ComposeContext'

export function useDraftModel() {
  const c = useCompose()
  const nav = useNavigate()
  const me = useMe().data
  const [failed, setFailed] = useState(false)
  const { makeDraft, draftReady, userCount } = c

  useEffect(() => {
    if (draftReady || !userCount) return
    const ctl = new AbortController()
    makeDraft(ctl.signal).catch(() => {
      if (!ctl.signal.aborted) setFailed(true)
    })
    return () => ctl.abort()
  }, [draftReady, userCount, makeDraft])

  return {
    redirect: !userCount,
    failed,
    draftReady,
    draft: c.draft,
    meName: me?.name,
    revising: c.revising,
    toggleFact: c.toggleFact,
    isFactSaved: c.isFactSaved,
    revise: c.revise,
    goChat: () => nav('/compose'),
    goPublish: () => {
      if (!c.revising) nav('/compose/publish')
    },
  }
}

export type DraftModel = ReturnType<typeof useDraftModel>
