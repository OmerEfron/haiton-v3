import { useEffect, useState } from 'react'
import type { Draft, RevisionKind } from '../../api/types'
import { btn, Check, Logo } from '../../components/ui'
import { relTime } from '../../lib/time'
import type { DraftModel } from './useDraftModel'

const REVS: [string, RevisionKind][] = [
  ['מצחיק יותר', 'funnier'], ['דרמטי יותר', 'dramatic'], ['מאופק יותר', 'restrained'],
  ['תמציתי יותר', 'concise'], ['כותרת חדשה', 'headline'], ['נוסח אחר', 'alternate'],
]
const STEPS = ['מגדיר את הסיפור', 'בודק בכרטסת העובדות', 'מחפש כתבות קודמות שלכם']

export function Loading({ onCancel }: { onCancel: () => void }) {
  const [step, setStep] = useState(0)
  useEffect(() => {
    const t = [1, 2, 3].map((i) => setTimeout(() => setStep(i), i * 1000))
    return () => t.forEach(clearTimeout)
  }, [])
  return (
    <div className="flex h-dvh items-center justify-center px-10">
      <div className="flex w-full max-w-[420px] flex-col gap-[26px]">
        <Logo className="text-[22px] text-right" />
        <div className="text-[27px] leading-tight font-extrabold">העורך עובד על הכתבה</div>
        <div className="flex flex-col gap-4">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-3 text-[17px] font-medium">
              {step > i ? (
                <span className="flex size-[22px] items-center justify-center rounded-full bg-brand text-[13px] text-white">✓</span>
              ) : step === i ? (
                <span className="flex size-[22px] items-center justify-center rounded-full border-2 border-brand"><span className="size-2 rounded-full bg-brand" /></span>
              ) : (
                <span className="size-[22px] rounded-full border-2 border-[#ddd]" />
              )}
              <span>{label}</span>
            </div>
          ))}
        </div>
        <button onClick={onCancel} className="h-[38px] self-start rounded-full border border-disabled bg-white px-4 text-sm font-semibold">
          ביטול וחזרה לשיחה
        </button>
      </div>
    </div>
  )
}

export function DraftFailed({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-4 p-10 text-center">
      <div className="text-lg font-bold">העורך לא הצליח לכתוב את הכתבה</div>
      <button onClick={onBack} className="h-10 rounded-full bg-charcoal px-5 font-semibold text-white">חזרה לשיחה</button>
    </div>
  )
}

export function UnpublishedChip() {
  return <span className="rounded-full bg-chip px-2.5 py-1 text-xs font-medium text-dim">לא פורסם</span>
}

export function DraftBody({ m, draft }: { m: DraftModel; draft: Draft }) {
  return (
    <div>
      <div className={`transition-opacity duration-300 ${m.revising ? 'opacity-35' : ''}`}>
        <div className="mb-2 text-[13px] font-bold text-brand">{m.meName}</div>
        <h1 className="mb-3 text-[28px] leading-[1.18] font-extrabold">{draft.headline}</h1>
        <p className="mb-[18px] text-[17px] leading-normal font-medium text-[#3a3a3a]">{draft.sub}</p>
        {draft.summary && (
          <div className="mb-[18px] rounded-[10px] bg-wash px-3.5 py-3">
            <div className="mb-1 text-xs font-bold text-dim">תקציר</div>
            <div className="text-[15px] leading-normal">{draft.summary}</div>
          </div>
        )}
        <div className="mb-[22px] flex flex-col gap-3">
          {draft.body.map((p, i) => <p key={i} className="text-[16.5px] leading-[1.7]">{p}</p>)}
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-2.5">
          <div className="rounded-[10px] border border-hairline px-3.5 py-3">
            <div className="mb-1 text-[13px] font-extrabold text-brand">מבזק</div>
            <div className="text-[15px] leading-snug font-medium">{draft.flash}</div>
          </div>
          <div className="rounded-[10px] border border-hairline px-3.5 py-3">
            <div className="mb-1 text-[13px] font-extrabold text-dim">הפוש שיישלח</div>
            <div className="text-[15px] leading-snug font-bold">{draft.push}</div>
          </div>
        </div>

        {(draft.basis.prevArticle || draft.basis.facts.length > 0) && (
          <div className="mt-[22px] overflow-hidden rounded-xl border border-hairline">
            <div className="bg-wash px-3.5 py-[11px] text-[13px] font-bold text-dim">על מה העורך נשען</div>
            {draft.basis.prevArticle && (
              <div className="flex flex-col gap-1 border-t border-hairline px-3.5 py-3">
                <div className="text-xs font-bold text-brand">כתבה קודמת שלכם · {relTime(draft.basis.prevArticle.createdAt)}</div>
                <div className="text-[15px] leading-snug font-semibold">{draft.basis.prevArticle.headline}</div>
              </div>
            )}
            {draft.basis.facts.length > 0 && (
              <div className="flex flex-col gap-2 border-t border-hairline px-3.5 py-3">
                <div className="text-xs font-bold text-dim">מהכרטסת שלכם</div>
                <div className="flex flex-wrap gap-1.5">
                  {draft.basis.facts.map((f) => (
                    <span key={f.id} className="rounded-full bg-chip px-2.5 py-[5px] text-[13px] font-medium">{f.k}: {f.v}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {draft.newFacts.length > 0 && (
          <div className="mt-3 overflow-hidden rounded-xl border border-hairline">
            <div className="flex justify-between gap-2 bg-wash px-3.5 py-[11px]">
              <span className="text-[13px] font-bold text-dim">חדש לכרטסת, מתוך השיחה</span>
              <span className="text-xs text-[#777]">נשמר בפרסום</span>
            </div>
            {draft.newFacts.map((f) => (
              <button
                key={f.k + f.v}
                onClick={() => m.toggleFact(f)}
                role="checkbox"
                aria-checked={m.isFactSaved(f)}
                className="flex w-full items-center justify-between gap-2.5 border-t border-hairline bg-white px-3.5 py-[11px] text-right"
              >
                <span className="flex flex-col gap-0.5">
                  <span className="text-xs font-medium text-[#777]">{f.k}</span>
                  <span className="text-[15px] font-semibold">{f.v}</span>
                </span>
                <Check checked={m.isFactSaved(f)} />
              </button>
            ))}
          </div>
        )}
      </div>
      {m.revising && (
        <div className="sticky bottom-0 flex justify-center pt-3">
          <div className="rounded-full bg-charcoal px-[18px] py-2.5 text-sm font-medium text-white">העורך מעדכן: {m.revising}…</div>
        </div>
      )}
    </div>
  )
}

export function RevisionChips({ m }: { m: DraftModel }) {
  return (
    <div className="flex gap-2 overflow-x-auto">
      {REVS.map(([label, kind]) => (
        <button
          key={kind}
          onClick={() => m.revise(kind, label)}
          disabled={!!m.revising}
          className="h-9 flex-none rounded-full border border-dash bg-white px-3.5 text-sm font-medium"
        >
          {label}
        </button>
      ))}
    </div>
  )
}

export function DraftFooter({ m }: { m: DraftModel }) {
  return (
    <>
      <div className="text-[13px] font-semibold text-dim">בקשה מהעורך</div>
      <RevisionChips m={m} />
      <button onClick={m.goPublish} className={btn.cta}>המשך לפרסום</button>
    </>
  )
}
