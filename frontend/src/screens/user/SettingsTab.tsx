import { useQueryClient } from '@tanstack/react-query'
import { useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { unhideArticle } from '../../api/core/articles'
import { deleteAccount, logout, removePhoto, updatePrefs, updateProfile, uploadPhoto } from '../../api/core/me'
import { deleteGroup } from '../../api/core/people'
import { useAction, useConnections, useGroups, useHidden, useMe, usePrefs } from '../../api/queries'
import type { NotificationPrefs } from '../../api/types'
import { Avatar, btn, Toggle } from '../../components/ui'
import { useNameOf } from '../../lib/useNameOf'
import { useCompose } from '../../state/ComposeContext'
import { useUiActions } from '../../state/UiProvider'
import { useConnectionActions } from './useConnectionActions'

const PREFS: [keyof NotificationPrefs, string][] = [
  ['articles', 'כתבה חדשה מהמעגל'],
  ['joins', 'מישהו הצטרף דרך ההזמנה שלי'],
  ['reactions', 'תגובות לכתבות שלי'],
]

function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex flex-col">
      <div className="flex items-center justify-between border-b-2 border-ink pb-2.5">
        <span className="text-lg font-extrabold text-ink">{title}</span>
        {action}
      </div>
      {children}
    </section>
  )
}

const Row = ({ children }: { children: ReactNode }) => (
  <div className="flex items-center justify-between gap-3 border-b border-line py-3">{children}</div>
)
const empty = 'py-4 text-[14.5px] leading-normal text-muted'

