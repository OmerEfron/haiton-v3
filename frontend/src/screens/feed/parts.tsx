import { Link } from 'react-router'
import type { ArticleSummary } from '../../api/types'
import { PillTabs } from '../../components/PillTabs'
import { Avatar, btn, Logo } from '../../components/ui'
import { shortDate, todayLabel } from '../../lib/time'
import type { FeedModel } from './useFeedModel'

export function Ticker({ items }: { items: ArticleSummary[] }) {
  const loop = [...items, ...items]
  return (
    <div className="flex h-[30px] items-stretch overflow-hidden bg-ink">
      <div className="relative z-[1] flex flex-none items-center gap-1.5 bg-hot px-3 text-[12.5px] font-extrabold text-white">
        <span className="size-1.5 rounded-full bg-white" />
        מבזקים
      </div>
      <div dir="ltr" className="min-w-0 flex-1 overflow-hidden">
        <div className="flex h-[30px] w-max animate-ticker hover:[animation-play-state:paused]">
          {loop.map((a, i) => (
            <Link
              key={i}
              to={`/article/${a.id}`}
              dir="rtl"
              className="flex h-[30px] flex-none cursor-pointer items-center gap-2 border-l border-[#3a342c] px-5 whitespace-nowrap"
            >
              <span dir="ltr" className="text-[11.5px] font-bold text-[#ff7a6e]">{shortDate(a.createdAt)}</span>
              <span className="text-[13px] font-medium text-paper">{a.flash}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

export function FeedTop({ m }: { m: FeedModel }) {
  return (
    <>
      <header className="bg-paper">
        <div className="mx-auto max-w-[1200px] px-[18px] pt-2.5">
          <div className="flex items-center justify-between gap-2.5 text-[11.5px] font-medium text-muted">
            <span>{todayLabel()}</span>
            <span className="flex items-center gap-2">
              <button
                onClick={m.openNotifs}
                className="relative h-7 rounded-full border border-ink px-[11px] text-xs font-semibold text-ink"
              >
                התראות
                {m.unread && <span className="absolute -top-1 -left-1 size-3 rounded-full border-2 border-paper bg-hot" />}
              </button>
              <button onClick={m.openProfile} aria-label="העמוד שלי">
                <Avatar label={m.me?.name ?? ''} bg="#16130f" photoUrl={m.me?.photoUrl} size={30} />
              </button>
            </span>
          </div>
          <div className="flex flex-col items-center gap-1.5 border-b border-ink pb-2.5">
            <Logo className="text-[56px] leading-[.95] tracking-[-2px]" />
            <div className="text-[12.5px] font-semibold tracking-wide text-ink">החדשות של האנשים שלכם</div>
          </div>
          <div className="h-1 border-b border-ink" />
        </div>
        {m.ticker.length > 0 && <Ticker items={m.ticker} />}
        <nav className="mx-auto flex max-w-[1200px] gap-1.5 overflow-x-auto px-[18px] py-2.5">
          <PillTabs tabs={m.tabs} active={m.activeTab} onChange={m.setTab} />
          <button
            onClick={m.addGroup}
            className="h-8 flex-none rounded-full border border-dashed border-stone px-3.5 text-sm font-medium text-ink"
          >
            + קבוצה
          </button>
        </nav>
      </header>
      {m.memberLine && (
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-3 px-[18px] pt-4">
          <span className="min-w-0 text-[13.5px] font-medium text-muted">{m.memberLine}</span>
          <button
            onClick={m.editGroup}
            className="h-[30px] flex-none rounded-full border border-ink px-3 text-[13px] font-medium text-ink"
          >
            עריכת הקבוצה
          </button>
        </div>
      )}
    </>
  )
}

export function EmptyFeed({ onWrite, onInvite }: { onWrite: () => void; onInvite: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 px-7 py-14 text-center">
      <div className="max-w-[320px] text-[15px] leading-normal text-muted">
        עוד אין כאן כתבות שכללו אתכם. כתבו משהו בעצמכם, או הזמינו חברים כדי לקרוא את שלהם.
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <button onClick={onWrite} className={btn.pillDark}>ספרו לכתב</button>
        <button onClick={onInvite} className={btn.pillOutline}>הזמנת חברים</button>
      </div>
    </div>
  )
}

export function DraftChip({ m }: { m: FeedModel }) {
  if (m.userCount === 0 || m.inviteOpen) return null
  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-[86px] z-10 flex justify-end">
      <button
        onClick={m.continueDraft}
        className="pointer-events-auto flex w-full max-w-[360px] items-center justify-between gap-3 rounded-[14px] border border-ink bg-cream px-4 py-3 text-right shadow-[4px_4px_0_var(--color-ink)]"
      >
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="text-xs font-bold text-brand">{m.draftReady ? 'טיוטה שלא פורסמה' : 'סיפור בתהליך'}</span>
          <span className="truncate text-[15px] leading-snug font-bold text-ink">{m.draftReady ? m.draftHeadline : m.lastUserText}</span>
        </span>
        <span className="flex-none text-[13.5px] font-semibold text-ink">המשך ←</span>
      </button>
    </div>
  )
}

export function ComposeFab({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 left-5 z-10 h-[50px] rounded-full bg-charcoal px-[22px] text-base font-bold text-white shadow-[0_6px_20px_rgba(0,0,0,.25)]"
    >
      + מה קרה?
    </button>
  )
}
