import type { ReactNode } from 'react'

export function Logo({ className = '' }: { className?: string }) {
  return (
    <div dir="ltr" className={`font-display font-black text-hot tracking-tight ${className}`}>
      haiton
    </div>
  )
}

export function Avatar({ label, bg, photoUrl, size = 24 }: { label: string; bg: string; photoUrl?: string | null; size?: number }) {
  return (
    <span
      className="flex flex-none items-center justify-center rounded-full bg-cover bg-center font-bold text-white"
      style={{ width: size, height: size, fontSize: size * 0.45, background: photoUrl ? `center/cover url("${photoUrl}")` : bg }}
    >
      {photoUrl ? '' : (label || ' ')[0]}
    </span>
  )
}

export function Check({ checked, tone = 'dark' }: { checked: boolean; tone?: 'dark' | 'brand' }) {
  return checked ? (
    <span className={`flex size-[22px] flex-none items-center justify-center rounded-md text-[13px] text-white ${tone === 'brand' ? 'bg-brand' : 'bg-charcoal'}`}>✓</span>
  ) : (
    <span className="size-[22px] flex-none rounded-md border-2 border-sand" />
  )
}

export function Radio({ checked, tone = 'brand' }: { checked: boolean; tone?: 'dark' | 'brand' }) {
  const ring = checked ? (tone === 'brand' ? 'border-[6px] border-brand' : 'border-[6px] border-charcoal') : 'border-2 border-silver'
  return <span className={`size-5 flex-none rounded-full ${ring}`} />
}

export function CheckRow({ label, checked, onClick, tone }: { label: ReactNode; checked: boolean; onClick: () => void; tone?: 'dark' | 'brand' }) {
  return (
    <button
      onClick={onClick}
      role="checkbox"
      aria-checked={checked}
      className="flex w-full items-center justify-between border-b border-rowline bg-white px-3.5 py-3 text-right text-[15px] font-medium text-charcoal last:border-b-0"
    >
      <span>{label}</span>
      <Check checked={checked} tone={tone} />
    </button>
  )
}

export function Toggle({ on }: { on: boolean }) {
  return (
    <span className={`flex h-6 w-[42px] flex-none rounded-full p-[3px] ${on ? 'justify-end bg-ink' : 'justify-start bg-sand'}`}>
      <span className="size-[18px] rounded-full bg-white" />
    </span>
  )
}

export function DoneMark() {
  return <div className="flex size-11 items-center justify-center rounded-full bg-charcoal text-xl text-white">✓</div>
}

export function Img({ src, className = '' }: { src: string; className?: string }) {
  return <img src={src} alt="" loading="lazy" decoding="async" className={`block bg-beige object-cover ${className}`} />
}
