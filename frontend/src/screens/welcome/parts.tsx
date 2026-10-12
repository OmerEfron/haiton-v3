import { Logo } from '../../components/ui'
import type { WelcomeModel } from './useWelcomeModel'

export function WelcomeBody({ name, steps, start }: WelcomeModel) {
  return (
    <>
      <Logo className="text-right text-[30px] leading-none" />
      <div className="flex flex-col gap-2">
        <div className="text-[27px] leading-tight font-extrabold">ברוכים הבאים, {name}</div>
        <div className="text-[15.5px] leading-relaxed text-ash">נכתוב יחד את הכתבה הראשונה שלכם. זה לוקח כמה דקות, ונסביר כל שלב בדרך.</div>
      </div>
      <div className="flex flex-col border-t border-hairline">
        {steps.map(([n, t, d]) => (
          <div key={n} className="grid grid-cols-[30px_minmax(0,1fr)] gap-3 border-b border-hairline py-[13px]">
            <span className="flex size-[26px] items-center justify-center rounded-full bg-charcoal text-[13px] font-bold text-white">{n}</span>
            <span className="flex flex-col gap-0.5">
              <span className="text-[15.5px] font-bold">{t}</span>
              <span className="text-[13.5px] leading-snug text-dim">{d}</span>
            </span>
          </div>
        ))}
      </div>
      <button onClick={start} className="h-[52px] rounded-xl bg-brand text-[17px] font-bold text-white">לכתבה הראשונה שלי</button>
    </>
  )
}
