import { useParams, useSearchParams } from 'react-router'
import { useMe, useUser, useUserArticles } from '../../api/queries'
import { useBack } from '../../lib/useBack'
import { useConfirmRemoveArticle } from '../../lib/useConfirmRemoveArticle'

export type UserTab = 'articles' | 'facts' | 'settings'

export function useUserModel() {
  const { id = '' } = useParams()
  const [params, setParams] = useSearchParams()
  const me = useMe().data
  const isMe = id === me?.id
  const user = useUser(id).data
  const articles = useUserArticles(id).data ?? []
  const back = useBack()
  const askRemoveArticle = useConfirmRemoveArticle()
  const tab = isMe ? (params.get('tab') ?? 'articles') : 'articles'
  const setTab = (next: UserTab) => setParams({ tab: next }, { replace: true })
  const name = isMe ? (me?.name ?? '') : (user?.name ?? '')

  return { id, me, isMe, user, articles, tab, setTab, back, askRemoveArticle, name }
}

export type UserModel = ReturnType<typeof useUserModel>
