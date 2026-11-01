import { Link } from 'react-router'
import type { PastSession } from '../../api/types'
import { Bubbles } from '../chat/parts'
import { relTime } from '../../lib/time'
import type { HistoryModel } from './useHistoryModel'

export function SessionList({ m }: { m: HistoryModel }) {
  if (m.loading) return null
  if (!m.sessions.length) return <div className="text-[15px] leading-normal text-muted">עוד אין שיחות קודמות.</div>
  return (
    <div className="flex flex-col">
      {m.sessions.map((s) => (
        <button key={s.id} onClick={() => m.open(s.id)} className="flex flex-col gap-1 border-b border-hairline py-3.5 text-right">
          <span className="text-xs font-bold text-brand">{relTime(s.createdAt)}</span>
          <span className="truncate text-[16px] font-semibold text-ink">{s.messages.find((x) => x.role === 'user')?.text}</span>
        </button>
      ))}
    </div>
  )
}

function Output({ s }: { s: PastSession }) {
  if (s.articleId) {
    return (
      <Link to={`/article/${s.articleId}`} className="flex flex-col gap-1 rounded-xl border border-ink bg-cream px-4 py-3.5">
        <span className="text-xs font-extrabold text-hot">פורסמה</span>
        <span className="text-[17px] leading-snug font-bold text-ink">{s.draft?.headline ?? 'לכתבה'}</span>
      </Link>
    )
  }
  if (!s.draft) return <div className="text-[14.5px] text-muted">עוד אין טיוטה לשיחה הזו.</div>
  return (
    <div className="flex flex-col gap-3 border-t border-ink pt-4">
      <div className="text-xs font-extrabold text-muted">טיוטה</div>
      <h2 className="text-[22px] leading-snug font-extrabold text-ink">{s.draft.headline}</h2>
      {s.draft.sub && <p className="text-[16px] leading-normal font-medium text-body">{s.draft.sub}</p>}
      {s.draft.body.map((p, i) => <p key={i} className="text-[16px] leading-relaxed text-ink">{p}</p>)}
    </div>
  )
}

export function SessionDetail({ s }: { s: PastSession }) {
  return (
    <div className="flex flex-col gap-8">
      <div className="font-chat">
        <Bubbles messages={s.messages} />
      </div>
      <Output s={s} />
    </div>
  )
}
