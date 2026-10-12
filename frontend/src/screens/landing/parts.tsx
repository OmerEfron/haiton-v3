import { Logo } from '../../components/ui'
import type { LandingModel } from './useLandingModel'

export function LandingBody({ steps, login }: LandingModel) {
  return (
    <>
      <div className="flex items-center justify-between gap-2.5 border-b border-ink pb-3">
        <Logo className="text-[34px] leading-none tracking-[-1.5px]" />
        <button onClick={login} className="h-[34px] rounded-full border border-ink px-3.5 text-sm font-semibold text-ink">כניסה</button>
      </div>
      <div className="flex flex-col gap-4 pt-2">
        <div className="text-[12.5px] font-extrabold tracking-wide text-hot">החדשות של האנשים שלכם</div>
        <h1 className="font-display text-[44px] leading-[1.04] font-black tracking-tight text-ink">מה שקרה לכם היום ראוי לכותרת</h1>
        <p className="max-w-[620px] text-lg leading-relaxed text-body">
          מספרים לכתב מה קרה, העורך כותב מזה כתבה, ואתם מחליטים מי יקרא אותה. בעמוד הראשי מחכות הכתבות של החברים והמשפחה.
        </p>
        <div className="flex flex-wrap gap-2.5 pt-1.5">
          <button onClick={login} className="h-[52px] rounded-full bg-hot px-[26px] text-[17px] font-bold text-white">הצטרפות</button>
          <button onClick={login} className="h-[52px] px-[22px] text-[15.5px] font-semibold text-ink underline underline-offset-4">כבר יש לי חשבון</button>
        </div>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-px border-t-[3px] border-b border-t-ink border-b-sand bg-sand">
        {steps.map(([n, t, d]) => (
          <div key={n} className="flex flex-col gap-1.5 bg-paper px-1 pt-4 pb-5">
            <span className="font-display text-[34px] leading-none font-black text-hot">{n}</span>
            <span className="font-display text-[19px] leading-snug font-extrabold text-ink">{t}</span>
            <span className="text-[15px] leading-normal text-body">{d}</span>
          </div>
        ))}
      </div>
    </>
  )
}
