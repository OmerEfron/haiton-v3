import { useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { publishArticle } from '../../api/core/articles'
import { useAction, useConnections, useGroups, useMe } from '../../api/queries'
import type { Article, AudienceMode, Group } from '../../api/types'
import { audienceModes, canPublish, pickedGroup, publishLabel, selectedIds } from '../../lib/audience'
import { useCompose } from '../../state/ComposeContext'
import { useUiActions } from '../../state/UiProvider'

export function usePublishModel() {
  const c = useCompose()
  const ui = useUiActions()
  const nav = useNavigate()
  const me = useMe().data
  const people = useConnections().data ?? []
  const groups = useGroups().data ?? []
  const publish = useAction(publishArticle)
  const [published, setPublished] = useState<Article | null>(null)
  const wasOnboarding = useRef(false)
  const left = useRef(false)

  const np = people.length
  const a = { ...c.audience, mode: np ? c.audience.mode : ('me' as AudienceMode) }
  const sel = selectedIds(a, people)
  const group = pickedGroup(a, groups)
  const ok = canPublish(a, people, groups) && !publish.isPending

  const chooseMode = (mode: AudienceMode) =>
    c.setAudience(mode === 'group' ? { mode, groupId: (groups.find((g) => g.memberIds.length) ?? groups[0])?.id ?? null } : { mode })
  const toggle = (id: string) => c.setAudience({ selected: sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id] })

  const finish = (art: Article, tab?: Group) => {
    if (left.current) return
    left.current = true
    const n = art.audienceIds?.length ?? 0
    const push = c.draft?.push
    c.reset()
    nav(tab ? `/feed?tab=${tab.id}` : '/feed', { replace: true })
    if (wasOnboarding.current) ui.openInvite(true)
    else ui.showToast({ title: n ? `הכתבה פורסמה ל-${n} אנשים` : 'הכתבה נשמרה אצלכם', sub: n && push ? `פוש נשלח: ${push}` : undefined })
  }

  const onPublish = () => {
    if (!ok || !c.draft) return
    const d = c.draft
    wasOnboarding.current = !!me?.onboarding
    publish.mutate(
      {
        draftId: d.id,
        content: { headline: d.headline, sub: d.sub, summary: d.summary, body: d.body, flash: d.flash, push: d.push },
        prevId: d.basis.prevArticle?.id ?? null,
        audience: { mode: a.mode, personIds: a.mode === 'people' ? sel : undefined, groupId: a.mode === 'group' ? group?.id : undefined },
        saveFacts: d.newFacts.filter(c.isFactSaved),
      },
      { onSuccess: (art) => (a.mode === 'people' ? setPublished(art) : finish(art)) },
    )
  }

  return {
    blocked: !left.current && (!c.draft || !c.draftReady),
    published,
    sheetPeople: people.filter((p) => sel.includes(p.id)),
    onSheetDone: (tab?: Group) => {
      if (published) finish(published, tab)
    },
    goDraft: () => nav('/compose/draft'),
    modes: audienceModes(np, groups.length),
    mode: a.mode,
    chooseMode,
    np,
    openInvite: () => ui.openInvite(),
    groups,
    people,
    sel,
    addGroupMembers: (memberIds: string[]) => c.setAudience({ selected: [...new Set([...sel, ...memberIds])] }),
    toggle,
    groupId: group?.id,
    pickGroup: (id: string) => c.setAudience({ groupId: id }),
    editGroup: (id: string) => ui.openGroupEditor({ groupId: id, onSaved: (saved) => c.setAudience({ mode: 'group', groupId: saved.id }) }),
    createGroup: () => ui.openGroupEditor({ onSaved: (g) => c.setAudience({ mode: 'group', groupId: g.id }) }),
    publishError: publish.isError,
    pending: publish.isPending,
    ok,
    onPublish,
    label: publishLabel(a, people, groups),
  }
}

export type PublishModel = ReturnType<typeof usePublishModel>
