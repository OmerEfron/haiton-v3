import { useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { publishArticle } from '../../api/core/articles'
import { useAction, useMe } from '../../api/queries'
import type { Article, Group } from '../../api/types'
import { useAudiencePicker } from '../../lib/useAudiencePicker'
import { useCompose } from '../../state/ComposeContext'
import { useUiActions } from '../../state/UiProvider'

export function usePublishModel() {
  const c = useCompose()
  const ui = useUiActions()
  const nav = useNavigate()
  const me = useMe().data
  const picker = useAudiencePicker(c.audience, c.setAudience)
  const publish = useAction(publishArticle)
  const [published, setPublished] = useState<Article | null>(null)
  const wasOnboarding = useRef(false)
  const left = useRef(false)

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
    if (!picker.ok || publish.isPending || !c.draft) return
    const d = c.draft
    wasOnboarding.current = !!me?.onboarding
    publish.mutate(
      {
        draftId: d.id,
        content: { headline: d.headline, sub: d.sub, summary: d.summary, body: d.body, flash: d.flash, push: d.push },
        prevId: d.basis.prevArticle?.id ?? null,
        audience: {
          mode: picker.mode,
          personIds: picker.mode === 'people' ? picker.sel : undefined,
          groupId: picker.mode === 'group' ? picker.groupId : undefined,
        },
        saveFacts: d.newFacts.filter(c.isFactSaved),
      },
      { onSuccess: (art) => (picker.mode === 'people' ? setPublished(art) : finish(art)) },
    )
  }

  return {
    ...picker,
    ok: picker.ok && !publish.isPending,
    blocked: !left.current && (!c.draft || !c.draftReady),
    published,
    sheetPeople: picker.people.filter((p) => picker.sel.includes(p.id)),
    onSheetDone: (tab?: Group) => {
      if (published) finish(published, tab)
    },
    goDraft: () => nav('/compose/draft'),
    publishError: publish.isError,
    pending: publish.isPending,
    onPublish,
  }
}

export type PublishModel = ReturnType<typeof usePublishModel>
