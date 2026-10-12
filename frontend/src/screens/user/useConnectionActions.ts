import { removeConnection, setMuted } from '../../api/core/people'
import { useAction } from '../../api/queries'
import { useUiActions } from '../../state/UiProvider'

export function useConnectionActions() {
  const { showConfirm, closeConfirm } = useUiActions()
  const remove = useAction(removeConnection)
  const mute = useAction(({ id, muted }: { id: string; muted: boolean }) => setMuted(id, muted))

  return {
    toggleMute: (id: string, muted: boolean) => mute.mutate({ id, muted: !muted }),
    askRemove: (id: string, name: string, onRemoved?: () => void) =>
      showConfirm({
        title: `להסיר את ${name} מהחיבורים?`,
        text: 'לא תקבלו יותר כתבות זה מזה, וההסרה תחול גם על הקבוצות שלכם. אפשר להזמין שוב בכל זמן.',
        yesLabel: 'הסרה',
        noLabel: 'ביטול',
        onYes: () =>
          remove.mutate(id, {
            onSuccess: () => {
              closeConfirm()
              onRemoved?.()
            },
          }),
      }),
  }
}
