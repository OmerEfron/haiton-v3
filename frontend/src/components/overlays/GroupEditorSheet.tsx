import { useState } from 'react'
import { createGroup, deleteGroup, updateGroup } from '../../api/core/people'
import { useAction, useConnections, useGroups } from '../../api/queries'
import { groupNameError } from '../../lib/audience'
import { useUiActions, type GroupEditorSpec } from '../../state/UiProvider'
import { btn, CheckRow, Sheet, SheetTitle } from '../ui'

export function GroupEditorSheet({ spec }: { spec: GroupEditorSpec }) {
  const { closeGroupEditor, openInvite } = useUiActions()
  const people = useConnections().data ?? []
  const groups = useGroups().data ?? []
  const editing = groups.find((g) => g.id === spec.groupId)
  const [name, setName] = useState(editing?.name ?? '')
  const [sel, setSel] = useState<string[]>(editing?.memberIds ?? [])

  const save = useAction(() => {
    const g = { name: name.trim(), memberIds: people.filter((p) => sel.includes(p.id)).map((p) => p.id) }
    return editing ? updateGroup(editing.id, g) : createGroup(g)
  })
  const remove = useAction(() => deleteGroup(editing!.id))

  const err = groupNameError(name, groups, editing?.id)
  const ok = !!name.trim() && !err && sel.some((id) => people.some((p) => p.id === id))
  const toggle = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  const count = sel.filter((id) => people.some((p) => p.id === id)).length

  const onSave = () => {
    if (!ok || save.isPending) return
    save.mutate(undefined, {
      onSuccess: (g) => {
        closeGroupEditor()
        spec.onSaved?.(g)
      },
    })
  }

  return (
    <Sheet onClose={closeGroupEditor}>
      <SheetTitle>{editing ? 'עריכת קבוצה' : 'קבוצה חדשה'}</SheetTitle>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="שם הקבוצה"
        aria-label="שם הקבוצה"
        className="h-[46px] rounded-[10px] border border-disabled px-3.5 text-base font-medium"
      />
      {err && <div className="text-[13px] font-medium text-brand">{err}</div>}
      <div className="text-[13px] font-semibold text-dim">{count ? `${count} נבחרו` : 'בחרו מי בקבוצה'}</div>
      <div className="overflow-hidden rounded-xl border border-hairline">
        {people.map((p) => (
          <CheckRow key={p.id} label={p.name} checked={sel.includes(p.id)} onClick={() => toggle(p.id)} />
        ))}
        {!people.length && (
          <div className="px-3.5 py-4 text-sm leading-normal text-dim">
            עוד אין לכם חיבורים. אחרי שמישהו יצטרף דרככם, אפשר יהיה לצרף אותו לקבוצה.
          </div>
        )}
      </div>
      {!people.length && <button onClick={() => openInvite()} className={btn.dark}>הזמנת חברים</button>}
      <div className="flex gap-2.5">
        {!!people.length && (
          <button onClick={onSave} disabled={!ok} className={`flex-1 ${btn.dark}`}>
            {editing ? 'שמירה' : 'יצירת קבוצה'}
          </button>
        )}
        <button onClick={closeGroupEditor} className={`flex-1 ${btn.outline}`}>ביטול</button>
      </div>
      {editing && (
        <button
          onClick={() => remove.mutate(undefined, { onSuccess: closeGroupEditor })}
          className="h-10 text-[14.5px] font-semibold text-brand"
        >
          מחיקת הקבוצה
        </button>
      )}
    </Sheet>
  )
}
