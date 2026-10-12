import { useState } from 'react'
import { createGroup } from '../../api/core/people'
import { useAction, useGroups } from '../../api/queries'
import type { Connection, Group } from '../../api/types'
import { btn, CheckRow, Sheet } from '../../components/ui'
import { groupNameError } from '../../lib/audience'

/** After publishing to specific people: offer to save them (or some of them) as a group. */
export function PostPublishGroupSheet({ people, onDone }: { people: Connection[]; onDone: (g?: Group) => void }) {
  const groups = useGroups().data ?? []
  const [name, setName] = useState('')
  const [sel, setSel] = useState(() => people.map((p) => p.id))
  const create = useAction(createGroup)
  const err = groupNameError(name, groups)
  const ok = !!name.trim() && !err && sel.length > 0

  return (
    <Sheet>
      <div className="text-[13px] font-extrabold text-ok">פורסם ✓</div>
      <div className="text-[21px] leading-tight font-extrabold">רוצים ליצור קבוצה מהאנשים האלה או מחלקם?</div>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="שם הקבוצה"
        aria-label="שם הקבוצה"
        className="h-[46px] rounded-[10px] border border-disabled px-3.5 text-base font-medium"
      />
      {err && <div className="text-[13px] font-medium text-brand">{err}</div>}
      <div className="overflow-hidden rounded-xl border border-hairline">
        {people.map((p) => (
          <CheckRow
            key={p.id}
            label={p.name}
            checked={sel.includes(p.id)}
            onClick={() => setSel((s) => (s.includes(p.id) ? s.filter((x) => x !== p.id) : [...s, p.id]))}
          />
        ))}
      </div>
      <div className="text-[13px] leading-snug text-dim">מי שלא ייכנס לקבוצה עדיין קיבל את הכתבה.</div>
      <div className="flex gap-2.5">
        <button
          disabled={!ok || create.isPending}
          onClick={() => create.mutate({ name: name.trim(), memberIds: sel }, { onSuccess: onDone })}
          className={`flex-1 ${btn.dark}`}
        >
          יצירת קבוצה
        </button>
        <button onClick={() => onDone()} className={`flex-1 ${btn.outline}`}>לא עכשיו</button>
      </div>
    </Sheet>
  )
}
