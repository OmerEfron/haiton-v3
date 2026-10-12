import { useEffect, useState } from 'react'
import { useLocation } from 'react-router'
import { createInvite } from '../../api/core/social'
import { useAction } from '../../api/queries'
import type { InviteLink } from '../../api/types'
import { useUiActions } from '../../state/UiProvider'
import { btn, DoneMark, Muted, Sheet, SheetTitle } from '../ui'

const MESSAGE = 'הצטרפו אליי ל-haiton, החדשות של האנשים שלנו: '

export function InviteSheet({ onboard }: { onboard: boolean }) {
  const { closeInvite } = useUiActions()
  const { pathname } = useLocation()
  const [link, setLink] = useState<InviteLink | null>(null)
  const [copied, setCopied] = useState(false)
  const [sent, setSent] = useState(false)
  const invite = useAction(createInvite)

  const { mutate } = invite
  useEffect(() => mutate('link', { onSuccess: setLink }), [mutate])

  const copy = async () => {
    if (!link) return
    await navigator.clipboard?.writeText(link.link).catch(() => undefined)
    setCopied(true)
  }

  const share = (channel: 'whatsapp' | 'email') => {
    if (!link) return
    const text = encodeURIComponent(MESSAGE + link.link)
    window.open(channel === 'whatsapp' ? `https://wa.me/?text=${text}` : `mailto:?subject=haiton&body=${text}`, '_blank', 'noopener')
    invite.mutate(channel)
    setSent(true)
  }

  if (sent)
    return (
      <Sheet onClose={closeInvite}>
        <DoneMark />
        <SheetTitle>ההזמנה נשלחה</SheetTitle>
        <Muted>
          כשמישהו יצטרף, נודיע לכם בהתראות. מאותו רגע אפשר יהיה לשלוח לו כתבות, והכתבות שלו יופיעו אצלכם בעמוד הראשי.
        </Muted>
        <button onClick={closeInvite} className={btn.dark}>{pathname === '/feed' ? 'לעמוד הראשי' : 'סגירה'}</button>
      </Sheet>
    )

  return (
    <Sheet onClose={closeInvite}>
      {onboard ? (
        <>
          <div className="text-xs font-bold text-brand">שלב 4 מתוך 4</div>
          <SheetTitle>העמוד הראשי שלכם מחכה לאנשים שלכם</SheetTitle>
          <Muted>
            הכתבה הראשונה נשמרה אצלכם. כדי שיהיה למי לשלוח אותה, ומה לקרוא בעמוד הראשי, הזמינו חברים ומשפחה. רק מי שתזמינו יוכל לקבל מכם כתבות.
          </Muted>
        </>
      ) : (
        <>
          <SheetTitle>הזמנת חברים</SheetTitle>
          <Muted>
            שלחו את הקישור לחברים ולמשפחה. מי שיצטרף יוכל לקבל מכם כתבות, והכתבות שלו יופיעו אצלכם בעמוד הראשי.
          </Muted>
        </>
      )}
      <div className="flex h-12 items-center gap-2 rounded-xl border border-disabled ps-3.5 pe-1.5">
        <span dir="ltr" className="min-w-0 flex-1 truncate text-left text-[15px] font-medium">
          {link ? link.link.replace(/^https?:\/\//, '') : '…'}
        </span>
        <button onClick={copy} disabled={!link} className="h-9 flex-none rounded-[9px] bg-chip px-3.5 text-sm font-semibold">
          {copied ? 'הועתק ✓' : 'העתקה'}
        </button>
      </div>
      <div className="flex gap-2.5">
        <button onClick={() => share('whatsapp')} disabled={!link} className={`flex-1 ${btn.dark}`}>שליחה בוואטסאפ</button>
        <button onClick={() => share('email')} disabled={!link} className={`flex-1 ${btn.outline}`}>שליחה במייל</button>
      </div>
      <button onClick={closeInvite} className="h-10 text-[14.5px] font-medium text-dim">
        {onboard ? 'אחר כך' : 'סגירה'}
      </button>
    </Sheet>
  )
}
