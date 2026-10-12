import type { ReactNode } from 'react'
import { useIsDesktop } from '../../device/useIsDesktop'

/** Bottom sheet on mobile; centered panel on desktop. */
export function Sheet({ children, onClose, className = '' }: { children: ReactNode; onClose?: () => void; className?: string }) {
  const desktop = useIsDesktop()
  return (
    <div
      className={desktop
        ? 'fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-6'
        : 'fixed inset-0 z-30 flex flex-col items-center justify-end bg-black/40'}
      onClick={onClose}
    >
      <div
        role="dialog"
        onClick={(e) => e.stopPropagation()}
        className={`flex max-h-[88dvh] w-full max-w-[560px] flex-col gap-3.5 overflow-y-auto bg-white px-[18px] pt-[22px] pb-[26px] ${desktop ? 'rounded-[22px]' : 'rounded-t-[22px]'} ${className}`}
      >
        {children}
      </div>
    </div>
  )
}

/** Centered modal dialog. */
export function Dialog({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-6">
      <div role="alertdialog" className="flex w-full max-w-[400px] flex-col gap-3.5 rounded-[18px] bg-white p-[22px]">
        {children}
      </div>
    </div>
  )
}

export function SheetTitle({ children }: { children: ReactNode }) {
  return <div className="text-[21px] leading-tight font-extrabold">{children}</div>
}

export function Muted({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`text-[14.5px] leading-normal text-ash ${className}`}>{children}</div>
}
