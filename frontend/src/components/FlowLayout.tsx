import type { ReactNode } from 'react'
import { TopBar } from './ui'

export function FlowLayout({ onBack, title, end, children, footer, width = 'max-w-[720px]' }: {
  onBack?: () => void
  title: ReactNode
  end?: ReactNode
  children: ReactNode
  footer?: ReactNode
  width?: string
}) {
  return (
    <div className="flex h-dvh flex-col">
      <TopBar onBack={onBack} title={title} end={end} />
      <div className="min-h-0 flex-1 overflow-y-auto px-[18px] pt-[22px] pb-6">
        <div className={`mx-auto ${width}`}>{children}</div>
      </div>
      {footer && (
        <div className="flex-none border-t border-hairline px-[18px] pt-3 pb-[22px]">
          <div className={`mx-auto flex flex-col gap-3 ${width}`}>{footer}</div>
        </div>
      )}
    </div>
  )
}