export function SettingsTab() {
  const me = useMe().data!
  const { showConfirm, closeConfirm, openInvite, openGroupEditor } = useUiActions()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const compose = useCompose()
  const people = useConnections().data ?? []
  const groups = useGroups().data ?? []
  const hidden = useHidden().data ?? []
  const prefs = usePrefs().data
  const conn = useConnectionActions()
  const nameOf = useNameOf()
  const [name, setName] = useState(me.name)
  const file = useRef<HTMLInputElement>(null)

  const saveName = useAction(updateProfile)
  const upload = useAction(uploadPhoto)
  const dropPhoto = useAction(removePhoto)
  const setPref = useAction(updatePrefs)
  const unhide = useAction(unhideArticle)
  const removeGroup = useAction(deleteGroup)
  const [leaving, setLeaving] = useState(false)

  // Not via useAction: refetching `me` after these would bounce through the auth guard first.
  const leave = async (call: () => Promise<void>, to: string) => {
    setLeaving(true)
    try {
      await call()
      closeConfirm()
      compose.reset()
      qc.clear()
      navigate(to, { replace: true })
    } catch {
      setLeaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-7 pt-[18px]">
      <Section title="פרופיל">
        <div className="flex items-center gap-3.5 border-b border-line py-3.5">
          <div className="flex flex-none flex-col items-center gap-1.5">
            <Avatar label={me.name} size={56} bg="var(--color-ink)" photoUrl={me.photoUrl} />
            <button
              onClick={() => (me.photoUrl ? dropPhoto.mutate() : file.current?.click())}
              className="text-xs font-semibold text-brand"
            >
              {me.photoUrl ? 'הסרת התמונה' : 'הוספת תמונה'}
            </button>
            <input
              ref={file}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) upload.mutate(f)
                e.target.value = ''
              }}
            />
          </div>
          <label className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className="text-[12.5px] font-medium text-muted">השם שמופיע על הכתבות שלכם</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => name.trim() && name.trim() !== me.name && saveName.mutate({ name: name.trim() })}
              className="h-[42px] min-w-0 rounded-[10px] border border-sand bg-white px-3 text-base font-medium text-ink"
            />
            {!name.trim() && <span className="text-[13px] font-medium text-brand">השם לא יכול להיות ריק. עד שתזינו שם, יוצג {me.name}.</span>}
          </label>
        </div>
      </Section>

      <Section title="חיבורים" action={<button onClick={() => openInvite()} className={btn.add}>+ הזמנת חברים</button>}>
        {people.map((p) => (
          <Row key={p.id}>
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="text-base font-bold text-ink">{p.name}</span>
              <span className="text-[13px] text-muted">{p.muted ? 'מושתק · לא מופיע בעמוד הראשי' : 'מופיע בעמוד הראשי'}</span>
            </span>
            <span className="flex flex-none gap-1.5">
              <button onClick={() => conn.toggleMute(p.id, p.muted)} className={btn.chip}>{p.muted ? 'ביטול השתקה' : 'השתקה'}</button>
              <button onClick={() => conn.askRemove(p.id, p.name)} className={btn.chipDanger}>הסרה</button>
            </span>
          </Row>
        ))}
        {!people.length && <div className={empty}>עוד אין לכם חיבורים. מי שיצטרף דרך הקישור שלכם יופיע כאן.</div>}
      </Section>

      {hidden.length > 0 && (
        <Section title="כתבות מוסתרות">
          {hidden.map((h) => (
            <Row key={h.id}>
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="text-[15px] leading-snug font-bold text-ink">{h.headline}</span>
                <span className="text-[13px] text-muted">{h.author}</span>
              </span>
              <button onClick={() => unhide.mutate(h.id)} className={`flex-none ${btn.chip}`}>הצגה מחדש</button>
            </Row>
          ))}
        </Section>
      )}

      <Section title="התראות">
        {PREFS.map(([k, label]) => {
          const on = !!prefs?.[k]
          return (
            <button
              key={k}
              role="switch"
              aria-checked={on}
              onClick={() => setPref.mutate({ [k]: !on })}
              className="flex items-center justify-between gap-3 border-b border-line py-[13px] text-right"
            >
              <span className="text-[15px] font-medium text-ink">{label}</span>
              <Toggle on={on} />
            </button>
          )
        })}
      </Section>

      <Section title="קבוצות" action={<button onClick={() => openGroupEditor()} className={btn.add}>+ קבוצה חדשה</button>}>
        {groups.map((g) => (
          <Row key={g.id}>
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="text-base font-bold text-ink">{g.name}</span>
              {g.memberIds.length ? (
                <span className="text-[13px] text-muted">{g.memberIds.map(nameOf).filter(Boolean).join(' · ')}</span>
              ) : (
                <span className="text-[13px] font-medium text-brand">אין חברים · ערכו או מחקו את הקבוצה</span>
              )}
            </span>
            <span className="flex flex-none gap-1.5">
              <button onClick={() => openGroupEditor({ groupId: g.id })} className={btn.chip}>עריכה</button>
              <button onClick={() => removeGroup.mutate(g.id)} className={btn.chipDanger}>מחיקה</button>
            </span>
          </Row>
        ))}
        {!groups.length && <div className={empty}>עוד אין קבוצות.</div>}
      </Section>

      <Section title="חשבון">
        <div className="flex justify-between gap-3 border-b border-line py-[13px] text-[14.5px] text-muted">
          <span>החשבון המחובר</span>
          <span dir="ltr" className="font-medium text-ink">{me.email}</span>
        </div>
        <button
          disabled={leaving}
          onClick={() => leave(logout, '/bye/signed-out')}
          className="flex items-center justify-between border-b border-line py-3.5 text-right text-[15.5px] font-semibold text-ink"
        >
          <span>התנתקות</span><span className="text-stone">←</span>
        </button>
        <button
          onClick={() => showConfirm({
            title: 'למחוק את החשבון?',
            text: 'כל הכתבות שלכם, כרטסת העובדות והקבוצות יימחקו לצמיתות. הכתבות יוסרו גם מהפיד של מי שקיבל אותן. אי אפשר לבטל את הפעולה.',
            yesLabel: 'מחיקה לצמיתות',
            noLabel: 'ביטול',
            onYes: () => leave(deleteAccount, '/bye/deleted'),
          })}
          className="flex items-center justify-between border-b border-line py-3.5 text-right text-[15.5px] font-semibold text-brand"
        >
          <span>מחיקת החשבון</span><span>←</span>
        </button>
      </Section>
    </div>
  )
}
