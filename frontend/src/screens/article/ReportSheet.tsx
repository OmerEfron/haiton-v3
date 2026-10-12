import { useState } from 'react'
import { useNavigate } from 'react-router'
import { hideArticle, reportArticle, unhideArticle } from '../../api/core/articles'
import { setMuted } from '../../api/core/people'
import { useAction, useConnections } from '../../api/queries'
import type { Article } from '../../api/types'
import { btn, DoneMark, Radio, Sheet, SheetTitle } from '../../components/ui'
import { firstName } from '../../lib/color'
import { useUiActions } from '../../state/UiProvider'

const REASONS = ['מידע שגוי עליי', 'פוגע או מעליב', 'חושף פרטים אישיים', 'ספאם', 'אחר']
const Mail = () => <a href="mailto:info@haiton.app" dir="ltr" className="text-brand [unicode-bidi:isolate]">info@haiton.app</a>

export function ReportSheet({ article, onClose }: { article: Article; onClose: () => void }) {
  const { showNote } = useUiActions()
  const nav = useNavigate()
  const people = useConnections().data ?? []
  const [reason, setReason] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [sent, setSent] = useState(article.reported)
  const report = useAction(() => reportArticle(article.id, reason!, note))
  const hide = useAction(hideArticle)
  const unhide = useAction(unhideArticle)
  const mute = useAction((id: string) => setMuted(id, true))
  const author = people.find((p) => p.id === article.authorId)

  if (sent)
    return (
      <Sheet onClose={onClose}>
        <div className="flex flex-col gap-2.5 pt-2 pb-1">
          <DoneMark />
          <SheetTitle>הדיווח נשלח</SheetTitle>
          <div className="text-[14.5px] leading-relaxed text-ash">מנהל האתר יבדוק את הכתבה ויטפל בה. אפשר להוסיף פרטים במייל <Mail /></div>
          <div className="mt-1.5 flex flex-col gap-2">
            <button
              onClick={() =>
                hide.mutate(article.id, {
                  onSuccess: () => {
                    nav('/feed')
                    showNote({ text: 'הכתבה הוסתרה מהעמוד הראשי', undo: () => unhide.mutate(article.id) })
                  },
                })
              }
              className={btn.dark}
            >
              הסתרת הכתבה מהפיד שלי
            </button>
            {author && !author.muted && (
              <button onClick={() => mute.mutate(author.id, { onSuccess: () => nav('/feed') })} className={btn.outline}>
                השתקת {firstName(article.author)}
              </button>
            )}
            <button onClick={onClose} className="h-11 text-[15px] font-medium text-dim">סגירה</button>
          </div>
        </div>
      </Sheet>
    )

  return (
    <Sheet onClose={onClose}>
      <div className="flex flex-col gap-1">
        <SheetTitle>דיווח על הכתבה</SheetTitle>
        <div className="text-sm leading-normal text-dim">הדיווח נשלח למנהל האתר והוא מטפל בו. מי שכתב את הכתבה לא יידע מי דיווח.</div>
      </div>
      <div role="radiogroup" className="overflow-hidden rounded-xl border border-hairline">
        {REASONS.map((r) => (
          <button
            key={r}
            role="radio"
            aria-checked={reason === r}
            onClick={() => setReason(r)}
            className="flex w-full items-center justify-between gap-2.5 border-b border-rowline bg-white px-3.5 py-3 text-right text-[15px] font-medium last:border-b-0"
          >
            <span>{r}</span>
            <Radio checked={reason === r} tone="dark" />
          </button>
        ))}
      </div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="פרטים נוספים (לא חובה)"
        aria-label="פרטים נוספים"
        className="min-h-[76px] resize-none rounded-[10px] border border-disabled px-3.5 py-2.5 text-[15px] leading-normal"
      />
      <div className="flex gap-2.5">
        <button
          disabled={!reason || report.isPending}
          onClick={() => report.mutate(undefined, { onSuccess: () => setSent(true) })}
          className={`flex-1 ${btn.dark}`}
        >
          שליחת דיווח
        </button>
        <button onClick={onClose} className={`flex-1 ${btn.outline}`}>ביטול</button>
      </div>
      <div className="text-center text-[13px] leading-normal text-dim">אפשר לפנות אלינו גם במייל <Mail /></div>
    </Sheet>
  )
}
