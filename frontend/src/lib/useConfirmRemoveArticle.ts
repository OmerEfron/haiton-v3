import { deleteArticle } from '../api/core/articles'
import { useAction } from '../api/queries'
import { useUiActions } from '../state/UiProvider'

export function useConfirmRemoveArticle(): (articleId: string, onRemoved?: () => void) => void {
  const { showConfirm, closeConfirm } = useUiActions()
  const remove = useAction(deleteArticle)
  return (articleId, onRemoved) =>
    showConfirm({
      title: 'להסיר את הכתבה?',
      text: 'הכתבה תוסר מהעמוד שלכם ומהפיד של כל מי שקיבל אותה. אי אפשר לבטל את הפעולה.',
      yesLabel: 'הסרת הכתבה',
      noLabel: 'ביטול',
      onYes: () => remove.mutate(articleId, { onSuccess: () => { closeConfirm(); onRemoved?.() } }),
    })
}
