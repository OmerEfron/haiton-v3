import type { ChatModel } from './useChatModel'

const pillBtn = 'h-[38px] rounded-full border border-[#d9d9d9] bg-white px-[18px] text-[14.5px] font-semibold text-chat shadow-sm'

function ReporterAvatar() {
  return (
    <div className="flex size-7 flex-none items-center justify-center rounded-full bg-chat font-sans text-[13px] font-bold text-white">כ</div>
  )
}

export function ChatHeader({ m, className = 'px-4' }: { m: ChatModel; className?: string }) {
  return (
    <div className={`flex h-[54px] flex-none items-center justify-between ${className}`}>
      <button onClick={m.goFeed} aria-label="לעמוד הראשי" className="flex size-9 flex-col items-center justify-center gap-[5px]">
        <span className="h-0.5 w-[18px] rounded bg-chat" />
        <span className="h-0.5 w-3 rounded bg-chat" />
      </button>
      <div className="flex flex-col items-center gap-px">
        <div className="text-[17px] font-semibold text-chat">הכתב</div>
        <button
          onClick={m.openFacts}
          className="text-xs font-medium whitespace-nowrap text-[#6b6b6b] underline decoration-[#cfcfcf] underline-offset-[3px]"
        >
          {m.factsCount ? `הכתב זוכר ${m.factsCount} דברים עליכם` : 'הכרטסת שלכם עוד ריקה'}
        </button>
      </div>
      <button onClick={m.startNew} className="h-8 rounded-full border border-[#e3e3e3] bg-white px-3 text-[13px] font-semibold text-chat">
        חדש
      </button>
    </div>
  )
}

export function MessageList({ m }: { m: ChatModel }) {
  return (
    <div className="flex flex-col gap-6">
      {m.messages.map((msg, i) =>
        msg.role === 'reporter' ? (
          <div key={i} className="flex items-start gap-3">
            <ReporterAvatar />
            <div className="pt-px text-[16.5px] leading-[1.65] text-chat">{msg.text}</div>
          </div>
        ) : (
          <div key={i} className="flex justify-end">
            <div className="max-w-[78%] rounded-[22px] bg-bubble px-4 py-2.5 text-[16.5px] leading-normal text-chat">{msg.text}</div>
          </div>
        ),
      )}
      {m.typing && (
        <div className="flex items-center gap-3">
          <ReporterAvatar />
          <span className="text-[15px] text-[#8f8f8f]">הכתב מקליד…</span>
        </div>
      )}
      {(m.error || m.startError) && <div className="text-center text-sm text-brand">{m.error ?? 'לא הצלחנו להתחבר לכתב. רעננו את הדף.'}</div>}
    </div>
  )
}

export function ChatDock({ m }: { m: ChatModel }) {
  return (
    <>
      {m.draftReady && !m.typing && (
        <div className="flex justify-center">
          <button onClick={m.goDraft} className={pillBtn}>חזרה לטיוטה ←</button>
        </div>
      )}
      {m.userCount >= 1 && !m.typing && !m.draftReady && (
        <div className="flex justify-center">
          <button onClick={m.goDraft} className={pillBtn}>די, תיצור טיוטה</button>
        </div>
      )}
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
    </>
  )
}
