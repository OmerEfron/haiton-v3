import { Logo } from '../../components/ui'
import type { ByeModel } from './useByeModel'

export function ByeBody({ copy, go }: ByeModel) {
  return (
    <>
      <Logo className="text-right text-[44px] leading-none tracking-[-1.5px]" />
      <div className="text-[26px] leading-tight font-extrabold text-ink">{copy.title}</div>
      <div className="text-[15px] leading-relaxed text-body">{copy.text}</div>
      <button onClick={go} className="h-[52px] rounded-xl bg-ink text-base font-bold text-white">{copy.cta}</button>
    </>
  )
}
