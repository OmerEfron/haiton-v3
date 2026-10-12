import { useNavigate, useSearchParams } from 'react-router'
import { useFeed, useGroups, useMe, useNotifications } from '../../api/queries'
import type { ArticleSummary } from '../../api/types'
import { FRONT } from '../../lib/audience'
import { useNameOf } from '../../lib/useNameOf'
import { useCompose } from '../../state/ComposeContext'
import { useUiActions, useUiState } from '../../state/UiProvider'
import { useStartStory } from '../../state/useStartStory'

const FRONT_TAB = 'front'

export function useFeedModel() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const me = useMe().data
  const groups = useGroups().data ?? []
  const unread = (useNotifications().data ?? []).some((n) => n.unread)
  const nameOf = useNameOf()
  const group = groups.find((g) => g.id === params.get('tab'))
  const front = useFeed()
  const tabFeed = useFeed(group?.id)
  const list = (group ? tabFeed.data : front.data) ?? []
  const loading = group ? tabFeed.isPending : front.isPending
  const flashes = front.data ?? []
  const c = useCompose()
  const { setNotifs, openGroupEditor, openInvite } = useUiActions()
  const { invite } = useUiState()
  const startStory = useStartStory()

  const setTab = (id: string) => setParams(id === FRONT_TAB ? {} : { tab: id })
  const tabs = [{ id: FRONT_TAB, label: FRONT }, ...groups.map((g) => ({ id: g.id, label: g.name }))]
  const memberLine = group
    ? group.memberIds.map(nameOf).filter(Boolean).join(' · ') || 'אין חברים בקבוצה · ערכו או מחקו אותה'
    : null
  const draftReady = c.draftReady
  const lastUserText = c.messages.findLast((m) => m.role === 'user')?.text

  return {
    me,
    unread,
    group,
    memberLine,
    list,
    loading,
    ticker: (flashes.length > 1 ? flashes.slice(0, 6) : []) as ArticleSummary[],
    tabs,
    activeTab: group?.id ?? FRONT_TAB,
    setTab,
    userCount: c.userCount,
    draftReady,
    draftHeadline: c.draft?.headline,
    lastUserText,
    inviteOpen: !!invite,
    openNotifs: () => setNotifs(true),
    openProfile: () => {
      if (me) navigate(`/u/${me.id}`)
    },
    addGroup: () => openGroupEditor({ onSaved: (g) => setParams({ tab: g.id }) }),
    editGroup: () => {
      if (group) openGroupEditor({ groupId: group.id })
    },
    continueDraft: () => navigate(draftReady ? '/compose/draft' : '/compose'),
    startStory: () => startStory(),
    openInvite: () => openInvite(),
  }
}

export type FeedModel = ReturnType<typeof useFeedModel>
