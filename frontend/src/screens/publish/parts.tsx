import { btn, CheckRow, Radio } from '../../components/ui'
import type { AudiencePicker } from '../../lib/useAudiencePicker'
import type { PublishModel } from './usePublishModel'

export function AudienceModes({ m }: { m: AudiencePicker }) {
  return (
    <>
      {m.modes.map((mode) =>
        mode.disabled ? (
          <div key={mode.id} className="flex items-center gap-3 rounded-xl border border-dashed border-disabled bg-field p-3.5">
            <span className="size-5 flex-none rounded-full border-2 border-[#e0e0e0]" />
            <span className="flex flex-col gap-0.5">
              <span className="text-base font-bold text-faint">{mode.label}</span>
              <span className="text-[13px] text-[#6b6b6b]">{mode.hint}</span>
            </span>
          </div>
        ) : (
          <button
            key={mode.id}
            onClick={() => m.chooseMode(mode.id)}
            role="radio"
            aria-checked={m.mode === mode.id}
            className="flex items-center gap-3 rounded-xl border border-[#e3e3e3] bg-white p-3.5 text-right"
          >
            <Radio checked={m.mode === mode.id} />
            <span className="flex flex-col gap-0.5">
              <span className="text-base font-bold">{mode.label}</span>
              <span className="text-[13px] text-dim">{mode.hint}</span>
            </span>
          </button>
        ),
      )}
    </>
  )
}

export function PublishBody({ m }: { m: AudiencePicker }) {
  return (
    <div className="flex flex-col gap-2.5">
      <AudienceModes m={m} />

      {!m.np && (
        <div className="flex flex-col items-start gap-2.5 rounded-xl bg-wash p-3.5">
          <div className="text-sm leading-normal text-ash">עוד אין לכם חיבורים, לכן הכתבה תישמר אצלכם. כדי לשלוח כתבות, הזמינו חברים ומשפחה.</div>
          <button onClick={m.openInvite} className="h-[38px] rounded-full bg-charcoal px-4 text-sm font-semibold text-white">הזמנת חברים</button>
        </div>
      )}

      {m.mode === 'people' && m.np > 0 && (
        <div className="mt-2 flex flex-col gap-2.5">
          <div className="flex flex-wrap gap-2">
            {m.groups.map((g) => (
              <button
                key={g.id}
                onClick={() => m.addGroupMembers(g.memberIds)}
                className="h-[34px] rounded-full border border-dash bg-[#f7f6f3] px-3.5 text-sm font-medium"
              >
                + {g.name}
              </button>
            ))}
          </div>
          <div className="overflow-hidden rounded-xl border border-hairline">
            {m.people.map((p) => <CheckRow key={p.id} label={p.name} tone="brand" checked={m.sel.includes(p.id)} onClick={() => m.toggle(p.id)} />)}
          </div>
        </div>
      )}

      {m.mode === 'group' && m.np > 0 && (
        <div className="mt-2 flex flex-col gap-2">
          {m.groups.map((g) =>
            g.memberIds.length ? (
              <button
                key={g.id}
                onClick={() => m.pickGroup(g.id)}
                className="flex w-full items-center justify-between rounded-xl border border-hairline bg-white px-3.5 py-3 text-[15px] font-medium"
              >
                <span>{g.name}</span>
                <span className="text-[13px] text-dim">{g.id === m.groupId ? '✓ נבחרה' : `${g.memberIds.length} אנשים`}</span>
              </button>
            ) : (
              <div key={g.id} className="flex items-center justify-between rounded-xl border border-dashed border-disabled bg-field px-3.5 py-3 text-[15px] font-medium text-faint">
                <span>{g.name}</span>
                <span className="flex items-center gap-2.5">
                  <span className="text-[13px] text-[#6b6b6b]">אין חברים בקבוצה</span>
                  <button onClick={() => m.editGroup(g.id)} className="text-[13px] font-semibold text-brand underline">
                    עריכת הקבוצה
                  </button>
                </span>
              </div>
            ),
          )}
          {!m.groups.length && (
            <div className="flex flex-col items-start gap-2.5 px-0.5 py-2">
              <div className="text-sm leading-normal text-dim">עוד אין קבוצות. אפשר ליצור קבוצה עכשיו מתוך החיבורים שלכם.</div>
              <button onClick={m.createGroup} className="h-[38px] rounded-full bg-charcoal px-4 text-sm font-semibold text-white">
                + יצירת קבוצה
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function PublishFooter({ m }: { m: PublishModel }) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="text-[13px] leading-snug text-dim">אחרי הפרסום הנוסח ננעל. אפשר להסיר את הכתבה, אי אפשר לשכתב אותה.</div>
      {m.publishError && <div className="text-[13px] text-brand">הפרסום נכשל. נסו שוב.</div>}
      <button onClick={m.onPublish} disabled={!m.ok} className={btn.cta}>
        {m.pending ? 'מפרסם…' : m.label}
      </button>
    </div>
  )
}
