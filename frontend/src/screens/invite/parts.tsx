import { btn, Logo } from '../../components/ui'
import type { InviteModel } from './useInviteModel'

export function InviteBody({ status, inviter, inviterFirst, signedIn, email, acceptPending, onDecline, switchAccount, onAccept, goLogin }: InviteModel) {
  return (
    <>
      <Logo className="text-right text-[30px] tracking-[-1.5px]" />
      {status === 'invalid' ? (
        <div className="text-lg font-bold">הקישור להזמנה לא תקין או שפג תוקפו.</div>
      ) : status === 'ready' ? (
        <>
          <div className="text-[26px] leading-tight font-extrabold">{inviter} מזמין אתכם להצטרף ל-haiton</div>
          <div className="text-[15px] leading-normal text-ash">אחרי ההצטרפות תראו את הכתבות ש{inviterFirst} בוחר לשתף אתכם.</div>
          {signedIn ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <span dir="ltr" className="text-sm text-dim">{email}</span>
                <button onClick={switchAccount} className="text-[13.5px] font-semibold text-brand">לא אתם? החלפת חשבון</button>
              </div>
              <button disabled={acceptPending} onClick={onAccept} className="h-[52px] rounded-xl bg-brand text-[17px] font-bold text-white">
                קבלת ההזמנה
              </button>
            </>
          ) : (
            <button onClick={goLogin} className="h-[52px] rounded-xl border border-disabled bg-white text-base font-semibold text-charcoal">
              המשך עם Google
            </button>
          )}
          <button onClick={onDecline} className={btn.ghost}>לא תודה</button>
        </>
      ) : null}
    </>
  )
}
