import { useNavigate } from 'react-router'
import { markNotificationsRead } from '../../api/core/social'
import { useAction, useConnections, useNotifications } from '../../api/queries'
import type { Notification } from '../../api/types'
import { relTime } from '../../lib/time'
import { useStartStory } from '../../state/useStartStory'
import { useUiActions } from '../../state/UiProvider'
import { Sheet, SheetTitle } from '../ui'

export function NotificationsSheet() {
  const { setNotifs } = useUiActions()
  const nav = useNavigate()
  const startStory = useStartStory()
  const list = useNotifications().data ?? []
  const people = useConnections().data ?? []
  const markRead = useAction(markNotificationsRead)

  const close = () => {
    setNotifs(false)
    if (list.some((n) => n.unread)) markRead.mutate()
  }

  const open = (n: Notification) => {
    close()
    if (n.kind === 'join' && n.personId) nav(`/u/${n.personId}`)
    else if (n.articleId) nav(`/article/${n.articleId}`)
  }

  return (
    <Sheet onClose={close} className="max-h-[80dvh] gap-1.5">
      <div className="flex items-center justify-between pb-1.5">
        <SheetTitle>התראות</SheetTitle>
        <button onClick={close} aria-label="סגירה" className="size-9 text-2xl leading-none text-dim">×</button>
      </div>
      {list.map((n) => (
        <div key={n.id} onClick={() => open(n)} className="flex cursor-pointer gap-3 border-t border-rowline py-[13px]">
          <span className={`mt-2 size-2 flex-none rounded-full ${n.unread ? 'bg-brand' : 'bg-disabled'}`} />
          <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
            <span className="text-[15px] leading-snug font-bold">{n.text}</span>
            <span className="text-[13.5px] leading-snug text-dim">{n.sub}</span>
            <span className="text-xs text-[#767676]">{relTime(n.createdAt)}</span>
            {n.kind === 'join' && people.some((p) => p.id === n.personId) && (
              <span className="flex pt-1.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    close()
                    startStory(n.personId)
                  }}
                  className="h-[34px] rounded-full bg-charcoal px-3.5 text-[13.5px] font-semibold text-white"
                >
                  שליחת כתבה אליה
                </button>
              </span>
            )}
          </span>
          <span className="flex-none self-center text-base text-faint">←</span>
        </div>
      ))}
      {!list.length && (
        <div className="pt-[18px] pb-2 text-[14.5px] leading-relaxed text-dim">
          אין התראות חדשות. כשמישהו יצטרף דרך ההזמנה שלכם או יגיב לכתבה שלכם, זה יופיע כאן.
        </div>
      )}
    </Sheet>
  )
}
