import type { ArticleSummary } from '../../api/types'
import { ArticleCard } from '../../components/ArticleCard'
import { Byline } from '../../components/Byline'
import { Img } from '../../components/ui'
import { isFresh } from '../../lib/time'
import { ComposeFab, DraftChip, EmptyFeed, FeedTop } from './parts'
import { useFeedModel } from './useFeedModel'

const kickerOf = (a: ArticleSummary) => (isFresh(a.createdAt) ? 'חדש · עכשיו' : 'הסיפור של היום')

function Lead({ a }: { a: ArticleSummary }) {
  const kicker = kickerOf(a)
  const to = `/article/${a.id}`
  if (!a.imageUrl)
    return (
      <ArticleCard to={to} className="flex cursor-pointer flex-col gap-3 bg-hot px-[18px] pt-6 pb-[22px] text-white">
        <div className="flex">
          <span className="bg-white px-[9px] py-1 text-xs font-extrabold tracking-wide text-hot">{kicker}</span>
        </div>
        <h2 className="max-w-[980px] font-display text-4xl leading-[1.05] font-black">{a.headline}</h2>
        <p className="max-w-[760px] text-base leading-normal font-medium">{a.sub}</p>
        <Byline a={a} dark />
      </ArticleCard>
    )
  return (
    <ArticleCard to={to} className="flex cursor-pointer flex-col gap-3 border-b border-ink px-[18px] pt-5 pb-[22px]">
      <div className="text-xs font-extrabold tracking-wide text-hot">{kicker}</div>
      <h2 className="font-display text-[34px] leading-[1.06] font-black text-ink">{a.headline}</h2>
      <Img src={a.imageUrl} className="aspect-[4/3] w-full" />
      <p className="text-base leading-normal text-body">{a.sub}</p>
      <Byline a={a} />
    </ArticleCard>
  )
}

function Subs({ items }: { items: ArticleSummary[] }) {
  return items.map((a, i) => (
    <ArticleCard
      key={a.id}
      to={`/article/${a.id}`}
      className="grid cursor-pointer grid-cols-[40px_minmax(0,1fr)] gap-3 border-b border-line p-[18px]"
    >
      <div className="font-display text-[30px] leading-none font-black text-hot">0{i + 2}</div>
      <div className="flex flex-col gap-2">
        {a.hasPrev && <div className="text-[11.5px] font-extrabold tracking-wide text-hot">המשך סיפור</div>}
        <h3 className="font-display text-[19px] leading-tight font-extrabold text-ink">{a.headline}</h3>
        <Byline a={a} size={20} />
      </div>
    </ArticleCard>
  ))
}

function More({ items }: { items: ArticleSummary[] }) {
  return (
    <div>
      <div className="flex items-center gap-3 px-[18px] pt-[26px] pb-2">
        <span className="font-display text-[22px] font-black text-ink">עוד מהמעגל</span>
        <span className="h-[3px] flex-1 bg-ink" />
      </div>
      <div>
        {items.map((a) => (
          <ArticleCard
            key={a.id}
            to={`/article/${a.id}`}
            image={a.imageUrl}
            imageClass="size-[76px] flex-none"
            className="flex cursor-pointer gap-3 border-b border-line px-[18px] py-3.5"
          >
            <div className="flex min-w-0 flex-col gap-1.5">
              <h4 className="font-display text-base leading-snug font-bold text-ink">{a.headline}</h4>
              <Byline a={a} dot />
            </div>
          </ArticleCard>
        ))}
      </div>
    </div>
  )
}

function Stories({ list }: { list: ArticleSummary[] }) {
  const [main, ...rest] = list
  const subs = rest.slice(0, 3)
  const more = rest.slice(3, 11)
  return (
    <div className="mx-auto max-w-[1200px]">
      <Lead a={main} />
      {subs.length > 0 && <Subs items={subs} />}
      {more.length > 0 && <More items={more} />}
    </div>
  )
}

export default function FeedMobile() {
  const m = useFeedModel()
  return (
    <div className="min-h-dvh bg-paper pb-24">
      <FeedTop m={m} />
      {m.list.length > 0 && <Stories list={m.list} />}
      {!m.loading && !m.list.length && <EmptyFeed onWrite={m.startStory} onInvite={m.openInvite} />}
      <DraftChip m={m} />
      <ComposeFab onClick={m.startStory} />
    </div>
  )
}
