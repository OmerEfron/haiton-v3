import type { ReactNode } from 'react'
import { Logo } from './marks'

/** Paper-colored top bar with back arrow and centered logo (article / user pages). */
export function PaperBar({ onBack }: { onBack: () => void }) {
  return (
    <div className="sticky top-0 z-10 border-b border-ink bg-paper">
      <div className="mx-auto flex h-[54px] max-w-[1200px] items-center justify-between px-3.5">
        <button onClick={onBack} aria-label="חזרה" className="p-1 text-xl text-ink">→</button>
        <Logo className="text-[28px] leading-none" />
        <span className="w-7" />
      </div>
    </div>
  )
}

/** Plain white top bar used in the compose flow. */
export function TopBar({ onBack, title, end }: { onBack?: () => void; title: ReactNode; end?: ReactNode }) {
  return (
    <div className="flex h-[54px] flex-none items-center justify-between gap-3 border-b border-hairline px-4">
      {onBack ? <button onClick={onBack} aria-label="חזרה" className="p-1 text-xl">→</button> : <span />}
      <div className="text-base font-bold">{title}</div>
      {end ?? <span className="w-7" />}
    </div>
  )
}
