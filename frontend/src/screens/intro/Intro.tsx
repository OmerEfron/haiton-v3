import { Bubbles } from '../chat/parts'
import { btn, Check, TopBar } from '../../components/ui'
import { type IntroModel, useIntroModel } from './useIntroModel'

function ReporterAvatar() {
  return (
    <div className="flex size-7 flex-none items-center justify-center rounded-full bg-chat font-sans text-[13px] font-bold text-white">כ</div>
  )
}

function Candidates({ m }: { m: IntroModel }) {
  if (!m.candidates.length) return null
  return (
    <div className="overflow-hidden rounded-xl border border-hairline">
      <div className="flex justify-between gap-2 bg-wash px-3.5 py-[11px]">
        <span className="text-[13px] font-bold text-dim">חדש לכרטסת</span>
        <span className="text-xs text-[#777]">נשמר רק אחרי אישור</span>
      </div>
      {m.candidates.map((f) => (
        <button
          key={f.k + f.v}
          onClick={() => m.toggle(f)}
          role="checkbox"
          aria-checked={m.isSaved(f)}
          className="flex w-full items-center justify-between gap-2.5 border-t border-hairline bg-white px-3.5 py-[11px] text-right"
        >
          <span className="flex flex-col gap-0.5">
            <span className="text-xs font-medium text-[#777]">{f.k}</span>
            <span className="text-[15px] font-semibold">{f.v}</span>
          </span>
          <Check checked={m.isSaved(f)} />
        </button>
      ))}
      <div className="border-t border-hairline p-3">
        <button onClick={m.onSave} disabled={!m.canSave} className={btn.cta}>שמירה לכרטסת</button>
        {m.saveError && <div className="pt-2 text-center text-sm text-brand">לא הצלחנו לשמור. נסו שוב.</div>}
      </div>
    </div>
  )
}

export default function Intro() {
  const m = useIntroModel()
  return (
    <div className="flex h-dvh flex-col font-chat">
      <TopBar onBack={m.back} title="היכרות" />
      <div ref={m.scroller} className="min-h-0 flex-1 overflow-y-auto px-[18px] pt-4 pb-6">
        <div className="mx-auto flex max-w-[740px] flex-col gap-6">
          <Bubbles messages={m.messages} />
          {m.typing && (
            <div className="flex items-center gap-3">
              <ReporterAvatar />
              <span className="text-[15px] text-[#8f8f8f]">הכתב מקליד…</span>
            </div>
          )}
          {(m.error || m.startError) && (
            <div className="text-center text-sm text-brand">{m.error ?? 'לא הצלחנו להתחבר לכתב. רעננו את הדף.'}</div>
          )}
          <Candidates m={m} />
        </div>
      </div>
      <div className="flex-none px-3 pt-1.5 pb-[22px]">
        <div className="mx-auto flex max-w-[740px] flex-col gap-2.5">
          <div className="flex min-h-[54px] items-center gap-2 rounded-[28px] bg-input p-1.5">
            <input
              value={m.input}
              onChange={(e) => m.setInput(e.target.value)}
              onKeyDown={m.onInputKeyDown}
              placeholder="ספרו לכתב…"
              aria-label="הודעה לכתב"
              className="min-w-0 flex-1 bg-transparent px-3 text-base text-chat"
            />
            <button
              onClick={m.send}
              disabled={!m.canSend}
              aria-label="שליחה"
              className="flex size-10 flex-none items-center justify-center rounded-full bg-chat font-sans text-lg font-bold text-white disabled:bg-disabled"
            >
              ↑
            </button>
          </div>
          <div className="text-center text-xs text-faint">הכתב לא מוסיף פרטים שלא סיפרתם</div>
        </div>
      </div>
    </div>
  )
}
