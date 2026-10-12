import { Link } from 'react-router'
import type { Article, ArticleSummary } from '../../api/types'
import { Avatar, Img } from '../../components/ui'
import { colorOf } from '../../lib/color'
import { relTime } from '../../lib/time'
import type { ArticleModel } from './useArticleModel'

export function ArticleBody({ m, headlineClass }: { m: ArticleModel; headlineClass: string }) {
  const a = m.article
  if (!a) return null
  return (
    <>
      <div className="text-[12.5px] font-extrabold tracking-wide text-hot">{m.kicker}</div>
      <h1 className={headlineClass}>{a.headline}</h1>
      <p className="text-[18.5px] leading-normal font-medium text-body">{a.sub}</p>
      <div className="flex items-center gap-2.5 border-y border-t-ink border-b-line py-3">
        <Avatar label={a.author} size={34} bg={colorOf(a.authorId)} photoUrl={m.photoUrl} />
        <span className="flex flex-col gap-px">
          <Link to={`/u/${a.authorId}`} className="text-right text-sm font-bold text-ink">{a.author}</Link>
          <span className="text-[12.5px] text-muted">{relTime(a.createdAt)}</span>
        </span>
      </div>
      {a.imageUrl && <Img src={a.imageUrl} className="aspect-[16/10] w-full" />}
      <div className="flex flex-col gap-4 pt-1">
        {a.body.map((p, i) => <p key={i} className="text-lg leading-[1.8] text-ink">{p}</p>)}
      </div>
      <div className="flex justify-center pt-2 font-display text-xl font-black text-hot">■</div>
      {a.history.length > 0 && <History items={a.history} note={m.historyNote} />}
      {!m.mine && <Reactions m={m} />}
      {!m.mine && <ReportButton reported={a.reported} onReport={() => m.setReporting(true)} />}
      {m.mine && <OwnerBox a={a} audienceLabel={m.audienceLabel} onRemove={m.askRemove} />}
      {!m.mine && (
        <div className="mt-3 flex flex-col items-start gap-3.5 bg-ink p-[22px] text-paper">
          <div className="font-display text-2xl leading-tight font-black">גם לכם קרה משהו היום?</div>
          <button onClick={() => m.startStory()} className="h-11 rounded-full bg-hot px-5 text-[15px] font-bold text-white">ספרו לכתב</button>
        </div>
      )}
    </>
  )
}

function History({ items, note }: { items: ArticleSummary[]; note: string }) {
  return (
    <div className="mt-2.5 flex flex-col gap-1 border-t-[3px] border-ink pt-3.5">
      <div className="font-display text-[22px] font-black text-ink">הסיפור עד כה</div>
      <div className="text-[13px] leading-normal text-muted">{note}</div>
      <div className="mt-3 flex flex-col">
        {items.map((h) => (
          <Link key={h.id} to={`/article/${h.id}`} className="grid cursor-pointer grid-cols-[14px_minmax(0,1fr)] gap-3">
            <div className="flex flex-col items-center">
              <span className="mt-[3px] size-3 flex-none rounded-full bg-hot" />
              <span className="w-0.5 flex-1 bg-sand" />
            </div>
            <div className="flex flex-col gap-1 pb-4">
              <span className="text-xs font-bold text-hot">{relTime(h.createdAt)}</span>
              <span className="font-display text-lg leading-snug font-extrabold text-ink">{h.headline}</span>
              <span className="text-[14.5px] leading-normal text-body">{h.sub}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

function Reactions({ m }: { m: ArticleModel }) {
  return (
    <div className="flex flex-col items-center gap-2.5 pt-1.5">
      <div className="text-[13px] font-semibold text-muted">{m.reactionLabel}</div>
      <div className="flex flex-wrap justify-center gap-2">
        {m.reacts.map((r) => (
          <button
            key={r}
            aria-pressed={m.reacted === r}
            onClick={() => m.react(r)}
            className={`h-9 rounded-full px-4 text-sm ${m.reacted === r ? 'bg-ink font-bold text-white' : 'border border-ink font-medium text-charcoal'}`}
          >
            {r}
          </button>
        ))}
      </div>
    </div>
  )
}

function ReportButton({ reported, onReport }: { reported: boolean; onReport: () => void }) {
  if (reported)
    return <div className="flex justify-center"><span className="flex h-9 items-center gap-1.5 rounded-full bg-beige px-3.5 text-[13.5px] font-medium text-muted">✓ הדיווח נשלח למנהל האתר</span></div>
  return (
    <div className="flex justify-center">
      <button onClick={onReport} className="flex h-9 items-center gap-1.5 rounded-full border border-sand px-3.5 text-[13.5px] font-medium text-muted">
        <span className="text-[13px]">⚑</span>דיווח על הכתבה
      </button>
    </div>
  )
}

function OwnerBox({ a, audienceLabel, onRemove }: { a: Article; audienceLabel: string; onRemove: () => void }) {
  return (
    <div className="mt-2 flex flex-col gap-2.5 rounded border border-ink bg-cream px-4 py-3.5">
      <div className="text-[13px] font-extrabold text-charcoal">מי קיבל את הכתבה</div>
      <div className="text-[14.5px] leading-normal text-body">{audienceLabel}</div>
      {!!a.audienceIds?.length && (
        <div className="flex flex-col gap-1.5 border-t border-beige pt-2.5">
          <div className="text-[13px] font-extrabold text-charcoal">תגובות</div>
          {a.received.map((r) => (
            <div key={r.personId + r.label} className="flex justify-between gap-2.5 text-[14.5px] font-medium text-ink">
              <span>{r.name}</span>
              <span className="rounded-full bg-ink px-2.5 py-0.5 text-[13px] font-semibold text-white">{r.label}</span>
            </div>
          ))}
          {!a.received.length && <div className="text-[13.5px] text-muted">עוד אין תגובות.</div>}
        </div>
      )}
      <button onClick={onRemove} className="h-9 self-start rounded-full border border-brand px-3.5 text-[13.5px] font-semibold text-brand">
        הסרת הכתבה
      </button>
    </div>
  )
}
