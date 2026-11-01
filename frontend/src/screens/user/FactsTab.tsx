import { useNavigate } from 'react-router'
import { deleteFact } from '../../api/core/me'
import { useAction, useFacts } from '../../api/queries'
import { btn } from '../../components/ui'

export function FactsTab({ name }: { name: string }) {
  const facts = useFacts().data ?? []
  const remove = useAction(deleteFact)
  const nav = useNavigate()
  return (
    <div className="flex flex-col gap-4 pt-4">
      <div className="text-sm leading-relaxed text-muted">
        הכרטסת נבנית ממה שסיפרתם לכתב, ורק לכם יש גישה אליה. הכתב משתמש בה כדי לדייק את הכתבות שלכם. אפשר למחוק כל פרט.
      </div>
      <button onClick={() => nav('/me/intro')} className={`${btn.pillOutline} self-start`}>ספרו לכתב עוד עליכם</button>
      <div className="border border-ink bg-cream shadow-[5px_5px_0_var(--color-ink)]">
        <div className="flex items-baseline justify-between gap-2.5 border-b-2 border-hot px-4 pt-3.5 pb-3">
          <span className="font-display text-[23px] font-black text-ink">כרטסת עובדות</span>
          <span className="text-[12.5px] font-medium text-muted">{name} · {facts.length} פרטים</span>
        </div>
        {facts.map((f) => (
          <div key={f.id} className="grid grid-cols-[96px_minmax(0,1fr)_28px] items-start gap-3 border-b border-factline px-4 py-3">
            <span className="text-[12.5px] leading-relaxed font-semibold text-muted">{f.k}</span>
            <span className="flex min-w-0 flex-col gap-[3px]">
              <span className="flex flex-wrap items-center gap-2">
                <span className="font-display text-[17px] leading-snug font-bold text-ink">{f.v}</span>
                {f.isNew && <span className="bg-hot px-[7px] py-0.5 text-[11px] font-bold text-white">חדש</span>}
              </span>
              <span className="text-xs leading-snug text-stone">{f.src}</span>
            </span>
            <button onClick={() => remove.mutate(f.id)} aria-label={`מחיקת ${f.k}`} className="size-7 text-xl leading-none text-stone">×</button>
          </div>
        ))}
        {!facts.length && <div className="px-4 py-7 text-[14.5px] leading-normal text-muted">הכרטסת עוד ריקה. היא תתמלא מהשיחות שלכם עם הכתב.</div>}
      </div>
    </div>
  )
}
