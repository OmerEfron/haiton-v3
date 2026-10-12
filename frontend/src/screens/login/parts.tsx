import type { LoginModel } from './useLoginModel'

export function LoginBody({ accounts, other, email, setEmail, busy, error, back, canSubmit, showOther, signIn, submitEmail }: LoginModel) {
  return (
    <>
      <div className="flex items-center justify-between">
        <button onClick={back} aria-label="חזרה" className="p-1 text-xl">→</button>
        <span className="text-[13px] font-bold text-dim">Google</span>
      </div>
      <div className="text-xl font-bold">בחירת חשבון</div>
      {accounts.map((a) => (
        <button
          key={a.email}
          disabled={busy}
          onClick={() => signIn(a.email)}
          className="flex items-center gap-3 rounded-xl border border-[#e3e3e3] bg-white p-3 text-right"
        >
          <span className="flex size-9 flex-none items-center justify-center rounded-full bg-[#e6e3de] text-[15px] font-bold">{a.name[0]}</span>
          <span className="flex flex-col gap-0.5">
            <span className="text-[15px] font-semibold text-charcoal">{a.name}</span>
            <span dir="ltr" className="text-right text-[13px] text-dim">{a.email}</span>
          </span>
        </button>
      ))}
      {other ? (
        <div className="flex flex-col gap-2.5">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submitEmail()}
            placeholder="name@gmail.com"
            aria-label="כתובת מייל"
            dir="ltr"
            className="h-[46px] rounded-[10px] border border-disabled px-3.5 text-left text-base font-medium"
          />
          <button
            disabled={!canSubmit}
            onClick={submitEmail}
            className="h-[46px] rounded-[10px] bg-charcoal text-[15px] font-bold text-white disabled:bg-silver"
          >
            המשך
          </button>
        </div>
      ) : (
        <button onClick={showOther} className="flex items-center gap-3 rounded-xl border border-[#e3e3e3] bg-white p-3 text-right">
          <span className="flex size-9 flex-none items-center justify-center rounded-full border-[1.5px] border-dashed border-silver text-xl text-dim">+</span>
          <span className="text-[15px] font-semibold text-charcoal">שימוש בחשבון אחר</span>
        </button>
      )}
      {error && <div className="text-[13px] text-brand">ההתחברות נכשלה. נסו שוב.</div>}
      <div className="text-[12.5px] leading-normal text-[#666]">haiton יקבל את השם וכתובת המייל שלכם.</div>
    </>
  )
}
