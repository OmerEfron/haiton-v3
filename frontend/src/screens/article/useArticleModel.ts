import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { setReaction } from '../../api/core/articles'
import { useAction, useArticle, useMe } from '../../api/queries'
import { audienceText } from '../../lib/audience'
import { firstName } from '../../lib/color'
import { isFresh } from '../../lib/time'
import { useBack } from '../../lib/useBack'
import { useConfirmRemoveArticle } from '../../lib/useConfirmRemoveArticle'
import { useNameOf } from '../../lib/useNameOf'
import { useStartStory } from '../../state/useStartStory'

const REACTS = ['אהבתי', 'מצחיק', 'מרגש'] as const

export function useArticleModel() {
  const { id = '' } = useParams()
  const nav = useNavigate()
  const me = useMe().data
  const nameOf = useNameOf()
  const q = useArticle(id)
  const reaction = useAction((label: string | null) => setReaction(id, label))
  const confirmRemove = useConfirmRemoveArticle()
  const startStory = useStartStory()
  const [reporting, setReporting] = useState(false)
  const back = useBack()

  const article = q.data
  const mine = !!article && article.authorId === me?.id
  const reacted = reaction.isPending ? (reaction.variables ?? null) : (article?.myReaction ?? null)
  const authorFirst = firstName(article?.author ?? '')
  const kicker = !article
    ? ''
    : isFresh(article.createdAt)
      ? 'חדש · עכשיו'
      : 'מהמעגל של ' + firstName(me?.name ?? '')

  const askRemove = () => {
    if (!article) return
    confirmRemove(article.id, () => nav('/feed', { replace: true }))
  }

  return {
    isPending: q.isPending,
    article,
    mine,
    reacted,
    reacts: REACTS,
    react: (label: string) => reaction.mutate(reacted === label ? null : label),
    reporting,
    setReporting,
    back,
    askRemove,
    startStory,
    kicker,
    reactionLabel: reacted ? `שלחתם ל${authorFirst}: ${reacted}` : `התגובה תגיע רק ל${authorFirst}`,
    historyNote: `הכתבה נשענת רק על כתבות קודמות של ${authorFirst}.`,
    audienceLabel: article ? audienceText(article.audienceIds, nameOf) : '',
    photoUrl: mine ? (me?.photoUrl ?? null) : null,
  }
}

export type ArticleModel = ReturnType<typeof useArticleModel>
